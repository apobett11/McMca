/** Classic Levenshtein edit distance (case/space-insensitive). */
export function levenshtein(a: string, b: string): number {
  const s = a.toLowerCase().replace(/\s+/g, ' ').trim();
  const t = b.toLowerCase().replace(/\s+/g, ' ').trim();
  if (s === t) return 0;
  if (!s.length) return t.length;
  if (!t.length) return s.length;
  let prev = Array.from({ length: t.length + 1 }, (_, i) => i);
  for (let i = 1; i <= s.length; i++) {
    const cur = [i];
    for (let j = 1; j <= t.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (s[i - 1] === t[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[t.length];
}

// GSM-03.38 basic charset + extension table (extension chars cost 2 septets).
const GSM_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM_EXT = '^{}\\[~]|€\f';

export interface SmsSegments {
  encoding: 'GSM-7' | 'UCS-2';
  units: number;
  segments: number;
  perSegment: number;
  remaining: number;
}

/** Real SMS segmentation: 160/153 septets (GSM-7) or 70/67 code units (UCS-2). */
export function smsSegments(text: string): SmsSegments {
  let septets = 0;
  let gsm = true;
  for (const ch of text) {
    if (GSM_BASIC.includes(ch)) septets += 1;
    else if (GSM_EXT.includes(ch)) septets += 2;
    else {
      gsm = false;
      break;
    }
  }
  if (gsm) {
    const single = septets <= 160;
    const per = single ? 160 : 153;
    const segments = septets === 0 ? 0 : Math.ceil(septets / per);
    return { encoding: 'GSM-7', units: septets, segments, perSegment: per, remaining: segments * per - septets };
  }
  const units = text.length; // UTF-16 code units
  const single = units <= 70;
  const per = single ? 70 : 67;
  const segments = units === 0 ? 0 : Math.ceil(units / per);
  return { encoding: 'UCS-2', units, segments, perSegment: per, remaining: segments * per - units };
}

export function fillTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? `{${k}}`);
}

export function downloadText(filename: string, content: string, mime = 'text/csv;charset=utf-8'): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function csvEscape(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
