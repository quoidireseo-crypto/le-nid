import { useRef, useState } from 'react'
import { membre } from '../data.js'
import { souvenirsDuJour, ilYaLabel } from '../engagement.js'
import { supabaseActif } from '../supabaseClient.js'
import { uploaderPhoto } from '../sync.js'

const EMOJI_TYPE = { photo: '📷', note: '🧲', message: '💬', reponse: '🌱' }

function moisCourant() {
  return new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

export default function Grenier({ donnees, setDonnees, moi }) {
  const souvenirs = souvenirsDuJour(donnees)
  const [envoiAlbum, setEnvoiAlbum] = useState(null) // id de l'album en cours d'upload
  const [erreur, setErreur] = useState(null)
  const fichierRef = useRef(null)
  const albumCibleRef = useRef(null)

  function creerAlbum() {
    const nom = window.prompt('Nom du nouvel album ?', '')
    if (!nom || !nom.trim()) return
    setDonnees((d) => ({
      ...d,
      albums: [...d.albums, { id: `a${Date.now()}`, nom: nom.trim(), emoji: '📸', photos: [], date: moisCourant(), auteur: moi }],
    }))
  }

  function choisirPhotoPour(albumId) {
    if (!supabaseActif) {
      setErreur('Les photos demandent la synchronisation en ligne — pas disponible en mode local.')
      return
    }
    albumCibleRef.current = albumId
    fichierRef.current?.click()
  }

  async function ajouterPhoto(e) {
    const fichier = e.target.files?.[0]
    e.target.value = ''
    const albumId = albumCibleRef.current
    if (!fichier || !albumId) return
    setErreur(null)
    setEnvoiAlbum(albumId)
    try {
      const url = await uploaderPhoto(fichier)
      setDonnees((d) => ({
        ...d,
        albums: d.albums.map((a) => (a.id === albumId ? { ...a, photos: [...a.photos, url] } : a)),
      }))
    } catch {
      setErreur('L’envoi de la photo a échoué. Réessayez.')
    } finally {
      setEnvoiAlbum(null)
    }
  }

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

      <div className="actions-grenier no-print">
        <button className="bouton-secondaire" style={{ marginLeft: 0, marginTop: 0 }} onClick={creerAlbum}>
          ➕ Nouvel album
        </button>
        {donnees.albums.length > 0 && (
          <button className="bouton-secondaire" style={{ marginTop: 0 }} onClick={() => window.print()}>
            🖨️ Livre photo
          </button>
        )}
      </div>
      {erreur && (
        <p role="alert" style={{ margin: '0 22px 8px', color: 'var(--tuile)', fontSize: '0.82rem' }}>{erreur}</p>
      )}
      <input
        ref={fichierRef}
        type="file"
        accept="image/*"
        onChange={ajouterPhoto}
        style={{ display: 'none' }}
        aria-label="Choisir une photo pour l'album"
      />

      {donnees.albums.map((a) => (
        <article key={a.id} className="album">
          <div className="titre-album">
            <span aria-hidden="true">{a.emoji}</span>
            <span>
              {a.nom} <span className="date">· {a.date}</span>
            </span>
            <button
              className="ajouter-photo-album no-print"
              onClick={() => choisirPhotoPour(a.id)}
              disabled={envoiAlbum === a.id}
              aria-label={`Ajouter une photo à ${a.nom}`}
            >
              {envoiAlbum === a.id ? '📤…' : '📷 +'}
            </button>
          </div>
          <div className="grille-photos" aria-label={`Photos de l'album ${a.nom}`}>
            {a.photos.length === 0 && (
              <span className="album-vide no-print">Album vide — ajoutez une première photo 📷</span>
            )}
            {a.photos.map((p, i) =>
              typeof p === 'string' && p.startsWith('http')
                ? <img key={i} src={p} alt="" loading="lazy" className="photo-album" />
                : <span key={i} aria-hidden="true">{p}</span>
            )}
          </div>
        </article>
      ))}
    </>
  )
}
