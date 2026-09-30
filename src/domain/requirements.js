/**
 * Bursary rules shared by every student. Nothing here is a person,
 * a school, or a phone number — those always come from that student's row.
 */

export const DOCUMENT_REQUIREMENTS = [
  {
    key: 'student-id',
    label: 'Student ID',
    scope: 'profile',
    hint: 'Photo or scan of the national ID or birth certificate.',
    activatesProfile: true
  },
  {
    key: 'guardian-id',
    label: 'Parent ID',
    scope: 'profile',
    hint: 'Photo or scan of one parent or guardian ID.',
    activatesProfile: true
  },
  {
    key: 'fee-structure',
    label: 'Fee structure',
    scope: 'application',
    hint: 'Current fee breakdown from the school.',
    requiredToApply: true
  },
  {
    key: 'admission',
    label: 'Admission letter',
    scope: 'application',
    hint: 'Proof of enrollment for this cycle.',
    requiredToApply: true
  }
];

const ACCEPTED = new Set(['inline_passed', 'verified']);
const OPEN_APPLICATION = new Set([
  'pending',
  'submitted',
  'under_review',
  'chief_approved',
  'mca_review',
  'approved'
]);

export function normalizeStatus(status) {
  return String(status || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

export function documentState(row) {
  if (!row) return 'missing';
  if (row.verification_status === 'verified' || row.ai_verified === true) return 'verified';
  if (row.verification_status === 'rejected') return 'rejected';
  if (ACCEPTED.has(row.verification_status)) return 'inline_passed';
  return 'missing';
}

export function isAcceptedDocument(row) {
  const state = documentState(row);
  return state === 'verified' || state === 'inline_passed';
}

export function isLockedDocument(row) {
  return documentState(row) === 'verified';
}

function latestDocument(documents, key, guardianId) {
  const rows = (documents || []).filter((row) => {
    if (row.document_type !== key) return false;
    if (guardianId && row.guardian_id !== guardianId) return false;
    return true;
  });
  rows.sort((a, b) => new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0));
  return rows[0] || null;
}

export function isPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 9 && digits.length <= 15;
}

export function inferBursaryCycle(date = new Date()) {
  const start = date.getMonth() >= 6 ? date.getFullYear() : date.getFullYear() - 1;
  return `${start}/${start + 1}`;
}

export function trackingCode(application) {
  if (!application?.id) return '';
  const year = String(application.cycle || inferBursaryCycle()).slice(0, 4);
  const token = String(application.id).replace(/-/g, '').slice(0, 8).toUpperCase();
  return `${year}-${token}`;
}

function guardianReady(guardian, documents) {
  if (!guardian?.full_name?.trim() || !isPhone(guardian.phone_number)) return false;
  return isAcceptedDocument(latestDocument(documents, 'guardian-id', guardian.id));
}

export function evaluateCase({ guardians = [], documents = [], applications = [] } = {}) {
  const studentId = latestDocument(documents, 'student-id');
  const readyGuardians = guardians.filter((guardian) => guardianReady(guardian, documents));
  const profileMissing = [];

  if (!isAcceptedDocument(studentId)) {
    profileMissing.push({
      key: 'student-id',
      label: 'Student ID',
      hint: 'Scan or photograph the student ID.'
    });
  }
  if (!readyGuardians.length) {
    profileMissing.push({
      key: 'guardian',
      label: 'Parent',
      hint: 'Add one parent and their ID scan.'
    });
  }

  const profile = {
    active: profileMissing.length === 0,
    hasStudentId: isAcceptedDocument(studentId),
    studentIdLocked: isLockedDocument(studentId),
    guardianCount: guardians.length,
    guardiansReady: readyGuardians.length,
    missing: profileMissing
  };

  const checklist = DOCUMENT_REQUIREMENTS.map((requirement) => {
    let document = null;
    if (requirement.key === 'guardian-id') {
      document = readyGuardians.length
        ? latestDocument(documents, 'guardian-id', readyGuardians[0].id)
        : latestDocument(documents, 'guardian-id');
    } else {
      document = latestDocument(documents, requirement.key);
    }
    const state = documentState(document);
    const satisfied = state === 'verified' || state === 'inline_passed';
    return {
      ...requirement,
      state,
      satisfied,
      locked: state === 'verified',
      document
    };
  });

  const applicationNeeds = checklist.filter((item) => item.requiredToApply && !item.satisfied);
  const openApplication =
    applications.find((row) => OPEN_APPLICATION.has(normalizeStatus(row.application_status))) || null;

  let blockReason = null;
  if (!profile.active) {
    blockReason = 'The profile is inactive until the student ID and one parent are on file.';
  } else if (applicationNeeds.length) {
    blockReason = 'Upload every document on the checklist before applying.';
  } else if (openApplication) {
    blockReason = 'An application is already open.';
  }

  const canApply = !blockReason;

  let next = { title: 'Open applications', route: '/student/applications', icon: 'applications' };
  if (!profile.active) {
    next = { title: 'Activate profile', route: '/student/profile', icon: 'profile' };
  } else if (applicationNeeds.length) {
    next = { title: 'Upload documents', route: '/student/documents', icon: 'upload' };
  } else if (canApply) {
    next = { title: 'Apply', route: '/student/new-application', icon: 'arrowRight' };
  } else if (openApplication && normalizeStatus(openApplication.application_status) === 'pending') {
    next = { title: 'With the chief', route: '/student/applications', icon: 'shield' };
  }

  const gates = [
    profile.hasStudentId,
    profile.guardiansReady > 0,
    ...checklist.filter((item) => item.requiredToApply).map((item) => item.satisfied)
  ];
  const readiness = Math.round((gates.filter(Boolean).length / gates.length) * 100);

  return {
    profile,
    checklist,
    applicationNeeds,
    openApplication,
    canApply,
    blockReason,
    next,
    readiness
  };
}

export function applicationSteps(evaluation, application) {
  const status = normalizeStatus(application?.application_status);
  const profileDone = evaluation?.profile?.active;
  const docsDone = (evaluation?.checklist || [])
    .filter((item) => item.requiredToApply)
    .every((item) => item.satisfied);
  const sent = Boolean(application) && status && status !== 'draft';
  const withChief = status === 'pending';
  const pastChief = ['chief_approved', 'mca_review', 'approved', 'rejected', 'funds_sent', 'disbursed'].includes(
    status
  );
  const decided = ['approved', 'rejected', 'funds_sent', 'disbursed'].includes(status);

  function state(done, current) {
    if (done) return 'completed';
    if (current) return 'current';
    return 'pending';
  }

  return [
    { label: 'Profile', state: state(profileDone, !profileDone) },
    { label: 'Documents', state: state(docsDone, profileDone && !docsDone) },
    { label: 'Chief', state: state(pastChief, withChief || (sent && !pastChief && docsDone)) },
    { label: 'Decision', state: state(decided, pastChief && !decided) }
  ];
}
