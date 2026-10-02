/**
 * Account allocation / onboarding algorithm — public surface.
 * Student class, activation, parent linking, and wizard progress live here.
 * Pixel inspection, OCR, and persist permission live in documentUpload.
 * Onboarding may call documentUpload. documentUpload never calls onboarding.
 */
export * from './constants.js';
export * from './eligibility.js';
export * from './allocateCategory.js';
export * from './documentRequirements.js';
export * from './documentInventory.js';
export * from './documentQuality.js';
export * from './identityMatch.js';
export * from './accountStatus.js';
export * from './activateAccount.js';
export * from './parentLinking.js';
export * from './applicationGate.js';
export * from './validation.js';
export * from './wizardCache.js';
export * from './wizardFlows.js';
