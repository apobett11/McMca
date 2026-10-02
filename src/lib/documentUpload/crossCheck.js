import { UPLOAD_KIND } from './constants.js';

const NOISE = new Set([
  'REPUBLIC', 'KENYA', 'CERTIFICATE', 'BIRTH', 'SERIAL', 'NUMBER', 'FULL', 'NAMES',
  'DATE', 'BIRTH', 'SEX', 'MALE', 'FEMALE', 'DISTRICT', 'PLACE', 'SIGNATURE',
  'HOLDER', 'NATIONAL', 'IDENTITY', 'CARD', 'ENTRY', 'CHILD'
]);

export function normalizeName(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z'\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function nameTokens(value) {
  return normalizeName(value)
    .split(' ')
    .filter((token) => token.length > 1 && !NOISE.has(token));
}

export function normalizeId(value) {
  return String(value || '').replace(/\s+/g, '').replace(/[^\d]/g, '');
}

function ocrDigitFixes(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[OQ]/g, '0')
    .replace(/[IL]/g, '1')
    .replace(/S/g, '5')
    .replace(/B/g, '8')
    .replace(/[^\d]/g, '');
}

function editDistance(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let i = 0; i < rows; i += 1) grid[i][0] = i;
  for (let j = 0; j < cols; j += 1) grid[0][j] = j;
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      grid[i][j] = Math.min(grid[i - 1][j] + 1, grid[i][j - 1] + 1, grid[i - 1][j - 1] + cost);
    }
  }
  return grid[a.length][b.length];
}

function tokenInHaystack(token, haystack) {
  if (!token) return false;
  if (haystack.includes(token)) return true;
  const words = haystack.split(/[^A-Z]+/).filter(Boolean);
  return words.some((word) => {
    if (word === token) return true;
    if (token.length >= 4 && word.length >= 4) {
      const allowed = token.length >= 7 ? 2 : 1;
      return editDistance(token, word) <= allowed;
    }
    return false;
  });
}

function idMatches(expected, candidates, haystack) {
  const want = normalizeId(expected);
  if (!want) return { ok: true, skipped: true };
  const hay = ocrDigitFixes(haystack);
  if (hay.includes(want) || candidates.map(ocrDigitFixes).includes(want)) {
    return { ok: true, matched: want };
  }
  const close = candidates
    .map(ocrDigitFixes)
    .find((id) => id.length === want.length && editDistance(id, want) <= 1);
  if (close) return { ok: true, matched: want, fuzzy: true };
  return { ok: false, reason: 'The identification number on the document does not match the number entered.' };
}

/**
 * Autonomous: compare OCR output to the information the person typed.
 * This algorithm never writes accounts or student categories.
 */
export function crossCheckExtractedFields({ kind, expected = {}, extracted }) {
  const haystack = normalizeName([
    extracted?.text,
    ...(extracted?.names || []),
    extracted?.primaryName
  ].filter(Boolean).join(' '));

  const requireNames = kind === UPLOAD_KIND.IDENTITY_FRONT
    || kind === UPLOAD_KIND.BIRTH_CERTIFICATE;

  if (requireNames) {
    const expectedName = expected.fullName || expected.certificateName || '';
    const tokens = nameTokens(expectedName);
    const required = tokens.filter((_, idx, all) => idx === 0 || idx === all.length - 1);
    if (!required.length) {
      return { ok: false, reason: 'There is no name on the form to verify this document against.' };
    }
    const missing = required.filter((token) => !tokenInHaystack(token, haystack));
    if (missing.length) {
      return {
        ok: false,
        reason: `The name on the document does not match the entered name. Missing: ${missing.join(', ')}.`,
        missing
      };
    }
  }

  if (kind === UPLOAD_KIND.IDENTITY_FRONT) {
    const idCheck = idMatches(expected.nationalId, extracted?.idNumbers || [], extracted?.text || '');
    if (!idCheck.ok) return idCheck;
  }

  if (kind === UPLOAD_KIND.IDENTITY_BACK) {
    const candidates = extracted?.idNumbers || [];
    if (candidates.length) {
      const idCheck = idMatches(expected.nationalId, candidates, extracted?.text || '');
      if (!idCheck.ok) return idCheck;
    }
  }

  if (kind === UPLOAD_KIND.BIRTH_CERTIFICATE && expected.certificateNumber) {
    const want = String(expected.certificateNumber).toUpperCase().replace(/\s+/g, '');
    const hay = String(extracted?.text || '').toUpperCase().replace(/\s+/g, '');
    const found = (extracted?.certificateNumbers || []).some(
      (n) => String(n).toUpperCase().replace(/\s+/g, '') === want
    ) || hay.includes(want);
    if (!found) {
      return {
        ok: false,
        reason: 'The birth certificate number on the document does not match the number entered.'
      };
    }
  }

  return {
    ok: true,
    matchedName: normalizeName(expected.fullName || extracted?.primaryName || ''),
    matchedIdNumber: normalizeId(expected.nationalId) || null,
    extractedName: extracted?.primaryName || (extracted?.names || [])[0] || '',
    extractedIdNumbers: extracted?.idNumbers || []
  };
}
