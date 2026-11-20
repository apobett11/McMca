import { createClient } from '@supabase/supabase-js';

function computeAgeYears(dateOfBirth) {
  if (!dateOfBirth) return null;
  const born = new Date(dateOfBirth);
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - born.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - born.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < born.getUTCDate())) {
    age -= 1;
  }
  return age;
}

async function parseRequestBody(req) {
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    return req.body;
  }
  if (typeof req.body === 'string' && req.body.trim()) {
    try {
      return JSON.parse(req.body);
    } catch {}
  }
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : (req.body || {}));
      } catch {
        resolve(req.body || {});
      }
    });
    req.on('error', () => resolve(req.body || {}));
  });
}

export default async function handler(req, res) {
  // Set CORS headers for Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    res.status(500).json({
      error: 'SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL is missing in environment variables.'
    });
    return;
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  let authUserId = null;
  try {
    const payload = await parseRequestBody(req);
    const { role, email, password, fields = {} } = payload;

    if (!role || !email || !password) {
      res.status(400).json({ error: 'Role, email, and password are required.' });
      return;
    }

    // Security Gate 1: Prohibit public registration for administrative/executive roles
    const ALLOWED_PUBLIC_ROLES = ['student', 'parent'];
    if (!ALLOWED_PUBLIC_ROLES.includes(role)) {
      res.status(403).json({
        error: 'Unauthorized registration: Administrative and executive roles cannot be created via public registration.'
      });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanId = String(fields.nationalId || '').trim().replace(/\D/g, '');
    const cleanPhone = String(fields.phone || '').trim();

    // Security Gate 2: National ID format validation (7 to 9 digits for Kenya)
    if (!cleanId || !/^\d{7,9}$/.test(cleanId)) {
      res.status(400).json({
        error: 'A valid 7 to 9 digit Kenyan National ID number is required.'
      });
      return;
    }

    // Security Gate 3: Age validation against underage independent registration
    const calculatedAge = computeAgeYears(fields.dateOfBirth);
    if (role === 'student') {
      if (calculatedAge === null) {
        res.status(400).json({ error: 'A valid date of birth is required.' });
        return;
      }
      if (calculatedAge < 18) {
        res.status(400).json({
          error: 'Statutory age requirement: You must be 18 years or older to register as an independent student. Underage students must be registered under parental custody.'
        });
        return;
      }
    } else if (role === 'parent') {
      if (calculatedAge !== null && calculatedAge < 18) {
        res.status(400).json({
          error: 'Statutory requirement: Parents or guardians registering must be at least 18 years of age.'
        });
        return;
      }
    }

    // Check if account already exists with this national ID or email in student_profiles
    const { data: existingStudent } = await admin
      .from('student_profiles')
      .select('id, email, national_id')
      .or(`email.eq.${cleanEmail},national_id.eq.${cleanId}`)
      .maybeSingle();

    if (existingStudent) {
      res.status(400).json({ error: 'An account with this National ID or Email already exists.' });
      return;
    }

    const { data: existingParent } = await admin
      .from('parent_profiles')
      .select('id, email, national_id')
      .or(`email.eq.${cleanEmail},national_id.eq.${cleanId}`)
      .maybeSingle();

    if (existingParent) {
      res.status(400).json({ error: 'An account with this National ID or Email already exists.' });
      return;
    }

    // 1. Create auth user (atomic: rollback if any subsequent step fails)
    let authData = null;
    let createResult = await admin.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        role,
        first_name: fields.firstName,
        last_name: fields.lastName,
        national_id: cleanId
      }
    });

    let authError = createResult.error;
    authData = createResult.data;

    // Handle case where an incomplete/orphaned auth account exists from earlier failed attempts
    if (authError && (authError.message?.toLowerCase().includes('already been registered') || authError.code === 'email_exists' || authError.status === 422)) {
      const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const orphan = listData?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);
      if (orphan) {
        const { data: orphanRoles } = await admin.from('user_roles').select('id').eq('auth_user_id', orphan.id);
        if (!orphanRoles || orphanRoles.length === 0) {
          // Orphaned auth record without roles/profile — clean up and recreate cleanly
          await admin.auth.admin.deleteUser(orphan.id);
          const retry = await admin.auth.admin.createUser({
            email: cleanEmail,
            password: password,
            email_confirm: true,
            user_metadata: {
              role,
              first_name: fields.firstName,
              last_name: fields.lastName,
              national_id: cleanId
            }
          });
          authData = retry.data;
          authError = retry.error;
        }
      }
    }

    if (authError || !authData?.user) {
      res.status(400).json({ error: authError?.message || 'Could not create authentication user.' });
      return;
    }

    authUserId = authData.user.id;

    // 2. Assign role in user_roles
    const { error: roleError } = await admin.from('user_roles').insert({
      auth_user_id: authUserId,
      role: role,
      is_active: true
    });

    if (roleError) {
      await admin.auth.admin.deleteUser(authUserId);
      authUserId = null;
      res.status(500).json({ error: 'Failed to assign user role: ' + roleError.message });
      return;
    }

    // 3. Create profile in student_profiles or parent_profiles
    let profileData = null;
    if (role === 'student') {
      const studentProfile = {
        auth_user_id: authUserId,
        student_type: 'IND',
        account_class: 'independent',
        category_locked: true,
        parent_created: false,
        delegated_access: false,
        first_name: String(fields.firstName || '').trim(),
        middle_name: fields.middleName ? String(fields.middleName).trim() : null,
        last_name: String(fields.lastName || '').trim(),
        gender: fields.gender || null,
        date_of_birth: fields.dateOfBirth,
        national_id: cleanId,
        email: cleanEmail,
        phone_number: cleanPhone,
        account_status: 'pending',
        is_active: false,
        national_id_verified: false
      };

      const { data: prof, error: profError } = await admin
        .from('student_profiles')
        .insert(studentProfile)
        .select()
        .single();

      if (profError) {
        await admin.from('user_roles').delete().eq('auth_user_id', authUserId);
        await admin.auth.admin.deleteUser(authUserId);
        authUserId = null;
        res.status(500).json({ error: 'Failed to create student profile: ' + profError.message });
        return;
      }
      profileData = prof;
    } else if (role === 'parent') {
      const parentProfile = {
        auth_user_id: authUserId,
        first_name: String(fields.firstName || '').trim(),
        middle_name: fields.middleName ? String(fields.middleName).trim() : null,
        last_name: String(fields.lastName || '').trim(),
        gender: fields.gender || null,
        date_of_birth: fields.dateOfBirth,
        national_id: cleanId,
        email: cleanEmail,
        phone_number: cleanPhone,
        account_status: 'pending',
        is_active: false,
        national_id_verified: false
      };

      const { data: prof, error: profError } = await admin
        .from('parent_profiles')
        .insert(parentProfile)
        .select()
        .single();

      if (profError) {
        await admin.from('user_roles').delete().eq('auth_user_id', authUserId);
        await admin.auth.admin.deleteUser(authUserId);
        authUserId = null;
        res.status(500).json({ error: 'Failed to create parent profile: ' + profError.message });
        return;
      }
      profileData = prof;
    }

    res.status(200).json({ ok: true, user: authData.user, profile: profileData });
  } catch (err) {
    if (authUserId) {
      try {
        await admin.from('user_roles').delete().eq('auth_user_id', authUserId);
        await admin.auth.admin.deleteUser(authUserId);
      } catch {}
    }
    res.status(500).json({ error: err.message || 'Internal registration error' });
  }
}
