import { supabase } from './supabase';
import {
  ACCOUNT_ROLE,
  ACCOUNT_STATUS,
  DOCUMENT_KIND,
  allocateIndependentClass,
  allocateStudentClassFromEducation,
  buildPendingParentIdentity,
  joinFullName,
  normalizeNationalId,
  normalizePhone,
  planAccountActivation,
  planLinkPermissions,
  planParentActivationLinks
} from './accountAllocation';
import { assertCanPersist, mapOnboardingKind, verifyDocumentUpload } from './documentUpload';

const IDENTITY_BUCKET = 'student-documents';

function fileExt(file) {
  const name = file?.name || 'photo.jpg';
  const ext = name.split('.').pop();
  return (ext || 'jpg').toLowerCase();
}

export async function fetchRoleRecord(userId) {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role, is_active')
    .eq('auth_user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchStudentAccount(userId) {
  const { data, error } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('auth_user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchParentAccount(userId) {
  const { data, error } = await supabase
    .from('parent_profiles')
    .select('*')
    .eq('auth_user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchIdentityDocuments(ownerType, ownerId) {
  const { data, error } = await supabase
    .from('identity_documents')
    .select('*')
    .eq('owner_type', ownerType)
    .eq('owner_id', ownerId)
    .order('uploaded_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchWizardSteps(ownerType, ownerId, flowId) {
  const { data, error } = await supabase
    .from('wizard_steps')
    .select('*')
    .eq('owner_type', ownerType)
    .eq('owner_id', ownerId)
    .eq('flow_id', flowId);
  if (error) throw error;
  return data || [];
}

export async function saveWizardStep({
  authUserId,
  ownerType,
  ownerId,
  flowId,
  stepKey,
  payload,
  completed = true
}) {
  const row = {
    auth_user_id: authUserId,
    owner_type: ownerType,
    owner_id: ownerId,
    flow_id: flowId,
    step_key: stepKey,
    payload: payload || {},
    completed,
    completed_at: completed ? new Date().toISOString() : null,
    updated_at: new Date().toISOString()
  };
  const { data, error } = await supabase
    .from('wizard_steps')
    .upsert(row, { onConflict: 'owner_type,owner_id,flow_id,step_key' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function persistVerifiedIdentityDocument({
  authUserId,
  ownerType,
  ownerId,
  studentProfileId,
  documentKind,
  file,
  expected,
  matchResult
}) {
  const kind = mapOnboardingKind(documentKind);
  let verification = matchResult;
  const persist = assertCanPersist(verification, file, expected || {});
  if (!persist.ok) {
    verification = await verifyDocumentUpload({ file, kind, expected: expected || {} });
    if (!verification.ok || !verification.canPersist) {
      throw new Error(verification.reason || persist.reason || 'The document must be verified before it is saved.');
    }
  }
  return uploadIdentityDocument({
    authUserId,
    ownerType,
    ownerId,
    studentProfileId,
    documentKind,
    file,
    matchResult: verification
  });
}

export async function uploadIdentityDocument({
  authUserId,
  ownerType,
  ownerId,
  studentProfileId,
  documentKind,
  file,
  matchResult
}) {
  if (!matchResult?.ok || !matchResult?.canPersist) {
    throw new Error('The document must be verified before it is saved.');
  }
  const path = `identity/${ownerType}/${ownerId}/${Date.now()}_${documentKind}.${fileExt(file)}`;
  const { error: uploadError } = await supabase.storage
    .from(IDENTITY_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('identity_documents')
    .insert({
      owner_type: ownerType,
      owner_id: ownerId,
      student_profile_id: studentProfileId || null,
      document_kind: documentKind,
      bucket_name: IDENTITY_BUCKET,
      storage_path: path,
      original_filename: file.name,
      mime_type: file.type,
      file_size: file.size,
      verification_status: matchResult.status || 'verified',
      matched_name: matchResult.matchedName || matchResult.extractedName || null,
      matched_id_number: matchResult.matchedIdNumber || null,
      readability_passed: Boolean(matchResult.specs?.ok || matchResult.quality?.ok),
      visibility_passed: Boolean(matchResult.specs?.ok || matchResult.quality?.ok),
      quality_notes: {
        specs: matchResult.specs || matchResult.quality || null,
        extractedName: matchResult.extractedName || null,
        extractedIdNumbers: matchResult.extractedIdNumbers || [],
        ocrConfidence: matchResult.ocr?.confidence || null
      },
      uploaded_by: authUserId
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createIndependentStudentAccount({ userId, email, fields }) {
  const allocation = allocateIndependentClass();
  const profile = {
    auth_user_id: userId,
    student_type: allocation.studentTypeCode,
    account_class: allocation.studentClass,
    category_locked: true,
    parent_created: false,
    delegated_access: false,
    first_name: fields.firstName.trim(),
    middle_name: fields.middleName?.trim() || null,
    last_name: fields.lastName.trim(),
    gender: fields.gender,
    date_of_birth: fields.dateOfBirth,
    national_id: normalizeNationalId(fields.nationalId),
    email,
    phone_number: normalizePhone(fields.phone),
    account_status: ACCOUNT_STATUS.PENDING,
    is_active: false,
    national_id_verified: false
  };
  return insertStudentProfile(profile);
}

async function insertStudentProfile(profile) {
  const first = await supabase.from('student_profiles').insert(profile).select().single();
  if (!first.error) return first.data;
  if (profile.student_type && profile.student_type !== 'IND') {
    const retry = await supabase
      .from('student_profiles')
      .insert({ ...profile, student_type: 'IND' })
      .select()
      .single();
    if (!retry.error) return retry.data;
    throw retry.error;
  }
  throw first.error;
}

export async function createParentAccount({ userId, email, fields }) {
  const profile = {
    auth_user_id: userId,
    first_name: fields.firstName.trim(),
    middle_name: fields.middleName?.trim() || null,
    last_name: fields.lastName.trim(),
    gender: fields.gender,
    date_of_birth: fields.dateOfBirth,
    national_id: normalizeNationalId(fields.nationalId),
    email,
    phone_number: normalizePhone(fields.phone),
    account_status: ACCOUNT_STATUS.PENDING,
    is_active: false,
    national_id_verified: false
  };
  const { data, error } = await supabase.from('parent_profiles').insert(profile).select().single();
  if (error) throw error;
  return data;
}

export async function assignUserRole(userId, role) {
  const { error } = await supabase.from('user_roles').insert({
    auth_user_id: userId,
    role,
    is_active: true
  });
  if (error && error.code !== '23505') throw error;
}

export async function activateOwnerAccount({ role, profile, documents, identityMatchOk }) {
  const plan = planAccountActivation({
    role,
    studentClass: profile.account_class,
    dateOfBirth: profile.date_of_birth,
    nationalId: profile.national_id,
    nationalIdVerified: identityMatchOk || profile.national_id_verified,
    documents,
    identityMatchOk
  });
  if (!plan.ok) return plan;

  const table = role === ACCOUNT_ROLE.PARENT ? 'parent_profiles' : 'student_profiles';
  const { data, error } = await supabase
    .from(table)
    .update({
      ...plan.patch,
      updated_at: new Date().toISOString()
    })
    .eq('id', profile.id)
    .select()
    .single();
  if (error) throw error;
  return { ...plan, profile: data };
}

export async function linkIndependentParentsOnActivation(parentProfile) {
  const id = normalizeNationalId(parentProfile.national_id);
  const { data: pending } = await supabase
    .from('pending_parent_identities')
    .select('*')
    .eq('parent_national_id', id);

  const plan = planParentActivationLinks({
    parentNationalId: id,
    pendingIdentities: pending || [],
    independentStudents: []
  });

  for (const link of plan.links) {
    await supabase.from('parent_student_links').upsert({
      parent_auth_user_id: parentProfile.auth_user_id,
      student_profile_id: link.student_profile_id,
      relationship: link.relationship,
      can_view: true,
      can_manage: false
    }, { onConflict: 'parent_auth_user_id,student_profile_id' });

    await supabase
      .from('pending_parent_identities')
      .update({
        linked_parent_profile_id: parentProfile.id,
        verification_status: 'linked'
      })
      .eq('student_profile_id', link.student_profile_id)
      .eq('parent_national_id', id);
  }
  return plan;
}

export async function savePendingParentFromStudent({ studentProfileId, parent, documentsVerified }) {
  const row = buildPendingParentIdentity({
    studentProfileId,
    parent: { ...parent, verified: documentsVerified }
  });
  const { data, error } = await supabase
    .from('pending_parent_identities')
    .upsert(row, { onConflict: 'student_profile_id,parent_national_id' })
    .select()
    .single();
  if (error) throw error;

  const { data: existingParent } = await supabase
    .from('parent_profiles')
    .select('*')
    .eq('national_id', row.parent_national_id)
    .eq('account_status', ACCOUNT_STATUS.ACTIVE)
    .maybeSingle();

  if (existingParent) {
    await supabase.from('parent_student_links').upsert({
      parent_auth_user_id: existingParent.auth_user_id,
      student_profile_id: studentProfileId,
      relationship: parent.relationship,
      can_view: true,
      can_manage: false
    }, { onConflict: 'parent_auth_user_id,student_profile_id' });
    await supabase
      .from('pending_parent_identities')
      .update({
        linked_parent_profile_id: existingParent.id,
        verification_status: 'linked'
      })
      .eq('id', data.id);
  }
  return data;
}

export async function fetchLinkedParents(studentProfileId) {
  const { data, error } = await supabase
    .from('pending_parent_identities')
    .select('*')
    .eq('student_profile_id', studentProfileId);
  if (error) throw error;
  return data || [];
}

export async function fetchParentChildren(parentAuthUserId) {
  const { data: links, error } = await supabase
    .from('parent_student_links')
    .select('*')
    .eq('parent_auth_user_id', parentAuthUserId);
  if (error) throw error;
  if (!links?.length) return [];
  const ids = links.map((link) => link.student_profile_id);
  const { data: profiles, error: profileError } = await supabase
    .from('student_profiles')
    .select('*')
    .in('id', ids);
  if (profileError) throw profileError;
  const byId = Object.fromEntries((profiles || []).map((row) => [row.id, row]));
  return links
    .map((link) => {
      const student = byId[link.student_profile_id];
      if (!student) return null;
      return {
        ...student,
        linkId: link.id,
        relationship: link.relationship,
        canView: link.can_view,
        canManage: link.can_manage
      };
    })
    .filter(Boolean);
}

export async function createChildForParent({ parentProfile, fields, educationLevel }) {
  const allocation = allocateStudentClassFromEducation(educationLevel);
  if (!allocation.ok) throw new Error(allocation.reason);
  const permissions = planLinkPermissions(allocation.studentClass);

  const profile = {
    auth_user_id: null,
    student_type: allocation.studentTypeCode,
    account_class: allocation.studentClass,
    category_locked: true,
    parent_created: true,
    delegated_access: allocation.delegatedAccess,
    first_name: fields.firstName.trim(),
    middle_name: fields.middleName?.trim() || null,
    last_name: fields.lastName.trim(),
    gender: fields.gender,
    date_of_birth: fields.dateOfBirth,
    birth_certificate_number: fields.birthCertificateNumber?.trim() || null,
    school_level: educationLevel,
    account_status: ACCOUNT_STATUS.ACTIVE,
    is_active: true,
    national_id_verified: false
  };

  const student = await insertStudentProfile(profile);

  const { error: linkError } = await supabase.from('parent_student_links').insert({
    parent_auth_user_id: parentProfile.auth_user_id,
    student_profile_id: student.id,
    relationship: fields.relationship || null,
    can_view: permissions.can_view,
    can_manage: permissions.can_manage
  });
  if (linkError) throw linkError;
  return student;
}

export async function updateChildProfile(studentId, patch) {
  const { data, error } = await supabase
    .from('student_profiles')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', studentId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function registerAuthUser({ email, password }) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  const user = data.user || data.session?.user;
  if (!user) {
    throw new Error('Check your email to confirm the account, then sign in to finish identity verification.');
  }
  return { user, session: data.session };
}

export { DOCUMENT_KIND, ACCOUNT_ROLE, joinFullName };
