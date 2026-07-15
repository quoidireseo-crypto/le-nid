import { membre } from '../data.js'

const ETOILES = [
  { top: '14%', left: '8%' }, { top: '8%', left: '30%' },
  { top: '18%', left: '55%' }, { top: '6%', left: '78%' },
  { top: '24%', left: '90%' }, { top: '30%', left: '18%' },
]

export default function Maison({ donnees, setDonnees, allerA, moi, changerIdentite, notifPermission, demanderNotifPermission }) {
  const derniereNote = donnees.frigo[donnees.frigo.length - 1]
  const dernierMessage = donnees.messages[donnees.messages.length - 1]
  const derniereRecette = donnees.recettes[0]
  const dernierAlbum = donnees.albums[donnees.albums.length - 1]
  const membres = Object.entries(donnees.membres || {})

  function renommerFoyer() {
    const nouveau = window.prompt('Quel est le nom de votre famille ?', donnees.nomFamille)
    if (nouveau && nouveau.trim()) {
      setDonnees((d) => ({ ...d, nomFamille: nouveau.trim() }))
    }
  }

  const pieces = [
    {
      id: 'salon', nom: 'Salon', icone: '🛋️', allumee: donnees.messages.length > 0,
      activite: dernierMessage ? `${membre(donnees.membres, dernierMessage.auteur).nom} a écrit` : 'Tout est calme',
    },
    {
      id: 'frigo', nom: 'Frigo', icone: '🧲', allumee: donnees.frigo.length > 0,
      activite: derniereNote ? `${donnees.frigo.length} choses aimantées` : 'Rien pour l\u2019instant',
    },
    {
      id: 'cuisine', nom: 'Cuisine', icone: '🍲', allumee: donnees.recettes.length > 0,
      activite: derniereRecette
        ? `Recette de ${membre(donnees.membres, derniereRecette.auteur).nom}`
        : 'À garnir de recettes',
    },
    {
      id: 'grenier', nom: 'Grenier', icone: '📸', allumee: donnees.albums.length > 0,
      activite: dernierAlbum ? dernierAlbum.nom : 'Aucun souvenir',
    },
    {
      id: 'jardin', nom: 'Jardin', icone: '🌳', allumee: true,
      activite: (() => {
        const scores = Object.entries(donnees.classementQuiz || {})
        if (scores.length === 0) return 'On joue ?'
        const [meneurId, meneur] = scores.sort((a, b) => b[1].meilleur - a[1].meilleur)[0]
        return `${membre(donnees.membres, meneurId).nom.split(' ')[0]} mène : ${meneur.meilleur}/8`
      })(),
    },
  ]

  return (
    <>
      <header className="ciel">
        {ETOILES.map((e, i) => (
          <span key={i} className="etoile" style={{ ...e, animationDelay: `${i * 0.5}s` }} aria-hidden="true" />
        ))}
        <h1>Le Nid</h1>
        <p className="sous-titre">
          La famille {donnees.nomFamille}{' '}
          <button
            onClick={renommerFoyer}
            style={{ background: 'none', border: 'none', color: 'inherit', opacity: 0.7, cursor: 'pointer', fontSize: '0.85em', padding: 0 }}
            aria-label="Modifier le nom de la famille"
          >
            ✏️
          </button>
          {' · '}Bienvenue à la maison, {membre(donnees.membres, moi).nom}
        </p>
        {changerIdentite && (
          <p style={{ fontSize: '0.74rem', color: 'rgba(251,247,238,0.65)', marginTop: 2 }}>
            <button
              onClick={changerIdentite}
              style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit', padding: 0 }}
            >
              ce n'est pas vous ?
            </button>
          </p>
        )}

        <div className="maison" role="group" aria-label="La maison de famille">
          <div className="toit">
            <div className="cheminee">
              <div className="fumee" aria-hidden="true">
                <span /><span /><span />
              </div>
            </div>
          </div>
          <div className="facade">
            {pieces.map((p) => (
              <button
                key={p.id}
                className={`piece ${p.allumee ? 'allumee' : ''}`}
                onClick={() => allerA(p.id)}
                aria-label={`Entrer dans ${p.nom} — ${p.activite}`}
              >
                <span className="icone" aria-hidden="true">{p.icone}</span>
                <span className="nom-piece">{p.nom}</span>
                <span className="activite">{p.activite}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="perron">
          <h3>Sur le pas de la porte</h3>
          <div className="rangee-avatars">
            {membres.map(([id, m], i) => (
              <div key={id} className={`avatar ${i < 4 ? 'present' : ''}`}>
                <span className="rond" style={{ background: m.couleur }} aria-hidden="true">{m.emoji}</span>
                {m.nom}
              </div>
            ))}
          </div>
        </div>
      </header>

      {notifPermission === 'default' && (
        <div className="carte" role="status">
          <h3>🔔 Ne rien rater</h3>
          <p style={{ color: 'var(--encre-douce)', fontSize: '0.9rem', marginBottom: 10 }}>
            Activez les notifications pour être prévenu quand quelqu'un écrit dans le Salon ou aimante quelque chose au Frigo.
          </p>
          <button className="bouton-secondaire" style={{ marginLeft: 0 }} onClick={demanderNotifPermission}>
            Activer les notifications
          </button>
        </div>
      )}
      {notifPermission === 'denied' && (
        <p style={{ margin: '0 22px 14px', fontSize: '0.8rem', color: 'var(--encre-douce)' }}>
          🔕 Notifications bloquées — activables dans les réglages du navigateur si vous changez d'avis.
        </p>
      )}

      <section className="carte" aria-label="Prochains rendez-vous">
        <h3>📅 Bientôt au Nid</h3>
        {donnees.evenements.map((e) => (
          <div key={e.id} className="evenement">
            <span className="emoji" aria-hidden="true">{e.emoji}</span>
            <div>
              <div className="quoi">{e.nom}</div>
              <div className="quand">{e.date}</div>
            </div>
          </div>
        ))}
      </section>
    </>
  )
}
