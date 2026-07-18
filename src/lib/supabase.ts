import { createClient } from '@supabase/supabase-js';

// Lazily initialized Supabase client to support dynamic /api/config retrieval
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export async function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance;

  try {
    // Attempt to load from custom backend config endpoint to avoid hardcoding secrets
    const res = await fetch('/api/config');
    if (res.ok) {
      const config = await res.json();
      if (config.supabaseUrl && config.supabaseAnonKey) {
        supabaseInstance = createClient(config.supabaseUrl, config.supabaseAnonKey);
        return supabaseInstance;
      }
    }
  } catch (err) {
    console.warn("Could not load dynamic config, falling back to environment variables", err);
  }

  interface SupabaseEnv {
    VITE_SUPABASE_URL?: string;
    VITE_SUPABASE_ANON_KEY?: string;
    [key: string]: string | undefined;
  }

  // Fallback to Vite standard environmental variables
  const url = (import.meta as unknown as { env: SupabaseEnv }).env?.VITE_SUPABASE_URL || '';
  const anonKey = (import.meta as unknown as { env: SupabaseEnv }).env?.VITE_SUPABASE_ANON_KEY || '';
  
  if (!url || !anonKey) {
    console.warn("Supabase credentials not configured in frontend. Please provide SUPABASE_URL and SUPABASE_ANON_KEY.");
  }

  supabaseInstance = createClient(url, anonKey);
  return supabaseInstance;
}
