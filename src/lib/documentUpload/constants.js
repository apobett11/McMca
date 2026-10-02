/** Document upload algorithm — owns photo specs, OCR, and persist permission. */

export const UPLOAD_KIND = Object.freeze({
  IDENTITY_FRONT: 'identity_front',
  IDENTITY_BACK: 'identity_back',
  BIRTH_CERTIFICATE: 'birth_certificate',
  GENERIC_IMAGE: 'generic_image',
  PDF: 'pdf'
});

export const UPLOAD_STATUS = Object.freeze({
  SPEC_FAILED: 'spec_failed',
  UNREADABLE: 'unreadable',
  MATCH_FAILED: 'match_failed',
  VERIFIED: 'verified'
});

export const ALLOWED_IMAGE_MIME = Object.freeze([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
]);

export const MIN_FILE_BYTES = 20 * 1024;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MIN_IMAGE_WIDTH = 640;
export const MIN_IMAGE_HEIGHT = 400;
export const MIN_BRIGHTNESS = 28;
export const MAX_BRIGHTNESS = 245;
export const MIN_CONTRAST = 80;
export const MIN_OCR_CHARS = 12;
export const MIN_OCR_CONFIDENCE = 38;
