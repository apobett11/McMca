import { useCallback, useEffect, useRef, useState } from 'react';

export function useDebounced<T>(value: T, delay = 200): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/** Ticks every `ms` – drives live timers / stall durations. */
export function useNow(ms = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

/** Re-renders when any of the given window events fire (legacy data layer notifies via CustomEvents). */
export function useDataTick(events: string[]): number {
  const [tick, setTick] = useState(0);
  const key = events.join('|');
  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    events.forEach((e) => window.addEventListener(e, bump));
    return () => events.forEach((e) => window.removeEventListener(e, bump));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return tick;
}

export interface Hotkey {
  /** e.g. 'ctrl+/', 'j', 'shift+r', 'escape' */
  combo: string;
  handler: (e: KeyboardEvent) => void;
  /** also fire while focus is inside inputs (default false, except for modifier combos) */
  allowInInput?: boolean;
}

function matches(e: KeyboardEvent, combo: string): boolean {
  const parts = combo.toLowerCase().split('+');
  const key = parts[parts.length - 1];
  const wantCtrl = parts.includes('ctrl') || parts.includes('mod');
  const wantShift = parts.includes('shift');
  const wantAlt = parts.includes('alt');
  const ctrl = e.ctrlKey || e.metaKey;
  return e.key.toLowerCase() === key && ctrl === wantCtrl && e.shiftKey === wantShift && e.altKey === wantAlt;
}

export function useHotkeys(keys: Hotkey[], enabled = true): void {
  const ref = useRef(keys);
  ref.current = keys;
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
      for (const k of ref.current) {
        if (!matches(e, k.combo)) continue;
        const hasMod = /ctrl|mod|alt/.test(k.combo.toLowerCase());
        if (typing && !k.allowInInput && !hasMod) continue;
        k.handler(e);
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);
}

/** Persisted state in localStorage (JSON). */
export function useStored<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const [val, setVal] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  const set = useCallback(
    (v: T | ((p: T) => T)) => {
      setVal((prev) => {
        const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* quota */
        }
        return next;
      });
    },
    [key]
  );
  return [val, set];
}
