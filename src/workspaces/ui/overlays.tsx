import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../lib/format.ts';
import { IconButton } from './primitives.tsx';

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function portalTarget(): Element {
  return document.querySelector('.ws') ?? document.body;
}

/** Esc-to-close, Tab focus trap, focus restore, body scroll lock. */
function useOverlayBehaviour(open: boolean, onClose: () => void, panelRef: React.RefObject<HTMLElement | null>) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const panel = panelRef.current;
    const t = setTimeout(() => {
      const first = panel?.querySelector<HTMLElement>('[data-autofocus]') ?? panel?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel)?.focus();
    }, 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
      }
      if (e.key === 'Tab' && panel) {
        const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((n) => n.offsetParent !== null);
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
      prev?.focus?.();
    };
  }, [open, panelRef]);
}

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  /** px – spec range is 600–720 */
  width?: number;
  children: ReactNode;
  footer?: ReactNode;
  headerExtra?: ReactNode;
}

/** Right-side slide-over (progressive disclosure – never a full page redirect). */
export function Drawer({ open, onClose, title, subtitle, width = 680, children, footer, headerExtra }: DrawerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useOverlayBehaviour(open, onClose, ref);
  if (!open) return null;
  return createPortal(
    <div className="ws-noprint fixed inset-0 z-[70]">
      <div className="absolute inset-0 animate-ws-fade-in bg-ink-950/70 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{ width: `min(100vw, ${width}px)` }}
        className="absolute inset-y-0 right-0 flex animate-ws-slide-in flex-col border-l border-slate-700/80 bg-ink-900 shadow-[-24px_0_60px_rgba(0,0,0,.5)]"
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-800 px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-lg font-bold text-white">
              {title}
            </h2>
            {subtitle ? <div className="mt-0.5 text-sm text-slate-300">{subtitle}</div> : null}
          </div>
          <div className="flex items-center gap-2">
            {headerExtra}
            <IconButton label="Close panel" icon="x" onClick={onClose} />
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer ? <footer className="border-t border-slate-800 bg-ink-950/60 px-5 py-3">{footer}</footer> : null}
      </div>
    </div>,
    portalTarget()
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 560
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useOverlayBehaviour(open, onClose, ref);
  if (!open) return null;
  return createPortal(
    <div className="ws-noprint fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-ws-fade-in bg-ink-950/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{ width: `min(100%, ${width}px)` }}
        className={cx('relative flex max-h-[90vh] animate-ws-pop flex-col rounded-2xl border border-slate-700 bg-ink-900 shadow-2xl')}
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-800 px-5 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-white">
              {title}
            </h2>
            {subtitle ? <p className="mt-0.5 text-sm text-slate-300">{subtitle}</p> : null}
          </div>
          <IconButton label="Close dialog" icon="x" onClick={onClose} />
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-800 px-5 py-3">{footer}</footer> : null}
      </div>
    </div>,
    portalTarget()
  );
}
