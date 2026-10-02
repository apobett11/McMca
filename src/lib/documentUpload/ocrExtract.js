import { MIN_OCR_CHARS } from './constants.js';
import { prepareImageForOcr } from './specifications.js';

let workerPromise = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng', 1, {
        logger: () => {}
      });
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-\'./: '
      });
      return worker;
    })();
  }
  return workerPromise;
}

function afterLabel(text, labels) {
  const upper = text.toUpperCase();
  for (const label of labels) {
    const idx = upper.indexOf(label);
    if (idx === -1) continue;
    const slice = text.slice(idx + label.length).replace(/^[\s:.\-]+/, '');
    const line = slice.split('\n')[0].trim();
    if (line.length >= 4) return line;
  }
  return '';
}

function unique(list) {
  return [...new Set(list.filter(Boolean))];
}

/** Autonomous: parse names, ID numbers, and certificate numbers from OCR text. */
export function extractFieldsFromText(rawText) {
  const text = String(rawText || '');
  const compact = text.replace(/\s+/g, ' ').trim();
  const upper = compact.toUpperCase();

  const idCandidates = unique((upper.match(/\b\d{7,8}\b/g) || []).map((n) => n.replace(/\D/g, '')));
  const certCandidates = unique(
    (upper.match(/\b[A-Z]{0,3}\d{4,12}\b/g) || []).concat(upper.match(/\b\d{5,12}\b/g) || [])
  );

  const labelledName = afterLabel(upper, [
    'FULL NAMES',
    'FULL NAME',
    'NAME OF CHILD',
    "CHILD'S NAME",
    'CHILDS NAME',
    'NAME OF THE CHILD',
    'SURNAME',
    'HOLDER'
  ]);

  const nameLines = upper
    .split(/\n+/)
    .map((line) => line.replace(/[^A-Z' \-]/g, ' ').replace(/\s+/g, ' ').trim())
    .filter((line) => {
      const words = line.split(' ').filter((w) => w.length > 1);
      return words.length >= 2 && words.length <= 6 && words.every((w) => /^[A-Z][A-Z'\-]{1,}$/.test(w));
    });

  const stripped = upper
    .replace(/REPUBLIC OF KENYA|FULL NAMES?|SERIAL NUMBER|ID NUMBER|DATE OF BIRTH|BIRTH CERTIFICATE|NAME OF CHILD|CHILDS NAME/g, ' ')
    .replace(/[^A-Z ]/g, ' ');
  const leftover = stripped
    .split(' ')
    .filter((t) => t.length > 2 && !/REPUBLIC|KENYA|CERTIFICATE|BIRTH|SERIAL|DISTRICT|GENDER|FEMALE|MALE|NUMBER|DATE|ENTRY|HOLDER|NATIONAL|IDENTITY/.test(t));
  const leftoverName = leftover.length >= 2 ? leftover.slice(0, 4).join(' ') : '';

  const names = unique([
    labelledName.replace(/[^A-Z' \-]/g, ' ').replace(/\s+/g, ' ').trim(),
    ...nameLines,
    leftoverName
  ]).filter((n) => n && !/REPUBLIC|KENYA|CERTIFICATE|BIRTH|SERIAL|DISTRICT|GENDER|FEMALE|MALE/.test(n));

  return {
    text: compact,
    names,
    primaryName: names[0] || '',
    idNumbers: idCandidates,
    certificateNumbers: certCandidates,
    readable: compact.replace(/[^A-Za-z0-9]/g, '').length >= MIN_OCR_CHARS
  };
}

/** Autonomous: read printed text from a document photo. */
export async function readDocumentText(file) {
  const prepared = await prepareImageForOcr(file);
  const worker = await getWorker();
  const { data } = await worker.recognize(prepared);
  const text = data?.text || '';
  const confidence = Number(data?.confidence || 0);
  const fields = extractFieldsFromText(text);
  return {
    text,
    confidence,
    fields,
    readable: fields.readable && text.trim().length > 0
  };
}
