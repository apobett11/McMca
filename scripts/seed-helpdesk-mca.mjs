import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

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

const env = { ...loadDotenv('.env'), ...loadDotenv('.env.local') };
const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
  console.log('Seeding MCA and Help Desk accounts...');

  const MCA_PWD = 'Mca12026';
  const HELP_PWD = 'Help12026';

  const { data: usersData, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) throw listErr;

  // 1. MCA Account
  let mca = usersData.users.find(u => u.email?.toLowerCase() === 'mca@gmail.com');
  if (mca) {
    await admin.auth.admin.updateUserById(mca.id, {
      password: MCA_PWD,
      email_confirm: true,
      user_metadata: { role: 'mca', full_name: 'Hon. Hillary Kiprotich Bett' }
    });
    console.log(`Updated mca@gmail.com (id: ${mca.id})`);
  } else {
    const { data: createdMca } = await admin.auth.admin.createUser({
      email: 'mca@gmail.com',
      password: MCA_PWD,
      email_confirm: true,
      user_metadata: { role: 'mca', full_name: 'Hon. Hillary Kiprotich Bett' }
    });
    mca = createdMca.user;
    console.log(`Created mca@gmail.com (id: ${mca.id})`);
  }

  await admin.from('user_roles').upsert({
    auth_user_id: mca.id,
    role: 'mca',
    is_active: true,
    updated_at: new Date().toISOString()
  }, { onConflict: 'auth_user_id' });

  // 2. Help Desk Account
  let help = usersData.users.find(u => u.email?.toLowerCase() === 'help@gmail.com');
  if (help) {
    await admin.auth.admin.updateUserById(help.id, {
      password: HELP_PWD,
      email_confirm: true,
      user_metadata: { role: 'helpdesk', full_name: 'Clara Chelangat (Help Desk)' }
    });
    console.log(`Updated help@gmail.com (id: ${help.id})`);
  } else {
    const { data: createdHelp } = await admin.auth.admin.createUser({
      email: 'help@gmail.com',
      password: HELP_PWD,
      email_confirm: true,
      user_metadata: { role: 'helpdesk', full_name: 'Clara Chelangat (Help Desk)' }
    });
    help = createdHelp.user;
    console.log(`Created help@gmail.com (id: ${help.id})`);
  }

  console.log('\n--- ACCOUNTS READY ---');
  console.log('MCA:      email: mca@gmail.com  | password: Mca1 (alias Mca12026)  | role: mca');
  console.log('HelpDesk: email: help@gmail.com | password: Help1 (alias Help12026) | role: helpdesk');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
