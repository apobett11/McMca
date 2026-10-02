import { MAX_LINKED_PARENTS, PARENT_CONTROL, STUDENT_CLASS } from './constants.js';
import { normalizeNationalId } from './validation.js';

export function getParentControlMode(studentClass) {
  if (studentClass === STUDENT_CLASS.CUSTODY) return PARENT_CONTROL.FULL_CONTROL;
  if (studentClass === STUDENT_CLASS.DELEGATED) return PARENT_CONTROL.OVERLAY_CONTROL;
  if (studentClass === STUDENT_CLASS.INDEPENDENT) return PARENT_CONTROL.LINKED_OVERVIEW;
  return PARENT_CONTROL.NONE;
}

export function describeParentControl(mode) {
  if (mode === PARENT_CONTROL.FULL_CONTROL) {
    return 'Full control — the parent applies, updates documents, and operates this account.';
  }
  if (mode === PARENT_CONTROL.OVERLAY_CONTROL) {
    return 'Delegated — the student operates the dashboard; the parent can view everything and retain control.';
  }
  if (mode === PARENT_CONTROL.LINKED_OVERVIEW) {
    return 'Linked overview — the parent sees applications and status for this independent student.';
  }
  return 'No parent control.';
}

export function canParentManageStudent(studentClass) {
  const mode = getParentControlMode(studentClass);
  return mode === PARENT_CONTROL.FULL_CONTROL || mode === PARENT_CONTROL.OVERLAY_CONTROL;
}

export function canParentApplyForStudent(studentClass) {
  return studentClass === STUDENT_CLASS.CUSTODY || studentClass === STUDENT_CLASS.DELEGATED;
}

/** Autonomous: independent students must link one or two parents by national ID. */
export function evaluateParentLinkSlots(existingLinks = []) {
  const count = existingLinks.length;
  return {
    linked: count,
    remaining: Math.max(0, MAX_LINKED_PARENTS - count),
    canAdd: count < MAX_LINKED_PARENTS,
    complete: count >= 1,
    maxed: count >= MAX_LINKED_PARENTS
  };
}

export function buildPendingParentIdentity({ studentProfileId, parent }) {
  const nationalId = normalizeNationalId(parent.nationalId);
  return {
    student_profile_id: studentProfileId,
    parent_national_id: nationalId,
    parent_first_name: parent.firstName?.trim(),
    parent_middle_name: parent.middleName?.trim() || null,
    parent_last_name: parent.lastName?.trim(),
    parent_phone: parent.phone?.trim() || null,
    relationship: parent.relationship,
    verification_status: parent.verified ? 'verified' : 'pending'
  };
}

/**
 * Autonomous: when a parent account becomes active, attach any independent students
 * who already submitted this national ID, and any pending identity rows.
 */
export function planParentActivationLinks({ parentNationalId, pendingIdentities = [], independentStudents = [] }) {
  const id = normalizeNationalId(parentNationalId);
  if (!id) return { links: [], unmatched: true };

  const fromPending = pendingIdentities.filter(
    (row) => normalizeNationalId(row.parent_national_id) === id
  );
  const fromIndependent = independentStudents.filter(
    (row) => normalizeNationalId(row.linked_parent_national_id || row.parent_national_id) === id
  );

  const seen = new Set();
  const links = [];
  for (const row of [...fromPending, ...fromIndependent]) {
    const studentId = row.student_profile_id || row.id;
    if (!studentId || seen.has(studentId)) continue;
    seen.add(studentId);
    links.push({
      student_profile_id: studentId,
      relationship: row.relationship || null,
      can_view: true,
      can_manage: false
    });
  }
  return { links, unmatched: links.length === 0 };
}

export function planLinkPermissions(studentClass) {
  const mode = getParentControlMode(studentClass);
  return {
    can_view: true,
    can_manage: mode === PARENT_CONTROL.FULL_CONTROL || mode === PARENT_CONTROL.OVERLAY_CONTROL
  };
}
