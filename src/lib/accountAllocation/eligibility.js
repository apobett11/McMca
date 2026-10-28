import { INDEPENDENT_MIN_AGE, STUDENT_CLASS } from './constants.js';

/** Autonomous: compute age in full years from an ISO date of birth. */
export function computeAgeYears(dateOfBirth, now = new Date()) {
  if (!dateOfBirth) return null;
  const born = new Date(dateOfBirth);
  if (Number.isNaN(born.getTime())) return null;
  let age = now.getFullYear() - born.getFullYear();
  const monthDelta = now.getMonth() - born.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < born.getDate())) {
    age -= 1;
  }
  return age;
}

/** Autonomous: independent self-registration is only allowed at 18+ with a national ID. */
export function canSelfRegisterAsIndependent({ dateOfBirth, nationalId }) {
  const age = computeAgeYears(dateOfBirth);
  const hasId = Boolean(String(nationalId || '').trim());
  if (age === null) {
    return { allowed: false, reason: 'Enter a valid date of birth.' };
  }
  if (age < INDEPENDENT_MIN_AGE) {
    return {
      allowed: false,
      reason: 'You must be 18 or older to create a student account. A parent can create one for a younger student.'
    };
  }
  if (!hasId) {
    return {
      allowed: false,
      reason: 'Enter your national ID number.'
    };
  }
  return { allowed: true, age };
}

/** Autonomous: under-18 students never receive a self-serve student registration path. */
export function mustBeRegisteredByParent(dateOfBirth) {
  const age = computeAgeYears(dateOfBirth);
  return age !== null && age < INDEPENDENT_MIN_AGE;
}

/** Autonomous: custody students never log into the student dashboard. */
export function canStudentLogin(studentClass) {
  return (
    studentClass === STUDENT_CLASS.INDEPENDENT ||
    studentClass === 'independent' ||
    studentClass === 'IND' ||
    studentClass === STUDENT_CLASS.DELEGATED ||
    studentClass === 'delegated' ||
    studentClass === 'DEL'
  );
}

export function isCustodyStudent(studentClass) {
  const c = String(studentClass || '').trim().toLowerCase();
  return c === STUDENT_CLASS.CUSTODY || c === 'custody' || c === 'cus';
}

export function isIndependentStudent(studentClass) {
  const c = String(studentClass || '').trim().toLowerCase();
  return c === STUDENT_CLASS.INDEPENDENT || c === 'independent' || c === 'ind';
}

export function isDelegatedStudent(studentClass) {
  const c = String(studentClass || '').trim().toLowerCase();
  return c === STUDENT_CLASS.DELEGATED || c === 'delegated' || c === 'del';
}

/** Check if delegated student profile has all required details finalized. */
export function isDelegatedSetupComplete(profile) {
  if (!profile) return false;
  const hasName = Boolean(profile.first_name?.trim() && profile.last_name?.trim());
  const hasEmail = Boolean(profile.email?.trim());
  const hasSchool = Boolean(
    profile.school_name?.trim() ||
    profile.institution_name?.trim() ||
    profile.admission_number?.trim() ||
    profile.school_level ||
    profile.institution_level
  );
  const notBlocked = profile.account_status !== 'blocked';
  return Boolean(hasName && hasEmail && hasSchool && notBlocked);
}
