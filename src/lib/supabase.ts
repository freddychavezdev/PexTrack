import { createClient } from '@supabase/supabase-js'
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
// GitHub/demo builds default to role selection. Set VITE_ENABLE_SUPABASE=true only when
// the production database, profiles, and RLS policies are ready.
export const isSupabaseConfigured = import.meta.env.VITE_ENABLE_SUPABASE === 'true' && Boolean(url && key && !url.includes('your-project'))
export const supabase = isSupabaseConfigured ? createClient(url, key) : null
