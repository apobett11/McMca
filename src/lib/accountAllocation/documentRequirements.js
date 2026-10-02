import { ACCOUNT_ROLE, DOCUMENT_KIND, STUDENT_CLASS } from './constants.js';

function req(kind, { sides = 1, label, required = true } = {}) {
  return { kind, sides, label, required };
}

/** Autonomous: documents required to activate a parent or independent student account. */
export function getActivationDocumentRequirements(role) {
  if (role === ACCOUNT_ROLE.PARENT || role === ACCOUNT_ROLE.STUDENT) {
    return [
      req(DOCUMENT_KIND.NATIONAL_ID_FRONT, { label: 'Front of ID' }),
      req(DOCUMENT_KIND.NATIONAL_ID_BACK, { label: 'Back of ID' })
    ];
  }
  return [];
}

/** Autonomous: documents an independent student must supply when linking a parent. */
export function getParentLinkDocumentRequirements() {
  return [
    req(DOCUMENT_KIND.PARENT_ID_FRONT, { label: 'Front of parent national ID' }),
    req(DOCUMENT_KIND.PARENT_ID_BACK, { label: 'Back of parent national ID' })
  ];
}

/** Autonomous: documents a parent must supply when adding a child. */
export function getAddChildDocumentRequirements() {
  return [
    req(DOCUMENT_KIND.BIRTH_CERTIFICATE, { label: 'Clear photo of birth certificate' })
  ];
}

/** Autonomous: documents that must exist and be verified before an application can submit. */
export function getApplicationDocumentRequirements(studentClass) {
  const shared = [
    req(DOCUMENT_KIND.BIRTH_CERTIFICATE, {
      label: 'Birth certificate',
      required: studentClass !== STUDENT_CLASS.INDEPENDENT
    })
  ];
  if (studentClass === STUDENT_CLASS.INDEPENDENT) {
    return [
      req(DOCUMENT_KIND.NATIONAL_ID_PHOTO, { label: 'Student national ID' }),
      ...shared.filter((d) => d.required)
    ];
  }
  return shared;
}

export function listRequiredKinds(requirements) {
  return requirements.filter((r) => r.required).map((r) => r.kind);
}
