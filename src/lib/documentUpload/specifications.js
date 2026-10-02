import {
  ALLOWED_IMAGE_MIME,
  MAX_FILE_BYTES,
  MIN_BRIGHTNESS,
  MIN_CONTRAST,
  MIN_FILE_BYTES,
  MIN_IMAGE_HEIGHT,
  MIN_IMAGE_WIDTH,
  MAX_BRIGHTNESS,
  UPLOAD_KIND
} from './constants.js';

export function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('The file could not be read as an image. Upload a clear photo of the document.'));
    };
    image.src = url;
  });
}

function sampleLuma(image) {
  const canvas = document.createElement('canvas');
  const width = Math.min(160, image.naturalWidth || image.width);
  const height = Math.min(120, image.naturalHeight || image.height);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { mean: 128, variance: 100 };
  ctx.drawImage(image, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);
  let sum = 0;
  let sumSq = 0;
  const pixels = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    const luma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    sum += luma;
    sumSq += luma * luma;
  }
  const mean = sum / pixels;
  return { mean, variance: sumSq / pixels - mean * mean };
}

function fail(reason, extras = {}) {
  return { ok: false, reason, ...extras };
}

/** Autonomous: file type, size, resolution, light, and document-shape checks. Does not OCR. */
export async function inspectDocumentSpecifications(file, kind = UPLOAD_KIND.GENERIC_IMAGE) {
  if (!file) return fail('Upload a clear photo of the document.');

  const mime = (file.type || '').toLowerCase();
  if (kind === UPLOAD_KIND.PDF || mime === 'application/pdf') {
    if (mime !== 'application/pdf') return fail('This document must be a PDF.');
    if (file.size > MAX_FILE_BYTES) return fail('The file must be 10 MB or smaller.');
    if (file.size < 1024) return fail('The PDF is empty or too small.');
    return { ok: true, mime, fileSize: file.size, kind };
  }

  if (!ALLOWED_IMAGE_MIME.includes(mime)) {
    return fail('Upload a JPEG, PNG, or WebP photo. PDFs are not accepted for identity or birth-certificate scans.');
  }
  if (file.size < MIN_FILE_BYTES) {
    return fail('The photo is too small. Take a closer, clearer picture of the document.');
  }
  if (file.size > MAX_FILE_BYTES) {
    return fail('The photo must be 10 MB or smaller.');
  }

  let image;
  try {
    image = await loadImageFile(file);
  } catch (err) {
    return fail(err.message);
  }

  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  if (width < MIN_IMAGE_WIDTH || height < MIN_IMAGE_HEIGHT) {
    return fail(`The photo is too low-resolution (${width}×${height}). Retake so the document fills the frame.`, {
      width,
      height
    });
  }

  const { mean, variance } = sampleLuma(image);
  if (mean < MIN_BRIGHTNESS) {
    return fail('The photo is too dark. Retake in better light so names and numbers are readable.');
  }
  if (mean > MAX_BRIGHTNESS) {
    return fail('The photo is overexposed. Avoid flash glare so the printed details stay readable.');
  }
  if (variance < MIN_CONTRAST) {
    return fail('The photo looks blank or blurred. Hold the camera steady and capture the full document.');
  }

  const ratio = width / height;
  if (kind === UPLOAD_KIND.IDENTITY_FRONT || kind === UPLOAD_KIND.IDENTITY_BACK) {
    const landscape = Math.max(ratio, 1 / ratio);
    if (landscape < 1.15 || landscape > 2.4) {
      return fail('Frame the full identification card. The photo should look like a card, not a cropped corner.');
    }
  }

  return {
    ok: true,
    kind,
    mime: file.type,
    fileSize: file.size,
    width,
    height,
    brightness: Math.round(mean),
    contrast: Math.round(variance),
    aspectRatio: Number(ratio.toFixed(2))
  };
}

/** @deprecated Use inspectDocumentSpecifications. Kept so older onboarding imports keep working. */
export async function inspectDocumentQuality(file) {
  return inspectDocumentSpecifications(file, UPLOAD_KIND.GENERIC_IMAGE);
}

export async function prepareImageForOcr(file) {
  const image = await loadImageFile(file);
  const longest = Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height);
  const scale = longest < 1400 ? Math.min(2.2, 1600 / longest) : 1;
  const width = Math.round((image.naturalWidth || image.width) * scale);
  const height = Math.round((image.naturalHeight || image.height) * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);
  const snapshot = ctx.getImageData(0, 0, width, height);
  const { data } = snapshot;
  for (let i = 0; i < data.length; i += 4) {
    const luma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    const boosted = luma < 140 ? Math.max(0, (luma - 20) * 1.35) : Math.min(255, luma * 1.1);
    const bw = boosted > 150 ? 255 : boosted < 90 ? 0 : boosted;
    data[i] = data[i + 1] = data[i + 2] = bw;
  }
  ctx.putImageData(snapshot, 0, 0);
  return canvas;
}
