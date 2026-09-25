// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Initialize Supabase client
let supabaseClient = null

try {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase URL and Anon Key are not configured properly!')
    console.error('Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set')
  } else {
    console.log('✅ Initializing Supabase client...')
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
    console.log('✅ Supabase client initialized successfully')
  }
} catch (error) {
  console.error('❌ Failed to initialize Supabase client:', error)
}

// Export functions for getting client
export const initSupabaseClient = async () => {
  return supabaseClient
}

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    const errorMsg = 'Supabase client not initialized. Please check your configuration.'
    console.error('❌', errorMsg)
    throw new Error(errorMsg)
  }
  return supabaseClient
}

// Legacy export for backwards compatibility
export const supabase = supabaseClient
