import { useState } from 'react'
import { QUIZ, membre } from '../data.js'

function melanger(tableau) {
  const copie = [...tableau]
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copie[i], copie[j]] = [copie[j], copie[i]]
  }
  return copie
}

function messageFinal(score, total) {
  const ratio = score / total
  if (ratio === 1) return { titre: 'Score parfait ! 🏆', texte: 'Personne ne connaît la famille aussi bien que vous.' }
  if (ratio >= 0.7) return { titre: 'Très beau score ! 🌟', texte: 'La famille a de la mémoire, ça se voit.' }
  if (ratio >= 0.4) return { titre: 'Pas mal du tout ! 🌱', texte: 'De quoi progresser au prochain tour.' }
  return { titre: 'On retente sa chance ? 🌻', texte: 'L\u2019important, c\u2019est de participer !' }
}

function classementTrie(membres, classement) {
  return Object.entries(membres)
    .map(([id, m]) => ({ id, membre: m, score: classement[id] }))
    .filter((l) => l.score)
    .sort((a, b) => b.score.meilleur - a.score.meilleur)
}

export default function Jardin({ donnees, setDonnees }) {
  const [etape, setEtape] = useState('choix') // choix | jeu | fin
  const [joueurId, setJoueurId] = useState(null)
  const [questions, setQuestions] = useState(() => melanger(QUIZ))
  const [index, setIndex] = useState(0)
  const [choix, setChoix] = useState(null)
  const [score, setScore] = useState(0)

  const membres = donnees.membres || {}
  const classement = classementTrie(membres, donnees.classementQuiz)

  function commencer(id) {
    setJoueurId(id)
    setQuestions(melanger(QUIZ))
    setIndex(0)
    setChoix(null)
    setScore(0)
    setEtape('jeu')
  }

  const q = questions[index]
  const dernier = index === questions.length - 1

  function repondre(i) {
    if (choix !== null) return
    setChoix(i)
    if (i === q.bonne) setScore((s) => s + 1)
  }

  function suivant() {
    if (dernier) {
      const scoreFinal = score
      const aujourdhui = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      setDonnees((d) => {
        const precedent = d.classementQuiz[joueurId]
        return {
          ...d,
          classementQuiz: {
            ...d.classementQuiz,
            [joueurId]: {
              meilleur: Math.max(precedent?.meilleur || 0, scoreFinal),
              dernier: scoreFinal,
              date: aujourdhui,
            },
          },
        }
      })
      setEtape('fin')
      return
    }
    setIndex((i) => i + 1)
    setChoix(null)
  }

  function retourAccueilJeu() {
    setEtape('choix')
    setJoueurId(null)
  }

  return (
    <>
      <header className="entete-piece">
        <p className="eyebrow">Le Jardin</p>
        <h2>Le Quiz du Nid 🌳</h2>
        <p>Chacun joue quand il veut, à son rythme. Le classement se retrouve ici.</p>
      </header>

      {etape === 'choix' && (
        <>
          <section className="carte">
            <h3>Qui joue ?</h3>
            <div className="rangee-avatars" style={{ marginTop: 12 }}>
              {Object.entries(membres).map(([id, m]) => {
                const deja = donnees.classementQuiz[id]
                return (
                  <button
                    key={id}
                    onClick={() => commencer(id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    aria-label={`Jouer en tant que ${m.nom}`}
                  >
                    <div className="avatar">
                      <span className="rond" style={{ background: m.couleur }} aria-hidden="true">{m.emoji}</span>
                      {m.nom}
                    </div>
                    {deja && (
                      <div style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--sauge)', fontWeight: 700, marginTop: 2 }}>
                        record {deja.meilleur}/8
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </section>

          <section className="carte" aria-label="Classement de la famille">
            <h3>🏅 Le classement du Jardin</h3>
            {classement.length === 0 ? (
              <p style={{ color: 'var(--encre-douce)', fontSize: '0.9rem' }}>
                Personne n'a encore joué. À vous d'ouvrir le bal !
              </p>
            ) : (
              classement.map((l, i) => (
                <div key={l.id} className="evenement">
                  <span className="emoji" aria-hidden="true">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : l.membre.emoji}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div className="quoi">{l.membre.nom}</div>
                    <div className="quand">Dernière partie le {l.score.date} · dernier score {l.score.dernier}/8</div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--sauge)' }}>{l.score.meilleur}/8</div>
                </div>
              ))
            )}
          </section>
        </>
      )}

      {etape === 'jeu' && (
        <section className="carte" aria-live="polite">
          <p style={{ color: 'var(--sauge)', fontWeight: 700, fontSize: '0.82rem', marginBottom: 6 }}>
            {membre(membres, joueurId).nom} · Question {index + 1} / {questions.length}
          </p>
          <h3 style={{ fontSize: '1.2rem', lineHeight: 1.35 }}>{q.question}</h3>

          <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
            {q.options.map((opt, i) => {
              let style = { background: 'var(--blanc)', borderColor: 'rgba(42,47,43,0.2)', color: 'var(--encre)' }
              if (choix !== null) {
                if (i === q.bonne) style = { background: '#dcefdd', borderColor: 'var(--sauge)', color: '#2f4a34' }
                else if (i === choix) style = { background: '#fbdada', borderColor: '#c76a5f', color: '#7a2f26' }
              }
              return (
                <button
                  key={i}
                  onClick={() => repondre(i)}
                  disabled={choix !== null}
                  style={{
                    ...style,
                    border: '2px solid',
                    borderRadius: 12,
                    padding: '14px 16px',
                    fontFamily: 'inherit',
                    fontSize: '1rem',
                    fontWeight: 700,
                    textAlign: 'left',
                    cursor: choix === null ? 'pointer' : 'default',
                  }}
                >
                  {opt}
                </button>
              )
            })}
          </div>

          {choix !== null && (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontFamily: 'Caveat, cursive', fontSize: '1.2rem', color: 'var(--encre-douce)' }}>
                {choix === q.bonne ? '✅ Bien joué !' : `❌ ${q.astuce}`}
              </p>
              <button className="bouton-principal" onClick={suivant} style={{ marginTop: 8 }}>
                {dernier ? 'Voir le résultat' : 'Question suivante'}
              </button>
            </div>
          )}
        </section>
      )}

      {etape === 'fin' && (
        <>
          <section className="souvenir-dimanche" aria-live="polite">
            <p className="etiquette">{membre(membres, joueurId).nom} a terminé</p>
            <div className="grande-photo" aria-hidden="true">🎉</div>
            <h3 style={{ marginTop: 10, color: 'var(--papier)' }}>{messageFinal(score, questions.length).titre}</h3>
            <p>{messageFinal(score, questions.length).texte}</p>
            <p style={{ fontFamily: 'Atkinson Hyperlegible, sans-serif', marginTop: 10 }}>
              Score : {score} / {questions.length}
            </p>
          </section>
          <div style={{ padding: '0 22px 20px', display: 'flex', gap: 10 }}>
            <button className="bouton-principal" onClick={() => commencer(joueurId)}>🔁 Rejouer</button>
            <button className="bouton-secondaire" onClick={retourAccueilJeu} style={{ marginTop: 0 }}>
              Voir le classement
            </button>
          </div>
        </>
      )}
    </>
  )
}
