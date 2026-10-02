import { createClient } from '@supabase/supabase-js';

const supabaseUrl = typeof __MCMCA_SUPABASE_URL__ === 'string' ? __MCMCA_SUPABASE_URL__ : '';
const supabaseAnonKey = typeof __MCMCA_SUPABASE_ANON_KEY__ === 'string' ? __MCMCA_SUPABASE_ANON_KEY__ : '';

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasSupabaseConfig) {
  console.warn(
    'Supabase credentials missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_URL and SUPABASE_ANON_KEY) for this environment, then rebuild.'
  );
}

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

export function getServiceSupabase() {
  throw new Error('Service role key must never be used on the client.');
}
