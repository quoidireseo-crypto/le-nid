import { useState } from 'react'

// Palette volontairement courte et chaleureuse : réagir en un seul tap, sans
// clavier — essentiel pour les membres les moins à l'aise avec l'écrit.
const PALETTE = ['❤️', '😂', '🥰', '👍', '🎉']

export default function Reactions({ reactions = {}, moi, onToggle }) {
  const [ouvert, setOuvert] = useState(false)
  const presentes = PALETTE.filter((e) => (reactions[e] || []).length > 0)

  return (
    <div className="reactions">
      {presentes.map((e) => {
        const liste = reactions[e] || []
        const actif = liste.includes(moi)
        return (
          <button
            key={e}
            type="button"
            className={`reaction ${actif ? 'actif' : ''}`}
            onClick={() => onToggle(e)}
            aria-pressed={actif}
            aria-label={`${e}, ${liste.length} réaction${liste.length > 1 ? 's' : ''}${actif ? ', la vôtre incluse' : ''}`}
          >
            <span aria-hidden="true">{e}</span>
            <span className="compte">{liste.length}</span>
          </button>
        )
      })}

      <button
        type="button"
        className="reaction ajouter"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        aria-label="Ajouter une réaction"
      >
        <span aria-hidden="true">🙂﹢</span>
      </button>

      {ouvert && (
        <div className="palette-reactions" role="group" aria-label="Choisir une réaction">
          {PALETTE.map((e) => (
            <button
              key={e}
              type="button"
              className={(reactions[e] || []).includes(moi) ? 'actif' : ''}
              onClick={() => { onToggle(e); setOuvert(false) }}
              aria-label={`Réagir ${e}`}
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
