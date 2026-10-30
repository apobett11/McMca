import React from 'react';
import { cx } from '../../lib/format.ts';
import { Icon, type IconName } from '../../ui/icons.tsx';
import { Badge } from '../../ui/primitives.tsx';

export interface HierarchyMetricCardProps {
  value: string | number;
  label: string;
  buttonText: string;
  onClick?: () => void;
  tone?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate';
  size?: 'lg' | 'md' | 'sm';
  badge?: string;
  badgeTone?: 'emerald' | 'amber' | 'red' | 'cyan' | 'neutral';
  icon?: IconName;
  className?: string;
}

const TONE_STYLES = {
  cyan: {
    border: 'border-cyan-500/30 hover:border-cyan-400/60',
    bg: 'bg-gradient-to-b from-cyan-950/40 via-slate-900/60 to-ink-950/80',
    accentText: 'text-cyan-400 group-hover:text-cyan-300',
    numText: 'text-white',
    ring: 'focus-visible:ring-cyan-400'
  },
  emerald: {
    border: 'border-emerald-500/30 hover:border-emerald-400/60',
    bg: 'bg-gradient-to-b from-emerald-950/40 via-slate-900/60 to-ink-950/80',
    accentText: 'text-emerald-400 group-hover:text-emerald-300',
    numText: 'text-white',
    ring: 'focus-visible:ring-emerald-400'
  },
  amber: {
    border: 'border-amber-500/30 hover:border-amber-400/60',
    bg: 'bg-gradient-to-b from-amber-950/40 via-slate-900/60 to-ink-950/80',
    accentText: 'text-amber-400 group-hover:text-amber-300',
    numText: 'text-white',
    ring: 'focus-visible:ring-amber-400'
  },
  rose: {
    border: 'border-rose-500/30 hover:border-rose-400/60',
    bg: 'bg-gradient-to-b from-rose-950/40 via-slate-900/60 to-ink-950/80',
    accentText: 'text-rose-400 group-hover:text-rose-300',
    numText: 'text-white',
    ring: 'focus-visible:ring-rose-400'
  },
  violet: {
    border: 'border-violet-500/30 hover:border-violet-400/60',
    bg: 'bg-gradient-to-b from-violet-950/40 via-slate-900/60 to-ink-950/80',
    accentText: 'text-violet-400 group-hover:text-violet-300',
    numText: 'text-white',
    ring: 'focus-visible:ring-violet-400'
  },
  slate: {
    border: 'border-slate-700/80 hover:border-slate-500/80',
    bg: 'bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-ink-950/80',
    accentText: 'text-slate-300 group-hover:text-white',
    numText: 'text-white',
    ring: 'focus-visible:ring-slate-400'
  }
};

/**
 * Metric Card strictly adhering to the UX guideline:
 * "no card title, just number and what it represents, and: the button or the link"
 * Supports clear visual hierarchy (size, color shades, typography).
 */
export function HierarchyMetricCard({
  value,
  label,
  buttonText,
  onClick,
  tone = 'cyan',
  size = 'md',
  badge,
  badgeTone = 'neutral',
  icon,
  className
}: HierarchyMetricCardProps) {
  const styles = TONE_STYLES[tone] || TONE_STYLES.cyan;

  const sizeClasses = {
    lg: 'p-6 min-h-[170px]',
    md: 'p-5 min-h-[148px]',
    sm: 'p-4 min-h-[120px]'
  }[size];

  const valueClasses = {
    lg: 'text-4xl sm:text-5xl tracking-tight',
    md: 'text-3xl sm:text-4xl tracking-tight',
    sm: 'text-2xl sm:text-3xl tracking-tight'
  }[size];

  const labelClasses = {
    lg: 'text-base font-medium text-slate-200 mt-2',
    md: 'text-sm font-medium text-slate-300 mt-1.5',
    sm: 'text-xs font-medium text-slate-300 mt-1'
  }[size];

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cx(
        'group relative flex flex-col justify-between rounded-xl border backdrop-blur-md shadow-lg transition-all duration-200',
        onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-2xl active:translate-y-0 focus-visible:outline-none focus-visible:ring-2' : '',
        styles.border,
        styles.bg,
        styles.ring,
        sizeClasses,
        className
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <span className={cx('font-mono font-bold tabular-nums', styles.numText, valueClasses)}>
            {value}
          </span>
          <div className="flex items-center gap-2">
            {badge ? <Badge tone={badgeTone}>{badge}</Badge> : null}
            {icon ? (
              <span className={cx('flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-900/60', styles.accentText)}>
                <Icon name={icon} size={16} />
              </span>
            ) : null}
          </div>
        </div>
        <p className={labelClasses}>{label}</p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3">
        <span className={cx('inline-flex items-center gap-1.5 text-xs font-semibold transition-colors', styles.accentText)}>
          {buttonText}
          <Icon name="chevronRight" size={13} className="transition-transform duration-150 group-hover:translate-x-0.5" />
        </span>
      </div>
    </div>
  );
}
