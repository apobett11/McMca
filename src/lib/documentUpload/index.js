/**
 * Document upload algorithm.
 * Owns: photo specifications, on-the-spot OCR, cross-check against typed form data,
 * and the permission to persist a file.
 *
 * Does not own: account creation, student class, parent linking, or activation.
 * The onboarding algorithm calls this one. This one never calls onboarding.
 */
export * from './constants.js';
export * from './specifications.js';
export * from './ocrExtract.js';
export * from './crossCheck.js';
export * from './verifyUpload.js';
