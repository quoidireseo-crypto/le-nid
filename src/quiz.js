// ————————————————————————————————————————————
// Le Nid — Le Jardin qui pousse : quiz VIVANT généré depuis les vraies données
// de la famille (recettes, frigo, événements, membres). Logique pure, testable.
//
// Récompense variable + personnalisation + curiosité : plus la famille remplit
// le Nid, plus le quiz se renouvelle. Repli sur les questions statiques (QUIZ)
// quand il n'y a pas encore assez de contenu réel (voir Jardin.jsx).
// ————————————————————————————————————————————

export function melanger(tableau) {
  const copie = [...tableau]
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copie[i], copie[j]] = [copie[j], copie[i]]
  }
  return copie
}

// Construit un jeu d'options (bonne réponse + distracteurs), mélangé, en gardant
// l'index de la bonne réponse. Renvoie null si trop peu de choix distincts.
function fabriquerOptions(bonne, candidats, max = 4) {
  const distincts = [...new Set(candidats.filter((c) => c != null && c !== ''))]
  const distracteurs = melanger(distincts.filter((c) => c !== bonne))
  const choix = melanger([bonne, ...distracteurs].slice(0, Math.min(max, distracteurs.length + 1)))
  if (choix.length < 3) return null // on ne garde que les questions à ≥ 3 options
  return { options: choix, bonne: choix.indexOf(bonne) }
}

export function genererQuiz(donnees) {
  const membres = donnees.membres || {}
  const nomDe = (id) => membres[id]?.nom
  const nomsMembres = Object.values(membres).map((m) => m.nom)
  const questions = []
  let n = 0
  const pousser = (question, bonne, candidats, astuce) => {
    const o = fabriquerOptions(bonne, candidats, 4)
    if (o) questions.push({ id: `g${n++}`, question, options: o.options, bonne: o.bonne, astuce })
  }

  // — Recettes : qui l'a partagée ? combien de temps ?
  for (const r of donnees.recettes || []) {
    const auteur = nomDe(r.auteur)
    if (auteur) pousser(`Qui a partagé la recette « ${r.nom} » ?`, auteur, nomsMembres, 'Indice : direction la Cuisine 🍲')
    if (r.duree) {
      const durees = (donnees.recettes || []).map((x) => x.duree)
      pousser(`Combien de temps pour préparer « ${r.nom} » ?`, r.duree, durees, 'Ça se trouve dans la Cuisine 🍲')
    }
  }

  // — Frigo : qui a écrit ce petit mot ?
  for (const note of donnees.frigo || []) {
    if (note.type === 'postit' && note.texte) {
      const auteur = nomDe(note.auteur)
      if (auteur) pousser(`Qui a aimanté ce mot : « ${note.texte} » ?`, auteur, nomsMembres, 'Un tour par le Frigo 🧲')
    }
  }

  // — Événements : à quelle date ?
  const evenements = donnees.evenements || []
  for (const e of evenements) {
    if (e.date) {
      pousser(`Quand a lieu « ${e.nom} » ?`, e.date, evenements.map((x) => x.date), 'C’est sur l’agenda de la Maison 🏠')
    }
  }

  return questions
}
