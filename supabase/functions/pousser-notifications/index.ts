// ————————————————————————————————————————————
// Le Nid — fonction Edge « pousser-notifications » (Deno)
//
// Déclenchée par un Database Webhook Supabase sur UPDATE de la table `nids`.
// Elle compare l'ancien et le nouvel état du foyer, détecte ce qui est nouveau
// (message, note du frigo, réponse à la question du jour), et envoie une
// notification push web à tous les appareils abonnés du foyer — sauf à l'auteur.
//
// Déploiement :
//   1) Générer une paire de clés VAPID :  npx web-push generate-vapid-keys
//   2) supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:vous@exemple.fr
//   3) supabase functions deploy pousser-notifications
//   4) Database → Webhooks → créer un webhook sur `nids` (UPDATE) vers cette fonction.
//   5) Côté appli : définir VITE_VAPID_PUBLIC_KEY (même clé publique) sur Vercel.
// ————————————————————————————————————————————
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:contact@le-nid.app'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

const admin = createClient(SUPABASE_URL, SERVICE_ROLE)

const nom = (membres: any, id: string) => membres?.[id]?.nom ?? 'Quelqu’un'
const jourClef = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// Détecte LA nouveauté à notifier (auteur + titre + corps), ou null.
function nouveaute(avant: any, apres: any) {
  const membres = apres.membres || {}
  if ((apres.messages?.length || 0) > (avant.messages?.length || 0)) {
    const m = apres.messages[apres.messages.length - 1]
    return { auteur: m.auteur, titre: '🛋️ Nouveau message au Salon', corps: `${nom(membres, m.auteur)} : ${m.texte}` }
  }
  if ((apres.frigo?.length || 0) > (avant.frigo?.length || 0)) {
    const n = apres.frigo[apres.frigo.length - 1]
    return { auteur: n.auteur, titre: '🧲 Nouveau sur le Frigo', corps: `${nom(membres, n.auteur)} a aimanté quelque chose` }
  }
  const jour = jourClef()
  const avR = avant.reponsesJour?.[jour] || {}
  const apR = apres.reponsesJour?.[jour] || {}
  const nouvel = Object.keys(apR).find((id) => !avR[id])
  if (nouvel) return { auteur: nouvel, titre: '🌱 La question du jour', corps: `${nom(membres, nouvel)} a répondu` }
  return null
}

Deno.serve(async (req) => {
  try {
    const charge = await req.json()
    const ancien = charge.old_record?.donnees ?? {}
    const nouveau = charge.record?.donnees ?? {}
    const foyer = charge.record?.code
    if (!foyer) return new Response('sans foyer', { status: 200 })

    const info = nouveaute(ancien, nouveau)
    if (!info) return new Response('rien à notifier', { status: 200 })

    const { data: abonnements } = await admin
      .from('subscriptions')
      .select('endpoint, membre, abonnement')
      .eq('foyer', foyer)

    const charge_utile = JSON.stringify({ titre: info.titre, corps: info.corps })
    await Promise.all(
      (abonnements || [])
        .filter((a) => a.membre !== info.auteur) // ne pas se notifier soi-même
        .map((a) =>
          webpush.sendNotification(a.abonnement, charge_utile).catch(async (e: any) => {
            // Abonnement expiré (404/410) : on le nettoie.
            if (e?.statusCode === 404 || e?.statusCode === 410) {
              await admin.from('subscriptions').delete().eq('endpoint', a.endpoint)
            }
          })
        )
    )
    return new Response('ok', { status: 200 })
  } catch (e) {
    return new Response(`erreur: ${e}`, { status: 500 })
  }
})
