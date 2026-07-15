// ————————————————————————————————————————————
// Le Nid — abonnement aux notifications push (Phase 2)
//
// Ce module abonne l'appareil aux VRAIES notifications push (qui réveillent le
// téléphone même appli fermée), via le service worker déjà en place.
//
// Il ne fait rien tant que le push distant n'est pas déployé :
//   - VITE_VAPID_PUBLIC_KEY doit être fourni (clé publique VAPID),
//   - la table `subscriptions` et la fonction Edge doivent être installées
//     (voir supabase-notifications.sql et supabase/functions/pousser-notifications).
// Sans ça, activerPushDistant() se contente de renvoyer false, sans erreur.
// ————————————————————————————————————————————
import { supabase, supabaseActif } from './supabaseClient.js'

const CLE_VAPID = import.meta.env.VITE_VAPID_PUBLIC_KEY || null
export const pushDistantConfigure = Boolean(CLE_VAPID)

// La clé VAPID (base64url) doit être convertie en Uint8Array pour l'API Push.
function base64UrlEnUint8(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const base = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const brut = atob(base)
  return Uint8Array.from([...brut].map((c) => c.charCodeAt(0)))
}

export async function activerPushDistant(foyer, membre) {
  if (!supabaseActif || !CLE_VAPID || !foyer) return false
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
  try {
    const registration = await navigator.serviceWorker.ready
    const abonnement =
      (await registration.pushManager.getSubscription()) ||
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlEnUint8(CLE_VAPID),
      }))
    const donnees = abonnement.toJSON()
    const { error } = await supabase.from('subscriptions').upsert(
      { foyer, membre, endpoint: abonnement.endpoint, abonnement: donnees },
      { onConflict: 'endpoint' }
    )
    if (error) throw error
    return true
  } catch {
    return false // navigateur non compatible, permission refusée, ou push non déployé
  }
}
