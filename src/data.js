// ————————————————————————————————————————————
// Le Nid — données de démonstration (famille Dupont)
// Les modifications sont sauvegardées sur l'appareil (localStorage).
// ————————————————————————————————————————————
import { supabaseActif } from './supabaseClient.js'

// Membres par défaut (démo). En usage réel, chaque personne ajoute son propre
// prénom et emoji au premier lancement — voir src/components/Identite.jsx.
// Ces membres vivent dans les données du foyer (donnees.membres), pas ici,
// pour que chaque famille ait sa propre liste, synchronisée entre appareils.
const MEMBRES_DEMO = {
  mamie: { nom: 'Mamie', emoji: '👵', couleur: '#E8B4B8' },
  papi: { nom: 'Papi', emoji: '👴', couleur: '#B8CDE8' },
  claire: { nom: 'Claire', emoji: '👩', couleur: '#F5B942' },
  thomas: { nom: 'Thomas', emoji: '👨', couleur: '#9BC29B' },
  leo: { nom: 'Léo', emoji: '👦', couleur: '#F0A868' },
  zoe: { nom: 'Zoé', emoji: '👧', couleur: '#D8B4E8' },
}

const PALETTE_COULEURS = [
  '#E8B4B8', '#B8CDE8', '#F5B942', '#9BC29B', '#F0A868', '#D8B4E8',
  '#8FBF9F', '#F2C6DE', '#B5D8D0', '#E3B8A0', '#C9B8E8', '#A8D8D0',
]

export function couleurAleatoire() {
  return PALETTE_COULEURS[Math.floor(Math.random() * PALETTE_COULEURS.length)]
}

export const SEED = {
  nomFamille: 'Dupont',
  membres: MEMBRES_DEMO,
  frigo: [
    {
      id: 'n1', type: 'postit', couleur: 'jaune', auteur: 'claire',
      texte: "Pensez au cadeau d'anniversaire de Papi ! 🎁",
    },
    {
      id: 'n2', type: 'polaroid', auteur: 'mamie', photo: '🌻',
      texte: 'Mes tournesols ont fleuri !',
    },
    {
      id: 'n3', type: 'liste', couleur: 'bleu', auteur: 'thomas',
      titre: 'Courses repas de dimanche',
      items: [
        { t: 'Poulet fermier', fait: true },
        { t: 'Haricots verts', fait: false },
        { t: 'Tarte aux pommes', fait: false },
        { t: 'Cidre', fait: false },
      ],
    },
    {
      id: 'n4', type: 'postit', couleur: 'rose', auteur: 'zoe',
      texte: "J'ai eu 18/20 en dictée !! ⭐",
    },
    {
      id: 'n5', type: 'polaroid', auteur: 'leo', photo: '⚽',
      texte: 'Victoire 3-1 samedi !',
    },
    {
      // Daté d'il y a un an, jour pour jour : alimente le souvenir « Ce jour-là ».
      id: 'n6', type: 'polaroid', auteur: 'papi', photo: '🏖️',
      texte: 'Notre journée à la plage, déjà un an !',
      ts: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString(),
    },
  ],
  messages: [
    { id: 'm1', auteur: 'mamie', texte: 'Bonjour mes chéris ! Qui vient dimanche ?', heure: '9:12', ts: new Date(Date.now() - 86400000).toISOString() },
    { id: 'm2', auteur: 'thomas', texte: 'Nous quatre, présents ! 🙋', heure: '9:30', ts: new Date(Date.now() - 86400000).toISOString() },
    { id: 'm3', auteur: 'papi', texte: 'Je sors la pétanque alors.', heure: '10:02', ts: new Date().toISOString() },
    { id: 'm4', auteur: 'zoe', texte: 'Papi tu vas encore perdre 😄', heure: '10:05', ts: new Date().toISOString() },
  ],
  recettes: [
    {
      id: 'r1', nom: 'La tarte aux pommes de Mamie', auteur: 'mamie', emoji: '🥧',
      duree: '1 h 10', secret: 'Une cuillère de calvados dans la compote. Chut !',
      faitePar: ['claire'],
      etapes: [
        'Préparer une pâte brisée maison, la laisser reposer 30 min au frais.',
        'Faire une compote avec 4 pommes, un peu de sucre et le fameux secret.',
        'Étaler la compote, disposer 3 pommes en lamelles en rosace.',
        'Cuire 40 min à 180 °C. Napper de gelée de coing à la sortie.',
      ],
    },
    {
      id: 'r2', nom: 'Le poulet du dimanche', auteur: 'papi', emoji: '🍗',
      duree: '1 h 30', secret: 'Arroser toutes les 15 minutes, sans exception.',
      faitePar: [],
      etapes: [
        'Frotter le poulet avec du beurre, du thym et une gousse d\u2019ail.',
        'Enfourner à 200 °C, une tête d\u2019ail entière dans le plat.',
        'Arroser régulièrement avec le jus.',
        'Laisser reposer 10 min sous une feuille d\u2019alu avant de découper.',
      ],
    },
    {
      id: 'r3', nom: 'Crêpes du mercredi', auteur: 'claire', emoji: '🥞',
      duree: '30 min', secret: 'Une cuillère d\u2019eau de fleur d\u2019oranger.',
      faitePar: ['zoe', 'mamie'],
      etapes: [
        'Mélanger 250 g de farine, 3 œufs, 50 cl de lait, une pincée de sel.',
        'Ajouter le secret et laisser reposer 1 h.',
        'Cuire à feu vif dans une poêle beurrée.',
      ],
    },
  ],
  albums: [
    { id: 'a1', nom: 'Noël 2025', emoji: '🎄', photos: ['🎁', '🕯️', '🍾', '⛄'], date: 'Décembre 2025' },
    { id: 'a2', nom: 'Vacances en Bretagne', emoji: '🌊', photos: ['⛵', '🦀', '🌅', '🐚', '🥐'], date: 'Août 2025' },
    { id: 'a3', nom: 'Les 10 ans de Léo', emoji: '🎂', photos: ['🎈', '🎮', '🍰'], date: 'Mars 2026' },
  ],
  classementQuiz: {}, // { [idMembre]: { meilleur, dernier, date } }
  evenements: [
    { id: 'e1', nom: 'Repas de famille', date: 'Dimanche 5 juillet', emoji: '🍽️' },
    { id: 'e2', nom: 'Anniversaire de Papi (71 ans)', date: 'Samedi 18 juillet', emoji: '🎂' },
    { id: 'e3', nom: 'Vacances tous ensemble', date: '2 → 16 août', emoji: '🏖️' },
  ],
}

export const QUIZ = [
  {
    id: 'q1',
    question: "Quel est le secret de la tarte aux pommes de Mamie ?",
    options: ['Une cuillère de calvados', 'Du miel de lavande', 'De la cannelle en spirale', 'Rien, c\u2019est un mystère'],
    bonne: 0,
    astuce: 'Indice : ça se trouve dans la Cuisine 🍲',
  },
  {
    id: 'q2',
    question: 'Qui a eu 18/20 en dictée cette semaine ?',
    options: ['Léo', 'Zoé', 'Mamie', 'Thomas'],
    bonne: 1,
    astuce: 'Indice : regardez les post-its du Frigo 🧲',
  },
  {
    id: 'q3',
    question: 'Le secret du poulet du dimanche de Papi, c\u2019est de\u2026',
    options: ['Le laisser cru au centre', 'L\u2019arroser toutes les 15 min', 'Le cuire 3 heures', 'Y ajouter du sucre'],
    bonne: 1,
    astuce: 'Un bon poulet, ça se chouchoute.',
  },
  {
    id: 'q4',
    question: 'Dans quel album trouve-t-on un crabe 🦀 ?',
    options: ['Noël 2025', 'Vacances en Bretagne', 'Les 10 ans de Léo', 'Aucun'],
    bonne: 1,
    astuce: 'Indice : direction le Grenier 📸',
  },
  {
    id: 'q5',
    question: 'Quel jour a lieu le prochain repas de famille ?',
    options: ['Samedi 18 juillet', 'Dimanche 5 juillet', 'Le 2 août', 'Mercredi prochain'],
    bonne: 1,
    astuce: 'C\u2019est marqué sur l\u2019agenda de la Maison 🏠',
  },
  {
    id: 'q6',
    question: 'Combien de bougies pour les 71 ans de Papi ?',
    options: ['69', '70', '71', '72'],
    bonne: 2,
    astuce: 'Un peu de calcul mental, ça ne fait pas de mal !',
  },
  {
    id: 'q7',
    question: 'Culture générale : combien de pattes a une pieuvre ?',
    options: ['6', '8', '10', '12'],
    bonne: 1,
    astuce: 'Celle-là, tout le monde peut la trouver ! 🐙',
  },
  {
    id: 'q8',
    question: 'Quel score a fait l\u2019équipe de Léo samedi dernier ?',
    options: ['1-1', '3-1', '0-2', '2-2'],
    bonne: 1,
    astuce: 'Un polaroïd dans le Frigo en parlait 📸',
  },
]

// Structure « vide » d'un foyer : uniquement les champs attendus, aucun contenu.
// Sert de squelette par défaut pour qu'un NOUVEAU foyer démarre vierge — sans
// hériter des données de démonstration (la famille Dupont). Le contenu de démo
// (SEED) n'est plus utilisé qu'en aperçu local, quand Supabase n'est pas branché.
export const STRUCTURE = {
  nomFamille: '',
  membres: {},
  frigo: [],
  messages: [],
  recettes: [],
  albums: [],
  classementQuiz: {},
  evenements: [],
  reponsesJour: {}, // { 'AAAA-MM-JJ': { [idMembre]: { texte, ts } } } — La Question du Nid
  luSalon: {},      // { [idMembre]: ts du dernier message vu } — accusés de lecture
}

// La Question du Nid : une question douce par jour, la même pour toute la famille.
// On ne voit les réponses des autres qu'après avoir posté la sienne (réciprocité).
export const QUESTIONS_DU_JOUR = [
  "Qu'est-ce qui t'a fait sourire aujourd'hui ?",
  "C'est quoi le plat de ce soir ?",
  'Une petite victoire de la journée ?',
  'À quoi penses-tu, là, maintenant ?',
  'Quel temps fait-il chez toi ?',
  "Qu'est-ce que tu attends avec impatience ?",
  'La dernière chose qui t’a fait rire ?',
  'Une chose belle vue aujourd’hui ?',
  'De quoi as-tu envie ce week-end ?',
  'Un souvenir qui t’est revenu récemment ?',
  'Qu’est-ce que tu écoutes en ce moment ?',
  'Une personne à qui tu penses aujourd’hui ?',
  'Ton petit plaisir du jour ?',
  'Qu’est-ce qui te ferait du bien là tout de suite ?',
  'Une nouvelle, même toute petite, à partager ?',
  'Qu’as-tu mangé de bon aujourd’hui ?',
]

const KEY = 'le-nid-v1'

export function charger() {
  try {
    const brut = localStorage.getItem(KEY)
    if (brut) return completer(JSON.parse(brut))
  } catch (e) { /* stockage indisponible */ }
  // Avec Supabase, un foyer neuf démarre vierge ; sans Supabase (aperçu local),
  // on affiche la famille de démo pour ne pas présenter une maison vide.
  return structuredClone(supabaseActif ? STRUCTURE : SEED)
}

export function sauvegarder(donnees) {
  try {
    localStorage.setItem(KEY, JSON.stringify(donnees))
  } catch (e) { /* mode privé ou quota plein : l'appli reste utilisable */ }
}

export function membre(membres, id) {
  return (membres && membres[id]) || { nom: 'Quelqu\u2019un', emoji: '🙂', couleur: '#cbd5cf' }
}

// Garantit que toutes les clés attendues existent (foyers créés avant l'ajout
// d'un champ, données partielles…), SANS injecter le contenu de démo : un foyer
// réel n'affiche que ses propres membres et son propre contenu.
export function completer(donnees) {
  return { ...STRUCTURE, ...donnees, membres: { ...(donnees?.membres || {}) } }
}
