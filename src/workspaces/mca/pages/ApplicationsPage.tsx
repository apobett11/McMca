import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cx, fmtDateTime, kes, num } from '../../lib/format.ts';
import { useDataTick } from '../../lib/hooks.ts';
import { appendLedger } from '../../lib/ledger.ts';
import { RuleViolation, latency, useMutation, useToast } from '../../lib/toast.tsx';
import type { AwardRow, BudgetTranche, CommitteeState } from '../../types/schema.ts';
import { Drawer, Modal } from '../../ui/overlays.tsx';
import { Icon } from '../../ui/icons.tsx';
import { Badge, Button, Card, Checkbox, Chip, DataTable, EmptyState, FieldLabel, Input, KeyValue, PageHeader, SearchInput, Select, Td, Textarea, Th, rowCls, tbodyCls } from '../../ui/primitives.tsx';
import { MCA_EVENTS, commitAwards, getMembers, getPolicy, getTranche, loadAwardRows, quorum, restoreSnapshot, signPayload, snapshot, generateMemberKey, type CommitItem } from '../store.ts';

const STATE_META: Record<CommitteeState, { label: string; tone: 'amber' | 'emerald' | 'neutral' | 'red' }> = {
  awaiting: { label: 'Awaiting Committee', tone: 'amber' },
  approved: { label: 'Approved', tone: 'emerald' },
  locked: { label: 'Disbursed · Locked', tone: 'neutral' },
  chief_rejected: { label: 'Chief Rejected', tone: 'red' }
};
const needTone = (n: number) => (n >= 90 ? 'gold' : n >= 78 ? 'emerald' : 'cyan');
const deviation = (amount: number, rec: number) => (rec > 0 ? (Math.abs(amount - rec) / rec) * 100 : 0);

type StatusFilter = 'all' | CommitteeState;

export function ApplicationsPage() {
  const [params] = useSearchParams();
  const run = useMutation();
  const tick = useDataTick(MCA_EVENTS);

  const [q, setQ] = useState(params.get('q') ?? '');
  const [loc, setLoc] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uniform, setUniform] = useState('10000');
  const [adjust, setAdjust] = useState<AwardRow | null>(null);
  const [inspect, setInspect] = useState<AwardRow | null>(null);
  const [execOpen, setExecOpen] = useState(false);
  // optimistic overlay: ids shown as approved before the commit returns
  const [optimistic, setOptimistic] = useState<Record<string, number>>({});
  const [trancheOverride, setTrancheOverride] = useState<BudgetTranche | null>(null);

  const tranche = trancheOverride ?? getTranche();
  const policy = useMemo(() => getPolicy(), [tick]);
  const base = useMemo(() => loadAwardRows(), [tick]);
  const rows = useMemo(
    () =>
      base.map((r) => {
        if (optimistic[r.id] !== undefined) return { ...r, state: 'approved' as const, proposed: optimistic[r.id] };
        return r.state === 'awaiting' && drafts[r.id] !== undefined ? { ...r, proposed: drafts[r.id] } : r;
      }),
    [base, drafts, optimistic]
  );
  const locations = useMemo(() => Array.from(new Set(rows.map((r) => r.subLocation))).sort(), [rows]);

  const filtered = rows.filter((r) => {
    if (status !== 'all' && r.state !== status) return false;
    if (loc !== 'all' && r.subLocation !== loc) return false;
    const t = q.trim().toLowerCase();
    return !t || `${r.name} ${r.serial} ${r.school} ${r.subLocation}`.toLowerCase().includes(t);
  });
  const selectable = filtered.filter((r) => r.state === 'awaiting');
  const allOn = selectable.length > 0 && selectable.every((r) => selected.has(r.id));
  const someOn = selectable.some((r) => selected.has(r.id));

  const batch = rows.filter((r) => selected.has(r.id) && r.state === 'awaiting');
  const staged = batch.reduce((a, r) => a + r.proposed, 0);
  const headroom = tranche.hard_cap_amount - tranche.committed_amount;
  const projected = tranche.total_amount - tranche.committed_amount - staged;
  const overCap = staged > headroom;
  const overCapBy = staged - headroom;

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const setProposed = (id: string, v: number) => setDrafts((d) => ({ ...d, [id]: Math.max(0, Math.round(v)) }));

  const applyUniform = () => {
    const v = Math.min(Number(uniform) || 0, policy.perStudentCap);
    if (v <= 0) return;
    setDrafts((d) => ({ ...d, ...Object.fromEntries(batch.map((r) => [r.id, v])) }));
  };
  const applyChief = () => setDrafts((d) => ({ ...d, ...Object.fromEntries(batch.map((r) => [r.id, r.chiefRecommended])) }));

  useEffect(() => {
    // drop selections that are no longer awaiting
    setSelected((s) => new Set(Array.from(s).filter((id) => rows.find((r) => r.id === id)?.state === 'awaiting')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const counts = (s: StatusFilter) => (s === 'all' ? rows.length : rows.filter((r) => r.state === s).length);

  return (
    <>
      <PageHeader eyebrow="Committee allocation & sign-off" title="Allocation Suite" description="Safe, high-speed allocation decisions with hard budget-cap enforcement." />

      <Card className="mb-4" flush>
        <div className="flex flex-wrap items-end gap-3 p-3">
          <div className="min-w-[240px] flex-1">
            <FieldLabel htmlFor="mca-search">Search</FieldLabel>
            <SearchInput id="mca-search" placeholder="Name, serial, institution…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="w-52">
            <FieldLabel htmlFor="mca-loc">Sub-location</FieldLabel>
            <Select id="mca-loc" value={loc} onChange={(e) => setLoc(e.target.value)}>
              <option value="all">All sub-locations</option>
              {locations.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </Select>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Status filter">
            {(['all', 'awaiting', 'approved', 'locked', 'chief_rejected'] as StatusFilter[]).map((s) => (
              <Chip key={s} active={status === s} count={counts(s)} onClick={() => setStatus(s)}>
                {s === 'all' ? 'All' : STATE_META[s].label}
              </Chip>
            ))}
          </div>
        </div>
      </Card>

      <DataTable maxHeight="calc(100vh - 340px)">
        <thead>
          <tr>
            <Th className="w-12">
              <Checkbox checked={allOn} indeterminate={!allOn && someOn} label="Select all awaiting applicants" onChange={(v) => setSelected(v ? new Set(selectable.map((r) => r.id)) : new Set())} />
            </Th>
            <Th>Applicant &amp; serial</Th>
            <Th>Sub-location &amp; polling station</Th>
            <Th>Institution &amp; course</Th>
            <Th align="right">Fee balance (KES)</Th>
            <Th align="center">Chief need score</Th>
            <Th align="right">Requested (KES)</Th>
            <Th align="right" className="min-w-[150px]">
              Proposed award (KES)
            </Th>
            <Th align="center">Status</Th>
            <Th align="right" className="ws-stick-r min-w-[120px]">
              Actions
            </Th>
          </tr>
        </thead>
        <tbody className={tbodyCls}>
          {filtered.map((r) => {
            const meta = STATE_META[r.state];
            const dev = deviation(r.proposed, r.chiefRecommended);
            return (
              <tr key={r.id} className={cx(rowCls, selected.has(r.id) && 'bg-accent/10')}>
                <Td>{r.state === 'awaiting' ? <Checkbox checked={selected.has(r.id)} onChange={() => toggle(r.id)} label={`Select ${r.name}`} /> : <span className="inline-block w-9" />}</Td>
                <Td>
                  <p className="font-semibold text-white">{r.name}</p>
                  <p className="mt-0.5 font-mono text-xs tabular-nums text-slate-200">{r.serial}</p>
                </Td>
                <Td>
                  <p className="text-white">{r.subLocation}</p>
                  <p className="mt-0.5 text-xs text-slate-200">{r.pollingStation}</p>
                </Td>
                <Td>
                  <p className="text-white">{r.school}</p>
                  <p className="mt-0.5 text-xs text-slate-200">{r.course}</p>
                </Td>
                <Td align="right" mono>
                  {num(r.feeBalance)}.00
                </Td>
                <Td align="center">
                  <Badge tone={needTone(r.needScore)}>
                    <span className="font-mono tabular-nums">{r.needScore}/100</span> · {r.needLabel}
                  </Badge>
                </Td>
                <Td align="right" mono>
                  {num(r.requested)}.00
                </Td>
                <Td align="right">
                  {r.state === 'awaiting' ? (
                    <div>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step={500}
                        aria-label={`Proposed award for ${r.name} in KES`}
                        value={r.proposed}
                        onChange={(e) => setProposed(r.id, Number(e.target.value))}
                        className={cx('w-[130px] text-right font-mono tabular-nums', r.proposed > policy.perStudentCap && 'border-red-400 text-red-200')}
                      />
                      {dev > policy.deviationPct ? <p className="mt-0.5 text-[11px] font-semibold text-amber-300">±{dev.toFixed(0)}% vs Chief · note needed</p> : null}
                    </div>
                  ) : (
                    <span className="font-mono tabular-nums font-bold text-white">{num(r.proposed)}.00</span>
                  )}
                </Td>
                <Td align="center">
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </Td>
                <Td align="right" className="ws-stick-r">
                  <div className="flex flex-col items-stretch gap-1.5">
                    <Button variant="primary" icon="scale" disabled={r.state !== 'awaiting'} onClick={() => setAdjust(r)}>
                      Adjust Award
                    </Button>
                    <Button variant="secondary" icon="eye" onClick={() => setInspect(r)} aria-label={`Inspect dossier for ${r.name}`}>
                      Inspect Dossier
                    </Button>
                  </div>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>
      {filtered.length === 0 ? <EmptyState title="No applicants match" body="Adjust filters to see applicants for this cycle." /> : null}

      {/* Floating batch dock */}
      {batch.length > 0 ? (
        <div className="ws-noprint pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 lg:left-[260px]">
          <div role="region" aria-label="Batch allocation dock" className="pointer-events-auto w-full max-w-[1100px] animate-ws-rise rounded-2xl border border-accent/50 bg-ink-900/95 p-3 shadow-[0_20px_60px_rgba(0,0,0,.6)] backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-200">Selected</p>
                <p className="font-mono text-lg font-bold tabular-nums text-white">{batch.length} students</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-200">Staged value</p>
                <p className="font-mono text-lg font-bold tabular-nums text-amber-200">{kes(staged)}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-200">Projected remaining pool</p>
                <p className={cx('font-mono text-lg font-bold tabular-nums', overCap ? 'text-red-300' : projected < tranche.total_amount * 0.1 ? 'text-amber-300' : 'text-emerald-300')}>{kes(projected)}</p>
              </div>
              <button type="button" aria-label="Clear selection" onClick={() => setSelected(new Set())} className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-100 hover:bg-slate-800">
                <Icon name="x" size={18} />
              </button>
            </div>
            {overCap ? (
              <p role="alert" className="mt-2 rounded-lg border border-red-400/60 bg-red-500/10 px-3 py-1.5 text-sm font-semibold text-red-200">
                Hard Budget Cap Exceeded: Staged value exceeds the hard cap by <span className="font-mono">{kes(overCapBy)}</span>. Reduce awards to proceed.
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-3">
              <div className="flex items-center overflow-hidden rounded-lg border border-slate-600">
                <span className="px-2.5 font-mono text-sm font-bold text-slate-100">KES</span>
                <input aria-label="Uniform amount in KES" type="number" min={0} step={500} value={uniform} onChange={(e) => setUniform(e.target.value)} className="h-9 w-24 bg-ink-950 px-2 text-right font-mono text-sm tabular-nums text-white" />
                <Button variant="secondary" className="rounded-none border-0 border-l border-slate-600" onClick={applyUniform}>
                  Set Uniform Amount
                </Button>
              </div>
              <Button variant="secondary" icon="shield" onClick={applyChief}>
                Apply Chief’s Recommendation
              </Button>
              <Button variant="gold" icon="pen" className="ml-auto" disabled={overCap} aria-disabled={overCap ? 'true' : 'false'} onClick={() => setExecOpen(true)}>
                Execute Committee Approval
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <AdjustModal
        row={adjust}
        onClose={() => setAdjust(null)}
        tranche={tranche}
        policy={policy}
        stagedOthers={batch.filter((b) => b.id !== adjust?.id).reduce((a, r) => a + r.proposed, 0)}
        onStage={(id, amount, note) => {
          setDrafts((d) => ({ ...d, [id]: amount }));
          setNotes((n) => ({ ...n, [id]: note }));
          setSelected((s) => new Set(s).add(id));
        }}
      />

      <ExecuteModal
        open={execOpen}
        onClose={() => setExecOpen(false)}
        batch={batch}
        staged={staged}
        projected={projected}
        notes={notes}
        setNotes={setNotes}
        onExecute={async (items, signerId) => {
          const snap = snapshot();
          const ok = await run({
            apply: () => {
              setOptimistic(Object.fromEntries(items.map((i) => [i.id, i.amount])));
              setTrancheOverride({ ...snap.tranche, committed_amount: snap.tranche.committed_amount + items.reduce((a, i) => a + i.amount, 0) });
              setExecOpen(false);
              setSelected(new Set());
            },
            rollback: () => {
              setOptimistic({});
              setTrancheOverride(null);
              restoreSnapshot(snap);
              setSelected(new Set(items.map((i) => i.id)));
            },
            commit: async () => {
              await latency(450);
              const payload = JSON.stringify({ tranche: snap.tranche.id, items, ts: new Date().toISOString() });
              const signature = await signPayload(signerId, payload);
              commitAwards(items);
              const signer = getMembers().find((m) => m.id === signerId);
              await appendLedger('mca', { actor: signer?.name ?? 'MCA', kind: 'committee_approval', target: snap.tranche.id, targetLabel: `${items.length} awards · ${kes(items.reduce((a, i) => a + i.amount, 0))}`, detail: `Signed ECDSA-P256 ${signature.slice(0, 24)}… with key ${signer?.fingerprint?.slice(0, 17) ?? 'n/a'}` });
            },
            success: `Committee approval executed – ${items.length} awards signed and committed`,
            failure: 'Committee approval blocked – nothing was committed',
            onSuccess: () => {
              setOptimistic({});
              setTrancheOverride(null);
              setDrafts((d) => {
                const n = { ...d };
                items.forEach((i) => delete n[i.id]);
                return n;
              });
            }
          });
          return ok;
        }}
      />

      <Drawer open={!!inspect} onClose={() => setInspect(null)} width={700} title={inspect?.name ?? ''} subtitle={inspect ? <span className="font-mono tabular-nums">{inspect.serial}</span> : null} headerExtra={inspect ? <Badge tone={STATE_META[inspect.state].tone}>{STATE_META[inspect.state].label}</Badge> : null}>
        {inspect ? (
          <div className="space-y-4 p-5">
            <Card title="Applicant">
              <dl className="grid grid-cols-2 gap-4">
                <KeyValue label="Sub-location">{inspect.subLocation}</KeyValue>
                <KeyValue label="Polling station">{inspect.pollingStation}</KeyValue>
                <KeyValue label="Guardian">{inspect.parentName}</KeyValue>
                <KeyValue label="Phone" mono>
                  {inspect.phone}
                </KeyValue>
                <KeyValue label="Institution">{inspect.school}</KeyValue>
                <KeyValue label="Course / level">{inspect.course}</KeyValue>
                <KeyValue label="Admission no." mono>
                  {inspect.admissionNo}
                </KeyValue>
                <KeyValue label="Chief need score">
                  <Badge tone={needTone(inspect.needScore)}>
                    {inspect.needScore}/100 · {inspect.needLabel}
                  </Badge>
                </KeyValue>
              </dl>
            </Card>
            <Card title="Financials">
              <dl className="grid grid-cols-2 gap-4">
                <KeyValue label="Outstanding fee balance" mono>
                  {kes(inspect.feeBalance)}
                </KeyValue>
                <KeyValue label="Student request" mono>
                  {kes(inspect.requested)}
                </KeyValue>
                <KeyValue label="Chief recommendation" mono>
                  {kes(inspect.chiefRecommended)}
                </KeyValue>
                <KeyValue label="Proposed award" mono>
                  {kes(inspect.proposed)}
                </KeyValue>
              </dl>
            </Card>
            {inspect.chiefReason ? (
              <Card title="Chief’s finding">
                <p className="text-sm text-slate-50">{inspect.chiefReason}</p>
              </Card>
            ) : null}
            {inspect.justification ? (
              <Card title="Committee justification">
                <p className="text-sm text-slate-50">{inspect.justification}</p>
              </Card>
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </>
  );
}

/* ───────── Individual allocation adjuster ───────── */

function Bar({ label, value, max, tone }: { label: string; value: number; max: number; tone: string }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-semibold text-slate-50">{label}</span>
        <span className="font-mono font-bold tabular-nums text-white">{kes(value)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-800" role="img" aria-label={`${label}: ${kes(value)}`}>
        <div className={cx('h-full rounded-full transition-[width] duration-300', tone)} style={{ width: `${Math.min(100, (value / Math.max(1, max)) * 100)}%` }} />
      </div>
    </div>
  );
}

function AdjustModal({ row, onClose, tranche, policy, stagedOthers, onStage }: { row: AwardRow | null; onClose: () => void; tranche: BudgetTranche; policy: { perStudentCap: number; deviationPct: number }; stagedOthers: number; onStage: (id: string, amount: number, note: string) => void }) {
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState('');
  useEffect(() => {
    if (row) {
      setAmount(row.proposed);
      setNote('');
    }
  }, [row]);
  if (!row) return null;

  const max = Math.min(policy.perStudentCap, Math.max(row.feeBalance, row.requested));
  const dev = deviation(amount, row.chiefRecommended);
  const needsNote = dev > policy.deviationPct;
  const noteOk = !needsNote || note.trim().length >= 15;
  const poolAfter = tranche.total_amount - tranche.committed_amount - stagedOthers - amount;
  const capHeadroomAfter = tranche.hard_cap_amount - tranche.committed_amount - stagedOthers - amount;
  const over = amount > policy.perStudentCap || capHeadroomAfter < 0;
  const scale = Math.max(row.feeBalance, row.requested, row.chiefRecommended, amount);

  return (
    <Modal
      open
      onClose={onClose}
      width={620}
      title={`Adjust award · ${row.name}`}
      subtitle={<span className="font-mono">{row.serial}</span>}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon="check"
            disabled={!noteOk || over || amount <= 0}
            onClick={() => {
              onStage(row.id, amount, note.trim());
              onClose();
            }}
          >
            Save Adjustment
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="space-y-3 rounded-xl border border-slate-700/80 bg-ink-950/40 p-4">
          <Bar label="Outstanding fee balance" value={row.feeBalance} max={scale} tone="bg-slate-300" />
          <Bar label="Student request" value={row.requested} max={scale} tone="bg-cyan-400" />
          <Bar label="Chief recommendation" value={row.chiefRecommended} max={scale} tone="bg-emerald-400" />
          <Bar label="Proposed award" value={amount} max={scale} tone="bg-gradient-to-r from-amber-500 to-amber-300" />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <FieldLabel htmlFor="adj-range">Award amount</FieldLabel>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm font-bold text-slate-100">KES</span>
              <Input type="number" aria-label="Award amount in KES" min={3000} max={45000} step={500} value={amount} onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))} className="w-32 text-right font-mono tabular-nums" />
            </div>
          </div>
          <input id="adj-range" type="range" min={3000} max={45000} step={500} value={Math.min(Math.max(3000, amount), 45000)} onChange={(e) => setAmount(Number(e.target.value))} className="h-6 w-full cursor-pointer accent-amber-400" aria-valuetext={kes(amount)} />
          <div className="mt-1 flex justify-between font-mono text-[11px] tabular-nums text-slate-200">
            <span>3,000</span>
            <button type="button" className="rounded px-1 font-semibold text-emerald-300 hover:bg-slate-800" onClick={() => setAmount(row.chiefRecommended)}>
              Chief {num(row.chiefRecommended)}
            </button>
            <span>45,000</span>
          </div>
        </div>

        <div className={cx('rounded-xl border p-3', over ? 'border-red-400/60 bg-red-500/10' : 'border-slate-700/80 bg-slate-900/60')} aria-live="polite">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-200">Global tranche after this award</p>
          <p className={cx('mt-1 font-mono text-xl font-bold tabular-nums', over ? 'text-red-300' : 'text-emerald-300')}>{kes(poolAfter)}</p>
          <p className="mt-0.5 text-xs text-slate-200">
            Deviation from Chief: <span className={cx('font-mono font-bold', needsNote ? 'text-amber-300' : 'text-slate-50')}>{dev.toFixed(0)}%</span> (limit {policy.deviationPct}%) · per-student cap <span className="font-mono">{kes(policy.perStudentCap)}</span>
          </p>
          {amount > policy.perStudentCap ? <p className="mt-1 text-sm font-semibold text-red-300">Exceeds the per-student cap.</p> : null}
        </div>

        <div>
          <FieldLabel htmlFor="adj-note" hint={needsNote ? `Required · ${note.trim().length}/15 min` : 'Optional'}>
            Justification note
          </FieldLabel>
          <Textarea id="adj-note" value={note} onChange={(e) => setNote(e.target.value)} aria-required={needsNote} placeholder={needsNote ? 'Explain why this award departs from the Chief’s recommendation…' : 'Optional committee note'} />
        </div>
      </div>
    </Modal>
  );
}

/* ───────── Sign-off modal ───────── */

function ExecuteModal({
  open,
  onClose,
  batch,
  staged,
  projected,
  notes,
  setNotes,
  onExecute
}: {
  open: boolean;
  onClose: () => void;
  batch: AwardRow[];
  staged: number;
  projected: number;
  notes: Record<string, string>;
  setNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onExecute: (items: CommitItem[], signerId: string) => Promise<boolean>;
}) {
  const toast = useToast();
  const policy = getPolicy();
  const q = quorum();
  const signer = getMembers()[0];
  const [busy, setBusy] = useState(false);
  const [hasKey, setHasKey] = useState(!!signer?.publicJwk);

  const needNotes = batch.filter((r) => deviation(r.proposed, r.chiefRecommended) > policy.deviationPct);
  const notesOk = needNotes.every((r) => (notes[r.id] ?? '').trim().length >= 15);
  const tooBig = batch.filter((r) => r.proposed > policy.perStudentCap);
  const ready = q.met && notesOk && tooBig.length === 0 && batch.length > 0;

  const go = async () => {
    setBusy(true);
    try {
      if (!hasKey) {
        await generateMemberKey(signer.id);
        setHasKey(true);
      }
      await onExecute(
        batch.map((r) => ({ id: r.id, amount: r.proposed, chiefRecommended: r.chiefRecommended, justification: notes[r.id] })),
        signer.id
      );
    } catch (e) {
      toast.push({ tone: 'red', title: 'Could not create sign-off key', body: e instanceof RuleViolation || e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={680}
      title="Execute committee approval"
      subtitle="Signs the batch with your ECDSA key and commits it against the tranche."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="gold" icon="pen" disabled={!ready} loading={busy} onClick={() => void go()}>
            Sign &amp; execute
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <dl className="grid grid-cols-3 gap-3">
          {[
            ['Awards', String(batch.length)],
            ['Staged value', kes(staged)],
            ['Pool after', kes(projected)]
          ].map(([l, v]) => (
            <div key={l} className="rounded-lg border border-slate-700 bg-slate-900/60 p-3">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-200">{l}</dt>
              <dd className="mt-0.5 break-words font-mono text-sm font-bold tabular-nums text-white">{v}</dd>
            </div>
          ))}
        </dl>

        <div className={cx('flex items-center gap-3 rounded-lg border p-3 text-sm', q.met ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100' : 'border-red-400/60 bg-red-500/10 text-red-100')}>
          <Icon name={q.met ? 'checkCircle' : 'alert'} size={18} />
          <span>
            Ward quorum <strong className="font-mono">{q.present}/{q.total}</strong> present — {q.met ? 'requirement met' : `${q.required} signatories required. Mark attendance in Committee Vault.`}
          </span>
        </div>

        {tooBig.length ? (
          <p role="alert" className="rounded-lg border border-red-400/60 bg-red-500/10 p-3 text-sm font-semibold text-red-200">
            {tooBig.length} award{tooBig.length > 1 ? 's' : ''} exceed the per-student cap of {kes(policy.perStudentCap)}.
          </p>
        ) : null}

        {needNotes.length ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-amber-200">
              {needNotes.length} award{needNotes.length > 1 ? 's' : ''} deviate &gt;{policy.deviationPct}% from the Chief — justification required:
            </p>
            {needNotes.map((r) => (
              <div key={r.id}>
                <FieldLabel htmlFor={`just-${r.id}`} hint={`${num(r.proposed)} vs Chief ${num(r.chiefRecommended)}`}>
                  {r.name}
                </FieldLabel>
                <Textarea id={`just-${r.id}`} value={notes[r.id] ?? ''} onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))} className="min-h-[64px]" placeholder="Minimum 15 characters" />
              </div>
            ))}
          </div>
        ) : null}

        <p className="text-xs text-slate-200">
          Signatory: <strong className="text-white">{signer?.name}</strong> · {hasKey ? <span className="font-mono">{signer.fingerprint}</span> : 'no key yet – one will be generated in this browser (non-extractable) on signing.'} · {fmtDateTime(new Date())}
        </p>
      </div>
    </Modal>
  );
}
