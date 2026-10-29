import type { LedgerEntry } from '../types/schema.ts';

type Workspace = LedgerEntry['workspace'];

const key = (ws: Workspace) => `mcmca_ws_ledger_v1_${ws}`;
export const LEDGER_EVENT = 'mcmca_ws_ledger_updated';
const GENESIS = '0'.repeat(64);

async function sha256(input: string): Promise<string> {
  try {
    if (globalThis.crypto?.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    /* fall through */
  }
  // Non-secure-context fallback (FNV-1a ×4, 128 bit) – still chain-verifiable.
  let out = '';
  for (let r = 0; r < 4; r++) {
    let h = 2166136261 ^ r;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    out += (h >>> 0).toString(16).padStart(8, '0');
  }
  return out.padEnd(64, '0');
}

export function readLedger(ws: Workspace): LedgerEntry[] {
  try {
    const raw = localStorage.getItem(key(ws));
    return raw ? (JSON.parse(raw) as LedgerEntry[]) : [];
  } catch {
    return [];
  }
}

function payload(e: Omit<LedgerEntry, 'hash'>): string {
  return [e.id, e.ts, e.actor, e.workspace, e.kind, e.target, e.targetLabel, e.detail, e.prevHash].join('\u241F');
}

let queue: Promise<unknown> = Promise.resolve();

export interface LedgerInput {
  actor: string;
  kind: string;
  target: string;
  targetLabel: string;
  detail: string;
}

/** Append-only, SHA-256 hash-chained. Serialised so concurrent actions never fork the chain. */
export function appendLedger(ws: Workspace, input: LedgerInput): Promise<LedgerEntry> {
  const run = async (): Promise<LedgerEntry> => {
    const list = readLedger(ws);
    const prevHash = list.length ? list[list.length - 1].hash : GENESIS;
    const base: Omit<LedgerEntry, 'hash'> = {
      id: `${ws.slice(0, 2)}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      ts: new Date().toISOString(),
      workspace: ws,
      prevHash,
      ...input
    };
    const entry: LedgerEntry = { ...base, hash: await sha256(payload(base)) };
    localStorage.setItem(key(ws), JSON.stringify([...list, entry]));
    window.dispatchEvent(new CustomEvent(LEDGER_EVENT, { detail: { ws } }));
    return entry;
  };
  const p = queue.then(run, run);
  queue = p.catch(() => undefined);
  return p;
}

export async function verifyLedger(ws: Workspace): Promise<{ ok: boolean; count: number; brokenAt: number | null }> {
  const list = readLedger(ws);
  let prev = GENESIS;
  for (let i = 0; i < list.length; i++) {
    const { hash, ...rest } = list[i];
    if (rest.prevHash !== prev || (await sha256(payload(rest))) !== hash) {
      return { ok: false, count: list.length, brokenAt: i };
    }
    prev = hash;
  }
  return { ok: true, count: list.length, brokenAt: null };
}

export const shortHash = (h: string): string => `${h.slice(0, 8)}…${h.slice(-6)}`;

export function isToday(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}
