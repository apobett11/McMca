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
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const LAST = 'Mutai';
const FAMILY = {
  francis: {
    firstName: 'Francis',
    lastName: LAST,
    gender: 'Male',
    dateOfBirth: '1978-11-03',
    nationalId: '22780123',
    phone: '+254722100001',
    email: 'francis@gmail.com',
    password: 'Francis@2026'
  },
  mark: {
    firstName: 'Mark',
    lastName: LAST,
    gender: 'Male',
    dateOfBirth: '2005-03-18',
    nationalId: '38701101',
    phone: '+254711100001',
    email: 'mark@gmail.com',
    password: 'Mark@2026'
  },
  marcus: {
    firstName: 'Marcus',
    lastName: LAST,
    gender: 'Male',
    dateOfBirth: '2006-09-02',
    nationalId: '38701102',
    phone: '+254711100002',
    email: 'marcus@gmail.com',
    password: 'Marcus@2026'
  },
  collins: {
    firstName: 'Collins',
    lastName: LAST,
    gender: 'Male',
    dateOfBirth: '2011-08-14',
    nationalId: null,
    phone: '+254711100003',
    email: 'collins@gmail.com',
    password: 'Collins@2026',
    birthCertificateNumber: 'BC20117890'
  }
};

async function ensureUser(person) {
  const { data, error } = await admin.auth.admin.createUser({
    email: person.email,
    password: person.password,
    email_confirm: true,
    user_metadata: {
      first_name: person.firstName,
      last_name: person.lastName
    }
  });
  if (!error && data?.user) return data.user;

  const msg = String(error?.message || '');
  if (!/already|registered|exists/i.test(msg) && error?.status !== 422) {
    throw error;
  }

  const { data: listed, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;
  const existing = listed.users.find((u) => u.email?.toLowerCase() === person.email.toLowerCase());
  if (!existing) throw error || new Error(`Could not find existing user ${person.email}`);

  const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
    password: person.password,
    email_confirm: true
  });
  if (updateError) throw updateError;
  return updated.user;
}

async function upsertRole(userId, role) {
  const { error } = await admin.from('user_roles').upsert(
    { auth_user_id: userId, role, is_active: true, updated_at: new Date().toISOString() },
    { onConflict: 'auth_user_id' }
  );
  if (error) throw error;
}

function personalPayload(person, extra = {}) {
  return {
    firstName: person.firstName,
    lastName: person.lastName,
    gender: person.gender,
    dateOfBirth: person.dateOfBirth,
    email: person.email,
    phone: person.phone,
    nationalId: person.nationalId,
    ...extra
  };
}

async function savePersonalStep({ authUserId, ownerType, ownerId, flowId, payload }) {
  const { error } = await admin.from('wizard_steps').upsert({
    auth_user_id: authUserId,
    owner_type: ownerType,
    owner_id: ownerId,
    flow_id: flowId,
    step_key: 'personal_information',
    payload,
    completed: true,
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, { onConflict: 'owner_type,owner_id,flow_id,step_key' });
  if (error) throw error;
}

const now = new Date().toISOString();

const francisUser = await ensureUser(FAMILY.francis);
const markUser = await ensureUser(FAMILY.mark);
const marcusUser = await ensureUser(FAMILY.marcus);
const collinsUser = await ensureUser(FAMILY.collins);

await upsertRole(francisUser.id, 'parent');
await upsertRole(markUser.id, 'student');
await upsertRole(marcusUser.id, 'student');
await upsertRole(collinsUser.id, 'student');

const { data: parent, error: parentError } = await admin.from('parent_profiles').upsert({
  auth_user_id: francisUser.id,
  first_name: FAMILY.francis.firstName,
  last_name: FAMILY.francis.lastName,
  gender: FAMILY.francis.gender,
  date_of_birth: FAMILY.francis.dateOfBirth,
  national_id: FAMILY.francis.nationalId,
  email: FAMILY.francis.email,
  phone_number: FAMILY.francis.phone,
  email_verified: true,
  phone_verified: false,
  national_id_verified: true,
  account_status: 'pending',
  is_active: false,
  wizard_completed: { personal_information: true },
  updated_at: now
}, { onConflict: 'auth_user_id' }).select().single();
if (parentError) throw parentError;

const studentRows = [
  {
    key: 'mark',
    user: markUser,
    person: FAMILY.mark,
    student_type: 'IND',
    account_class: 'independent',
    parent_created: false,
    delegated_access: false,
    school_level: 'tertiary',
    school_name: 'Egerton University',
    birth_certificate_number: null,
    national_id_verified: true
  },
  {
    key: 'marcus',
    user: marcusUser,
    person: FAMILY.marcus,
    student_type: 'DEL',
    account_class: 'delegated',
    parent_created: true,
    delegated_access: true,
    school_level: 'tertiary',
    school_name: 'Rift Valley Technical Training Institute',
    birth_certificate_number: null,
    national_id_verified: true
  },
  {
    key: 'collins',
    user: collinsUser,
    person: FAMILY.collins,
    student_type: 'CUS',
    account_class: 'custody',
    parent_created: true,
    delegated_access: false,
    school_level: 'secondary',
    school_name: 'Moi Secondary School',
    birth_certificate_number: FAMILY.collins.birthCertificateNumber,
    national_id_verified: false
  }
];

const students = {};
for (const row of studentRows) {
  let result = await admin.from('student_profiles').upsert({
    auth_user_id: row.user.id,
    student_type: row.student_type,
    first_name: row.person.firstName,
    last_name: row.person.lastName,
    gender: row.person.gender,
    date_of_birth: row.person.dateOfBirth,
    national_id: row.person.nationalId,
    email: row.person.email,
    phone_number: row.person.phone,
    email_verified: true,
    national_id_verified: row.national_id_verified,
    delegated_access: row.delegated_access,
    parent_created: row.parent_created,
    school_name: row.school_name,
    school_level: row.school_level,
    account_class: row.account_class,
    account_status: 'pending',
    category_locked: true,
    birth_certificate_number: row.birth_certificate_number,
    is_active: false,
    wizard_completed: { personal_information: true },
    updated_at: now
  }, { onConflict: 'auth_user_id' }).select().single();

  if (result.error && row.student_type !== 'IND') {
    result = await admin.from('student_profiles').upsert({
      auth_user_id: row.user.id,
      student_type: 'IND',
      first_name: row.person.firstName,
      last_name: row.person.lastName,
      gender: row.person.gender,
      date_of_birth: row.person.dateOfBirth,
      national_id: row.person.nationalId,
      email: row.person.email,
      phone_number: row.person.phone,
      email_verified: true,
      national_id_verified: row.national_id_verified,
      delegated_access: row.delegated_access,
      parent_created: row.parent_created,
      school_name: row.school_name,
      school_level: row.school_level,
      account_class: row.account_class,
      account_status: 'pending',
      category_locked: true,
      birth_certificate_number: row.birth_certificate_number,
      is_active: false,
      wizard_completed: { personal_information: true },
      updated_at: now
    }, { onConflict: 'auth_user_id' }).select().single();
  }
  if (result.error) throw result.error;
  students[row.key] = result.data;
}

const links = [
  { student: students.mark, can_manage: false },
  { student: students.marcus, can_manage: true },
  { student: students.collins, can_manage: true }
];

for (const link of links) {
  const { error } = await admin.from('parent_student_links').upsert({
    parent_auth_user_id: francisUser.id,
    student_profile_id: link.student.id,
    relationship: 'father',
    can_view: true,
    can_manage: link.can_manage
  }, { onConflict: 'parent_auth_user_id,student_profile_id' });
  if (error) throw error;
}

const { error: pendingError } = await admin.from('pending_parent_identities').upsert({
  student_profile_id: students.mark.id,
  parent_national_id: FAMILY.francis.nationalId,
  parent_first_name: FAMILY.francis.firstName,
  parent_last_name: FAMILY.francis.lastName,
  parent_phone: FAMILY.francis.phone,
  relationship: 'father',
  verification_status: 'linked',
  linked_parent_profile_id: parent.id
}, { onConflict: 'student_profile_id,parent_national_id' });
if (pendingError) throw pendingError;

await savePersonalStep({
  authUserId: francisUser.id,
  ownerType: 'parent',
  ownerId: parent.id,
  flowId: 'register_parent',
  payload: personalPayload(FAMILY.francis)
});
await savePersonalStep({
  authUserId: markUser.id,
  ownerType: 'student',
  ownerId: students.mark.id,
  flowId: 'register_independent',
  payload: personalPayload(FAMILY.mark)
});
await savePersonalStep({
  authUserId: francisUser.id,
  ownerType: 'student',
  ownerId: students.marcus.id,
  flowId: 'parent_add_child',
  payload: personalPayload(FAMILY.marcus, { educationLevel: 'tertiary' })
});
await savePersonalStep({
  authUserId: francisUser.id,
  ownerType: 'student',
  ownerId: students.collins.id,
  flowId: 'parent_add_child',
  payload: personalPayload(FAMILY.collins, {
    educationLevel: 'secondary',
    birthCertificateNumber: FAMILY.collins.birthCertificateNumber
  })
});

console.log(JSON.stringify({
  ok: true,
  parent: { email: FAMILY.francis.email, role: 'parent', class: null },
  students: [
    { email: FAMILY.mark.email, role: 'student', class: 'independent' },
    { email: FAMILY.marcus.email, role: 'student', class: 'delegated' },
    { email: FAMILY.collins.email, role: 'student', class: 'custody' }
  ],
  links: 'Francis is father of Mark (overview), Marcus (delegated control), Collins (full custody control)'
}, null, 2));
