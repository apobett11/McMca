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
const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function run() {
  const email = 'chief@gmail.com';
  const password = 'Chief1';

  console.log(`Ensuring auth user for ${email}...`);
  let user;

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: 'Chief Peter Waweru',
      first_name: 'Peter',
      last_name: 'Waweru'
    }
  });

  if (!createError && created?.user) {
    user = created.user;
    console.log(`Created user ${user.id}`);
  } else {
    console.log('User may already exist, fetching existing user...');
    const { data: listed, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (listError) throw listError;
    const existing = listed.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!existing) throw createError || new Error(`Could not find ${email}`);

    console.log(`Found existing user ${existing.id}, updating password and metadata...`);
    const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: {
        full_name: 'Chief Peter Waweru',
        first_name: 'Peter',
        last_name: 'Waweru'
      }
    });
    if (updateError) throw updateError;
    user = updated.user;
    console.log(`Updated user ${user.id}`);
  }

  console.log(`Assigning role 'chief' in user_roles for user ${user.id}...`);
  const { error: roleError } = await admin.from('user_roles').upsert(
    {
      auth_user_id: user.id,
      role: 'chief',
      is_active: true,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'auth_user_id' }
  );

  if (roleError) {
    console.error('Error assigning role:', roleError);
    throw roleError;
  }
  console.log('Role assigned successfully!');

  // Check if chief_profiles table exists
  try {
    const { error: profError } = await admin.from('chief_profiles').upsert(
      {
        auth_user_id: user.id,
        first_name: 'Peter',
        last_name: 'Waweru',
        phone_number: '+254722100099',
        national_id: '12345678',
        ward: 'Westlands Ward',
        location_name: 'Parklands',
        sub_location_name: 'Highridge'
      },
      { onConflict: 'auth_user_id' }
    );
    if (!profError) {
      console.log('chief_profiles updated.');
    }
  } catch (e) {
    // chief_profiles table might not exist; chief uses user_roles + CHIEF mock/data
  }

  console.log('\n--- SUCCESS ---');
  console.log(`Chief account seeded successfully:`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Role: chief`);

  const anonKey = env.VITE_SUPABASE_ANON_KEY;
  if (anonKey) {
    console.log('\nVerifying login with anon client...');
    const client = createClient(url, anonKey);
    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email,
      password
    });
    if (authError) {
      console.error('Anon client login failed:', authError.message);
    } else {
      console.log('Anon client login verified! User ID:', authData.user.id);
      const { data: roleRow, error: roleFetchErr } = await client
        .from('user_roles')
        .select('role')
        .eq('auth_user_id', authData.user.id)
        .single();
      console.log('Verified user_roles role:', roleRow?.role, roleFetchErr ? roleFetchErr.message : '(ok)');
    }
  }
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
