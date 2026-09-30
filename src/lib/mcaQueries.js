import { supabase } from './supabase';
import { explainQueryError, getDocumentSignedUrl } from './queries.js';

export const MCA_PAGE_SIZE = 20;
const EXPORT_LIMIT = 5000;

export const MCA_STAGES = [
  { value: 'awaiting', label: 'Awaiting decision' },
  { value: 'approved', label: 'Approved' },
  { value: 'declined', label: 'Declined' },
  { value: 'all', label: 'All' }
];

export const MCA_SORTS = [
  { value: 'recent', label: 'Newest chief approval', column: 'chief_approved_at', ascending: false },
  { value: 'oldest', label: 'Longest waiting', column: 'chief_approved_at', ascending: true },
  { value: 'school', label: 'School (A–Z)', column: 'school', ascending: true },
  { value: 'ward', label: 'Ward (A–Z)', column: 'ward', ascending: true },
  { value: 'level', label: 'Education level', column: 'education_level', ascending: true },
  { value: 'location', label: 'Chief location', column: 'location', ascending: true },
  { value: 'polling', label: 'Polling station', column: 'polling_station', ascending: true },
  { value: 'requested', label: 'Amount requested (high first)', column: 'amount_requested', ascending: false },
  { value: 'name', label: 'Student name (A–Z)', column: 'student_name', ascending: true }
];

const LIST_COLUMNS =
  'id, student_name, admission_number, school, education_level, ward, location, polling_station, cycle, mca_stage, application_status, amount_requested, amount_allocated, chief_approved_at, mca_decided_at, returning_beneficiary';

const FILTER_COLUMNS = {
  cycle: 'cycle',
  ward: 'ward',
  level: 'education_level',
  school: 'school',
  location: 'location',
  polling: 'polling_station'
};

function value(input) {
  return input && input !== 'All' ? input : null;
}

function withFilters(query, filters = {}) {
  let next = query;
  for (const [key, column] of Object.entries(FILTER_COLUMNS)) {
    const selected = value(filters[key]);
    if (selected) next = next.eq(column, selected);
  }
  return next;
}

function withSearch(query, search) {
  const term = String(search || '')
    .trim()
    .replace(/[%_,()*]/g, ' ')
    .replace(/\s+/g, ' ');
  if (!term) return query;
  return query.or(`student_name.ilike.%${term}%,admission_number.ilike.%${term}%,school.ilike.%${term}%`);
}

export async function fetchMcaSummary(filters = {}) {
  const { data, error } = await supabase.rpc('mca_dashboard_summary', {
    p_cycle: value(filters.cycle),
    p_ward: value(filters.ward),
    p_level: value(filters.level),
    p_school: value(filters.school),
    p_location: value(filters.location),
    p_polling: value(filters.polling)
  });
  if (error) throw explainQueryError(error);
  return data;
}

export async function fetchMcaFilterOptions() {
  const { data, error } = await supabase.rpc('mca_filter_options');
  if (error) throw explainQueryError(error);
  const sorted = (list) => [...(list || [])].filter(Boolean).sort((a, b) => String(a).localeCompare(String(b)));
  return {
    cycles: data?.cycles || [],
    wards: sorted(data?.wards),
    levels: sorted(data?.levels),
    schools: sorted(data?.schools),
    locations: sorted(data?.locations),
    pollingStations: sorted(data?.polling_stations)
  };
}

function listQuery({ filters, stage, sort, search }, columns, options) {
  const sortRule = MCA_SORTS.find((item) => item.value === sort) || MCA_SORTS[0];
  let query = supabase.from('mca_application_facts').select(columns, options);
  query = withFilters(query, filters);
  query = withSearch(query, search);
  if (stage && stage !== 'all') query = query.eq('mca_stage', stage);
  return query
    .order(sortRule.column, { ascending: sortRule.ascending, nullsFirst: false })
    .order('id', { ascending: true });
}

export async function fetchMcaApplications({ filters, stage = 'awaiting', sort = 'oldest', search = '', page = 0 }) {
  const from = page * MCA_PAGE_SIZE;
  const { data, error, count } = await listQuery({ filters, stage, sort, search }, LIST_COLUMNS, { count: 'exact' }).range(
    from,
    from + MCA_PAGE_SIZE - 1
  );
  if (error) throw explainQueryError(error);
  return { rows: data || [], total: count || 0 };
}

const CSV_FIELDS = [
  ['student_name', 'Student'],
  ['admission_number', 'Admission no.'],
  ['school', 'School'],
  ['education_level', 'Education level'],
  ['ward', 'Ward'],
  ['location', 'Chief location'],
  ['polling_station', 'Polling station'],
  ['cycle', 'Cycle'],
  ['mca_stage', 'MCA stage'],
  ['amount_requested', 'Requested (KES)'],
  ['amount_allocated', 'Allocated (KES)'],
  ['chief_approved_at', 'Chief approved'],
  ['mca_decided_at', 'MCA decided']
];

function csvCell(input) {
  if (input === null || input === undefined) return '';
  const text = String(input);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function exportMcaApplications({ filters, stage, sort, search }) {
  const { data, error } = await listQuery({ filters, stage, sort, search }, LIST_COLUMNS).range(0, EXPORT_LIMIT - 1);
  if (error) throw explainQueryError(error);
  const lines = [CSV_FIELDS.map(([, label]) => label).join(',')];
  for (const row of data || []) {
    lines.push(CSV_FIELDS.map(([key]) => csvCell(row[key])).join(','));
  }
  return { csv: lines.join('\n'), rows: data?.length || 0, capped: (data?.length || 0) >= EXPORT_LIMIT };
}

export async function fetchMcaApplication(applicationId) {
  const { data: row, error } = await supabase
    .from('mca_application_facts')
    .select(`${LIST_COLUMNS}, student_profile_id, sub_location, chief_name, submitted_at, mca_note`)
    .eq('id', applicationId)
    .single();
  if (error) throw explainQueryError(error);

  const [documentsRes, guardiansRes] = await Promise.all([
    supabase
      .from('student_documents')
      .select('id, document_type, verification_status, ai_verified, storage_path, uploaded_at')
      .eq('student_profile_id', row.student_profile_id)
      .order('uploaded_at', { ascending: false })
      .limit(50),
    supabase
      .from('student_guardians')
      .select('id, full_name, phone_number, relationship')
      .eq('student_profile_id', row.student_profile_id)
      .limit(5)
  ]);
  if (documentsRes.error) throw explainQueryError(documentsRes.error);
  if (guardiansRes.error) throw explainQueryError(guardiansRes.error);

  const latestByType = new Map();
  for (const document of documentsRes.data || []) {
    if (!latestByType.has(document.document_type)) latestByType.set(document.document_type, document);
  }

  return { application: row, documents: [...latestByType.values()], guardians: guardiansRes.data || [] };
}

export async function openMcaDocument(storagePath) {
  return getDocumentSignedUrl(storagePath);
}

export async function mcaDecide(applicationId, action, { amount, note } = {}) {
  const { data, error } = await supabase.rpc('mca_decide', {
    p_application_id: applicationId,
    p_action: action,
    p_amount: action === 'approve' ? Number(amount) : null,
    p_note: note || null
  });
  if (error) throw explainQueryError(error);
  return data;
}

export async function fetchMcaProfile(userId) {
  const { data, error } = await supabase
    .from('mca_profiles')
    .select('auth_user_id, full_name, email, phone_number, constituency, wards, updated_at')
    .eq('auth_user_id', userId)
    .maybeSingle();
  if (error) throw explainQueryError(error);
  return data;
}

export async function updateMcaPhone(userId, phoneNumber) {
  const { error } = await supabase
    .from('mca_profiles')
    .update({ phone_number: phoneNumber.trim(), updated_at: new Date().toISOString() })
    .eq('auth_user_id', userId);
  if (error) throw explainQueryError(error);
}
