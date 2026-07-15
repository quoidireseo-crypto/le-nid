import { useRef, useState } from 'react'
import { membre } from '../data.js'
import { basculerReaction } from '../engagement.js'
import { supabaseActif } from '../supabaseClient.js'
import { uploaderPhoto } from '../sync.js'
import Reactions from './Reactions.jsx'

const COULEURS = ['jaune', 'rose', 'bleu']

export default function Frigo({ donnees, setDonnees, moi }) {
  const [nouveau, setNouveau] = useState('')
  const [envoiPhoto, setEnvoiPhoto] = useState(false)
  const [erreurPhoto, setErreurPhoto] = useState(null)
  const fichierRef = useRef(null)

  function aimanter(e) {
    e.preventDefault()
    const propre = nouveau.trim()
    if (!propre) return
    const couleur = COULEURS[donnees.frigo.length % COULEURS.length]
    setDonnees((d) => ({
      ...d,
      frigo: [...d.frigo, { id: `n${Date.now()}`, type: 'postit', couleur, auteur: moi, texte: propre, ts: new Date().toISOString() }],
    }))
    setNouveau('')
  }

  async function choisirPhoto(e) {
    const fichier = e.target.files?.[0]
    e.target.value = '' // permet de reprendre la même photo plus tard si besoin
    if (!fichier) return
    if (!supabaseActif) {
      setErreurPhoto('Les photos demandent la synchronisation en ligne — pas disponible en mode local.')
      return
    }
    setErreurPhoto(null)
    setEnvoiPhoto(true)
    try {
      const url = await uploaderPhoto(fichier)
      setDonnees((d) => ({
        ...d,
        frigo: [...d.frigo, { id: `n${Date.now()}`, type: 'polaroid', auteur: moi, photo: url, texte: '', ts: new Date().toISOString() }],
      }))
    } catch {
      setErreurPhoto('L\u2019envoi de la photo a échoué. Réessayez.')
    } finally {
      setEnvoiPhoto(false)
    }
  }

  function retirer(id) {
    setDonnees((d) => ({ ...d, frigo: d.frigo.filter((n) => n.id !== id) }))
  }

  function reagir(noteId, emoji) {
    setDonnees((d) => ({
      ...d,
      frigo: d.frigo.map((n) =>
        n.id === noteId ? { ...n, reactions: basculerReaction(n.reactions, emoji, moi) } : n
      ),
    }))
  }

  function cocher(noteId, index) {
    setDonnees((d) => ({
      ...d,
      frigo: d.frigo.map((n) =>
        n.id === noteId
          ? { ...n, items: n.items.map((it, i) => (i === index ? { ...it, fait: !it.fait } : it)) }
          : n
      ),
    }))
  }

  return (
    <>
      <header className="entete-piece">
        <p className="eyebrow">Le Frigo</p>
        <h2>Le tableau de la famille 🧲</h2>
        <p>Aimantez un mot, une photo, une liste. Comme à la maison.</p>
      </header>

      <form className="ajout-note" onSubmit={aimanter}>
        <textarea
          rows="2"
          value={nouveau}
          onChange={(e) => setNouveau(e.target.value)}
          placeholder="Écrire un petit mot…"
          aria-label="Nouveau post-it"
        />
        <div className="actions" style={{ justifyContent: 'space-between' }}>
          <button
            type="button"
            className="bouton-secondaire"
            style={{ marginLeft: 0, marginTop: 0 }}
            onClick={() => fichierRef.current?.click()}
            disabled={envoiPhoto}
          >
            {envoiPhoto ? '📤 Envoi…' : '📷 Ajouter une photo'}
          </button>
          <input
            ref={fichierRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={choisirPhoto}
            style={{ display: 'none' }}
            aria-label="Choisir une photo"
          />
          <button type="submit" className="bouton-principal">🧲 Aimanter</button>
        </div>
        {erreurPhoto && (
          <p role="alert" style={{ color: 'var(--tuile)', fontSize: '0.82rem', marginTop: 8 }}>
            {erreurPhoto}
          </p>
        )}
      </form>

      <div className="porte-frigo" aria-label="Notes aimantées sur le frigo">
        {donnees.frigo.map((n) => (
          <article key={n.id} className={`note ${n.type} ${n.couleur || ''}`}>
            <span className="aimant" aria-hidden="true" />
            <button className="retirer" onClick={() => retirer(n.id)} aria-label="Retirer cette note">✕</button>

            {n.type === 'postit' && (
              <>
                <p className="texte-note">{n.texte}</p>
                <span className="signature">— {membre(donnees.membres, n.auteur).nom}</span>
              </>
            )}

            {n.type === 'polaroid' && (
              <>
                <div className="photo" aria-hidden={!n.photo?.startsWith('http')}>
                  {n.photo?.startsWith('http') ? (
                    <img src={n.photo} alt="" loading="lazy" />
                  ) : (
                    n.photo
                  )}
                </div>
                {n.texte && <p className="texte-note">{n.texte}</p>}
                <span className="signature">— {membre(donnees.membres, n.auteur).nom}</span>
              </>
            )}

            {n.type === 'liste' && (
              <>
                <h4>{n.titre}</h4>
                {n.items.map((it, i) => (
                  <label key={i}>
                    <input
                      type="checkbox"
                      checked={it.fait}
                      onChange={() => cocher(n.id, i)}
                    />
                    <span className={it.fait ? 'fait' : ''}>{it.t}</span>
                  </label>
                ))}
                <span className="signature">— {membre(donnees.membres, n.auteur).nom}</span>
              </>
            )}

            <Reactions reactions={n.reactions} moi={moi} onToggle={(e) => reagir(n.id, e)} />
          </article>
        ))}
      </div>
    </>
  )
}
