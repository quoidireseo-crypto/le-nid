// ————————————————————————————————————————————
// Le Nid — moteur de synchronisation
//
// Problème résolu : avant, chaque appareil réécrivait TOUT le blob de données.
// Deux personnes qui postaient en même temps → l'une écrasait l'autre
// silencieusement (« dernier qui écrit gagne »).
//
// Principe ici : un état « serveur » autoritatif + une file de changements
// locaux (des reducers) pas encore confirmés. On envoie avec un contrôle de
// concurrence optimiste (on ne remplace la ligne que si personne n'a écrit
// depuis notre dernière lecture). En cas de conflit, on RE-JOUE nos changements
// locaux par-dessus l'état frais du serveur et on réessaie — rien n'est perdu,
// même les suppressions (le reducer se ré-exécute sur les données à jour).
// ————————————————————————————————————————————
import { supabase, supabaseActif } from './supabaseClient.js'
import { charger, sauvegarder, completer } from './data.js'
import { CODE_FOYER } from './sync.js'
import { jourClef } from './engagement.js'

const TABLE = 'nids'
const RECUL_MS = 400 // léger recul avant de réessayer, pour éviter les rafales

export function creerMoteur({ onEtat, onNotif, onErreur, getMoi }) {
  let serveur = charger()   // dernier état autoritatif connu (local au démarrage)
  let enAttente = []        // reducers locaux pas encore confirmés par le serveur
  let baseUpdatedAt = null  // updated_at du serveur (jeton de concurrence optimiste)
  let canal = null
  let envoiEnCours = false
  let relancer = false

  // État affiché = serveur autoritatif + nos changements locaux rejoués dessus.
  function etatLocal() {
    return completer(enAttente.reduce((acc, r) => r(acc), serveur))
  }

  function diffuser() {
    const etat = etatLocal()
    sauvegarder(etat)
    onEtat(etat)
    return etat
  }

  // ——— Changement local : optimiste immédiatement, puis synchronisé ———
  function muter(reducer) {
    if (typeof reducer !== 'function') return // on n'accepte que la forme fonctionnelle
    enAttente.push(reducer)
    diffuser()
    programmerEnvoi()
  }

  // ——— Réception d'un changement distant ———
  function appliquerServeur(donnees, updatedAt) {
    if (updatedAt && updatedAt === baseUpdatedAt) return // déjà connu (souvent notre écho)
    const avant = serveur
    serveur = completer(donnees)
    baseUpdatedAt = updatedAt
    detecterNouveautes(avant, serveur)
    diffuser() // nos changements en attente sont rejoués par-dessus, jamais perdus
  }

  function detecterNouveautes(avant, apres) {
    const moi = getMoi?.()
    if (apres.messages.length > (avant.messages?.length || 0)) {
      const dernier = apres.messages[apres.messages.length - 1]
      if (dernier && dernier.auteur !== moi) onNotif?.('message', dernier, apres)
    }
    if (apres.frigo.length > (avant.frigo?.length || 0)) {
      const derniere = apres.frigo[apres.frigo.length - 1]
      if (derniere && derniere.auteur !== moi) onNotif?.('frigo', derniere, apres)
    }
    // Nouvelle réponse à la question du jour (par quelqu'un d'autre)
    const jour = jourClef(new Date())
    const avantRep = avant.reponsesJour?.[jour] || {}
    const apresRep = apres.reponsesJour?.[jour] || {}
    const nouveaux = Object.keys(apresRep).filter((id) => !avantRep[id] && id !== moi)
    if (nouveaux.length) onNotif?.('question', { auteur: nouveaux[0] }, apres)
  }

  function ecouter() {
    canal = supabase
      .channel(`nid-${CODE_FOYER}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: TABLE, filter: `code=eq.${CODE_FOYER}` },
        (p) => appliquerServeur(p.new.donnees, p.new.updated_at)
      )
      .subscribe()
  }

  // ——— Envoi : concurrence optimiste + rejeu en cas de conflit ———
  function programmerEnvoi() {
    if (!supabaseActif) return
    if (envoiEnCours) { relancer = true; return } // un seul envoi à la fois
    envoyer()
  }

  async function envoyer() {
    if (!enAttente.length) return
    envoiEnCours = true
    const lot = enAttente.slice() // instantané des reducers qu'on tente de confirmer
    const candidat = completer(lot.reduce((acc, r) => r(acc), serveur))
    try {
      const { data, error } = await supabase.rpc('push_nid', {
        p_code: CODE_FOYER,
        p_donnees: candidat,
        p_expected: baseUpdatedAt,
      })
      if (error) throw error
      serveur = completer(data.donnees)
      baseUpdatedAt = data.updated_at
      if (data.applied) {
        // Nos reducers sont confirmés ; on retire ceux de ce lot (d'autres ont
        // pu s'ajouter pendant l'attente : ils restent en file).
        enAttente = enAttente.slice(lot.length)
      }
      // Conflit (applied = false) : on garde les reducers, ils seront rejoués
      // sur le serveur frais au prochain envoi.
      diffuser()
    } catch (e) {
      onErreur?.() // hors-ligne ou RPC absente : on garde tout, l'appli reste utilisable
    } finally {
      envoiEnCours = false
      if (enAttente.length || relancer) {
        relancer = false
        setTimeout(programmerEnvoi, RECUL_MS)
      }
    }
  }

  // ——— Connexion initiale ———
  async function connecter() {
    if (!supabaseActif) { diffuser(); return }
    const { data, error } = await supabase
      .from(TABLE)
      .select('donnees, updated_at')
      .eq('code', CODE_FOYER)
      .maybeSingle()
    if (error) throw error
    if (data) {
      serveur = completer(data.donnees)
      baseUpdatedAt = data.updated_at
    } else {
      // Le foyer n'existe pas encore : on force un premier envoi qui le créera.
      enAttente.push((d) => d)
    }
    ecouter()
    diffuser()
    if (enAttente.length) programmerEnvoi()
  }

  function arreter() {
    if (canal) supabase.removeChannel(canal)
    canal = null
  }

  return { muter, connecter, arreter, etatLocal }
}
