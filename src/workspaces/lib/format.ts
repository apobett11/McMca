const NF0 = new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 });
const NF2 = new Intl.NumberFormat('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const num = (n: number): string => NF0.format(n);

/** `KES 6,580,000.00` */
export const kes = (n: number): string => `KES ${NF2.format(Number.isFinite(n) ? n : 0)}`;

/** Compact: `KES 6.58M` – only for chart axes / tight chips. */
export const kesCompact = (n: number): string => {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `KES ${(n / 1_000).toFixed(1)}K`;
  return `KES ${NF0.format(n)}`;
};

/** Parses `KES 48,000`, `48000`, `"15,000.50"` → number. */
export function parseKes(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const cleaned = String(value ?? '').replace(/[^0-9.]/g, '');
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export const pct = (n: number, digits = 1): string => `${n.toFixed(digits)}%`;

const pad = (n: number): string => String(n).padStart(2, '0');

export function fmtDate(iso: string | number | Date | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fmtTime(iso: string | number | Date | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fmtDateTime(iso: string | number | Date | null | undefined): string {
  if (!iso) return '—';
  return `${fmtDate(iso)} ${fmtTime(iso)}`;
}

/** `3d 04h 12m` */
export function fmtDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(total / 1440);
  const h = Math.floor((total % 1440) / 60);
  const m = total % 60;
  if (d > 0) return `${d}d ${pad(h)}h ${pad(m)}m`;
  return `${pad(h)}h ${pad(m)}m`;
}

/** `03:12:44` */
export function fmtClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

/** Small deterministic hash → [0, 1). Used for stable demo diagnostics (never random per render). */
export function hash01(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

export const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
