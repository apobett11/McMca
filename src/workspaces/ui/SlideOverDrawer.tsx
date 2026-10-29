import React, { useEffect, useRef } from 'react';
import { Icon } from './icons.tsx';

export interface SlideOverDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  width?: string; // e.g. 'max-w-2xl' or 'w-[640px]' or 'w-[720px]'
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function SlideOverDrawer({
  open,
  onClose,
  title,
  subtitle,
  width = 'w-[680px]',
  children,
  footer
}: SlideOverDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label={title}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity animate-ws-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          ref={panelRef}
          className={`flex ${width} max-w-[95vw] flex-col border-l border-slate-800/80 bg-slate-950 text-slate-100 shadow-2xl animate-ws-slide-in`}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-800/80 px-6 py-5 bg-slate-900/60 backdrop-blur-md">
            <div className="min-w-0 flex-1 pr-4">
              <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
              {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-800/60 text-slate-300 hover:bg-slate-700/80 hover:text-white transition-colors"
            >
              <Icon name="x" size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {children}
          </div>

          {/* Optional Footer */}
          {footer && (
            <div className="border-t border-slate-800/80 bg-slate-900/80 px-6 py-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
