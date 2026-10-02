import { DOCUMENT_STATUS } from './constants.js';

function normalizeDocs(documents = []) {
  return documents.map((doc) => ({
    kind: doc.document_kind || doc.document_type || doc.kind,
    status: doc.verification_status || deriveStatus(doc),
    uploaded: Boolean(doc.storage_path || doc.file || doc.uploaded),
    verified: doc.verification_status === DOCUMENT_STATUS.VERIFIED || doc.ai_verified === true,
    id: doc.id
  }));
}

function deriveStatus(doc) {
  if (doc.verification_status) return doc.verification_status;
  if (doc.ai_verified) return DOCUMENT_STATUS.VERIFIED;
  if (doc.storage_path) return DOCUMENT_STATUS.UPLOADED;
  return DOCUMENT_STATUS.MISSING;
}

/** Autonomous: inspect which required documents already exist, and their verification state. */
export function inspectDocumentInventory({ requiredKinds = [], documents = [] }) {
  const existing = normalizeDocs(documents);
  const byKind = new Map();
  for (const doc of existing) {
    if (!doc.kind) continue;
    const prev = byKind.get(doc.kind);
    if (!prev || (doc.verified && !prev.verified) || (doc.uploaded && !prev.uploaded)) {
      byKind.set(doc.kind, doc);
    }
  }

  const items = requiredKinds.map((kind) => {
    const found = byKind.get(kind);
    if (!found) {
      return { kind, status: DOCUMENT_STATUS.MISSING, present: false, verified: false };
    }
    return {
      kind,
      status: found.status,
      present: found.uploaded || found.verified,
      verified: found.verified,
      id: found.id
    };
  });

  const missing = items.filter((i) => !i.present).map((i) => i.kind);
  const unverified = items.filter((i) => i.present && !i.verified).map((i) => i.kind);
  const verified = items.filter((i) => i.verified).map((i) => i.kind);

  return {
    items,
    missing,
    unverified,
    verified,
    complete: missing.length === 0,
    allVerified: missing.length === 0 && unverified.length === 0
  };
}

export function hasDocument(documents, kind) {
  return inspectDocumentInventory({ requiredKinds: [kind], documents }).complete;
}

export function isDocumentVerified(documents, kind) {
  return inspectDocumentInventory({ requiredKinds: [kind], documents }).allVerified;
}
