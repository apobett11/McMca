import { MIN_OCR_CONFIDENCE, UPLOAD_KIND, UPLOAD_STATUS } from './constants.js';
import { inspectDocumentSpecifications } from './specifications.js';
import { readDocumentText } from './ocrExtract.js';
import { crossCheckExtractedFields } from './crossCheck.js';

function fileFingerprint(file) {
  if (!file) return '';
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function fail(status, reason, extras = {}) {
  return {
    ok: false,
    canPersist: false,
    status,
    reason,
    ...extras
  };
}

/**
 * Document upload algorithm — single entry point.
 * 1. Check clarity and file specifications.
 * 2. Read names and numbers off the photo.
 * 3. Cross-check against the form the person already filled.
 * The photo must not be saved to storage until canPersist is true.
 */
export async function verifyDocumentUpload({
  file,
  kind = UPLOAD_KIND.IDENTITY_FRONT,
  expected = {}
}) {
  const specs = await inspectDocumentSpecifications(file, kind);
  if (!specs.ok) {
    return fail(UPLOAD_STATUS.SPEC_FAILED, specs.reason, { specs });
  }

  if (kind === UPLOAD_KIND.PDF || kind === UPLOAD_KIND.GENERIC_IMAGE) {
    return {
      ok: true,
      canPersist: true,
      status: UPLOAD_STATUS.VERIFIED,
      reason: null,
      specs,
      fingerprint: fileFingerprint(file),
      expectedSnapshot: { ...expected }
    };
  }

  let ocr;
  try {
    ocr = await readDocumentText(file);
  } catch (err) {
    return fail(
      UPLOAD_STATUS.UNREADABLE,
      'The document could not be read. Retake a clearer, well-lit photo of the full page.',
      { specs, ocrError: err.message }
    );
  }

  const minConfidence = kind === UPLOAD_KIND.IDENTITY_BACK ? 22 : MIN_OCR_CONFIDENCE;
  if (!ocr.readable || ocr.confidence < minConfidence) {
    return fail(
      UPLOAD_STATUS.UNREADABLE,
      'The document is not clear enough to read the printed names. Retake the photo so the text is sharp and fully in frame.',
      { specs, ocr }
    );
  }

  const match = crossCheckExtractedFields({
    kind,
    expected,
    extracted: ocr.fields
  });
  if (!match.ok) {
    return fail(UPLOAD_STATUS.MATCH_FAILED, match.reason, { specs, ocr, match });
  }

  return {
    ok: true,
    canPersist: true,
    status: UPLOAD_STATUS.VERIFIED,
    reason: null,
    specs,
    ocr,
    match,
    matchedName: match.matchedName,
    matchedIdNumber: match.matchedIdNumber,
    extractedName: match.extractedName,
    extractedIdNumbers: match.extractedIdNumbers,
    fingerprint: fileFingerprint(file),
    expectedSnapshot: { ...expected },
    quality: specs
  };
}

/** Autonomous: storage may write the photo only after this returns ok. */
export function assertCanPersist(verification, file, expected = {}) {
  if (!verification?.ok || !verification?.canPersist) {
    return { ok: false, reason: 'The document must be verified before it is saved.' };
  }
  if (fileFingerprint(file) !== verification.fingerprint) {
    return { ok: false, reason: 'The photo changed after verification. Scan it again.' };
  }
  const snap = verification.expectedSnapshot || {};
  const nameSame = String(snap.fullName || '').toUpperCase() === String(expected.fullName || '').toUpperCase();
  const idSame = String(snap.nationalId || '') === String(expected.nationalId || '');
  if ((expected.fullName && !nameSame) || (expected.nationalId && !idSame)) {
    return { ok: false, reason: 'The entered name or ID changed after the photo was verified. Scan it again.' };
  }
  return { ok: true };
}

export function mapOnboardingKind(documentKind, side) {
  const value = String(documentKind || side || '').toLowerCase();
  if (value.includes('back')) return UPLOAD_KIND.IDENTITY_BACK;
  if (value.includes('birth')) return UPLOAD_KIND.BIRTH_CERTIFICATE;
  if (value.includes('id') || value.includes('identity') || value.includes('national')) {
    return UPLOAD_KIND.IDENTITY_FRONT;
  }
  if (value.includes('pdf')) return UPLOAD_KIND.PDF;
  return UPLOAD_KIND.GENERIC_IMAGE;
}
