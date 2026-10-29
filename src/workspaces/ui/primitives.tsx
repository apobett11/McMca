import {
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TdHTMLAttributes,
  type TextareaHTMLAttributes,
  type ThHTMLAttributes
} from 'react';
import { cx, initials as toInitials } from '../lib/format.ts';
import type { Tone } from '../types/schema.ts';
import { Icon, type IconName } from './icons.tsx';

/* ───────── Card (Gestalt common region) ───────── */

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  flush?: boolean;
  as?: 'section' | 'div' | 'article';
}

export function Card({ title, subtitle, actions, flush, as = 'section', className, children, ...rest }: CardProps) {
  const Tag = as;
  return (
    <Tag className={cx('rounded-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md', className)} {...rest}>
      {title || actions ? (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 px-4 py-3">
          <div className="min-w-0">
            {title ? <h2 className="text-sm font-semibold tracking-wide text-slate-50">{title}</h2> : null}
            {subtitle ? <p className="mt-0.5 text-xs text-slate-300">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={flush ? '' : 'p-4'}>{children}</div>
    </Tag>
  );
}

/* ───────── Badge / Chip ───────── */

const badgeTone: Record<Tone, string> = {
  neutral: 'bg-slate-700/40 text-slate-100 ring-slate-500/50',
  accent: 'bg-accent/15 text-accent-soft ring-accent/40',
  emerald: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/40',
  cyan: 'bg-cyan-500/15 text-cyan-300 ring-cyan-400/40',
  amber: 'bg-amber-500/15 text-amber-300 ring-amber-400/40',
  red: 'bg-red-500/15 text-red-300 ring-red-400/40',
  violet: 'bg-violet-500/15 text-violet-300 ring-violet-400/40',
  gold: 'bg-amber-500/15 text-amber-200 ring-amber-300/50'
};

const dotTone: Record<Tone, string> = {
  neutral: 'bg-slate-300',
  accent: 'bg-accent',
  emerald: 'bg-emerald-400',
  cyan: 'bg-cyan-400',
  amber: 'bg-amber-400',
  red: 'bg-red-400',
  violet: 'bg-violet-400',
  gold: 'bg-amber-300'
};

export function Badge({
  tone = 'neutral',
  dot,
  pulse,
  className,
  children,
  title
}: {
  tone?: Tone;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
  children: ReactNode;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        badgeTone[tone],
        className
      )}
    >
      {dot || pulse ? (
        <span className="relative flex h-2 w-2">
          {pulse ? <span className={cx('absolute inline-flex h-full w-full animate-ping rounded-full opacity-70', dotTone[tone])} /> : null}
          <span className={cx('relative inline-flex h-2 w-2 rounded-full', dotTone[tone])} />
        </span>
      ) : null}
      {children}
    </span>
  );
}

export function Chip({
  active,
  count,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; count?: number }) {
  return (
    <button
      type="button"
      aria-pressed={!!active}
      className={cx(
        'inline-flex min-h-[36px] items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition-colors',
        active
          ? 'border-accent bg-accent/20 text-accent-soft'
          : 'border-slate-700 bg-slate-900/60 text-slate-200 hover:border-slate-500 hover:bg-slate-800/60'
      )}
      {...rest}
    >
      {children}
      {count !== undefined ? (
        <span className={cx('rounded-full px-2 font-mono text-xs tabular-nums', active ? 'bg-accent/25 text-accent-soft' : 'bg-slate-800 text-slate-200')}>
          {count}
        </span>
      ) : null}
    </button>
  );
}

/* ───────── Buttons (Fitts: ≥36×36 hit area, visible focus) ───────── */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'warn' | 'emerald' | 'gold';

const btnVariant: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-ink-950 hover:bg-accent-soft',
  secondary: 'border border-slate-600 bg-slate-800/70 text-slate-50 hover:border-slate-400 hover:bg-slate-700/70',
  ghost: 'text-slate-100 hover:bg-slate-800/70',
  danger: 'bg-red-400 text-ink-950 hover:bg-red-300',
  warn: 'bg-amber-400 text-ink-950 hover:bg-amber-300',
  emerald: 'bg-emerald-400 text-ink-950 hover:bg-emerald-300',
  gold: 'bg-amber-300 text-ink-950 hover:bg-amber-200'
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: IconName;
  block?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', icon, block, loading, className, children, disabled, type = 'button', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex min-h-[36px] min-w-[36px] select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3.5 text-sm font-semibold transition-all active:scale-[.97] disabled:opacity-45 disabled:active:scale-100',
        btnVariant[variant],
        block && 'w-full',
        className
      )}
      {...rest}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" /> : icon ? <Icon name={icon} size={16} /> : null}
      {children}
    </button>
  );
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: icon-only controls must be named for assistive tech. */
  label: string;
  icon: IconName;
  variant?: ButtonVariant;
  badge?: number;
  size?: number;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, variant = 'ghost', badge, size = 18, className, type = 'button', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        'relative inline-flex h-9 min-h-[36px] w-9 min-w-[36px] items-center justify-center rounded-lg transition-all active:scale-95 disabled:opacity-45',
        btnVariant[variant],
        className
      )}
      {...rest}
    >
      <Icon name={icon} size={size} />
      {badge ? (
        <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-400 px-1 font-mono text-[11px] font-bold leading-none text-ink-950">
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </button>
  );
});

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[22px] items-center justify-center rounded border border-slate-600 bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-100">
      {children}
    </kbd>
  );
}

/* ───────── Form controls ───────── */

const fieldBase =
  'min-h-[36px] w-full rounded-lg border border-slate-700 bg-ink-950/70 px-3 text-sm text-slate-50 transition-colors hover:border-slate-500 focus-visible:border-accent disabled:opacity-50';

export function FieldLabel({ htmlFor, children, hint }: { htmlFor?: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline justify-between gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
      <span>{children}</span>
      {hint ? <span className="font-mono normal-case tracking-normal text-slate-300">{hint}</span> : null}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cx(fieldBase, className)} {...rest} />;
});

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(fieldBase, 'cursor-pointer', className)} {...rest}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(fieldBase, 'min-h-[88px] resize-y py-2', className)} {...rest} />;
}

export function SearchInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cx('relative', className)}>
      <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
      <input type="search" className={cx(fieldBase, 'pl-9')} {...rest} />
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx('relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors', checked ? 'border-accent bg-accent/40' : 'border-slate-500 bg-slate-800')}
    >
      <span className={cx('inline-block h-4 w-4 rounded-full bg-white transition-transform', checked ? 'translate-x-6' : 'translate-x-1')} />
    </button>
  );
}

export function Checkbox({ checked, onChange, label, indeterminate }: { checked: boolean; onChange: (v: boolean) => void; label: string; indeterminate?: boolean }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-slate-800/70"
    >
      <span
        className={cx(
          'flex h-[18px] w-[18px] items-center justify-center rounded border-2 transition-colors',
          checked || indeterminate ? 'border-accent bg-accent text-ink-950' : 'border-slate-400 bg-transparent'
        )}
      >
        {indeterminate ? <Icon name="minus" size={12} strokeWidth={3} /> : checked ? <Icon name="check" size={12} strokeWidth={3} /> : null}
      </span>
    </button>
  );
}

/* ───────── Table atoms (alignment laws live here) ───────── */

type Align = 'left' | 'right' | 'center';
const alignCls: Record<Align, string> = { left: 'text-left', right: 'text-right', center: 'text-center' };

export function Th({ align = 'left', className, children, ...rest }: ThHTMLAttributes<HTMLTableCellElement> & { align?: Align }) {
  return (
    <th
      scope="col"
      className={cx('whitespace-nowrap border-b border-slate-700/70 bg-ink-900 px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-200', alignCls[align], className)}
      {...rest}
    >
      {children}
    </th>
  );
}

/** `mono` → font-mono + tabular-nums (currency, dates, serials, IDs). Pair with align="right". */
export function Td({ align = 'left', mono, className, children, ...rest }: TdHTMLAttributes<HTMLTableCellElement> & { align?: Align; mono?: boolean }) {
  return (
    <td className={cx('px-3 py-3 align-middle text-slate-100', alignCls[align], mono && 'font-mono tabular-nums tracking-tight', className)} {...rest}>
      {children}
    </td>
  );
}

export function DataTable({ children, className, maxHeight }: { children: ReactNode; className?: string; maxHeight?: string }) {
  return (
    <div className={cx('overflow-auto rounded-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md', className)} style={maxHeight ? { maxHeight } : undefined}>
      <table className="ws-sticky-head w-full min-w-max text-sm">{children}</table>
    </div>
  );
}

export const rowCls = 'transition-colors hover:bg-slate-800/40';
export const tbodyCls = 'divide-y divide-slate-800/50';

/* ───────── Progress / Rings ───────── */

const barTone: Record<Tone, string> = {
  neutral: 'bg-slate-300',
  accent: 'bg-accent',
  emerald: 'bg-emerald-400',
  cyan: 'bg-cyan-400',
  amber: 'bg-amber-400',
  red: 'bg-red-400',
  violet: 'bg-violet-400',
  gold: 'bg-gradient-to-r from-amber-500 to-amber-300'
};

export function ProgressBar({ value, tone = 'accent', label, className }: { value: number; tone?: Tone; label: string; className?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v)}
      className={cx('h-2 w-full overflow-hidden rounded-full bg-slate-800', className)}
    >
      <div className={cx('h-full rounded-full transition-[width] duration-500', barTone[tone])} style={{ width: `${v}%` }} />
    </div>
  );
}

export interface StackPart {
  label: string;
  value: number;
  tone: Tone;
}

export function StackedBar({ parts, total, label }: { parts: StackPart[]; total: number; label: string }) {
  return (
    <div role="img" aria-label={label} className="flex h-3 w-full overflow-hidden rounded-full bg-slate-800">
      {parts.map((p) => (
        <div key={p.label} title={`${p.label}`} className={cx('h-full transition-[width] duration-500', barTone[p.tone])} style={{ width: `${total > 0 ? (p.value / total) * 100 : 0}%` }} />
      ))}
    </div>
  );
}

const strokeTone: Record<Tone, string> = {
  neutral: '#cbd5e1',
  accent: 'rgb(var(--ws-accent))',
  emerald: '#34d399',
  cyan: '#22d3ee',
  amber: '#fbbf24',
  red: '#f87171',
  violet: '#a78bfa',
  gold: '#fbbf24'
};

export function Ring({
  value,
  size = 56,
  stroke = 6,
  tone = 'accent',
  label,
  children
}: {
  value: number;
  size?: number;
  stroke?: number;
  tone?: Tone;
  label: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${v.toFixed(1)}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={strokeTone[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v / 100)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      {children ? <div className="absolute inset-0 flex items-center justify-center">{children}</div> : null}
    </div>
  );
}

/* ───────── Tabs ───────── */

export function Tabs<K extends string>({
  tabs,
  value,
  onChange,
  label
}: {
  tabs: { key: K; label: string; icon?: IconName }[];
  value: K;
  onChange: (k: K) => void;
  label: string;
}) {
  const id = useId();
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto border-b border-slate-800/80 px-2">
      {tabs.map((t, i) => {
        const on = t.key === value;
        return (
          <button
            key={t.key}
            role="tab"
            id={`${id}-${t.key}`}
            aria-selected={on}
            aria-controls={`${id}-panel`}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(t.key)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') onChange(tabs[(i + 1) % tabs.length].key);
              if (e.key === 'ArrowLeft') onChange(tabs[(i - 1 + tabs.length) % tabs.length].key);
            }}
            className={cx(
              'relative inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap px-3 text-sm font-semibold transition-colors',
              on ? 'text-accent-soft' : 'text-slate-200 hover:text-white'
            )}
          >
            {t.icon ? <Icon name={t.icon} size={15} /> : null}
            {t.label}
            {on ? <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-accent" /> : null}
          </button>
        );
      })}
    </div>
  );
}

export function Segmented<K extends string>({ options, value, onChange, label }: { options: { key: K; label: string }[]; value: K; onChange: (k: K) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg border border-slate-700 bg-ink-950/60 p-0.5">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          aria-pressed={o.key === value}
          onClick={() => onChange(o.key)}
          className={cx(
            'min-h-[32px] min-w-[36px] rounded-md px-3 text-xs font-semibold transition-colors',
            o.key === value ? 'bg-accent text-ink-950' : 'text-slate-200 hover:bg-slate-800'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ───────── Misc ───────── */

export function Avatar({ name, src, size = 40, tone = 'accent' }: { name: string; src?: string; size?: number; tone?: Tone }) {
  return src ? (
    <img src={src} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span
      aria-hidden="true"
      className={cx('inline-flex shrink-0 items-center justify-center rounded-full font-bold ring-1 ring-inset', badgeTone[tone])}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {toInitials(name)}
    </span>
  );
}

export function EmptyState({ icon = 'search', title, body }: { icon?: IconName; title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-700 bg-slate-800/60 text-slate-200">
        <Icon name={icon} size={22} />
      </span>
      <p className="text-sm font-semibold text-slate-50">{title}</p>
      {body ? <p className="max-w-sm text-sm text-slate-300">{body}</p> : null}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent-soft">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">{title}</h1>
        {description ? <p className="mt-1 max-w-3xl text-sm text-slate-300">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function KeyValue({ label, children, mono }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-300">{label}</dt>
      <dd className={cx('mt-0.5 break-words text-sm text-slate-50', mono && 'font-mono tabular-nums')}>{children}</dd>
    </div>
  );
}
