const NAME_RE = /^[A-Za-z][A-Za-z'’\- ]{1,79}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(?:\+254|0)7\d{8}$/;
const ID_RE = /^\d{7,8}$/;
const CERT_RE = /^[A-Za-z0-9][A-Za-z0-9\-\/ ]{4,39}$/;
const PASSWORD_MIN = 8;

export function normalizeNationalId(value) {
  return String(value || '').replace(/\s+/g, '').replace(/[^\d]/g, '');
}

export function normalizePhone(value) {
  const digits = String(value || '').replace(/\s+/g, '');
  if (/^07\d{8}$/.test(digits)) return `+254${digits.slice(1)}`;
  if (/^\+2547\d{8}$/.test(digits)) return digits;
  return digits;
}

export function normalizePersonName(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

export function joinFullName({ firstName, middleName, lastName }) {
  return [firstName, middleName, lastName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function ok() {
  return { ok: true, message: '' };
}
function fail(message) {
  return { ok: false, message };
}

export function validateRequired(value, label = 'This field') {
  if (!String(value || '').trim()) return fail(`${label} is required.`);
  return ok();
}

export function validateName(value, label = 'Name') {
  const trimmed = String(value || '').trim();
  if (!trimmed) return fail(`${label} is required.`);
  if (!NAME_RE.test(trimmed)) return fail(`${label} may only contain letters, spaces, hyphens, or apostrophes.`);
  return ok();
}

export function validateEmail(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return fail('Email is required.');
  if (!EMAIL_RE.test(trimmed)) return fail('Enter a valid email address.');
  return ok();
}

export function validatePhone(value, { required = true } = {}) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return required ? fail('Phone number is required.') : ok();
  if (!PHONE_RE.test(trimmed.replace(/\s+/g, ''))) {
    return fail('Enter a Kenyan mobile number such as 07XX XXX XXX or +2547XXXXXXXX.');
  }
  return ok();
}

export function validateNationalId(value, { required = true } = {}) {
  const id = normalizeNationalId(value);
  if (!id) return required ? fail('National ID number is required.') : ok();
  if (!ID_RE.test(id)) return fail('National ID must be 7 or 8 digits.');
  return ok();
}

export function validateDateOfBirth(value) {
  if (!value) return fail('Date of birth is required.');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fail('Enter a valid date of birth.');
  if (date > new Date()) return fail('Date of birth cannot be in the future.');
  const year = date.getFullYear();
  if (year < 1920) return fail('Enter a realistic date of birth.');
  return ok();
}

export function validatePassword(value) {
  const raw = String(value || '');
  if (raw.length < PASSWORD_MIN) return fail(`Password must be at least ${PASSWORD_MIN} characters.`);
  if (!/[A-Za-z]/.test(raw) || !/\d/.test(raw)) {
    return fail('Password must include at least one letter and one number.');
  }
  return ok();
}

export function validateBirthCertificateNumber(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return fail('Birth certificate number is required.');
  if (!CERT_RE.test(trimmed)) return fail('Enter the birth certificate number as printed on the document.');
  return ok();
}

export function namesMatch(registeredName, scannedName) {
  const registered = normalizePersonName(registeredName);
  const scanned = normalizePersonName(scannedName);
  if (!registered) return { ok: false, reason: 'Registered name is missing.' };
  if (!scanned) return { ok: false, reason: 'Type the name exactly as it appears on the document.' };

  const registeredTokens = registered.split(' ').filter((t) => t.length > 1);
  const scannedTokens = scanned.split(' ').filter((t) => t.length > 1);
  const hits = registeredTokens.filter((token) => scannedTokens.includes(token));
  if (hits.length < Math.min(2, registeredTokens.length)) {
    return {
      ok: false,
      reason: 'The name on the document does not match the name used at registration.'
    };
  }
  return { ok: true };
}

export function validateField(name, value, extras = {}) {
  switch (name) {
    case 'firstName':
    case 'lastName':
    case 'parentFirstName':
    case 'parentLastName':
    case 'scannedName':
    case 'certificateName':
      return validateName(value, extras.label || 'Name');
    case 'middleName':
      if (!String(value || '').trim()) return ok();
      return validateName(value, 'Middle name');
    case 'email':
      return validateEmail(value);
    case 'phone':
    case 'phoneNumber':
    case 'parentPhone':
      return validatePhone(value, extras);
    case 'nationalId':
    case 'scannedIdNumber':
    case 'parentNationalId':
      return validateNationalId(value, extras);
    case 'dateOfBirth':
      return validateDateOfBirth(value);
    case 'password':
      return validatePassword(value);
    case 'birthCertificateNumber':
      return validateBirthCertificateNumber(value);
    case 'gender':
    case 'relationship':
    case 'educationLevel':
    case 'schoolName':
      return validateRequired(value, extras.label || 'This field');
    default:
      return extras.required === false && !String(value || '').trim()
        ? ok()
        : validateRequired(value, extras.label || 'This field');
  }
}

export function validateForm(fields, schema) {
  const errors = {};
  for (const [name, rules] of Object.entries(schema)) {
    const result = validateField(name, fields[name], rules);
    if (!result.ok) errors[name] = result.message;
  }
  return {
    ok: Object.keys(errors).length === 0,
    errors
  };
}
