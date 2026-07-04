import { useState } from 'react'

const EMOJIS = ['👵', '👴', '👩', '👨', '🧑', '👧', '👦', '👶', '🐱', '🐶', '🦊', '🐻', '🐰', '🌻', '⭐️', '🌳']

export default function Identite({ onValider }) {
  const [nom, setNom] = useState('')
  const [emoji, setEmoji] = useState(null)

  function valider(e) {
    e.preventDefault()
    if (!nom.trim() || !emoji) return
    onValider(nom.trim(), emoji)
  }

  return (
    <div className="appli">
      <div style={{ padding: '10vh 26px 40px', textAlign: 'center', margin: 'auto', width: '100%' }}>
        <div style={{ fontSize: '3rem' }} aria-hidden="true">👋</div>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.6rem', marginTop: 10 }}>Qui êtes-vous ?</h1>
        <p style={{ color: 'var(--encre-douce)', marginTop: 8, lineHeight: 1.4 }}>
          Votre prénom et un petit symbole, pour que vos messages vous ressemblent.
        </p>

        <form onSubmit={valider} style={{ marginTop: 26 }}>
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Votre prénom"
            aria-label="Votre prénom"
            maxLength={20}
            style={{
              padding: '13px 18px', borderRadius: 999, border: '2px solid rgba(42,47,43,0.2)',
              fontFamily: 'inherit', fontSize: '1rem', textAlign: 'center', background: 'var(--blanc)', width: '100%',
            }}
          />

          <p style={{ marginTop: 20, fontSize: '0.85rem', color: 'var(--encre-douce)', fontWeight: 700 }}>
            Choisissez votre symbole
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 10 }}>
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                aria-label={`Choisir ${e}`}
                aria-pressed={emoji === e}
                style={{
                  fontSize: '1.6rem', padding: '10px 0', borderRadius: 12,
                  border: emoji === e ? '2px solid var(--miel)' : '2px solid rgba(42,47,43,0.15)',
                  background: emoji === e ? 'var(--miel-doux)' : 'var(--blanc)', cursor: 'pointer',
                }}
              >
                {e}
              </button>
            ))}
          </div>

          <button type="submit" className="bouton-principal" style={{ marginTop: 26 }} disabled={!nom.trim() || !emoji}>
            C'est moi !
          </button>
        </form>
      </div>
    </div>
  )
}
