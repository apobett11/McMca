/**
 * Strict TypeScript mirrors of the database schema
 * (sql/bootstrap_public.sql + sql/budget_tranches.sql) and the view-models the
 * workspaces build on top of them.
 */

export type Uuid = string;
export type IsoDateTime = string;

/* ───────────────────────── Database rows ───────────────────────── */

export type StudentTypeCode = 'IND' | 'DEL' | 'CUS';
export type ApplicationStatusType =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'appealed'
  | 'disbursed';
export type ApprovalStatusType = 'pending' | 'approved' | 'rejected';

export interface StudentProfile {
  id: Uuid;
  auth_user_id: Uuid | null;
  student_type: StudentTypeCode;
  admission_number: string | null;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  gender: string | null;
  date_of_birth: string;
  national_id: string | null;
  birth_certificate_number: string | null;
  email: string | null;
  phone_number: string | null;
  national_id_verified: boolean;
  school_name: string | null;
  school_level: string | null;
  institution_code: string | null;
  county: string | null;
  ward: string | null;
  location_name: string | null;
  profile_photo_url: string | null;
  account_class: string | null;
  account_status: string | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export interface StudentApplication {
  id: Uuid;
  student_profile_id: Uuid;
  application_window_id: Uuid;
  application_status: ApplicationStatusType;
  institution_name: string | null;
  institution_level: string | null;
  fee_balance: number | null;
  requested_amount: number | null;
  allocated_amount: number | null;
  chief_approval_status: ApprovalStatusType;
  mca_approval_status: ApprovalStatusType;
  appeal_status: string | null;
  readiness_score: number | null;
  submitted_at: IsoDateTime | null;
  approved_at: IsoDateTime | null;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

export type DocumentVerificationStatus =
  | 'uploaded'
  | 'verified'
  | 'manual_override'
  | 'rejected'
  | 'rescan_queued';

export interface IdentityDocument {
  id: Uuid;
  owner_type: string;
  owner_id: Uuid;
  student_profile_id: Uuid | null;
  document_kind: string;
  bucket_name: string;
  storage_path: string;
  original_filename: string | null;
  mime_type: string | null;
  file_size: number | null;
  verification_status: DocumentVerificationStatus;
  matched_name: string | null;
  matched_id_number: string | null;
  readability_passed: boolean;
  visibility_passed: boolean;
  quality_notes: Record<string, unknown> | null;
  uploaded_by: Uuid | null;
  uploaded_at: IsoDateTime;
}

/** New table: see sql/budget_tranches.sql */
export interface BudgetTranche {
  id: Uuid;
  academic_cycle: string;
  title: string;
  total_amount: number;
  committed_amount: number;
  hard_cap_amount: number;
  reserve_amount: number;
  reserve_committed: number;
  warn_threshold_pct: number;
  min_sublocation_share_pct: number;
  is_active: boolean;
  created_at: IsoDateTime;
  updated_at: IsoDateTime;
}

/* ───────────────────────── View-models ───────────────────────── */

export type Tone = 'neutral' | 'accent' | 'emerald' | 'cyan' | 'amber' | 'red' | 'violet' | 'gold';

export type IssueFlag =
  | 'NEMIS Mismatch'
  | 'Blurry BC'
  | 'Stamp Missing'
  | 'Oversize File'
  | 'Corrupt PDF'
  | 'Guardian Match Pending'
  | 'Inactive';

export interface StuckRegistration {
  id: string;
  name: string;
  nationalId: string;
  school: string;
  subLocation: string;
  phone: string;
  stepsDone: number;
  totalSteps: number;
  hangingStepLabel: string;
  lastActiveIso: IsoDateTime;
  stallMs: number;
  issue: IssueFlag;
  reminded: boolean;
}

export type DocQueueFilter = 'all' | 'failed_ocr' | 'hanging' | 'stamp_missing';

export type FieldState = 'match' | 'discrepancy' | 'missing';

export interface ExtractedField {
  key: string;
  label: string;
  expected: string;
  extracted: string | null;
  state: FieldState;
  /** Levenshtein edit distance between extracted and expected (null when unextracted) */
  distance: number | null;
}

export interface QualityFlag {
  key: string;
  label: string;
  pass: boolean;
  detail: string;
}

export interface FlaggedUpload {
  id: string;
  applicantName: string;
  nationalId: string;
  phone: string;
  location: string;
  documentType: string;
  fileName: string;
  fileSize: string;
  uploadedAt: IsoDateTime;
  failureReason: string;
  status: string;
  reuploadRequested: boolean;
  ocrConfidence: number;
  blurPct: number;
  stampConfidence: number;
  categories: DocQueueFilter[];
  verification: DocumentVerificationStatus;
  previewUrl?: string;
}

export type AccountClass = 'IND' | 'DEL' | 'CUS';

export interface RegistryRow {
  id: string;
  serial: string;
  name: string;
  initials: string;
  photoUrl?: string;
  grade: string;
  level: string;
  nationalId: string;
  birthCert: string;
  upi: string;
  guardianName: string;
  guardianPhone: string;
  relationship: string;
  school: string;
  requestedKes: number;
  chiefStatus: 'Approved' | 'Rejected' | 'Under Review' | 'Proceeded to MCA Direct';
  accountClass: AccountClass;
  subLocation: string;
  submittedAt: IsoDateTime;
  chiefReason: string;
  riskFlag: string;
  notes: string;
  sentToMca: boolean;
}

export interface LedgerEntry {
  id: string;
  ts: IsoDateTime;
  actor: string;
  workspace: 'helpdesk' | 'mca';
  kind: string;
  target: string;
  targetLabel: string;
  detail: string;
  prevHash: string;
  hash: string;
}

export interface SearchHit {
  id: string;
  title: string;
  subtitle: string;
  kind: string;
  to: string;
}

export interface AlertItem {
  id: string;
  tone: Tone;
  title: string;
  body: string;
  at: IsoDateTime;
  to?: string;
}

/* ───────────────────────── MCA view-models ───────────────────────── */

export type CommitteeState = 'awaiting' | 'approved' | 'locked' | 'chief_rejected';

export interface AwardRow {
  id: string;
  serial: string;
  name: string;
  subLocation: string;
  pollingStation: string;
  school: string;
  course: string;
  level: string;
  feeBalance: number;
  needScore: number;
  needLabel: 'Extreme Need' | 'High Need' | 'Moderate Need';
  requested: number;
  chiefRecommended: number;
  proposed: number;
  state: CommitteeState;
  justification: string;
  appealable: boolean;
  chiefReason: string;
  parentName: string;
  phone: string;
  admissionNo: string;
}

export type ManifestStatus = 'Draft' | 'Cheque Drawn' | 'EFT Dispatched';

export interface InstitutionPayable {
  code: string;
  name: string;
  bank: string;
  branch: string;
  accountNo: string;
  accountVerified: boolean;
  status: ManifestStatus;
  roster: { id: string; name: string; admissionNo: string; award: number }[];
  total: number;
}
