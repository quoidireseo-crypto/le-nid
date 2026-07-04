import { useState, useRef, useEffect } from 'react'
import { membre } from '../data.js'

export default function Salon({ donnees, setDonnees, moi }) {
  const [texte, setTexte] = useState('')
  const [appelEnCours, setAppelEnCours] = useState(null)
  const finRef = useRef(null)
  const membres = Object.entries(donnees.membres || {})

  useEffect(() => {
    finRef.current?.scrollIntoView({ block: 'end' })
  }, [donnees.messages.length])

  function envoyer(e) {
    e.preventDefault()
    const propre = texte.trim()
    if (!propre) return
    const heure = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    setDonnees((d) => ({
      ...d,
      messages: [...d.messages, { id: `m${Date.now()}`, auteur: moi, texte: propre, heure }],
    }))
    setTexte('')
  }

  function appeler(m) {
    setAppelEnCours(m.nom)
    setTimeout(() => setAppelEnCours(null), 2500)
  }

  return (
    <>
      <header className="entete-piece">
        <p className="eyebrow">Le Salon</p>
        <h2>On papote 🛋️</h2>
        <p>Une seule conversation, toute la famille.</p>
      </header>

      <div className="appels-rapides" aria-label="Appeler quelqu'un">
        {membres.filter(([id]) => id !== moi).map(([id, m]) => (
          <button key={id} className="bouton-appel" onClick={() => appeler(m)}>
            <span aria-hidden="true">{m.emoji}</span> 📞 {m.nom}
          </button>
        ))}
      </div>

      {appelEnCours && (
        <div className="carte" role="status">
          <h3>📞 Appel de {appelEnCours}…</h3>
          <p style={{ color: 'var(--encre-douce)', fontSize: '0.9rem' }}>
            (Démo : les appels vidéo arriveront dans une prochaine version.)
          </p>
        </div>
      )}

      <div className="fil-messages">
        {donnees.messages.map((msg) => {
          const auteur = membre(donnees.membres, msg.auteur)
          const estMoi = msg.auteur === moi
          return (
            <div key={msg.id} className={`bulle-rangee ${estMoi ? 'moi' : ''}`}>
              <span className="bulle-avatar" style={{ background: auteur.couleur }} aria-hidden="true">
                {auteur.emoji}
              </span>
              <div className="bulle">
                {!estMoi && <div className="qui">{auteur.nom}</div>}
                <div>{msg.texte}</div>
                <div className="heure">{msg.heure}</div>
              </div>
            </div>
          )
        })}
        <div ref={finRef} />
      </div>

      <form className="saisie" onSubmit={envoyer}>
        <input
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder="Écrire à la famille…"
          aria-label="Votre message"
        />
        <button type="submit" className="bouton-principal">Envoyer</button>
      </form>
    </>
  )
}
