import { ACCOUNT_ROLE, ACCOUNT_STATUS, STUDENT_CLASS } from './constants.js';
import { canSelfRegisterAsIndependent } from './eligibility.js';
import { inspectDocumentInventory } from './documentInventory.js';
import { getActivationDocumentRequirements, listRequiredKinds } from './documentRequirements.js';

function blocked(reason, extras = {}) {
  return { status: ACCOUNT_STATUS.PENDING, canActivate: false, reason, ...extras };
}

/** Autonomous: decide whether an account may move to active, from documents + identity only. */
export function evaluateAccountActivation({
  role,
  studentClass,
  dateOfBirth,
  nationalId,
  nationalIdVerified,
  documents = [],
  identityMatchOk = false
}) {
  if (role === ACCOUNT_ROLE.STUDENT && studentClass === STUDENT_CLASS.INDEPENDENT) {
    const eligibility = canSelfRegisterAsIndependent({ dateOfBirth, nationalId });
    if (!eligibility.allowed) return blocked(eligibility.reason);
  }

  if (role === ACCOUNT_ROLE.PARENT && !String(nationalId || '').trim()) {
    return blocked('A parent account requires a national ID.');
  }

  const required = listRequiredKinds(getActivationDocumentRequirements(role));
  const inventory = inspectDocumentInventory({ requiredKinds: required, documents });
  if (!inventory.complete) {
    return blocked('Upload a clear photo of the identification card to finish registration.', { inventory });
  }

  const verified = nationalIdVerified || identityMatchOk || inventory.allVerified;
  if (!verified) {
    return {
      status: ACCOUNT_STATUS.VERIFYING,
      canActivate: false,
      reason: 'The identification card must match the registered name and ID number.',
      inventory
    };
  }

  return {
    status: ACCOUNT_STATUS.ACTIVE,
    canActivate: true,
    reason: null,
    inventory
  };
}

/** Autonomous: map stored flags to a public account status. */
export function readAccountStatus({ isActive, accountStatus, nationalIdVerified, blocked: isBlocked }) {
  if (isBlocked || accountStatus === ACCOUNT_STATUS.BLOCKED) return ACCOUNT_STATUS.BLOCKED;
  if (accountStatus) return accountStatus;
  if (isActive && nationalIdVerified) return ACCOUNT_STATUS.ACTIVE;
  if (nationalIdVerified) return ACCOUNT_STATUS.VERIFYING;
  return ACCOUNT_STATUS.PENDING;
}

export function isAccountActive(status) {
  return status === ACCOUNT_STATUS.ACTIVE;
}
