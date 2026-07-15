import { useState } from 'react'

// La surface virale : partager la clé du foyer sous forme de lien.
// En ouvrant le lien, l'invité arrive directement sur l'écran « Rejoindre »
// avec la clé pré-remplie (voir le paramètre ?nid= dans App.jsx).
export default function Inviter({ foyer, nomFamille }) {
  const [copie, setCopie] = useState(false)
  if (!foyer) return null

  const lien = `${window.location.origin}${window.location.pathname}?nid=${encodeURIComponent(foyer)}`
  const message = `Rejoins notre Nid de famille${nomFamille ? ` (${nomFamille})` : ''} 🪺 — ouvre ce lien, tout est déjà prêt : ${lien}`

  async function copier() {
    try {
      await navigator.clipboard.writeText(lien)
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    } catch { /* presse-papiers indisponible */ }
  }

  async function partager() {
    if (navigator.share) {
      try { await navigator.share({ title: 'Le Nid', text: message, url: lien }) } catch { /* annulé */ }
    } else {
      copier()
    }
  }

  return (
    <section className="carte inviter" aria-label="Inviter la famille">
      <h3>💌 Inviter la famille</h3>
      <p className="indice-reponse" style={{ marginBottom: 10 }}>
        Partagez ce lien : en l'ouvrant, chacun entre directement dans votre Nid.
      </p>
      <div className="cle-foyer" aria-label="La clé de votre Nid">
        <span aria-hidden="true">🔑</span> {foyer}
      </div>
      <div className="actions" style={{ gap: 8, marginTop: 12 }}>
        <button className="bouton-principal" onClick={partager}>Partager l'invitation</button>
        <button className="bouton-secondaire" onClick={copier} style={{ marginTop: 0, marginLeft: 0 }}>
          {copie ? '✓ Lien copié' : 'Copier le lien'}
        </button>
      </div>
    </section>
  )
}
