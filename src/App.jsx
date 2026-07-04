import { useEffect, useRef, useState } from 'react'
import { charger, sauvegarder, membre, completer, couleurAleatoire } from './data.js'
import { supabaseActif } from './supabaseClient.js'
import {
  CODE_FOYER, connecterFoyer, pousserDonnees, ecouterChangements,
  codeEnregistre, enregistrerCode,
} from './sync.js'
import { identiteEnregistree, enregistrerIdentite, oublierIdentite, genererIdMembre } from './identite.js'
import { permissionNotifications, demanderPermission, notifier } from './notifications.js'
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
    // La clé déjà validée sur cet appareil ? On entre directement.
    return codeEnregistre() === CODE_FOYER ? 'chargement' : 'cle'
  })
  const [erreur, setErreur] = useState(null)
  const [enCours, setEnCours] = useState(false)
  const [notifPermission, setNotifPermission] = useState(permissionNotifications)

  const derniereEcriture = useRef(null)
  const arretEcoute = useRef(null)
  const moiRef = useRef(moi)

  useEffect(() => { moiRef.current = moi }, [moi])

  function suite() {
    setVue(identiteEnregistree() ? 'app' : 'identite')
  }

  // Compare les anciennes et nouvelles données pour notifier des nouveautés d'autrui
  function appliquerMiseAJour(nouvelles) {
    const completes = completer(nouvelles)
    setDonnees((prev) => {
      if (prev.messages && completes.messages.length > prev.messages.length) {
        const dernier = completes.messages[completes.messages.length - 1]
        if (dernier.auteur !== moiRef.current) {
          notifier('🛋️ Nouveau message au Salon', `${membre(completes.membres, dernier.auteur).nom} : ${dernier.texte}`)
        }
      }
      if (prev.frigo && completes.frigo.length > prev.frigo.length) {
        const derniere = completes.frigo[completes.frigo.length - 1]
        if (derniere.auteur !== moiRef.current) {
          notifier('🧲 Nouveau sur le Frigo', `${membre(completes.membres, derniere.auteur).nom} a aimanté quelque chose`)
        }
      }
      return completes
    })
  }

  function connecter() {
    return connecterFoyer(donnees).then((d) => {
      const completes = completer(d)
      derniereEcriture.current = JSON.stringify(d)
      setDonnees(completes)
      suite()
      arretEcoute.current = ecouterChangements(CODE_FOYER, (nouvelles) => {
        const s = JSON.stringify(nouvelles)
        if (s === derniereEcriture.current) return
        derniereEcriture.current = s
        appliquerMiseAJour(nouvelles)
      })
    })
  }

  // Au démarrage : si la clé a déjà été validée sur cet appareil, connexion directe
  useEffect(() => {
    if (!supabaseActif) { suite(); return }
    if (codeEnregistre() !== CODE_FOYER) return // la porte s'affichera
    let annule = false
    connecter().catch(() => {
      if (annule) return
      suite()
      setErreur('Connexion à la maison impossible pour le moment — vos données restent sur cet appareil.')
    })
    return () => { annule = true; arretEcoute.current?.() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Validation de la clé saisie sur l'écran d'entrée
  async function entrerAvecCle(saisie) {
    setErreur(null)
    if (saisie !== CODE_FOYER.toLowerCase()) {
      setErreur('Ce n\u2019est pas la bonne clé. Vérifiez auprès de la famille.')
      return
    }
    setEnCours(true)
    try {
      await connecter()
      enregistrerCode(CODE_FOYER)
    } catch {
      setErreur('Connexion impossible pour le moment. Réessayez dans un instant.')
    } finally {
      setEnCours(false)
    }
  }

  // Sauvegarde locale systématique (filet de sécurité) + synchronisation Supabase
  useEffect(() => {
    sauvegarder(donnees)
    if (!supabaseActif || vue !== 'app') return
    const s = JSON.stringify(donnees)
    if (s === derniereEcriture.current) return
    derniereEcriture.current = s
    pousserDonnees(CODE_FOYER, donnees).catch(() =>
      setErreur('La synchronisation a échoué — vos données restent sur cet appareil.')
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donnees])

  // Crée le profil (prénom + emoji choisis) et l'ajoute aux membres partagés du foyer
  function validerIdentite(nom, emoji) {
    const id = genererIdMembre()
    setDonnees((d) => ({
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
  if (vue === 'cle') return <Cle onEntrer={entrerAvecCle} erreur={erreur} enCours={enCours} />
  if (vue === 'identite') return <Identite onValider={validerIdentite} />

  const props = {
    donnees, setDonnees, allerA: setOnglet, moi,
    changerIdentite, notifPermission, demanderNotifPermission,
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
