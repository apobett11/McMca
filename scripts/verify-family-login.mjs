import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

function loadDotenv(path) {
  const env = {};
  for (const line of fs.readFileSync(path, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
  }
  return env;
}

const env = loadDotenv('.env');
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const accounts = [
  ['mark@gmail.com', 'Mark@2026'],
  ['collins@gmail.com', 'Collins@2026'],
  ['marcus@gmail.com', 'Marcus@2026'],
  ['francis@gmail.com', 'Francis@2026']
];

const out = [];
for (const [email, password] of accounts) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    out.push({ email, ok: false, error: error.message });
    continue;
  }
  const { data: role, error: roleError } = await sb
    .from('user_roles')
    .select('role')
    .eq('auth_user_id', data.user.id)
    .single();
  await sb.auth.signOut();
  out.push({ email, ok: true, role: role?.role || null, roleError: roleError?.message || null });
}
console.log(JSON.stringify(out, null, 2));
