import { ACCOUNT_STATUS } from './constants.js';
import { inspectDocumentInventory } from './documentInventory.js';
import { getApplicationDocumentRequirements, listRequiredKinds } from './documentRequirements.js';

/** Autonomous: an application cannot submit until the account is active and required documents are verified. */
export function evaluateApplicationReadiness({
  accountStatus,
  studentClass,
  documents = [],
  formComplete = false,
  parentLinksComplete = true
}) {
  if (accountStatus !== ACCOUNT_STATUS.ACTIVE) {
    return {
      ready: false,
      reason: 'The account must be active before an application can be submitted.'
    };
  }
  if (!parentLinksComplete) {
    return {
      ready: false,
      reason: 'Link at least one verified parent before submitting an application.'
    };
  }
  if (!formComplete) {
    return {
      ready: false,
      reason: 'Finish every application form step before submitting.'
    };
  }
  const required = listRequiredKinds(getApplicationDocumentRequirements(studentClass));
  const inventory = inspectDocumentInventory({ requiredKinds: required, documents });
  if (!inventory.allVerified && required.length > 0) {
    if (!inventory.complete) {
      return {
        ready: false,
        reason: 'Upload every required document before submitting.',
        inventory
      };
    }
    return {
      ready: false,
      reason: 'Every required document must be verified before submitting.',
      inventory
    };
  }
  return { ready: true, inventory };
}
