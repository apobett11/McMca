import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createClient } from '@supabase/supabase-js';
import { describeSupabaseKey, pickBrowserSupabaseKey, pickSupabaseUrl } from './src/lib/supabaseKeys.js';

function registerApiPlugin(supabaseUrl, serviceRoleKey) {
  const admin = (supabaseUrl && serviceRoleKey)
    ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;

  async function handleRegister(req, res) {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }
    if (!admin) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Database service is not configured on server.' }));
      return;
    }

    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => {
      let authUserId = null;
      try {
        const payload = JSON.parse(body || '{}');
        const { role, email, password, fields = {} } = payload;

        if (!role || !email || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Role, email, and password are required.' }));
          return;
        }

        const cleanEmail = String(email).trim().toLowerCase();
        const cleanId = String(fields.nationalId || '').trim().replace(/\D/g, '');
        const cleanPhone = String(fields.phone || '').trim();

        if (!cleanId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'National ID number is required.' }));
          return;
        }

        // Check if account already exists with this national ID or email
        const { data: existingStudent } = await admin
          .from('student_profiles')
          .select('id, email, national_id')
          .or(`email.eq.${cleanEmail},national_id.eq.${cleanId}`)
          .maybeSingle();

        if (existingStudent) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'An account with this National ID or Email already exists.' }));
          return;
        }

        const { data: existingParent } = await admin
          .from('parent_profiles')
          .select('id, email, national_id')
          .or(`email.eq.${cleanEmail},national_id.eq.${cleanId}`)
          .maybeSingle();

        if (existingParent) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'An account with this National ID or Email already exists.' }));
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

        // Clean up orphaned auth user from earlier failed attempts
        if (authError && (authError.message?.toLowerCase().includes('already been registered') || authError.code === 'email_exists' || authError.status === 422)) {
          const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 });
          const orphan = listData?.users?.find((u) => u.email?.toLowerCase() === cleanEmail);
          if (orphan) {
            const { data: orphanRoles } = await admin.from('user_roles').select('id').eq('auth_user_id', orphan.id);
            if (!orphanRoles || orphanRoles.length === 0) {
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
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: authError?.message || 'Could not create authentication user.' }));
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
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to assign user role: ' + roleError.message }));
          return;
        }

        // 3. Create profile in student_profiles or parent_profiles
        let profileData = null;
        if (role === 'student') {
          const studentProfile = {
            auth_user_id: authUserId,
            student_type: 'IND',
            account_class: 'IND',
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
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to create student profile: ' + profError.message }));
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
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to create parent profile: ' + profError.message }));
            return;
          }
          profileData = prof;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, user: authData.user, profile: profileData }));
      } catch (err) {
        if (authUserId) {
          try {
            await admin.from('user_roles').delete().eq('auth_user_id', authUserId);
            await admin.auth.admin.deleteUser(authUserId);
          } catch {}
        }
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || 'Internal registration error' }));
      }
    });
  }

  async function handleAddChild(req, res) {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }
    if (!admin) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Database service is not configured on server.' }));
      return;
    }
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { parentProfile = {}, authUserId, personal = {}, institution = {}, household = {} } = payload;
        const parentAuthUserId = authUserId || parentProfile.auth_user_id;
        if (!parentAuthUserId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Parent authentication user ID is required.' }));
          return;
        }

        const rawLevel = String(institution.schoolLevel || institution.educationLevel || personal.schoolLevel || 'secondary').trim().toLowerCase();
        let studentClass = 'custody';
        let studentTypeCode = 'CUS';
        if (rawLevel.includes('tvet') || rawLevel.includes('poly') || rawLevel.includes('univ') || rawLevel.includes('colleg') || rawLevel.includes('tert')) {
          studentClass = 'delegated';
          studentTypeCode = 'DEL';
        }

        const bank = {
          bankName: institution.bankName || '',
          bankBranch: institution.bankBranch || '',
          accountNumber: institution.accountNumber || ''
        };

        const studentProfile = {
          auth_user_id: null,
          student_type: studentTypeCode,
          account_class: studentClass,
          category_locked: true,
          parent_created: true,
          delegated_access: studentClass === 'delegated',
          first_name: String(personal.firstName || '').trim(),
          middle_name: personal.middleName ? String(personal.middleName).trim() : null,
          last_name: String(personal.lastName || '').trim(),
          gender: personal.gender || null,
          date_of_birth: personal.dateOfBirth,
          birth_certificate_number: personal.birthCertificateNumber ? String(personal.birthCertificateNumber).trim() : null,
          school_name: String(institution.schoolName || '').trim(),
          school_level: institution.schoolLevel || 'secondary',
          admission_number: String(institution.admissionNumber || '').trim(),
          account_status: 'active',
          is_active: true,
          national_id_verified: false,
          county: household.county || null,
          ward: household.ward || null,
          location_name: household.pollingStation || household.constituency || null,
          wizard_completed: { household, institution: bank }
        };

        const { data: student, error: studentError } = await admin
          .from('student_profiles')
          .insert(studentProfile)
          .select()
          .single();

        if (studentError) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to create student: ' + studentError.message }));
          return;
        }

        const { data: link, error: linkError } = await admin
          .from('parent_student_links')
          .insert({
            parent_auth_user_id: parentAuthUserId,
            student_profile_id: student.id,
            relationship: personal.relationship || 'child',
            can_view: true,
            can_manage: true
          })
          .select()
          .single();

        let application = null;
        try {
          const { data: windows } = await admin
            .from('application_windows')
            .select('*')
            .order('academic_year', { ascending: false })
            .limit(1);

          const cycle = windows?.[0] || {
            id: 'c3f096b3-5445-4eb2-b2f7-3dc5b81a198a',
            title: 'Tendeno / Sorget Ward Bursary Cycle 2026/2027',
            academic_year: 2026
          };

          const serialTail = String(student.id || Date.now()).replace(/\D/g, '').slice(-4).padStart(4, '0');
          const serial = `BUR-${cycle.academic_year || 2026}-${serialTail}`;

          const { data: dbApp, error: appError } = await admin
            .from('student_applications')
            .insert({
              student_profile_id: student.id,
              application_window_id: cycle.id,
              application_status: 'submitted',
              institution_name: student.school_name || bank.bankName || null,
              institution_level: student.school_level || 'secondary',
              submitted_at: new Date().toISOString(),
              readiness_score: 100,
              requested_amount: 15000
            })
            .select()
            .single();

          if (!appError && dbApp) {
            application = { ...dbApp, serial };
          }
        } catch {}

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: true,
          student: {
            ...student,
            linkId: link?.id || null,
            canView: true,
            canManage: true
          },
          application
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || 'Internal server error adding child' }));
      }
    });
  }

  return {
    name: 'register-api-endpoint',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/register' || req.url?.startsWith('/api/register?')) {
          handleRegister(req, res);
        } else if (req.url === '/api/add-child' || req.url?.startsWith('/api/add-child?')) {
          handleAddChild(req, res);
        } else {
          next();
        }
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/register' || req.url?.startsWith('/api/register?')) {
          handleRegister(req, res);
        } else if (req.url === '/api/add-child' || req.url?.startsWith('/api/add-child?')) {
          handleAddChild(req, res);
        } else {
          next();
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = {
    ...loadEnv(mode, process.cwd(), 'SUPABASE_'),
    ...loadEnv(mode, process.cwd(), 'VITE_'),
    ...loadEnv(mode, process.cwd(), '')
  };
  const supabaseUrl = pickSupabaseUrl(env);
  const supabaseAnonKey = pickBrowserSupabaseKey(env);
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || '';
  console.log(`[mcmca] Supabase URL host: ${(() => { try { return new URL(supabaseUrl).host; } catch { return '(missing)'; } })()}; browser key: ${describeSupabaseKey(supabaseAnonKey).kind}`);

  return {
    plugins: [
      react(),
      registerApiPlugin(supabaseUrl, serviceRoleKey)
    ],
    define: {
      __MCMCA_SUPABASE_URL__: JSON.stringify(supabaseUrl),
      __MCMCA_SUPABASE_ANON_KEY__: JSON.stringify(supabaseAnonKey)
    },
    optimizeDeps: {
      include: ['tesseract.js']
    },
    server: {
      port: Number(process.env.PORT) || 5173,
      strictPort: true
    }
  };
});
