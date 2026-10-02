import { EDUCATION_LEVEL, STUDENT_CLASS, STUDENT_TYPE_CODE } from './constants.js';

const LEVEL_TO_CLASS = Object.freeze({
  [EDUCATION_LEVEL.PRIMARY]: STUDENT_CLASS.CUSTODY,
  [EDUCATION_LEVEL.SECONDARY]: STUDENT_CLASS.CUSTODY,
  [EDUCATION_LEVEL.TERTIARY]: STUDENT_CLASS.DELEGATED
});

/** Autonomous: map an education level to custody or delegated. Never used for independent students. */
export function allocateStudentClassFromEducation(educationLevel) {
  const studentClass = LEVEL_TO_CLASS[educationLevel];
  if (!studentClass) {
    return {
      ok: false,
      reason: 'Select primary school, secondary / high school, or tertiary.'
    };
  }
  return {
    ok: true,
    studentClass,
    studentTypeCode: STUDENT_TYPE_CODE[studentClass],
    parentCreated: true,
    delegatedAccess: studentClass === STUDENT_CLASS.DELEGATED,
    locked: true
  };
}

/** Autonomous: independent class is assigned only at self-registration, never by education level. */
export function allocateIndependentClass() {
  return {
    ok: true,
    studentClass: STUDENT_CLASS.INDEPENDENT,
    studentTypeCode: STUDENT_TYPE_CODE[STUDENT_CLASS.INDEPENDENT],
    parentCreated: false,
    delegatedAccess: false,
    locked: true
  };
}

/**
 * Autonomous: student class never changes after allocation unless an admin explicitly overrides.
 * Ordinary flows must call this before writing a class update.
 */
export function assertClassChangeAllowed({ currentClass, nextClass, isAdmin, reason }) {
  if (!currentClass) {
    return { allowed: true };
  }
  if (currentClass === nextClass) {
    return { allowed: true, unchanged: true };
  }
  if (!isAdmin) {
    return {
      allowed: false,
      reason: 'Student category is locked. Only an administrator can change it.'
    };
  }
  if (!reason || !String(reason).trim()) {
    return {
      allowed: false,
      reason: 'Administrator must record a reason when changing student category.'
    };
  }
  return { allowed: true, adminOverride: true };
}

export function describeAllocatedClass(studentClass) {
  if (studentClass === STUDENT_CLASS.CUSTODY) {
    return 'Custody — parent has full control of this student account.';
  }
  if (studentClass === STUDENT_CLASS.DELEGATED) {
    return 'Delegated — student operates their own dashboard; parent keeps overlay control.';
  }
  if (studentClass === STUDENT_CLASS.INDEPENDENT) {
    return 'Independent — student registered themselves and operates their dashboard.';
  }
  return 'Unknown category.';
}
