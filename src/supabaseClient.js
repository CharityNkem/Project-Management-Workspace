import { createClient } from '@supabase/supabase-js'

// Values come from environment variables (see .env.example).
// The publishable/anon key is safe to expose in the browser — access is
// enforced by Row-Level Security in the database. The service-role key is
// NEVER used here; it lives only in the serverless functions' env on the host.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Helpful message during local setup if .env isn't filled in.
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill it in.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
