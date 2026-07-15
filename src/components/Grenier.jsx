import { membre } from '../data.js'
import { souvenirsDuJour, ilYaLabel } from '../engagement.js'

const EMOJI_TYPE = { photo: '📷', note: '🧲', message: '💬', reponse: '🌱' }

export default function Grenier({ donnees }) {
  const souvenirs = souvenirsDuJour(donnees)

  return (
    <>
      <header className="entete-piece">
        <p className="eyebrow">Le Grenier</p>
        <h2>Les souvenirs 📸</h2>
        <p>Tout ce qu'on garde précieusement, rangé par moments.</p>
      </header>

      {souvenirs.length > 0 ? (
        souvenirs.map((s, i) => {
          const estPhotoUrl = s.type === 'photo' && typeof s.contenu === 'string' && s.contenu.startsWith('http')
          return (
            <section key={i} className="souvenir-dimanche" aria-label="Ce jour-là">
              <p className="etiquette">✨ Ce jour-là · {ilYaLabel(s.annees)}</p>
              <div className="grande-photo" aria-hidden="true">
                {estPhotoUrl ? <img src={s.contenu} alt="" loading="lazy" /> : (EMOJI_TYPE[s.type] || '✨')}
              </div>
              {!estPhotoUrl && s.contenu && <p>« {s.contenu} »</p>}
              <p style={{ fontFamily: 'Atkinson Hyperlegible, sans-serif', fontSize: '0.82rem', opacity: 0.85, marginTop: 6 }}>
                — {membre(donnees.membres, s.auteur).nom}
              </p>
            </section>
          )
        })
      ) : (
        <section className="souvenir-dimanche" aria-label="Souvenir du jour">
          <p className="etiquette">✨ Le souvenir du jour</p>
          <div className="grande-photo" aria-hidden="true">🕰️</div>
          <p>Rien de ce jour dans les années passées… pour l'instant. Vos souvenirs d'aujourd'hui reviendront ici l'an prochain.</p>
        </section>
      )}

      {donnees.albums.map((a) => (
        <article key={a.id} className="album">
          <div className="titre-album">
            <span aria-hidden="true">{a.emoji}</span>
            <span>
              {a.nom} <span className="date">· {a.date}</span>
            </span>
          </div>
          <div className="grille-photos" aria-label={`Photos de l'album ${a.nom}`}>
            {a.photos.map((p, i) => (
              <span key={i} aria-hidden="true">{p}</span>
            ))}
          </div>
        </article>
      ))}
    </>
  )
}
