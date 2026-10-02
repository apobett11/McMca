import { createClient } from '@supabase/supabase-js';
import { describeSupabaseKey, isBrowserSafeSupabaseKey } from './supabaseKeys';

const supabaseUrl = typeof __MCMCA_SUPABASE_URL__ === 'string' ? __MCMCA_SUPABASE_URL__ : '';
const rawKey = typeof __MCMCA_SUPABASE_ANON_KEY__ === 'string' ? __MCMCA_SUPABASE_ANON_KEY__ : '';
const keyInfo = describeSupabaseKey(rawKey);
const supabaseAnonKey = isBrowserSafeSupabaseKey(rawKey) ? rawKey : '';

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

if (rawKey && !supabaseAnonKey) {
  console.warn(
    `Refusing to use a ${keyInfo.kind} Supabase key in the browser. Use the publishable or anon key, never sb_secret_ / service_role.`
  );
} else if (!hasSupabaseConfig) {
  console.warn(
    'Supabase credentials missing. Set SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY (publishable/anon only), then rebuild.'
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
