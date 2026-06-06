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

export async function fetchConversations(userId) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .contains('participants', [userId])
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchMessages(conversationId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function sendMessage(conversationId, senderId, content) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchLinkedParent(userId) {
  const profileId = await getProfileIdByAuthId(userId);
  const { data, error } = await supabase
    .from('student_parent_links')
    .select('parent_id, parent_profiles(*)')
    .eq('student_profile_id', profileId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
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
