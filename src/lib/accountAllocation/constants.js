/** Account allocation algorithm — shared constants. Each module reads these; none mutate them. */

export const STUDENT_CLASS = Object.freeze({
  INDEPENDENT: 'independent',
  DELEGATED: 'delegated',
  CUSTODY: 'custody'
});

export const STUDENT_TYPE_CODE = Object.freeze({
  [STUDENT_CLASS.INDEPENDENT]: 'IND',
  [STUDENT_CLASS.DELEGATED]: 'DEL',
  [STUDENT_CLASS.CUSTODY]: 'CUS'
});

export const ACCOUNT_STATUS = Object.freeze({
  PENDING: 'pending',
  VERIFYING: 'verifying',
  ACTIVE: 'active',
  BLOCKED: 'blocked'
});

export const EDUCATION_LEVEL = Object.freeze({
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  TERTIARY: 'tertiary'
});

export const EDUCATION_LEVEL_LABEL = Object.freeze({
  [EDUCATION_LEVEL.PRIMARY]: 'Primary school',
  [EDUCATION_LEVEL.SECONDARY]: 'Secondary / high school',
  [EDUCATION_LEVEL.TERTIARY]: 'Tertiary (college, TVET or university)'
});

export const ACCOUNT_ROLE = Object.freeze({
  STUDENT: 'student',
  PARENT: 'parent'
});

export const DOCUMENT_KIND = Object.freeze({
  NATIONAL_ID_FRONT: 'national_id_front',
  NATIONAL_ID_BACK: 'national_id_back',
  NATIONAL_ID_PHOTO: 'national_id_photo',
  BIRTH_CERTIFICATE: 'birth_certificate',
  PORTRAIT: 'portrait',
  PARENT_ID_FRONT: 'parent_id_front',
  PARENT_ID_BACK: 'parent_id_back'
});

export const DOCUMENT_STATUS = Object.freeze({
  MISSING: 'missing',
  UPLOADED: 'uploaded',
  QUALITY_FAILED: 'quality_failed',
  MATCH_FAILED: 'match_failed',
  PENDING_REVIEW: 'pending_review',
  VERIFIED: 'verified',
  REJECTED: 'rejected'
});

export const PARENT_CONTROL = Object.freeze({
  NONE: 'none',
  LINKED_OVERVIEW: 'linked_overview',
  OVERLAY_CONTROL: 'overlay_control',
  FULL_CONTROL: 'full_control'
});

export const RELATIONSHIP = Object.freeze({
  MOTHER: 'mother',
  FATHER: 'father',
  GUARDIAN: 'guardian'
});

export const INDEPENDENT_MIN_AGE = 18;
export const MAX_LINKED_PARENTS = 2;
export const MIN_ID_IMAGE_WIDTH = 640;
export const MIN_ID_IMAGE_HEIGHT = 400;
export const MIN_ID_FILE_BYTES = 20 * 1024;
export const MAX_ID_FILE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_ID_MIME = Object.freeze(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);

export const WIZARD_FLOW = Object.freeze({
  REGISTER_INDEPENDENT: 'register_independent',
  REGISTER_PARENT: 'register_parent',
  STUDENT_LINK_PARENTS: 'student_link_parents',
  PARENT_ADD_CHILD: 'parent_add_child',
  CHILD_PROFILE: 'child_profile',
  APPLICATION: 'application',
  DASHBOARD_STUDENT: 'dashboard_student',
  DASHBOARD_PARENT: 'dashboard_parent'
});

export const CACHE_PREFIX = 'mcmca.wizard';
export const FILE_CACHE_DB = 'mcmca-wizard-files';
export const FILE_CACHE_STORE = 'files';
