/**
 * Checks a photo or scan in the browser before it is stored.
 * This confirms the file is readable. The chief still verifies the document.
 */

const LIMITS = {
  maxBytes: 10 * 1024 * 1024,
  minImageBytes: 20 * 1024,
  minPdfBytes: 4 * 1024,
  minEdge: 480,
  flatVariance: 12,
  allowed: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
};

function fail(checks) {
  return { passed: false, checks };
}

async function readAscii(file, length) {
  const buffer = await file.slice(0, length).arrayBuffer();
  return String.fromCharCode(...new Uint8Array(buffer));
}

async function measureImage(file) {
  const bitmap = await createImageBitmap(file);
  const width = bitmap.width;
  const height = bitmap.height;
  const size = 24;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(bitmap, 0, 0, size, size);
  if (typeof bitmap.close === 'function') bitmap.close();
  const pixels = context.getImageData(0, 0, size, size).data;
  let sum = 0;
  let sumSq = 0;
  const count = size * size;
  for (let index = 0; index < pixels.length; index += 4) {
    const luminance = 0.2126 * pixels[index] + 0.7152 * pixels[index + 1] + 0.0722 * pixels[index + 2];
    sum += luminance;
    sumSq += luminance * luminance;
  }
  const mean = sum / count;
  const variance = sumSq / count - mean * mean;
  return { width, height, flat: variance < LIMITS.flatVariance };
}

export async function verifyUpload(file) {
  if (!file) return fail(['Choose a photo or a PDF scan.']);

  const checks = [];
  if (!LIMITS.allowed.includes(file.type)) {
    checks.push('Use a JPG, PNG, WEBP photo or a PDF scan.');
  }
  if (file.size > LIMITS.maxBytes) {
    checks.push('File must be under 10 MB.');
  }

  if (checks.length) return fail(checks);

  if (file.type === 'application/pdf') {
    if (file.size < LIMITS.minPdfBytes) checks.push('This PDF looks empty.');
    const header = await readAscii(file, 5);
    if (header !== '%PDF-') checks.push('This file is not a valid PDF.');
    return { passed: checks.length === 0, checks };
  }

  if (file.size < LIMITS.minImageBytes) {
    checks.push('This photo is too small to read.');
  }
  try {
    const measured = await measureImage(file);
    if (Math.min(measured.width, measured.height) < LIMITS.minEdge) {
      checks.push('Move closer so the document fills the photo.');
    } else if (measured.flat) {
      checks.push('The photo looks blank. Retake it in better light.');
    }
  } catch {
    checks.push('The photo could not be read. Try another file.');
  }

  return { passed: checks.length === 0, checks };
}
