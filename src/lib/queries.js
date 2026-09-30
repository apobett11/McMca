import { supabase } from './supabase';
import { evaluateCase, inferBursaryCycle, isLockedDocument } from '../domain/requirements.js';

async function getProfileIdByAuthId(userId) {
  const { data, error } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('auth_user_id', userId)
    .single();
  if (error) throw error;
  return data.id;
}

export async function fetchStudentProfile(userId) {
  const { data, error } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('auth_user_id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchStudentApplication(userId) {
  const profileId = await getProfileIdByAuthId(userId);
  const { data, error } = await supabase
    .from('student_applications')
    .select('*')
    .eq('student_profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function fetchAllApplications(userId) {
  const profileId = await getProfileIdByAuthId(userId);
  const { data, error } = await supabase
    .from('student_applications')
    .select('*')
    .eq('student_profile_id', profileId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchStudentNotifications(userId) {
  const profileId = await getProfileIdByAuthId(userId);
  const { data, error } = await supabase
    .from('student_notifications')
    .select('*')
    .eq('student_profile_id', profileId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchRecentActivity(userId) {
  const profileId = await getProfileIdByAuthId(userId);
  const { data, error } = await supabase
    .from('student_activity_logs')
    .select('*')
    .eq('student_profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  return data || [];
}

export async function fetchStudentDocuments(userId) {
  const profileId = await getProfileIdByAuthId(userId);
  const { data, error } = await supabase
    .from('student_documents')
    .select('*')
    .eq('student_profile_id', profileId)
    .order('uploaded_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchDocumentChecklist() {
  return [];
}

export async function updateStudentProfile(userId, updates) {
  const allowedFields = [
    'phone_number',
    'email'
  ];
  const safeUpdates = {};
  for (const key of Object.keys(updates)) {
    if (allowedFields.includes(key)) {
      safeUpdates[key] = updates[key];
    }
  }
  if (Object.keys(safeUpdates).length === 0) {
    throw new Error('No editable fields provided');
  }
  const { data, error } = await supabase
    .from('student_profiles')
    .update(safeUpdates)
    .eq('auth_user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

const DOCUMENT_COLUMNS =
  'id, student_profile_id, application_id, guardian_id, document_type, verification_status, scope, original_filename, mime_type, file_size, uploaded_at, storage_path, ai_verified, inline_checks, verified_at';

function explainQueryError(error) {
  if (!error) return error;
  const missing =
    error.code === '42P01' ||
    error.code === '42703' ||
    error.code === 'PGRST204' ||
    error.code === 'PGRST205';
  if (missing) {
    return new Error(
      'Student records are missing a required table or column. Apply supabase/migrations/20260930120000_student_document_channel.sql.'
    );
  }
  return error;
}

export async function fetchOpenCycles() {
  const { data, error } = await supabase
    .from('bursary_cycles')
    .select('label, status')
    .eq('status', 'open')
    .order('label', { ascending: false })
    .limit(5);
  if (error || !data?.length) {
    return [{ label: inferBursaryCycle(), status: 'open' }];
  }
  return data;
}

export async function fetchStudentCase(userId) {
  const profile = await fetchStudentProfile(userId);
  const [guardiansRes, documentsRes, applicationsRes, notificationsRes, cycles] = await Promise.all([
    supabase
      .from('student_guardians')
      .select('id, full_name, phone_number, relationship, national_id, created_at')
      .eq('student_profile_id', profile.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('student_documents')
      .select(DOCUMENT_COLUMNS)
      .eq('student_profile_id', profile.id)
      .order('uploaded_at', { ascending: false })
      .limit(100),
    supabase
      .from('student_applications')
      .select('id, application_status, institution_name, cycle, current_office, submitted_at, created_at, appeal_status, review_note')
      .eq('student_profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('student_notifications')
      .select('id, title, message, is_read, created_at')
      .eq('student_profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(8),
    fetchOpenCycles()
  ]);

  if (guardiansRes.error) throw explainQueryError(guardiansRes.error);
  if (documentsRes.error) throw explainQueryError(documentsRes.error);
  if (applicationsRes.error) throw explainQueryError(applicationsRes.error);

  const guardians = guardiansRes.data || [];
  const documents = documentsRes.data || [];
  const applications = applicationsRes.data || [];
  const notifications = notificationsRes.error ? [] : notificationsRes.data || [];
  const evaluation = evaluateCase({ guardians, documents, applications });

  return {
    profile,
    guardians,
    documents,
    applications,
    application: applications[0] || null,
    notifications,
    cycles,
    evaluation
  };
}

export async function saveGuardian(userId, guardian) {
  const profileId = await getProfileIdByAuthId(userId);
  const row = {
    student_profile_id: profileId,
    full_name: guardian.fullName.trim(),
    phone_number: guardian.phoneNumber.trim(),
    relationship: (guardian.relationship || 'parent').trim() || 'parent',
    updated_at: new Date().toISOString()
  };

  if (guardian.id) {
    const { data, error } = await supabase
      .from('student_guardians')
      .update(row)
      .eq('id', guardian.id)
      .eq('student_profile_id', profileId)
      .select('id, full_name, phone_number, relationship')
      .single();
    if (error) throw explainQueryError(error);
    return data;
  }

  const { data, error } = await supabase
    .from('student_guardians')
    .insert(row)
    .select('id, full_name, phone_number, relationship')
    .single();
  if (error) throw explainQueryError(error);
  return data;
}

export async function uploadStudentDocument(userId, applicationId, docType, file, extra = {}) {
  const profileId = await getProfileIdByAuthId(userId);
  const { data: existing, error: existingError } = await supabase
    .from('student_documents')
    .select('id, document_type, guardian_id, verification_status, ai_verified, uploaded_at')
    .eq('student_profile_id', profileId)
    .eq('document_type', docType)
    .order('uploaded_at', { ascending: false })
    .limit(20);
  if (existingError) throw explainQueryError(existingError);

  const locked = (existing || []).find((row) => {
    if (!isLockedDocument(row)) return false;
    if (extra.guardianId) return row.guardian_id === extra.guardianId;
    return true;
  });
  if (locked) {
    throw new Error('This document is already verified and stays on the profile.');
  }

  const fileExt = file.name.split('.').pop();
  const storagePath = `student-documents/${profileId}/${applicationId || 'profile'}/${Date.now()}_${docType}.${fileExt}`;
  const { error: uploadError } = await supabase.storage
    .from('student-documents')
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false
    });
  if (uploadError) throw uploadError;

  const { error: insertError } = await supabase.from('student_documents').insert({
    student_profile_id: profileId,
    application_id: applicationId || null,
    guardian_id: extra.guardianId || null,
    document_type: docType,
    scope: extra.scope || (applicationId ? 'application' : 'profile'),
    verification_status: 'inline_passed',
    inline_checks: extra.inline || null,
    ai_verified: false,
    bucket_name: 'student-documents',
    storage_path: storagePath,
    original_filename: file.name,
    mime_type: file.type,
    file_size: file.size,
    uploaded_by: userId
  });
  if (insertError) throw explainQueryError(insertError);
}

async function recordStudentEvent(profileId, title, message) {
  await supabase.from('student_activity_logs').insert({
    student_profile_id: profileId,
    activity_type: 'application',
    activity_description: message
  });
  await supabase.from('student_notifications').insert({
    student_profile_id: profileId,
    title,
    message,
    is_read: false
  });
}

export async function submitBursaryApplication(userId, { cycle, institutionName }) {
  const current = await fetchStudentCase(userId);
  if (!current.evaluation.canApply) {
    throw new Error(current.evaluation.blockReason || 'Complete the checklist before applying.');
  }

  const school = (institutionName || current.profile.school_name || '').trim();
  if (!school) throw new Error('Add the school name before applying.');

  if (school !== current.profile.school_name) {
    const { error: profileError } = await supabase
      .from('student_profiles')
      .update({ school_name: school })
      .eq('id', current.profile.id);
    if (profileError) throw profileError;
  }

  const { data, error } = await supabase
    .from('student_applications')
    .insert({
      student_profile_id: current.profile.id,
      application_status: 'pending',
      current_office: 'chief',
      cycle: cycle || current.cycles[0]?.label || inferBursaryCycle(),
      institution_name: school,
      submitted_at: new Date().toISOString()
    })
    .select('id, application_status, current_office, cycle')
    .single();
  if (error) throw explainQueryError(error);

  try {
    await recordStudentEvent(
      current.profile.id,
      'Application with the chief',
      'Your application is pending with your area chief. Verified documents stay on your profile.'
    );
  } catch {
    /* The application row is the source of truth. A feed write must not roll it back. */
  }

  return data;
}

const CHIEF_PAGE_SIZE = 25;

export async function fetchChiefQueue({ page = 0, search = '' } = {}) {
  const from = page * CHIEF_PAGE_SIZE;
  const to = from + CHIEF_PAGE_SIZE - 1;
  let query = supabase
    .from('student_applications')
    .select(
      `id, application_status, institution_name, cycle, current_office, submitted_at, created_at,
       student_profiles (id, first_name, middle_name, last_name, school_name, admission_number, student_type, email, phone_number)`,
      { count: 'exact' }
    )
    .eq('application_status', 'pending')
    .eq('current_office', 'chief')
    .order('created_at', { ascending: false })
    .range(from, to);

  const term = search.trim().replace(/[%_,]/g, '');
  if (term) {
    const { data: profiles, error: profileError } = await supabase
      .from('student_profiles')
      .select('id')
      .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,school_name.ilike.%${term}%`)
      .limit(50);
    if (profileError) throw explainQueryError(profileError);
    const ids = (profiles || []).map((profile) => profile.id);
    if (!ids.length) return { rows: [], count: 0, pageSize: CHIEF_PAGE_SIZE };
    query = query.in('student_profile_id', ids);
  }

  const { data, error, count } = await query;
  if (error) throw explainQueryError(error);
  return { rows: data || [], count: count || 0, pageSize: CHIEF_PAGE_SIZE };
}

export async function fetchChiefApplication(applicationId) {
  const { data, error } = await supabase
    .from('student_applications')
    .select(
      `id, application_status, institution_name, cycle, current_office, submitted_at, created_at, review_note,
       student_profiles (id, first_name, middle_name, last_name, school_name, admission_number, student_type, email, phone_number)`
    )
    .eq('id', applicationId)
    .single();
  if (error) throw explainQueryError(error);

  const profileId = data.student_profiles?.id;
  const [documentsRes, guardiansRes] = await Promise.all([
    supabase
      .from('student_documents')
      .select(DOCUMENT_COLUMNS)
      .eq('student_profile_id', profileId)
      .order('uploaded_at', { ascending: false })
      .limit(100),
    supabase
      .from('student_guardians')
      .select('id, full_name, phone_number, relationship')
      .eq('student_profile_id', profileId)
  ]);
  if (documentsRes.error) throw explainQueryError(documentsRes.error);
  if (guardiansRes.error) throw explainQueryError(guardiansRes.error);

  return {
    application: data,
    documents: documentsRes.data || [],
    guardians: guardiansRes.data || []
  };
}

export async function setDocumentVerification(documentId, status) {
  const verified = status === 'verified';
  const { data, error } = await supabase
    .from('student_documents')
    .update({
      verification_status: status,
      ai_verified: verified,
      verified_at: verified ? new Date().toISOString() : null
    })
    .eq('id', documentId)
    .select('id, student_profile_id, document_type, verification_status')
    .single();
  if (error) throw explainQueryError(error);

  if (verified && data.document_type === 'student-id') {
    await supabase
      .from('student_profiles')
      .update({ national_id_verified: true })
      .eq('id', data.student_profile_id);
  }
  return data;
}

const CHIEF_DECISIONS = {
  approve: { application_status: 'chief_approved', current_office: 'mca' },
  reject: { application_status: 'rejected', current_office: null },
  clarify: { application_status: 'pending', current_office: 'chief' }
};

export async function decideApplication(applicationId, action, note) {
  const decision = CHIEF_DECISIONS[action];
  if (!decision) throw new Error('Unknown review action.');

  const { data, error } = await supabase
    .from('student_applications')
    .update({
      ...decision,
      review_note: note || null
    })
    .eq('id', applicationId)
    .select('id, student_profile_id, application_status')
    .single();
  if (error) throw explainQueryError(error);

  const copy = {
    approve: ['Chief approved', 'Your area chief approved the application. It moves to the MCA office.'],
    reject: ['Application not approved', note || 'Your area chief did not approve this application.'],
    clarify: ['Clarification requested', note || 'Your area chief asked for a clarification.']
  }[action];

  try {
    await recordStudentEvent(data.student_profile_id, copy[0], copy[1]);
  } catch {
    /* Decision row is already saved. */
  }
  return data;
}

export async function getDocumentSignedUrl(storagePath) {
  const { data, error } = await supabase.storage
    .from('student-documents')
    .createSignedUrl(storagePath, 3600);
  if (error) throw error;
  return data?.signedUrl;
}

export async function callEdgeFunction(functionName, payload = {}) {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: payload
  });
  if (error) throw error;
  return data;
}
