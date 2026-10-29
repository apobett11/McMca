import React from 'react';
import type { Tone } from '../types/schema.ts';

interface BadgeProps {
  children: React.ReactNode;
  tone?: Tone | 'gray' | 'blue' | 'purple' | 'green';
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

const toneMap: Record<string, string> = {
  neutral: 'border-slate-700/60 bg-slate-800/80 text-slate-300',
  gray: 'border-slate-700/60 bg-slate-800/80 text-slate-300',
  accent: 'border-cyan-500/40 bg-cyan-950/60 text-cyan-200',
  cyan: 'border-cyan-500/40 bg-cyan-950/60 text-cyan-200',
  emerald: 'border-emerald-500/40 bg-emerald-950/60 text-emerald-200',
  green: 'border-emerald-500/40 bg-emerald-950/60 text-emerald-200',
  amber: 'border-amber-500/40 bg-amber-950/60 text-amber-200',
  red: 'border-rose-500/40 bg-rose-950/60 text-rose-200',
  violet: 'border-purple-500/40 bg-purple-950/60 text-purple-200',
  purple: 'border-purple-500/40 bg-purple-950/60 text-purple-200',
  gold: 'border-amber-500/40 bg-amber-950/60 text-amber-200'
};

export function Badge({
  children,
  tone = 'neutral',
  size = 'md',
  pulse = false,
  className = ''
}: BadgeProps) {
  const toneClass = toneMap[tone] || toneMap.neutral;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${sizeClass} ${toneClass} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}
