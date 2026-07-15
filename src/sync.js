import { supabase } from './supabaseClient.js'

const CLE_CODE = 'le-nid-code'
const TABLE = 'nids'

// Mode « foyer unique verrouillé » : si VITE_NID_CODE est défini, l'appli reste
// dédiée à CE foyer (compatibilité avec les déploiements mono-famille existants).
// Sinon (non défini), l'appli est en mode PRODUIT multi-foyer : chaque famille
// crée ou rejoint son propre Nid — la clé du foyer actif est stockée sur l'appareil.
export const NID_FIXE = import.meta.env.VITE_NID_CODE || null

// La clé du foyer actif sur cet appareil (créé ou rejoint). Base de tout le reste.
export function foyerActif() {
  return localStorage.getItem(CLE_CODE)
}
export function definirFoyer(code) {
  localStorage.setItem(CLE_CODE, code)
}
export function oublierFoyer() {
  localStorage.removeItem(CLE_CODE)
}

// Un foyer portant cette clé existe-t-il déjà ? (pour valider une invitation)
export async function foyerExiste(code) {
  const { data, error } = await supabase.from(TABLE).select('code').eq('code', code).maybeSingle()
  if (error) throw error
  return Boolean(data)
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

// Génère une clé encore libre (évite de tomber sur un foyer déjà existant).
export async function genererCodeLibre() {
  for (let i = 0; i < 6; i++) {
    const code = genererCode()
    try {
      if (!(await foyerExiste(code))) return code
    } catch {
      return code // hors-ligne : on tente quand même, la création tranchera
    }
  }
  return `${genererCode()}-${Math.floor(100 + Math.random() * 900)}`
}
