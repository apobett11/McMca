const KES = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0
});

const KES_COMPACT = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  notation: 'compact',
  maximumFractionDigits: 1
});

const COUNT = new Intl.NumberFormat('en-KE');

export function formatKes(value, { compact = false } = {}) {
  const amount = Number(value) || 0;
  return compact && Math.abs(amount) >= 100000 ? KES_COMPACT.format(amount) : KES.format(amount);
}

export function formatCount(value) {
  return COUNT.format(Number(value) || 0);
}

export function formatPercent(part, whole) {
  const denominator = Number(whole) || 0;
  if (!denominator) return '0%';
  return `${Math.round(((Number(part) || 0) / denominator) * 100)}%`;
}

export function formatDays(value) {
  if (value === null || value === undefined) return '—';
  const days = Number(value);
  if (!Number.isFinite(days)) return '—';
  if (days < 1) return 'Under a day';
  const rounded = Math.round(days);
  return `${rounded} day${rounded === 1 ? '' : 's'}`;
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatWeek(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
}
