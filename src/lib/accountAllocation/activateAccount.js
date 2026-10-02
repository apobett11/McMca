import { ACCOUNT_STATUS } from './constants.js';
import { evaluateAccountActivation } from './accountStatus.js';

/**
 * Autonomous: activate an account only when the evaluation says it may.
 * Student class is never written here.
 */
export function planAccountActivation(input) {
  const evaluation = evaluateAccountActivation(input);
  if (!evaluation.canActivate) {
    return {
      ok: false,
      nextStatus: evaluation.status,
      reason: evaluation.reason,
      evaluation
    };
  }
  return {
    ok: true,
    nextStatus: ACCOUNT_STATUS.ACTIVE,
    patch: {
      account_status: ACCOUNT_STATUS.ACTIVE,
      is_active: true,
      national_id_verified: true
    },
    evaluation
  };
}

/** Autonomous: admin-only status changes. Ordinary flows must not call this. */
export function planAdminStatusChange({ nextStatus, reason, isAdmin }) {
  if (!isAdmin) {
    return { ok: false, reason: 'Only an administrator can override account status.' };
  }
  const allowed = Object.values(ACCOUNT_STATUS);
  if (!allowed.includes(nextStatus)) {
    return { ok: false, reason: 'Unknown account status.' };
  }
  if (!reason || !String(reason).trim()) {
    return { ok: false, reason: 'Administrator must record a reason.' };
  }
  return {
    ok: true,
    patch: {
      account_status: nextStatus,
      is_active: nextStatus === ACCOUNT_STATUS.ACTIVE
    }
  };
}
