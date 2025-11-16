import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database'

/**
 * Create a Supabase client for server-side operations
 * 
 * Note: This is a reference implementation. In Next.js, use the 
 * server client from @supabase/ssr for proper cookie handling.
 */
export function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient<Database>(supabaseUrl, supabaseKey)
}

