// ————————————————————————————————————————————
// Le Nid — logique pure des boucles d'engagement (Phase 1)
// Aucune dépendance à React ni Supabase : facilement testable.
// ————————————————————————————————————————————

// Clé de jour local « AAAA-MM-JJ » à partir d'une Date ou d'un horodatage ISO.
export function jourClef(dateOuTs) {
  const d = dateOuTs instanceof Date ? dateOuTs : new Date(dateOuTs)
  if (isNaN(d.getTime())) return null
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// Jour précédent (calcul en heure locale, robuste aux fins de mois).
export function veilleDe(clef) {
  const [a, m, j] = clef.split('-').map(Number)
  return jourClef(new Date(a, m - 1, j - 1))
}

// ——— La Question du Nid ———
// Sélection DÉTERMINISTE par date : toute la famille voit la même question
// le même jour (indépendamment de l'appareil).
export function indexDuJour(taille, date = new Date()) {
  const base = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const jours = Math.floor(base.getTime() / 86400000)
  return ((jours % taille) + taille) % taille
}
export function promptDuJour(prompts, date = new Date()) {
  if (!prompts || !prompts.length) return ''
  return prompts[indexDuJour(prompts.length, date)]
}
export function reponsesDuJour(donnees, date = new Date()) {
  return donnees.reponsesJour?.[jourClef(date)] || {}
}

// ——— La Flamme du Nid (streak collectif) ———
// Tous les jours où la famille a été active (message, frigo, ou réponse du jour).
export function datesActives(donnees) {
  const set = new Set()
  for (const m of donnees.messages || []) if (m.ts) set.add(jourClef(m.ts))
  for (const n of donnees.frigo || []) if (n.ts) set.add(jourClef(n.ts))
  for (const jour of Object.keys(donnees.reponsesJour || {})) set.add(jour)
  set.delete(null)
  return set
}

// Nombre de jours CONSÉCUTIFS d'activité, encore en vie aujourd'hui ou hier.
// Si la dernière activité remonte à avant-hier, la flamme est éteinte (0).
export function calculerFlamme(donnees, date = new Date()) {
  const dates = datesActives(donnees)
  const aujourdhui = jourClef(date)
  const hier = veilleDe(aujourdhui)
  if (!dates.has(aujourdhui) && !dates.has(hier)) return { jours: 0, aujourdhui: false }
  let curseur = dates.has(aujourdhui) ? aujourdhui : hier
  let jours = 0
  while (dates.has(curseur)) {
    jours++
    curseur = veilleDe(curseur)
  }
  return { jours, aujourdhui: dates.has(aujourdhui) }
}

// ——— « Ce jour-là » (souvenirs qui refont surface) ———
// Renvoie les contenus passés tombant le MÊME jour calendaire (mois + jour) que
// `date`, mais une année précédente. La nostalgie comme récompense récurrente.
export function souvenirsDuJour(donnees, date = new Date()) {
  const cible = `${date.getMonth()}-${date.getDate()}`
  const anneeRef = date.getFullYear()
  const souvenirs = []
  const ajouter = (ts, type, contenu, auteur) => {
    if (!ts) return
    const d = new Date(ts)
    if (isNaN(d.getTime())) return
    if (`${d.getMonth()}-${d.getDate()}` !== cible) return
    const annees = anneeRef - d.getFullYear()
    if (annees < 1) return // uniquement le passé (années précédentes)
    souvenirs.push({ ts, type, contenu, auteur, annees })
  }
  for (const m of donnees.messages || []) ajouter(m.ts, 'message', m.texte, m.auteur)
  for (const n of donnees.frigo || []) {
    ajouter(n.ts, n.type === 'polaroid' ? 'photo' : 'note', n.texte || n.photo, n.auteur)
  }
  for (const reps of Object.values(donnees.reponsesJour || {})) {
    for (const [id, r] of Object.entries(reps)) ajouter(r.ts, 'reponse', r.texte, id)
  }
  return souvenirs.sort((a, b) => b.annees - a.annees)
}

// Étiquette humaine : « il y a 1 an », « il y a 2 ans »…
export function ilYaLabel(annees) {
  return `il y a ${annees} an${annees > 1 ? 's' : ''}`
}

// ——— Réactions ———
// Bascule (ajoute/retire) la réaction `emoji` de `moi` sur un objet reactions
// de forme { emoji: [idsMembres] }. Renvoie un NOUVEL objet (immuable).
export function basculerReaction(reactions, emoji, moi) {
  const liste = reactions?.[emoji] || []
  const nouvelle = liste.includes(moi) ? liste.filter((x) => x !== moi) : [...liste, moi]
  const copie = { ...(reactions || {}) }
  if (nouvelle.length) copie[emoji] = nouvelle
  else delete copie[emoji]
  return copie
}
