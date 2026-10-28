import { createClient } from '@supabase/supabase-js';

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
      error: 'SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL is missing in environment.'
    });
    return;
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  try {
    const payload = await parseRequestBody(req);
    const { parentProfile = {}, authUserId, personal = {}, institution = {}, household = {} } = payload;

    const parentAuthUserId = authUserId || parentProfile.auth_user_id;
    if (!parentAuthUserId) {
      res.status(400).json({ error: 'Parent authentication user ID is required.' });
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

    // 1. Insert student profile with service role
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
      res.status(500).json({ error: 'Failed to create student: ' + studentError.message });
      return;
    }

    // 2. Link parent to child
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

    if (linkError) {
      console.warn('Parent student link warning:', linkError);
    }

    // 3. Submit application
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
    } catch (appErr) {
      console.warn('Auto application submission warning:', appErr);
    }

    res.status(200).json({
      ok: true,
      student: {
        ...student,
        linkId: link?.id || null,
        canView: true,
        canManage: true
      },
      application
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error adding child' });
  }
}
