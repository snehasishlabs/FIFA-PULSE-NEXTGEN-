import { createClient } from '@supabase/supabase-js';

let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;
let supabaseAnonInstance: ReturnType<typeof createClient> | null = null;

/**
 * Returns the Supabase client initialized with the Service Role key for admin database transactions.
 * Bypasses RLS to act as a system user. Safe as it only runs on the server.
 */
export function getSupabaseAdmin() {
  if (supabaseAdminInstance) return supabaseAdminInstance;

  const url = process.env.SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!url || !serviceKey) {
    console.warn(
      "Supabase Admin credentials missing! Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured in the environment."
    );
    return null;
  }

  try {
    supabaseAdminInstance = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
    return supabaseAdminInstance;
  } catch (err) {
    console.error("Failed to initialize Supabase Admin client:", err);
    return null;
  }
}

/**
 * Returns the Supabase client initialized with the Anonymous key.
 * Respects RLS and uses authentication headers.
 */
export function getSupabaseAnon() {
  if (supabaseAnonInstance) return supabaseAnonInstance;

  const url = process.env.SUPABASE_URL || '';
  const anonKey = process.env.SUPABASE_ANON_KEY || '';

  if (!url || !anonKey) {
    console.warn(
      "Supabase Anon credentials missing! Ensure SUPABASE_URL and SUPABASE_ANON_KEY are configured in the environment."
    );
    return null;
  }

  try {
    supabaseAnonInstance = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
    return supabaseAnonInstance;
  } catch (err) {
    console.error("Failed to initialize Supabase Anon client:", err);
    return null;
  }
}
