import { supabase } from './supabase';

export async function fetchStudentProfile(userId) {
  const { data, error } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchStudentApplication(userId) {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function fetchAllApplications(userId) {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchStudentNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchRecentActivity(userId) {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  return data || [];
}

export async function fetchStudentDocuments(userId) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('uploaded_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchDocumentChecklist(userId) {
  const { data, error } = await supabase
    .from('document_checklist')
    .select('*')
    .eq('user_id', userId)
    .order('required_order', { ascending: true });
  if (error) throw error;
  return data || [];
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
  const { data, error } = await supabase
    .from('student_parent_links')
    .select('parent_id, parent_profiles(*)')
    .eq('student_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateStudentProfile(userId, updates) {
  const allowedFields = [
    'phone',
    'address',
    'emergency_contact',
    'emergency_phone',
    'bio'
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
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getDocumentUploadUrl(userId, fileName, fileType) {
  const filePath = `${userId}/${Date.now()}_${fileName}`;
  const { data, error } = await supabase.storage
    .from('student-documents')
    .upload(filePath, fileName, {
      contentType: fileType,
      upsert: false
    });
  if (error) throw error;
  return data;
}

export async function getDocumentSignedUrl(filePath) {
  const { data, error } = await supabase.storage
    .from('student-documents')
    .createSignedUrl(filePath, 3600);
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
