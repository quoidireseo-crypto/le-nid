const CLE_IDENTITE = 'le-nid-identite'

export function identiteEnregistree() {
  return localStorage.getItem(CLE_IDENTITE)
}
export function enregistrerIdentite(id) {
  localStorage.setItem(CLE_IDENTITE, id)
}
export function oublierIdentite() {
  localStorage.removeItem(CLE_IDENTITE)
}
export function genererIdMembre() {
  return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}
