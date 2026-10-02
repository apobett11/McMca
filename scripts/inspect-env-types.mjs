import fs from 'fs';
import { describeSupabaseKey, pickBrowserSupabaseKey, pickSupabaseUrl } from '../src/lib/supabaseKeys.js';

function loadDotenv(path) {
  const env = {};
  if (!fs.existsSync(path)) return env;
  for (const line of fs.readFileSync(path, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 0) continue;
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
  }
  return env;
}

function inspect(name, value) {
  const info = describeSupabaseKey(value);
  return { name, present: Boolean(String(value || '').trim()), kind: info.kind, ok: info.ok };
}

const fileEnv = loadDotenv('.env');
const names = [
  'SUPABASE_URL',
  'VITE_SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'VITE_SUPABASE_SERVICE_ROLE_KEY'
];

let urlHost = null;
try {
  urlHost = new URL(pickSupabaseUrl(fileEnv)).host;
} catch {
  urlHost = null;
}

const picked = pickBrowserSupabaseKey(fileEnv);
const processOverlay = names
  .filter((n) => process.env[n] && process.env[n] !== fileEnv[n])
  .map((n) => ({ name: n, processKind: describeSupabaseKey(process.env[n]).kind, fileKind: describeSupabaseKey(fileEnv[n]).kind }));

console.log(JSON.stringify({
  urlHost,
  fileKeys: names.map((n) => inspect(n, fileEnv[n])),
  pickedKind: describeSupabaseKey(picked),
  processEnvOverrides: processOverlay
}, null, 2));
