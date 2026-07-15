// Écran d'entrée du mode PRODUIT (multi-foyer) : créer son Nid ou en rejoindre un.
export default function Accueil({ onCreer, onRejoindre, enCours, erreur }) {
  return (
    <div className="appli">
      <div style={{ padding: '13vh 26px 40px', textAlign: 'center', margin: 'auto', width: '100%' }}>
        <div style={{ fontSize: '3rem' }} aria-hidden="true">🪺</div>
        <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.9rem', marginTop: 10 }}>Le Nid</h1>
        <p style={{ color: 'var(--encre-douce)', marginTop: 6, lineHeight: 1.45 }}>
          La maison de votre famille, dans votre poche.
        </p>

        <div style={{ marginTop: 32, display: 'grid', gap: 12 }}>
          <button className="bouton-principal" onClick={onCreer} disabled={enCours}>
            {enCours ? 'On prépare la maison…' : '🏡 Créer notre Nid'}
          </button>
          <button className="bouton-secondaire" onClick={onRejoindre} disabled={enCours} style={{ marginLeft: 0 }}>
            🔑 Rejoindre un Nid existant
          </button>
        </div>

        {erreur && (
          <p role="alert" style={{ color: 'var(--tuile)', marginTop: 16, fontWeight: 700 }}>{erreur}</p>
        )}

        <p style={{ marginTop: 26, fontSize: '0.8rem', color: 'var(--encre-douce)', lineHeight: 1.4 }}>
          Créez le foyer, puis invitez vos proches d'un simple lien.<br />
          Chacun ouvre le lien et se retrouve directement à la maison.
        </p>
      </div>
    </div>
  )
}
