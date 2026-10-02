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
      reason: 'Students under 18 cannot register themselves. A parent must register them from the parent dashboard.'
    };
  }
  if (!hasId) {
    return {
      allowed: false,
      reason: 'Independent students must have a national ID. Registration cannot continue without one.'
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
  return studentClass === STUDENT_CLASS.INDEPENDENT || studentClass === STUDENT_CLASS.DELEGATED;
}
