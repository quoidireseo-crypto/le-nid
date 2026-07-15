import { useEffect, useRef, useState } from 'react'
import { charger, membre, couleurAleatoire } from './data.js'
import { supabaseActif } from './supabaseClient.js'
import { NID_FIXE, foyerActif, definirFoyer, oublierFoyer, foyerExiste, genererCodeLibre } from './sync.js'
import { creerMoteur } from './syncEngine.js'
import { identiteEnregistree, enregistrerIdentite, oublierIdentite, genererIdMembre } from './identite.js'
import { permissionNotifications, demanderPermission, notifier } from './notifications.js'
import { activerPushDistant } from './push.js'
import Accueil from './components/Accueil.jsx'
import Cle from './components/Cle.jsx'
import Identite from './components/Identite.jsx'
import Maison from './components/Maison.jsx'
import Salon from './components/Salon.jsx'
import Frigo from './components/Frigo.jsx'
import Cuisine from './components/Cuisine.jsx'
import Grenier from './components/Grenier.jsx'
import Jardin from './components/Jardin.jsx'

const ONGLETS = [
  { id: 'maison', nom: 'Maison', ico: '🏠' },
  { id: 'salon', nom: 'Salon', ico: '💬' },
  { id: 'frigo', nom: 'Frigo', ico: '🧲' },
  { id: 'cuisine', nom: 'Cuisine', ico: '🍲' },
  { id: 'grenier', nom: 'Grenier', ico: '📸' },
  { id: 'jardin', nom: 'Jardin', ico: '🌳' },
]

export default function App() {
  const [onglet, setOnglet] = useState('maison')
  const [donnees, setDonnees] = useState(charger)
  const [moi, setMoi] = useState(identiteEnregistree)
  const [vue, setVue] = useState(() => {
    if (!supabaseActif) return 'demarrage'
    if (foyerActif()) return 'chargement'   // foyer déjà créé/rejoint sur cet appareil
    return NID_FIXE ? 'cle' : 'accueil'      // mode fixe : la porte ; mode produit : créer/rejoindre
  })
  const [erreur, setErreur] = useState(null)
  const [enCours, setEnCours] = useState(false)
  const [nidInvite, setNidInvite] = useState(null) // clé pré-remplie depuis un lien ?nid=
  const [notifPermission, setNotifPermission] = useState(permissionNotifications)

  const moiRef = useRef(moi)
  const moteurRef = useRef(null)

  useEffect(() => { moiRef.current = moi }, [moi])

  function suite() {
    setVue(identiteEnregistree() ? 'app' : 'identite')
  }

  // Notification déclenchée par le moteur quand quelqu'un d'AUTRE poste
  function surNouveaute(type, item, etat) {
    if (type === 'message') {
      notifier('🛋️ Nouveau message au Salon', `${membre(etat.membres, item.auteur).nom} : ${item.texte}`)
    } else if (type === 'frigo') {
      notifier('🧲 Nouveau sur le Frigo', `${membre(etat.membres, item.auteur).nom} a aimanté quelque chose`)
    } else if (type === 'question') {
      notifier('🌱 La question du jour', `${membre(etat.membres, item.auteur).nom} a répondu`)
    }
  }

  // Le moteur possède l'état partagé (concurrence optimiste, rejeu des changements
  // locaux, sauvegarde locale, temps réel). L'appli n'en garde qu'un miroir affiché.
  useEffect(() => {
    const moteur = creerMoteur({
      onEtat: setDonnees,
      onNotif: surNouveaute,
      onErreur: () => setErreur('La synchronisation a échoué — vos données restent sur cet appareil.'),
      getMoi: () => moiRef.current,
    })
    moteurRef.current = moteur

    if (!supabaseActif) {
      moteur.connecter().finally(suite)
    } else if (foyerActif()) {
      moteur.connecter().then(suite).catch(() => {
        suite()
        setErreur('Connexion à la maison impossible pour le moment — vos données restent sur cet appareil.')
      })
    } else {
      // Pas encore de foyer : un lien d'invitation ?nid=CLE pré-remplit l'écran « Rejoindre ».
      const invite = new URLSearchParams(window.location.search).get('nid')
      if (invite && !NID_FIXE) {
        setNidInvite(invite.trim().toLowerCase())
        setVue('cle')
      }
    }
    return () => moteur.arreter()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Tout changement de données passe par le moteur (optimiste puis synchronisé).
  function muter(reducer) {
    moteurRef.current?.muter(reducer)
  }

  function nettoyerUrl() {
    if (window.location.search) window.history.replaceState(null, '', window.location.pathname)
  }

  // Rejoindre un Nid avec sa clé.
  // Mode fixe (VITE_NID_CODE) : la clé doit correspondre. Mode produit : le foyer doit exister.
  async function entrerAvecCle(saisie) {
    setErreur(null)
    const code = (saisie || '').trim().toLowerCase()
    if (!code) return
    if (NID_FIXE && code !== NID_FIXE.toLowerCase()) {
      setErreur('Ce n\u2019est pas la bonne clé. Vérifiez auprès de la famille.')
      return
    }
    setEnCours(true)
    try {
      if (!NID_FIXE && !(await foyerExiste(code))) {
        setErreur('Aucun Nid ne porte cette clé. Vérifiez auprès de la famille.')
        return
      }
      definirFoyer(NID_FIXE || code)
      await moteurRef.current.connecter()
      nettoyerUrl()
      suite()
    } catch {
      setErreur('Connexion impossible pour le moment. Réessayez dans un instant.')
    } finally {
      setEnCours(false)
    }
  }

  // Créer un nouveau Nid (mode produit) : génère une clé libre, crée le foyer vide.
  async function creerNouveauNid() {
    setErreur(null)
    setEnCours(true)
    try {
      const code = await genererCodeLibre()
      definirFoyer(code)
      await moteurRef.current.connecter() // le foyer inexistant est créé au premier envoi
      nettoyerUrl()
      suite()
    } catch {
      oublierFoyer()
      setErreur('Création impossible pour le moment. Réessayez dans un instant.')
    } finally {
      setEnCours(false)
    }
  }

  // Quitter le foyer actuel pour en créer/rejoindre un autre.
  function changerDeFoyer() {
    oublierFoyer()
    oublierIdentite()
    window.location.reload()
  }

  // Crée le profil (prénom + emoji choisis) et l'ajoute aux membres partagés du foyer
  function validerIdentite(nom, emoji) {
    const id = genererIdMembre()
    muter((d) => ({
      ...d,
      membres: { ...d.membres, [id]: { nom, emoji, couleur: couleurAleatoire() } },
    }))
    enregistrerIdentite(id)
    setMoi(id)
    setVue('app')
  }

  function changerIdentite() {
    oublierIdentite()
    setMoi(null)
    setVue('identite')
  }

  async function demanderNotifPermission() {
    const resultat = await demanderPermission()
    setNotifPermission(resultat)
    // Si le push distant est configuré (Phase 2 déployée), on abonne aussi
    // l'appareil pour recevoir des notifications même appli fermée.
    if (resultat === 'granted') {
      activerPushDistant(foyerActif(), moiRef.current).catch(() => {})
    }
  }

  if (vue === 'demarrage' || vue === 'chargement') {
    return (
      <div className="appli" style={{ display: 'flex' }}>
        <p style={{ margin: 'auto', color: 'var(--encre-douce)', fontFamily: 'Caveat, cursive', fontSize: '1.4rem' }}>
          On ouvre la porte de la maison…
        </p>
      </div>
    )
  }
  if (vue === 'accueil') {
    return <Accueil onCreer={creerNouveauNid} onRejoindre={() => { setErreur(null); setVue('cle') }} enCours={enCours} erreur={erreur} />
  }
  if (vue === 'cle') {
    return (
      <Cle
        onEntrer={entrerAvecCle}
        erreur={erreur}
        enCours={enCours}
        valeurInitiale={nidInvite || ''}
        rejoindre={!NID_FIXE}
        onRetour={NID_FIXE ? null : () => { setErreur(null); setVue('accueil') }}
      />
    )
  }
  if (vue === 'identite') return <Identite onValider={validerIdentite} />

  const props = {
    donnees, setDonnees: muter, allerA: setOnglet, moi,
    changerIdentite, notifPermission, demanderNotifPermission,
    foyer: foyerActif(), multiFoyer: supabaseActif && !NID_FIXE, changerDeFoyer,
  }

  return (
    <div className="appli">
      {erreur && (
        <p role="alert" style={{ background: 'var(--miel-doux)', padding: '8px 16px', fontSize: '0.8rem', color: 'var(--encre)' }}>
          {erreur}
        </p>
      )}
      <main className="contenu">
        {onglet === 'maison' && <Maison {...props} />}
        {onglet === 'salon' && <Salon {...props} />}
        {onglet === 'frigo' && <Frigo {...props} />}
        {onglet === 'cuisine' && <Cuisine {...props} />}
        {onglet === 'grenier' && <Grenier {...props} />}
        {onglet === 'jardin' && <Jardin {...props} />}
      </main>

      <nav className="nav" aria-label="Pièces de la maison">
        {ONGLETS.map((o) => (
          <button
            key={o.id}
            className={onglet === o.id ? 'actif' : ''}
            onClick={() => setOnglet(o.id)}
            aria-current={onglet === o.id ? 'page' : undefined}
          >
            <span className="ico" aria-hidden="true">{o.ico}</span>
            {o.nom}
          </button>
        ))}
      </nav>
    </div>
  )
}
