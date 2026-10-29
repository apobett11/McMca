import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Icon } from '../ui/icons.tsx';
import type { Tone } from '../types/schema.ts';

export interface ToastInput {
  tone?: Tone;
  title: string;
  body?: string;
  action?: { label: string; onClick: () => void };
  /** ms; 0 = sticky */
  duration?: number;
}
interface ToastItem extends ToastInput {
  id: number;
}

interface ToastApi {
  push: (t: ToastInput) => void;
}

const Ctx = createContext<ToastApi | null>(null);

const toneStyle: Record<string, string> = {
  emerald: 'border-emerald-400/50 bg-emerald-950/90 text-emerald-100',
  red: 'border-red-400/60 bg-red-950/95 text-red-100',
  amber: 'border-amber-400/60 bg-amber-950/95 text-amber-100',
  neutral: 'border-slate-600 bg-slate-900/95 text-slate-100'
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (t: ToastInput) => {
      const id = ++seq.current;
      setItems((l) => [...l.slice(-3), { ...t, id }]);
      const d = t.duration ?? (t.tone === 'red' ? 7000 : 4200);
      if (d > 0) setTimeout(() => dismiss(id), d);
    },
    [dismiss]
  );

  const api = useMemo(() => ({ push }), [push]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <div
        className="ws-noprint pointer-events-none fixed bottom-24 right-4 z-[90] flex w-[min(92vw,380px)] flex-col gap-2"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
      >
        {items.map((t) => {
          const style = toneStyle[t.tone === 'emerald' || t.tone === 'red' || t.tone === 'amber' ? t.tone : 'neutral'];
          return (
            <div
              key={t.id}
              role={t.tone === 'red' ? 'alert' : 'status'}
              className={`pointer-events-auto flex animate-ws-rise items-start gap-3 rounded-xl border p-3 shadow-2xl backdrop-blur-md ${style}`}
            >
              <Icon name={t.tone === 'red' ? 'alert' : t.tone === 'amber' ? 'alert' : 'check'} size={18} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{t.title}</p>
                {t.body ? <p className="mt-0.5 text-sm opacity-95">{t.body}</p> : null}
                {t.action ? (
                  <button
                    type="button"
                    onClick={() => {
                      t.action?.onClick();
                      dismiss(t.id);
                    }}
                    className="mt-2 inline-flex min-h-[36px] items-center rounded-md border border-current px-3 text-sm font-semibold hover:bg-white/10"
                  >
                    {t.action.label}
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismiss(t.id)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md hover:bg-white/10"
              >
                <Icon name="x" size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastApi {
  const c = useContext(Ctx);
  if (!c) throw new Error('useToast must be used inside <ToastProvider>');
  return c;
}

export interface MutationOptions<T> {
  /** Synchronously apply the optimistic UI change. */
  apply: () => void;
  /** Restore the previous UI state if commit fails. */
  rollback: () => void;
  /** Persist. Throw (or reject) to trigger rollback + error toast. */
  commit: () => Promise<T> | T;
  success?: string | ((r: T) => string);
  /** Error toast title; the thrown message becomes the body. */
  failure?: string;
  onSuccess?: (r: T) => void;
}

/**
 * Optimistic UI: apply immediately, commit in the background, and on failure
 * roll back + raise a toast with a Retry action.
 */
export function useMutation() {
  const toast = useToast();
  const run = useCallback(
    async function exec<T>(opts: MutationOptions<T>): Promise<boolean> {
      opts.apply();
      try {
        const result = await opts.commit();
        if (opts.success) {
          toast.push({ tone: 'emerald', title: typeof opts.success === 'function' ? opts.success(result) : opts.success });
        }
        opts.onSuccess?.(result);
        return true;
      } catch (err) {
        opts.rollback();
        toast.push({
          tone: 'red',
          title: opts.failure ?? 'Action failed – changes were rolled back',
          body: err instanceof Error ? err.message : String(err),
          action: { label: 'Retry', onClick: () => void exec(opts) }
        });
        return false;
      }
    },
    [toast]
  );
  return run;
}

/** Simulated network round-trip for localStorage-backed stores (keeps optimistic UX honest). */
export const latency = (ms = 350) => new Promise<void>((r) => setTimeout(r, ms));

export class RuleViolation extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RuleViolation';
  }
}
