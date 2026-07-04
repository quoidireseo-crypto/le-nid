import { membre } from '../data.js'

export default function Cuisine({ donnees, setDonnees, moi }) {
  function jaiFaite(id) {
    setDonnees((d) => ({
      ...d,
      recettes: d.recettes.map((r) =>
        r.id === id && !r.faitePar.includes(moi)
          ? { ...r, faitePar: [...r.faitePar, moi] }
          : r
      ),
    }))
  }

  return (
    <>
      <header className="entete-piece">
        <p className="eyebrow">La Cuisine</p>
        <h2>Le livre de recettes 🍲</h2>
        <p>Les plats de la famille, avec leurs petits secrets.</p>
      </header>

      {donnees.recettes.map((r) => (
        <details key={r.id} className="recette">
          <summary>
            <span className="emoji-plat" aria-hidden="true">{r.emoji}</span>
            <span className="infos">
              <span className="nom">{r.nom}</span>
              <br />
              <span className="meta">Par {membre(donnees.membres, r.auteur).nom} · {r.duree}</span>
            </span>
          </summary>
          <div className="corps">
            <ol>
              {r.etapes.map((e, i) => <li key={i}>{e}</li>)}
            </ol>
            <div className="secret">🤫 Le secret : {r.secret}</div>
            {r.faitePar.length > 0 && (
              <span className="badge-faite">
                ✓ Réussie par {r.faitePar.map((id) => membre(donnees.membres, id).nom.split(' ')[0]).join(', ')}
              </span>
            )}
            {!r.faitePar.includes(moi) && (
              <button className="bouton-secondaire" onClick={() => jaiFaite(r.id)}>
                Je l'ai faite !
              </button>
            )}
          </div>
        </details>
      ))}
    </>
  )
}
