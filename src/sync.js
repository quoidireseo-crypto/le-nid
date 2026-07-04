import { supabase } from './supabaseClient.js'

const CLE_CODE = 'le-nid-code'
const TABLE = 'nids'

// Le code du foyer unique : tout le monde qui ouvre l'appli entre dans la même maison.
// Modifiable via la variable d'environnement VITE_NID_CODE si besoin.
export const CODE_FOYER = import.meta.env.VITE_NID_CODE || 'notre-maison'

export function codeEnregistre() {
  return localStorage.getItem(CLE_CODE)
}
export function enregistrerCode(code) {
  localStorage.setItem(CLE_CODE, code)
}
export function oublierCode() {
  localStorage.removeItem(CLE_CODE)
}

// ——— Création et connexion ———

export async function creerNid(code, donneesInitiales) {
  const { error } = await supabase.from(TABLE).insert({ code, donnees: donneesInitiales })
  if (error) throw error
}

export async function rejoindreNid(code) {
  const { data, error } = await supabase.from(TABLE).select('donnees').eq('code', code).single()
  if (error) throw error
  return data.donnees
}

// Se connecte au foyer unique : le rejoint s'il existe, le crée sinon.
export async function connecterFoyer(donneesInitiales) {
  try {
    return await rejoindreNid(CODE_FOYER)
  } catch {
    // Le foyer n'existe pas encore : on le crée (premier membre de la famille).
    try {
      await creerNid(CODE_FOYER, donneesInitiales)
      return donneesInitiales
    } catch {
      // Quelqu'un d'autre l'a créé au même moment : on le rejoint simplement.
      return await rejoindreNid(CODE_FOYER)
    }
  }
}

export async function pousserDonnees(code, donnees) {
  const { error } = await supabase
    .from(TABLE)
    .update({ donnees, updated_at: new Date().toISOString() })
    .eq('code', code)
  if (error) throw error
}

// ——— Photos ———

export async function uploaderPhoto(fichier) {
  const extension = fichier.name.split('.').pop() || 'jpg'
  const nomFichier = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`
  const { error } = await supabase.storage.from('photos').upload(nomFichier, fichier)
  if (error) throw error
  const { data } = supabase.storage.from('photos').getPublicUrl(nomFichier)
  return data.publicUrl
}

// Écoute les changements poussés par les autres appareils du même foyer.
// Retourne une fonction pour arrêter l'écoute.
export function ecouterChangements(code, callback) {
  const canal = supabase
    .channel(`nid-${code}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: TABLE, filter: `code=eq.${code}` },
      (payload) => callback(payload.new.donnees)
    )
    .subscribe()
  return () => supabase.removeChannel(canal)
}

// ——— Génération d'une clé de foyer, facile à lire et à partager ———

const ADJECTIFS = ['tendre', 'chaleureux', 'paisible', 'lumineux', 'fidèle', 'joyeux', 'doux', 'vif']
const NOMS = ['tilleul', 'roseau', 'érable', 'ruisseau', 'genêt', 'sentier', 'clocher', 'noisetier']

export function genererCode() {
  const a = ADJECTIFS[Math.floor(Math.random() * ADJECTIFS.length)]
  const n = NOMS[Math.floor(Math.random() * NOMS.length)]
  const chiffres = Math.floor(10 + Math.random() * 90)
  return `${a}-${n}-${chiffres}`
}
