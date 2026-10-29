/**
 * MCA workspace store.
 * - Reads applications from the existing MCA data layer (src/dashboards/mca/utils/mcaData.js).
 * - Persists tranche / awards / manifests / appeals / committee policy in a localStorage mirror whose
 *   column names match sql/budget_tranches.sql, so swapping to Supabase RPCs is a drop-in.
 * - Every mutating function re-validates hard rules (budget cap, per-student cap, reserve cap) and
 *   throws RuleViolation – the UI applies optimistically and rolls back on throw.
 */
import * as mca from '../../dashboards/mca/utils/mcaData.js';
import { clamp, hash01 } from '../lib/format.ts';
import { RuleViolation } from '../lib/toast.tsx';
import type { AwardRow, BudgetTranche, CommitteeState, InstitutionPayable, ManifestStatus } from '../types/schema.ts';

export const MCA_EVENTS = ['mcmca_mca_apps_updated', 'mcmca_ws_mca_updated'];
export const CYCLE = '2026/2027';
const notify = () => window.dispatchEvent(new CustomEvent('mcmca_ws_mca_updated'));

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, v: unknown): void {
  localStorage.setItem(key, JSON.stringify(v));
  notify();
}

/* ───────── legacy shape ───────── */

interface LegacyMcaApp {
  id: string;
  year: string;
  serial: string;
  fullName: string;
  educationLevel: string;
  school: string;
  pollingStation: string;
  village: string;
  bursaryAmount: number;
  allocatedAmount?: number | null;
  month: string;
  status: string;
  submittedDate: string;
  parentName: string;
  phone: string;
  needScore: string;
  failureReason?: string;
  feeBalance?: number;
  course?: string;
  admissionNumber?: string;
}

export const legacyApps = (): LegacyMcaApp[] => (mca.getMCAApplications() as unknown as LegacyMcaApp[]).filter((a) => a.year === CYCLE);

/* ───────── tranche ───────── */

const TRANCHE_KEY = 'mcmca_ws_mca_tranche_v1';
const DEFAULT_TRANCHE: BudgetTranche = {
  id: 'tr-2026-27-t1',
  academic_cycle: CYCLE,
  title: 'Tendeno/Sorget NG-CDF Bursary Tranche 1',
  total_amount: 15_000_000,
  committed_amount: 6_580_000,
  hard_cap_amount: 15_000_000,
  reserve_amount: 1_000_000,
  reserve_committed: 0,
  warn_threshold_pct: 80,
  min_sublocation_share_pct: 15,
  is_active: true,
  created_at: '2026-01-10T08:00:00.000Z',
  updated_at: '2026-01-10T08:00:00.000Z'
};

export const getTranche = (): BudgetTranche => read(TRANCHE_KEY, DEFAULT_TRANCHE);
export function saveTranche(t: BudgetTranche): void {
  write(TRANCHE_KEY, { ...t, updated_at: new Date().toISOString() });
}

/* ───────── committee policy & members ───────── */

export interface Member {
  id: string;
  name: string;
  role: string;
  present: boolean;
  fingerprint: string;
  publicJwk: JsonWebKey | null;
  keyCreatedAt: string | null;
  revoked: boolean;
}
export interface Policy {
  perStudentCap: number;
  deviationPct: number;
  quorumRequired: number;
}
const POLICY_KEY = 'mcmca_ws_mca_policy_v1';
const MEMBERS_KEY = 'mcmca_ws_mca_members_v1';

export const getPolicy = (): Policy => read(POLICY_KEY, { perStudentCap: 60_000, deviationPct: 30, quorumRequired: 3 });
export const savePolicy = (p: Policy): void => write(POLICY_KEY, p);

const mkMember = (id: string, name: string, role: string, present: boolean): Member => ({ id, name, role, present, fingerprint: '', publicJwk: null, keyCreatedAt: null, revoked: false });
export const getMembers = (): Member[] =>
  read<Member[]>(MEMBERS_KEY, [
    mkMember('m1', (mca.getMCAProfile() as { fullName: string }).fullName, 'Chair · MCA', true),
    mkMember('m2', 'Mercy Chepkirui', 'Ward Administrator (Secretary)', true),
    mkMember('m3', 'Chief Peter Waweru', 'Chief Representative', true),
    mkMember('m4', 'Rev. Daniel Koskei', 'Faith Community Representative', true),
    mkMember('m5', 'Beatrice Kosgei', 'Women & Youth Representative', false)
  ]);
export const saveMembers = (m: Member[]): void => write(MEMBERS_KEY, m);
export const quorum = (): { present: number; total: number; required: number; met: boolean } => {
  const ms = getMembers().filter((m) => !m.revoked);
  const present = ms.filter((m) => m.present).length;
  const required = getPolicy().quorumRequired;
  return { present, total: ms.length, required, met: present >= required };
};

/* ───────── WebCrypto sign-off keys (ECDSA P-256, private key non-extractable, kept in IndexedDB) ───────── */

const idb = (): Promise<IDBDatabase> =>
  new Promise((res, rej) => {
    const r = indexedDB.open('mcmca_ws_keys', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('keys');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
async function idbPut(id: string, key: CryptoKey): Promise<void> {
  const db = await idb();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction('keys', 'readwrite');
    tx.objectStore('keys').put(key, id);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}
async function idbGet(id: string): Promise<CryptoKey | null> {
  const db = await idb();
  return new Promise((res, rej) => {
    const q = db.transaction('keys').objectStore('keys').get(id);
    q.onsuccess = () => res((q.result as CryptoKey) ?? null);
    q.onerror = () => rej(q.error);
  });
}
const hex = (b: ArrayBuffer): string =>
  Array.from(new Uint8Array(b))
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');

export async function generateMemberKey(memberId: string): Promise<Member[]> {
  if (!crypto?.subtle) throw new RuleViolation('Secure context required for key generation (use https or localhost).');
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign', 'verify']);
  await idbPut(memberId, pair.privateKey);
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
  const raw = await crypto.subtle.exportKey('raw', pair.publicKey);
  const fp = hex(await crypto.subtle.digest('SHA-256', raw)).match(/.{2}/g)!.slice(0, 12).join(':');
  const next = getMembers().map((m) => (m.id === memberId ? { ...m, publicJwk: jwk, fingerprint: fp, keyCreatedAt: new Date().toISOString(), revoked: false } : m));
  saveMembers(next);
  return next;
}

/** Signs `payload` with the member's non-extractable private key; returns hex signature. */
export async function signPayload(memberId: string, payload: string): Promise<string> {
  const key = await idbGet(memberId);
  if (!key) throw new RuleViolation('No sign-off key on this device for this signatory. Generate one in Profile → Signatory vault.');
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(payload));
  return hex(sig);
}

/* ───────── awards ───────── */

export interface AwardRecord {
  amount: number;
  state: 'approved';
  justification: string;
  chiefRecommended: number;
  approvedAt: string;
  reserve: boolean;
  viaAppeal: boolean;
}
const AWARDS_KEY = 'mcmca_ws_mca_awards_v1';
export const getAwards = (): Record<string, AwardRecord> => read(AWARDS_KEY, {});

const round500 = (n: number) => Math.round(n / 500) * 500;
const NEED: Record<string, { label: AwardRow['needLabel']; base: number }> = {
  'Extreme Need': { label: 'Extreme Need', base: 92 },
  'High Need': { label: 'High Need', base: 80 },
  'Moderate Need': { label: 'Moderate Need', base: 62 }
};
const COURSE_BY_LEVEL: Record<string, string> = { Primary: 'Primary (Std 8)', Secondary: 'Secondary (KCSE track)', 'TVET / Vocational': 'TVET Diploma', University: 'Bachelor’s Degree' };

export function loadAwardRows(): AwardRow[] {
  const awards = getAwards();
  return legacyApps().map((a) => {
    const need = NEED[a.needScore] ?? { label: 'High Need' as const, base: 74 };
    const j = hash01(a.id);
    const needScore = clamp(Math.round(need.base + j * 6), 0, 99);
    const requested = a.bursaryAmount;
    const chiefRecommended = round500(requested * (needScore >= 90 ? 1 : needScore >= 78 ? 0.85 : 0.7));
    const rec = awards[a.id];
    const locked = a.status === 'Disbursed' || a.status === 'Paid to account';
    const rejected = a.status === 'Failed' && !rec;
    const state: CommitteeState = rec ? 'approved' : locked ? 'locked' : rejected ? 'chief_rejected' : 'awaiting';
    return {
      id: a.id,
      serial: a.serial,
      name: a.fullName,
      subLocation: a.village,
      pollingStation: a.pollingStation.replace(/ Polling Station$/, ''),
      school: a.school,
      course: a.course ?? COURSE_BY_LEVEL[a.educationLevel] ?? a.educationLevel,
      level: a.educationLevel,
      // Adapter fallback until application_details.balance is synced from Supabase
      feeBalance: a.feeBalance ?? round500(requested * 1.4 + j * 3000),
      needScore,
      needLabel: need.label,
      requested,
      chiefRecommended,
      proposed: rec ? rec.amount : locked ? (a.allocatedAmount ?? requested) : chiefRecommended,
      state,
      justification: rec?.justification ?? '',
      appealable: rejected,
      chiefReason: a.failureReason ?? '',
      parentName: a.parentName,
      phone: a.phone,
      admissionNo: a.admissionNumber ?? `ADM/${a.serial.replace(/\D/g, '').slice(-3).padStart(3, '0')}/${CYCLE.slice(2, 4)}`
    };
  });
}

export interface CommitItem {
  id: string;
  amount: number;
  justification?: string;
  chiefRecommended: number;
  viaAppeal?: boolean;
}

/** Atomic: validates the whole batch against hard rules, then commits all-or-nothing. */
export function commitAwards(items: CommitItem[], opts: { reserve?: boolean } = {}): BudgetTranche {
  const tranche = getTranche();
  const policy = getPolicy();
  const awards = getAwards();
  let delta = 0;
  for (const it of items) {
    if (!Number.isFinite(it.amount) || it.amount <= 0) throw new RuleViolation(`Award for ${it.id} must be greater than zero.`);
    if (it.amount > policy.perStudentCap) throw new RuleViolation(`Award KES ${it.amount.toLocaleString('en-KE')} exceeds the per-student cap of KES ${policy.perStudentCap.toLocaleString('en-KE')}.`);
    const dev = it.chiefRecommended > 0 ? (Math.abs(it.amount - it.chiefRecommended) / it.chiefRecommended) * 100 : 0;
    if (dev > policy.deviationPct && !(it.justification && it.justification.trim().length >= 15)) {
      throw new RuleViolation(`A written justification (≥15 chars) is required when the award deviates ${dev.toFixed(0)}% from the Chief’s recommendation.`);
    }
    delta += it.amount - (awards[it.id]?.amount ?? 0);
  }
  if (tranche.committed_amount + delta > tranche.hard_cap_amount) {
    throw new RuleViolation(`Hard budget cap exceeded: committing KES ${delta.toLocaleString('en-KE')} would exceed the cap by KES ${(tranche.committed_amount + delta - tranche.hard_cap_amount).toLocaleString('en-KE')}.`);
  }
  if (opts.reserve && tranche.reserve_committed + delta > tranche.reserve_amount) {
    throw new RuleViolation(`Special Hardship Reserve exhausted: only KES ${(tranche.reserve_amount - tranche.reserve_committed).toLocaleString('en-KE')} remains.`);
  }
  const now = new Date().toISOString();
  const next = { ...awards };
  items.forEach((it) => {
    next[it.id] = { amount: it.amount, state: 'approved', justification: it.justification ?? '', chiefRecommended: it.chiefRecommended, approvedAt: now, reserve: !!opts.reserve, viaAppeal: !!it.viaAppeal };
  });
  const t2: BudgetTranche = { ...tranche, committed_amount: tranche.committed_amount + delta, reserve_committed: tranche.reserve_committed + (opts.reserve ? delta : 0), updated_at: now };
  localStorage.setItem(AWARDS_KEY, JSON.stringify(next));
  localStorage.setItem(TRANCHE_KEY, JSON.stringify(t2));

  // keep the legacy data layer consistent for other portals
  const apps = mca.getMCAApplications() as unknown as LegacyMcaApp[];
  const ids = new Set(items.map((i) => i.id));
  mca.saveMCAApplications(apps.map((a) => (ids.has(a.id) ? { ...a, status: 'Allocated', allocatedAmount: next[a.id].amount } : a)));
  notify();
  return t2;
}

/** Restore a snapshot (used by UI rollback when a later step in the same mutation fails). */
export function restoreSnapshot(snap: { tranche: BudgetTranche; awards: Record<string, AwardRecord> }): void {
  localStorage.setItem(TRANCHE_KEY, JSON.stringify(snap.tranche));
  localStorage.setItem(AWARDS_KEY, JSON.stringify(snap.awards));
  notify();
}
export const snapshot = () => ({ tranche: getTranche(), awards: getAwards() });

/* ───────── appeals ───────── */

export interface AppealDecision {
  decision: 'upheld' | 'dismissed';
  amount: number;
  note: string;
  reserve: boolean;
  at: string;
}
const APPEALS_KEY = 'mcmca_ws_mca_appeals_v1';
export const getAppealDecisions = (): Record<string, AppealDecision> => read(APPEALS_KEY, {});
export const saveAppealDecisions = (d: Record<string, AppealDecision>): void => write(APPEALS_KEY, d);

/* ───────── institutions & manifests ───────── */

const BANKS = ['Equity Bank', 'KCB Bank', 'Co-operative Bank', 'Absa Bank Kenya', 'Family Bank'];
const BRANCHES = ['Kericho', 'Kipkelion', 'Litein', 'Sotik'];
const MANIFEST_KEY = 'mcmca_ws_mca_manifests_v1';
type ManifestMap = Record<string, { status: ManifestStatus; at: string }>;
export const getManifests = (): ManifestMap => read(MANIFEST_KEY, {});
export function setManifestStatus(code: string, status: ManifestStatus): void {
  write(MANIFEST_KEY, { ...getManifests(), [code]: { status, at: new Date().toISOString() } });
}
export function restoreManifests(m: ManifestMap): void {
  write(MANIFEST_KEY, m);
}

const instCode = (name: string) => `INS-${String(Math.floor(hash01(`code:${name}`) * 9000) + 1000)}`;

/** Bank registry is a deterministic seed until institution banking is stored in application_details. */
export function loadPayables(): InstitutionPayable[] {
  const rows = loadAwardRows().filter((r) => r.state === 'approved' || r.state === 'locked');
  const manifests = getManifests();
  const legacy = new Map(legacyApps().map((a) => [a.id, a.status]));
  const by = new Map<string, AwardRow[]>();
  rows.forEach((r) => by.set(r.school, [...(by.get(r.school) ?? []), r]));
  return Array.from(by.entries())
    .map(([name, rs]) => {
      const code = instCode(name);
      const h = hash01(`bank:${name}`);
      const derived: ManifestStatus = rs.every((r) => legacy.get(r.id) === 'Paid to account') ? 'EFT Dispatched' : rs.every((r) => ['Disbursed', 'Paid to account'].includes(legacy.get(r.id) ?? '')) ? 'Cheque Drawn' : 'Draft';
      return {
        code,
        name,
        bank: BANKS[Math.floor(h * BANKS.length)],
        branch: BRANCHES[Math.floor(hash01(`br:${name}`) * BRANCHES.length)],
        accountNo: String(Math.floor(1_000_000_000 + hash01(`acc:${name}`) * 8_999_999_999)),
        accountVerified: hash01(`ver:${name}`) > 0.2,
        status: manifests[code]?.status ?? derived,
        roster: rs.map((r) => ({ id: r.id, name: r.name, admissionNo: r.admissionNo, award: r.proposed })),
        total: rs.reduce((a, r) => a + r.proposed, 0)
      };
    })
    .sort((a, b) => b.total - a.total);
}

/* ───────── analytics ───────── */

export function equity(rows: AwardRow[], by: 'sub' | 'level') {
  const live = rows.filter((r) => r.state !== 'chief_rejected');
  const key = (r: AwardRow) => (by === 'sub' ? r.subLocation : r.level.startsWith('TVET') ? 'TVET' : r.level);
  const m = new Map<string, number>();
  live.forEach((r) => m.set(key(r), (m.get(key(r)) ?? 0) + r.proposed));
  const total = Array.from(m.values()).reduce((a, b) => a + b, 0) || 1;
  return Array.from(m.entries())
    .map(([k, v]) => ({ key: k, amount: v, share: (v / total) * 100 }))
    .sort((a, b) => b.amount - a.amount);
}

const MONTH_ORDER = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function velocity() {
  const apps = legacyApps();
  const months = MONTH_ORDER.filter((m) => apps.some((a) => a.month === m));
  return {
    months,
    submissions: months.map((m) => apps.filter((a) => a.month === m).length),
    approvals: months.map((m) => apps.filter((a) => a.month === m && ['Allocated', 'Disbursed', 'Paid to account'].includes(a.status)).length),
    appeals: months.map((m) => apps.filter((a) => a.month === m && a.status === 'Failed').length)
  };
}

export function vetting() {
  const apps = legacyApps();
  const cleared = apps.filter((a) => a.status !== 'Failed').length;
  return { cleared, total: apps.length, pct: apps.length ? (cleared / apps.length) * 100 : 0 };
}
