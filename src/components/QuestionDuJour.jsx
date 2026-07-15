import { useState } from 'react'
import { membre, QUESTIONS_DU_JOUR } from '../data.js'
import { promptDuJour, reponsesDuJour, jourClef } from '../engagement.js'

export default function QuestionDuJour({ donnees, setDonnees, moi }) {
  const [texte, setTexte] = useState('')
  const question = promptDuJour(QUESTIONS_DU_JOUR)
  const reponses = reponsesDuJour(donnees)
  const maReponse = reponses[moi]
  const membres = donnees.membres || {}
  const total = Object.keys(membres).length || 1
  const entrees = Object.entries(reponses).sort((a, b) => (a[1].ts || '').localeCompare(b[1].ts || ''))

  function repondre(e) {
    e.preventDefault()
    const propre = texte.trim()
    if (!propre) return
    setDonnees((d) => {
      const jour = jourClef(new Date())
      const dejaCeJour = d.reponsesJour?.[jour] || {}
      return {
        ...d,
        reponsesJour: {
          ...d.reponsesJour,
          [jour]: { ...dejaCeJour, [moi]: { texte: propre, ts: new Date().toISOString() } },
        },
      }
    })
    setTexte('')
  }

  return (
    <section className="carte question-jour" aria-label="La question du jour">
      <p className="eyebrow">🌱 La question du jour</p>
      <h3 className="question-texte">{question}</h3>

      {!maReponse ? (
        <form onSubmit={repondre} style={{ marginTop: 12 }}>
          <textarea
            rows="2"
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            placeholder="Votre réponse…"
            aria-label="Votre réponse à la question du jour"
            className="champ-reponse"
          />
          <div className="actions" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="indice-reponse">
              {entrees.length > 0
                ? `Répondez pour découvrir ${entrees.length} réponse${entrees.length > 1 ? 's' : ''} 👀`
                : 'Ouvrez le bal — répondez le premier 🌱'}
            </span>
            <button type="submit" className="bouton-principal" disabled={!texte.trim()}>
              Répondre
            </button>
          </div>
        </form>
      ) : (
        <>
          <p className="progres-reponses">
            {entrees.length}/{total} ont répondu aujourd'hui
          </p>
          <div className="fil-reponses">
            {entrees.map(([id, r]) => {
              const m = membre(membres, id)
              return (
                <div key={id} className="reponse-ligne">
                  <span className="reponse-avatar" style={{ background: m.couleur }} aria-hidden="true">{m.emoji}</span>
                  <div>
                    <div className="reponse-qui">{m.nom}{id === moi ? ' (vous)' : ''}</div>
                    <div className="reponse-texte">{r.texte}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}
