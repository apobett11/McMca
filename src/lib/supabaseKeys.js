function decodeJwtRole(key) {
  try {
    const part = String(key).split('.')[1];
    if (!part) return null;
    const padded = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = typeof Buffer !== 'undefined'
      ? Buffer.from(part, 'base64url').toString('utf8')
      : atob(padded);
    return JSON.parse(json).role || null;
  } catch {
    return null;
  }
}

export function describeSupabaseKey(key) {
  const v = String(key || '').trim();
  if (!v) return { ok: false, kind: 'missing' };
  if (v.startsWith('sb_secret_')) return { ok: false, kind: 'secret' };
  if (v.startsWith('sb_publishable_')) return { ok: true, kind: 'publishable' };
  if (v.startsWith('eyJ')) {
    const role = decodeJwtRole(v);
    if (role === 'service_role') return { ok: false, kind: 'service_role' };
    if (role === 'anon' || role === 'authenticated') return { ok: true, kind: 'anon_jwt' };
    return { ok: false, kind: 'jwt_unknown' };
  }
  return { ok: false, kind: 'unknown' };
}

export function isBrowserSafeSupabaseKey(key) {
  return describeSupabaseKey(key).ok;
}

/** Prefer publishable/anon JWTs. Never select sb_secret_ or service_role. */
export function pickBrowserSupabaseKey(env = {}) {
  const candidates = [
    env.VITE_SUPABASE_PUBLISHABLE_KEY,
    env.SUPABASE_PUBLISHABLE_KEY,
    env.VITE_SUPABASE_ANON_KEY,
    env.SUPABASE_ANON_KEY
  ];
  for (const candidate of candidates) {
    const value = String(candidate || '').trim();
    if (isBrowserSafeSupabaseKey(value)) return value;
  }
  return '';
}

export function pickSupabaseUrl(env = {}) {
  return String(env.VITE_SUPABASE_URL || env.SUPABASE_URL || '').trim();
}
