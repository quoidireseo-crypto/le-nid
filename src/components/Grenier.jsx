export default function Grenier({ donnees }) {
  return (
    <>
      <header className="entete-piece">
        <p className="eyebrow">Le Grenier</p>
        <h2>Les souvenirs 📸</h2>
        <p>Tout ce qu'on garde précieusement, rangé par moments.</p>
      </header>

      <section className="souvenir-dimanche" aria-label="Souvenir de la semaine">
        <p className="etiquette">✨ Le souvenir du dimanche</p>
        <div className="grande-photo" aria-hidden="true">⛵</div>
        <p>« Il y a un an, on était tous en Bretagne. Papi avait gagné le concours de châteaux de sable. »</p>
      </section>

      {donnees.albums.map((a) => (
        <article key={a.id} className="album">
          <div className="titre-album">
            <span aria-hidden="true">{a.emoji}</span>
            <span>
              {a.nom} <span className="date">· {a.date}</span>
            </span>
          </div>
          <div className="grille-photos" aria-label={`Photos de l'album ${a.nom}`}>
            {a.photos.map((p, i) => (
              <span key={i} aria-hidden="true">{p}</span>
            ))}
          </div>
        </article>
      ))}
    </>
  )
}
