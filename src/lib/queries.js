import { supabase } from './supabase';

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

const OFFICE_LABELS = {
  chief: 'Area chief',
  mca: 'MCA office',
  help: 'Help desk'
};

export async function sendStudentOfficeMessage(userId, { office, body }) {
  const profileId = await getProfileIdByAuthId(userId);
  const text = String(body || '').trim();
  if (!OFFICE_LABELS[office]) throw new Error('Choose who should receive this message.');
  if (text.length < 8) throw new Error('Write a short message before sending.');
  const { error } = await supabase.from('student_activity_logs').insert({
    student_profile_id: profileId,
    activity_type: 'office_message',
    activity_description: text,
    metadata: { office, office_label: OFFICE_LABELS[office] }
  });
  if (error) throw error;
  const { error: noteError } = await supabase.from('student_notifications').insert({
    student_profile_id: profileId,
    title: `Message sent to ${OFFICE_LABELS[office]}`,
    message: 'Your message is with the office.'
  });
  if (noteError) console.error('Could not store the message receipt', noteError);
  return { office, label: OFFICE_LABELS[office] };
}

export async function fetchStudentOfficeMessages(userId) {
  const profileId = await getProfileIdByAuthId(userId);
  const { data, error } = await supabase
    .from('student_activity_logs')
    .select('*')
    .eq('student_profile_id', profileId)
    .eq('activity_type', 'office_message')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function sendParentOfficeMessage({ parentAuthUserId, studentProfileId, studentName, office, body }) {
  const text = String(body || '').trim();
  if (!OFFICE_LABELS[office]) throw new Error('Choose who should receive this message.');
  if (text.length < 8) throw new Error('Write a short message before sending.');
  if (!studentProfileId) throw new Error('Please choose the student with an issue.');

  const { error } = await supabase.from('student_activity_logs').insert({
    student_profile_id: studentProfileId,
    activity_type: 'office_message',
    activity_description: text,
    metadata: {
      office,
      office_label: OFFICE_LABELS[office],
      tagged_student_id: studentProfileId,
      tagged_student_name: studentName || 'Student',
      sent_by_parent: true,
      parent_auth_user_id: parentAuthUserId
    }
  });
  if (error) {
    console.warn('DB sendParentOfficeMessage log fallback:', error);
  }

  try {
    await supabase.from('student_notifications').insert({
      student_profile_id: studentProfileId,
      title: `Message sent to ${OFFICE_LABELS[office]}`,
      message: `Parent sent a message regarding ${studentName || 'student'}.`
    });
  } catch (noteError) {
    console.warn('Could not store student notification receipt', noteError);
  }

  return { office, label: OFFICE_LABELS[office], studentName };
}

export async function fetchParentOfficeMessages(childrenStudentProfileIds = []) {
  if (!childrenStudentProfileIds.length) return [];
  const { data, error } = await supabase
    .from('student_activity_logs')
    .select('*')
    .in('student_profile_id', childrenStudentProfileIds)
    .eq('activity_type', 'office_message')
    .order('created_at', { ascending: false });
  if (error) {
    console.warn('fetchParentOfficeMessages error fallback:', error);
    return [];
  }
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

export async function uploadStudentDocument(userId, applicationId, docType, file) {
  const profileId = await getProfileIdByAuthId(userId);
  const fileExt = file.name.split('.').pop();
  const storagePath = `student-documents/${profileId}/${applicationId || 'general'}/${Date.now()}_${docType}.${fileExt}`;
  const { error: uploadError } = await supabase.storage
    .from('student-documents')
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false
    });
  if (uploadError) throw uploadError;
  const { error: insertError } = await supabase
    .from('student_documents')
    .insert({
      student_profile_id: profileId,
      application_id: applicationId || null,
      document_type: docType,
      bucket_name: 'student-documents',
      storage_path: storagePath,
      original_filename: file.name,
      mime_type: file.type,
      file_size: file.size,
      uploaded_by: userId
    });
  if (insertError) throw insertError;
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
