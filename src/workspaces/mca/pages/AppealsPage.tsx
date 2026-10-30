import { useEffect, useMemo, useState } from 'react';
import { cx, fmtDateTime, kes, num } from '../../lib/format.ts';
import { useDataTick } from '../../lib/hooks.ts';
import { appendLedger } from '../../lib/ledger.ts';
import { RuleViolation, latency, useMutation } from '../../lib/toast.tsx';
import type { AwardRow } from '../../types/schema.ts';
import { Icon } from '../../ui/icons.tsx';
import { Avatar, Badge, Button, Card, Chip, EmptyState, FieldLabel, Input, KeyValue, PageHeader, ProgressBar, Switch, Textarea } from '../../ui/primitives.tsx';
import { MCA_EVENTS, commitAwards, getAppealDecisions, getMembers, getPolicy, getTranche, loadAwardRows, quorum, restoreSnapshot, saveAppealDecisions, snapshot, type AppealDecision } from '../store.ts';

type View = 'pending' | 'decided';

export function AppealsPage() {
  const run = useMutation();
  const tick = useDataTick(MCA_EVENTS);
  const [view, setView] = useState<View>('pending');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [useReserve, setUseReserve] = useState(false);
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState('');
  const [overlay, setOverlay] = useState<Record<string, AppealDecision>>({});

  const rows = useMemo(() => loadAwardRows(), [tick]);
  const decisions = useMemo(() => ({ ...getAppealDecisions(), ...overlay }), [tick, overlay]);
  const tranche = getTranche();
  const policy = getPolicy();
  const q = quorum();

  const petitions = rows.filter((r) => r.appealable || decisions[r.id]);
  const pending = petitions.filter((r) => !decisions[r.id]);
  const decided = petitions.filter((r) => decisions[r.id]);
  const list = view === 'pending' ? pending : decided;
  const active: AwardRow | null = list.find((r) => r.id === activeId) ?? list[0] ?? null;
  const decision = active ? decisions[active.id] : undefined;

  useEffect(() => {
    if (active) {
      setAmount(Math.min(policy.perStudentCap, Math.round((active.requested * 0.7) / 500) * 500));
      setNote('');
      setUseReserve(false);
      if (active.id !== activeId) setActiveId(active.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  const reserveLeft = tranche.reserve_amount - tranche.reserve_committed;
  const headroom = tranche.hard_cap_amount - tranche.committed_amount;
  const overReserve = useReserve && amount > reserveLeft;
  const overCap = amount > headroom;
  const noteOk = note.trim().length >= 20;

  const decide = (kind: 'upheld' | 'dismissed') => {
    if (!active) return;
    const r = active;
    const snap = snapshot();
    const prevDecisions = getAppealDecisions();
    const d: AppealDecision = { decision: kind, amount: kind === 'upheld' ? amount : 0, note: note.trim(), reserve: kind === 'upheld' && useReserve, at: new Date().toISOString() };
    return run({
      apply: () => setOverlay((o) => ({ ...o, [r.id]: d })),
      rollback: () => {
        setOverlay((o) => {
          const n = { ...o };
          delete n[r.id];
          return n;
        });
        restoreSnapshot(snap);
        saveAppealDecisions(prevDecisions);
      },
      commit: async () => {
        await latency(400);
        if (!q.met) throw new RuleViolation(`Tribunal quorum not met (${q.present}/${q.required}). Mark attendance in Committee Vault.`);
        if (kind === 'upheld') {
          commitAwards([{ id: r.id, amount, chiefRecommended: 0, justification: note.trim(), viaAppeal: true }], { reserve: useReserve });
        }
        saveAppealDecisions({ ...getAppealDecisions(), [r.id]: d });
        await appendLedger('mca', {
          actor: getMembers()[0]?.name ?? 'MCA',
          kind: kind === 'upheld' ? 'appeal_upheld' : 'appeal_dismissed',
          target: r.id,
          targetLabel: r.name,
          detail: kind === 'upheld' ? `Upheld; ${kes(amount)} from ${useReserve ? 'Special Hardship Reserve' : 'general pool'}. ${note.trim()}` : `Dismissed. ${note.trim()}`
        });
      },
      success: kind === 'upheld' ? `Appeal upheld – ${r.name} awarded ${kes(amount)}` : `Appeal dismissed for ${r.name}`,
      failure: 'Tribunal decision not recorded – rolled back',
      onSuccess: () => {
        setOverlay((o) => {
          const n = { ...o };
          delete n[r.id];
          return n;
        });
        setActiveId(null);
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="pb-12">
      {/* HERO BANNER (CHIEF STYLING - AMBER THEME) */}
      <section
        className="dash-single-card"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, var(--surface-elevated, #101c38) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          boxShadow: '0 4px 20px rgba(245, 158, 11, 0.08)'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: 'rgba(245, 158, 11, 0.18)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(245, 158, 11, 0.25)'
              }}
            >
              <Icon name="shield" size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: '#f59e0b',
                    border: '1px solid rgba(245, 158, 11, 0.35)'
                  }}
                >
                  Legislative Tribunal Bench
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Tendeno / Sorget Ward
                </span>
              </div>
              <h1 style={{ margin: '4px 0 0', fontSize: '1.45rem', color: 'var(--text, #fff)', fontWeight: 800 }}>
                Constituent Bursary Appeals
              </h1>
              <p style={{ margin: '4px 0 0', color: 'var(--text-2, #94a3b8)', fontSize: '0.88rem' }}>
                Review petitions arising from Chief rejections and allocate from the ward pool or the Special Hardship Emergency Reserve.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid min-h-[560px] grid-cols-1 gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card flush className="flex flex-col overflow-hidden" aria-label="Petitions">
          <div className="flex gap-2 border-b border-slate-800/60 p-3">
            <Chip active={view === 'pending'} count={pending.length} onClick={() => setView('pending')}>
              Pending
            </Chip>
            <Chip active={view === 'decided'} count={decided.length} onClick={() => setView('decided')}>
              Decided
            </Chip>
          </div>
          <ul className="min-h-0 flex-1 divide-y divide-slate-800/50 overflow-y-auto">
            {list.map((r) => {
              const d = decisions[r.id];
              const on = r.id === active?.id;
              return (
                <li key={r.id}>
                  <button type="button" aria-current={on} onClick={() => setActiveId(r.id)} className={cx('flex min-h-[84px] w-full items-start gap-3 px-3 py-3 text-left transition-colors', on ? 'bg-accent/10 shadow-[inset_3px_0_0_rgb(var(--ws-accent))]' : 'hover:bg-slate-800/40')}>
                    <Avatar name={r.name} size={36} tone={d ? (d.decision === 'upheld' ? 'emerald' : 'neutral') : 'amber'} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">{r.name}</span>
                      <span className="block truncate text-xs text-slate-200">
                        {r.school} · {r.subLocation}
                      </span>
                      <span className="mt-1.5 flex items-center gap-2">
                        {d ? <Badge tone={d.decision === 'upheld' ? 'emerald' : 'neutral'}>{d.decision === 'upheld' ? 'Upheld' : 'Dismissed'}</Badge> : <Badge tone="amber">Awaiting bench</Badge>}
                        <span className="font-mono text-xs tabular-nums text-slate-100">{num(r.requested)}</span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {list.length === 0 ? <EmptyState icon="checkCircle" title={view === 'pending' ? 'No pending petitions' : 'No decisions yet'} /> : null}
        </Card>

        {active ? (
          <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
            <Card title="Petition" subtitle={<span className="font-mono">{active.serial}</span>}>
              <dl className="grid grid-cols-2 gap-4">
                <KeyValue label="Applicant">{active.name}</KeyValue>
                <KeyValue label="Guardian">{active.parentName}</KeyValue>
                <KeyValue label="Sub-location">{active.subLocation}</KeyValue>
                <KeyValue label="Institution">{active.school}</KeyValue>
                <KeyValue label="Requested" mono>
                  {kes(active.requested)}
                </KeyValue>
                <KeyValue label="Fee balance" mono>
                  {kes(active.feeBalance)}
                </KeyValue>
                <KeyValue label="Chief need score">
                  <Badge tone={active.needScore >= 90 ? 'gold' : active.needScore >= 78 ? 'emerald' : 'cyan'}>
                    {active.needScore}/100 · {active.needLabel}
                  </Badge>
                </KeyValue>
                <KeyValue label="Phone" mono>
                  {active.phone}
                </KeyValue>
              </dl>
              <div className="mt-4 rounded-lg border border-red-400/40 bg-red-500/10 p-3">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red-200">
                  <Icon name="alert" size={13} /> Chief’s rejection
                </p>
                <p className="mt-1 text-sm text-slate-50">{active.chiefReason || 'The Chief declined this application. No further reason was recorded.'}</p>
              </div>
            </Card>

            <Card title={decision ? 'Tribunal decision' : 'Bench decision'}>
              {decision ? (
                <div className="space-y-3">
                  <Badge tone={decision.decision === 'upheld' ? 'emerald' : 'neutral'}>{decision.decision === 'upheld' ? 'Appeal upheld' : 'Appeal dismissed'}</Badge>
                  {decision.decision === 'upheld' ? (
                    <p className="font-mono text-xl font-bold tabular-nums text-amber-200">
                      {kes(decision.amount)} <span className="text-sm font-semibold text-slate-100">· {decision.reserve ? 'Hardship Reserve' : 'General pool'}</span>
                    </p>
                  ) : null}
                  <p className="text-sm text-slate-50">{decision.note}</p>
                  <p className="font-mono text-xs tabular-nums text-slate-200">{fmtDateTime(decision.at)}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {!q.met ? (
                    <p role="alert" className="rounded-lg border border-amber-400/50 bg-amber-500/10 p-3 text-sm font-semibold text-amber-100">
                      Quorum not met ({q.present}/{q.required}). Decisions are blocked until attendance is recorded.
                    </p>
                  ) : null}
                  <div>
                    <FieldLabel htmlFor="appeal-amount">Award amount if upheld (KES)</FieldLabel>
                    <Input id="appeal-amount" type="number" min={0} step={500} value={amount} onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))} className="text-right font-mono tabular-nums" />
                    {amount > policy.perStudentCap ? <p className="mt-1 text-sm font-semibold text-red-300">Exceeds the per-student cap of {kes(policy.perStudentCap)}.</p> : null}
                  </div>

                  <div className={cx('rounded-xl border p-3', useReserve ? 'border-violet-400/60 bg-violet-500/10' : 'border-slate-700 bg-slate-900/60')}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-white">Special Hardship Emergency Reserve</p>
                        <p className="text-xs text-slate-200">
                          Available <span className="font-mono tabular-nums text-violet-200">{kes(reserveLeft)}</span> of <span className="font-mono tabular-nums">{kes(tranche.reserve_amount)}</span>
                        </p>
                      </div>
                      <Switch checked={useReserve} onChange={setUseReserve} label="Allocate from Special Hardship Emergency Reserve" />
                    </div>
                    <ProgressBar value={((tranche.reserve_committed + (useReserve ? amount : 0)) / tranche.reserve_amount) * 100} tone={overReserve ? 'red' : 'violet'} label="Reserve utilisation" className="mt-3" />
                    {overReserve ? <p className="mt-1.5 text-sm font-semibold text-red-300">Reserve would be overdrawn by {kes(amount - reserveLeft)}.</p> : null}
                  </div>

                  <p className="font-mono text-sm tabular-nums text-slate-100">
                    General pool after: <span className={overCap ? 'text-red-300' : 'text-emerald-300'}>{kes(tranche.total_amount - tranche.committed_amount - amount)}</span>
                  </p>

                  <div>
                    <FieldLabel htmlFor="appeal-note" hint={`${note.trim().length}/20 min`}>
                      Tribunal reasoning (required)
                    </FieldLabel>
                    <Textarea id="appeal-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Record the evidence and reasoning behind this decision…" aria-required="true" />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="emerald" icon="check" disabled={!noteOk || amount <= 0 || overReserve || overCap || amount > policy.perStudentCap} onClick={() => void decide('upheld')}>
                      Uphold &amp; allocate
                    </Button>
                    <Button variant="secondary" icon="x" disabled={!noteOk} onClick={() => void decide('dismissed')}>
                      Dismiss petition
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        ) : (
          <Card className="flex items-center justify-center">
            <EmptyState icon="scale" title="No petition selected" />
          </Card>
        )}
      </div>
    </div>
  );
}
