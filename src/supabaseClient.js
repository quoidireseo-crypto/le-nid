import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Si les clés ne sont pas configurées, l'appli fonctionne quand même
// en mode local (localStorage), sans synchronisation entre appareils.
export const supabaseActif = Boolean(url && anonKey)

export const supabase = supabaseActif ? createClient(url, anonKey) : null
