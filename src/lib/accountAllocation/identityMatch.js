/**
 * Onboarding adapter: the allocation algorithm never inspects pixels.
 * It asks the document-upload algorithm to verify the photo, then continues.
 */
import { DOCUMENT_STATUS } from './constants.js';
import { UPLOAD_KIND, verifyDocumentUpload } from '../documentUpload';

function toOnboardingStatus(result) {
  if (result.ok) return DOCUMENT_STATUS.VERIFIED;
  if (result.status === 'spec_failed' || result.status === 'unreadable') {
    return DOCUMENT_STATUS.QUALITY_FAILED;
  }
  return DOCUMENT_STATUS.MATCH_FAILED;
}

export async function scanAndMatchIdentity({
  file,
  registeredName,
  registeredIdNumber,
  side
}) {
  const result = await verifyDocumentUpload({
    file,
    kind: side === 'back' ? UPLOAD_KIND.IDENTITY_BACK : UPLOAD_KIND.IDENTITY_FRONT,
    expected: {
      fullName: registeredName,
      nationalId: registeredIdNumber
    }
  });
  return {
    ...result,
    status: toOnboardingStatus(result)
  };
}

export async function scanBirthCertificate({
  file,
  studentFullName,
  certificateName,
  certificateNumber
}) {
  const result = await verifyDocumentUpload({
    file,
    kind: UPLOAD_KIND.BIRTH_CERTIFICATE,
    expected: {
      fullName: studentFullName || certificateName,
      certificateName: certificateName || studentFullName,
      certificateNumber
    }
  });
  return {
    ...result,
    status: toOnboardingStatus(result)
  };
}
