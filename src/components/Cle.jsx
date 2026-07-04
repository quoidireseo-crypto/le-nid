import { useState } from 'react'

export default function Cle({ onEntrer, erreur, enCours }) {
  const [saisie, setSaisie] = useState('')

  function valider(e) {
    e.preventDefault()
    if (!saisie.trim()) return
    onEntrer(saisie.trim().toLowerCase())
  }

  return (
    <div className="appli">
      <div style={{ padding: '20vh 26px 40px', textAlign: 'center', margin: 'auto', width: '100%' }}>
        <div style={{ fontSize: '3rem' }} aria-hidden="true">🔑</div>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.8rem', marginTop: 10 }}>Le Nid</h1>
        <p style={{ color: 'var(--encre-douce)', marginTop: 6, lineHeight: 1.4 }}>
          Cette maison est privée. Entrez la clé de la famille pour ouvrir la porte.
        </p>

        <form onSubmit={valider} style={{ marginTop: 30, display: 'grid', gap: 12 }}>
          <input
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            placeholder="La clé de la maison"
            aria-label="Clé de la maison"
            autoComplete="off"
            style={{
              padding: '13px 18px', borderRadius: 999, border: '2px solid rgba(42,47,43,0.2)',
              fontFamily: 'inherit', fontSize: '1rem', textAlign: 'center', background: 'var(--blanc)',
            }}
          />
          <button type="submit" className="bouton-principal" disabled={!saisie.trim() || enCours}>
            {enCours ? 'On ouvre la porte…' : '🚪 Entrer dans la maison'}
          </button>
        </form>

        {erreur && (
          <p role="alert" style={{ color: 'var(--tuile)', marginTop: 16, fontWeight: 700 }}>
            {erreur}
          </p>
        )}

        <p style={{ marginTop: 24, fontSize: '0.8rem', color: 'var(--encre-douce)' }}>
          Pas de clé ? Demandez-la à la personne de la famille qui vous a envoyé ce lien.
        </p>
      </div>
    </div>
  )
}
