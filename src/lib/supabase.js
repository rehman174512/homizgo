import { createClient as createSupabaseClient } from '@supabase/supabase-js'

let supabaseInstance = null

export function createClient() {
  if (supabaseInstance) return supabaseInstance

  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  if (!url || !anonKey) {
    console.error('❌ Supabase environment variables are missing! Check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
    return null
  }
  
  supabaseInstance = createSupabaseClient(url, anonKey)
  return supabaseInstance
}

export const supabase = createClient()
