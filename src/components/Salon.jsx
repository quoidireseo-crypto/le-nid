import { useState, useRef, useEffect } from 'react'
import { membre } from '../data.js'
import { basculerReaction } from '../engagement.js'
import Reactions from './Reactions.jsx'

export default function Salon({ donnees, setDonnees, moi }) {
  const [texte, setTexte] = useState('')
  const [appelEnCours, setAppelEnCours] = useState(null)
  const finRef = useRef(null)
  const membres = Object.entries(donnees.membres || {})
  const dernier = donnees.messages[donnees.messages.length - 1]

  useEffect(() => {
    finRef.current?.scrollIntoView({ block: 'end' })
  }, [donnees.messages.length])

  // Accusé de lecture : en ouvrant le Salon (ou à l'arrivée d'un message), on
  // note qu'on a vu jusqu'au dernier message. Les autres voient alors « Vu par ».
  useEffect(() => {
    if (!moi || !dernier?.ts) return
    if (donnees.luSalon?.[moi] === dernier.ts) return
    setDonnees((d) => ({ ...d, luSalon: { ...d.luSalon, [moi]: dernier.ts } }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dernier?.ts, moi])

  function reagir(msgId, emoji) {
    setDonnees((d) => ({
      ...d,
      messages: d.messages.map((m) =>
        m.id === msgId ? { ...m, reactions: basculerReaction(m.reactions, emoji, moi) } : m
      ),
    }))
  }

  // Membres (autres que l'auteur et moi) ayant vu le dernier message
  const vuPar = dernier?.ts
    ? membres
        .filter(([id]) => id !== dernier.auteur && id !== moi)
        .filter(([id]) => (donnees.luSalon?.[id] || '') >= dernier.ts)
        .map(([, m]) => m.nom.split(' ')[0])
    : []

  function envoyer(e) {
    e.preventDefault()
    const propre = texte.trim()
    if (!propre) return
    const maintenant = new Date()
    const heure = maintenant.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    setDonnees((d) => ({
      ...d,
      // ts (horodatage ISO) : socle des futurs souvenirs « Ce jour-là » et de la
      // Flamme du Nid ; heure reste pour l'affichage immédiat.
      messages: [...d.messages, { id: `m${Date.now()}`, auteur: moi, texte: propre, heure, ts: maintenant.toISOString() }],
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
                <Reactions reactions={msg.reactions} moi={moi} onToggle={(e) => reagir(msg.id, e)} />
              </div>
            </div>
          )
        })}
        {vuPar.length > 0 && (
          <p className="vu-par">Vu par {vuPar.join(', ')}</p>
        )}
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
