import { useState, useRef, useEffect } from 'react'
import { membre } from '../data.js'
import { basculerReaction } from '../engagement.js'
import { supabaseActif } from '../supabaseClient.js'
import { uploaderAudio } from '../sync.js'
import Reactions from './Reactions.jsx'

// L'enregistrement vocal est-il possible ? (micro + navigateur compatible + synchro)
const vocalPossible =
  supabaseActif &&
  typeof navigator !== 'undefined' &&
  navigator.mediaDevices &&
  typeof window !== 'undefined' &&
  'MediaRecorder' in window

export default function Salon({ donnees, setDonnees, moi }) {
  const [texte, setTexte] = useState('')
  const [enreg, setEnreg] = useState(false)
  const [envoiVocal, setEnvoiVocal] = useState(false)
  const [erreurVocal, setErreurVocal] = useState(null)
  const finRef = useRef(null)
  const mediaRef = useRef(null)
  const morceauxRef = useRef([])
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

  function heureCourante() {
    return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  function ajouterMessage(champs) {
    const maintenant = new Date()
    setDonnees((d) => ({
      ...d,
      messages: [...d.messages, { id: `m${Date.now()}`, auteur: moi, heure: heureCourante(), ts: maintenant.toISOString(), ...champs }],
    }))
  }

  function envoyer(e) {
    e.preventDefault()
    const propre = texte.trim()
    if (!propre) return
    ajouterMessage({ texte: propre })
    setTexte('')
  }

  // ——— Notes vocales ———
  // La voix débloque les membres les moins à l'aise avec l'écrit (grands-parents)
  // et porte une chaleur qu'un texte n'a pas.
  async function basculerEnreg() {
    setErreurVocal(null)
    if (enreg) {
      mediaRef.current?.stop()
      return
    }
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(flux)
      mediaRef.current = mr
      morceauxRef.current = []
      mr.ondataavailable = (ev) => { if (ev.data.size) morceauxRef.current.push(ev.data) }
      mr.onstop = async () => {
        flux.getTracks().forEach((t) => t.stop())
        const blob = new Blob(morceauxRef.current, { type: 'audio/webm' })
        setEnvoiVocal(true)
        try {
          const url = await uploaderAudio(blob)
          ajouterMessage({ type: 'vocal', audio: url })
        } catch {
          setErreurVocal('L’envoi de la note vocale a échoué. Réessayez.')
        } finally {
          setEnvoiVocal(false)
        }
      }
      mr.start()
      setEnreg(true)
    } catch {
      setErreurVocal('Micro indisponible — vérifiez l’autorisation du navigateur.')
      setEnreg(false)
    }
  }

  return (
    <>
      <header className="entete-piece">
        <p className="eyebrow">Le Salon</p>
        <h2>On papote 🛋️</h2>
        <p>Une seule conversation, toute la famille. À l'écrit ou à la voix.</p>
      </header>

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
                {msg.type === 'vocal'
                  ? <audio controls src={msg.audio} className="note-vocale" aria-label={`Note vocale de ${auteur.nom}`} />
                  : <div>{msg.texte}</div>}
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

      {erreurVocal && (
        <p role="alert" style={{ margin: '0 16px 6px', color: 'var(--tuile)', fontSize: '0.82rem' }}>{erreurVocal}</p>
      )}

      <form className="saisie" onSubmit={envoyer}>
        {vocalPossible && (
          <button
            type="button"
            className={`bouton-micro ${enreg ? 'enreg' : ''}`}
            onClick={basculerEnreg}
            disabled={envoiVocal}
            aria-pressed={enreg}
            aria-label={enreg ? 'Arrêter et envoyer la note vocale' : 'Enregistrer une note vocale'}
            title={enreg ? 'Arrêter et envoyer' : 'Note vocale'}
          >
            {envoiVocal ? '📤' : enreg ? '⏹️' : '🎙️'}
          </button>
        )}
        <input
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder={enreg ? 'Enregistrement en cours…' : 'Écrire à la famille…'}
          aria-label="Votre message"
          disabled={enreg}
        />
        <button type="submit" className="bouton-principal" disabled={enreg}>Envoyer</button>
      </form>
    </>
  )
}
