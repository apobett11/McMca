import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cx, fmtDateTime, fmtDuration, num } from '../../lib/format.ts';
import { useDataTick, useNow } from '../../lib/hooks.ts';
import { LEDGER_EVENT, appendLedger, isToday, readLedger } from '../../lib/ledger.ts';
import { useMutation } from '../../lib/toast.tsx';
import type { StuckRegistration } from '../../types/schema.ts';
import { Drawer } from '../../ui/overlays.tsx';
import { Icon } from '../../ui/icons.tsx';
import { Badge, Button, Card, Chip, DataTable, EmptyState, KeyValue, PageHeader, ProgressBar, Ring, SearchInput, Td, Th, rowCls, tbodyCls } from '../../ui/primitives.tsx';
import { HD_EVENTS, hd, issueTone, loadFunnel, loadStuck, loadUploads, officer, ticketKpis } from '../data.ts';

const STEP_LABELS = ['Personal', 'Guardian Match', 'Family Details', 'Institution', 'Home & Submit'];

function KpiCard({
  title,
  value,
  chip,
  chipTone,
  chipPulse,
  action,
  onClick,
  children
}: {
  title: string;
  value: string;
  chip: string;
  chipTone: 'red' | 'emerald' | 'amber' | 'neutral';
  chipPulse?: boolean;
  action: string;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[148px] flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 text-left backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-accent/60 hover:bg-slate-900/90 active:translate-y-0"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-200">{title}</p>
          <p className="mt-2 font-mono text-4xl font-bold tabular-nums tracking-tight text-white">{value}</p>
        </div>
        {children}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <Badge tone={chipTone} pulse={chipPulse}>
          {chip}
        </Badge>
        <span className="flex items-center gap-1 text-xs font-semibold text-accent-soft group-hover:underline">
          {action} <Icon name="chevronRight" size={14} />
        </span>
      </div>
    </button>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const run = useMutation();
  const tick = useDataTick([...HD_EVENTS, LEDGER_EVENT]);
  const now = useNow(30_000);
  const queueRef = useRef<HTMLDivElement>(null);

  const [q, setQ] = useState('');
  const [issueFilter, setIssueFilter] = useState<string>('all');
  const [inspect, setInspect] = useState<StuckRegistration | null>(null);
  const [optimisticReminded, setOptimisticReminded] = useState<Set<string>>(new Set());

  const stuck = useMemo(() => loadStuck(now), [tick, now]);
  const funnel = useMemo(() => loadFunnel(), [tick]);
  const uploads = useMemo(() => loadUploads(), [tick]);
  const tk = useMemo(() => ticketKpis(now), [tick, now]);

  const failedOcr = uploads.filter((u) => u.verification === 'uploaded' && u.categories.includes('failed_ocr')).length;
  const resolvedToday = readLedger('helpdesk').filter((e) => isToday(e.ts) && (e.kind === 'doc_override' || e.kind === 'doc_resolved')).length;
  const newStalls = stuck.filter((s) => s.stallMs < 4 * 3600_000).length;

  const worstDrop = funnel.reduce((best, s, i) => (i > 0 && s.dropFromPrev > (funnel[best]?.dropFromPrev ?? 0) ? i : best), 1);
  const dropDetected = funnel[worstDrop] && funnel[worstDrop].dropFromPrev >= 15;

  const issues = useMemo(() => Array.from(new Set(stuck.map((s) => s.issue))), [stuck]);
  const rows = stuck.filter((s) => {
    if (issueFilter !== 'all' && s.issue !== issueFilter) return false;
    const t = q.trim().toLowerCase();
    return !t || `${s.name} ${s.nationalId} ${s.school} ${s.subLocation}`.toLowerCase().includes(t);
  });

  const isReminded = (s: StuckRegistration) => s.reminded || optimisticReminded.has(s.id);

  const sendReminder = (s: StuckRegistration) =>
    run({
      apply: () => setOptimisticReminded((p) => new Set(p).add(s.id)),
      rollback: () =>
        setOptimisticReminded((p) => {
          const n = new Set(p);
          n.delete(s.id);
          return n;
        }),
      commit: async () => {
        hd.sendStepReminder(s.id);
        await appendLedger('helpdesk', { actor: officer().name, kind: 'sms_reminder', target: s.id, targetLabel: s.name, detail: `Step reminder SMS to ${s.phone} (stalled at ${s.hangingStepLabel})` });
      },
      success: `Reminder SMS queued for ${s.name}`,
      failure: `Reminder to ${s.name} failed`
    });

  const uploadFor = (s: StuckRegistration) => uploads.find((u) => u.nationalId === s.nationalId);

  return (
    <>
      <PageHeader
        eyebrow="Operational telemetry"
        title="Triage Dashboard"
        description="Clear registration bottlenecks, failed OCR and SLA breaches before applicants give up."
        actions={
          <Button variant="secondary" icon="refresh" onClick={() => window.dispatchEvent(new CustomEvent('mcmca_helpdesk_steps_updated'))}>
            Refresh
          </Button>
        }
      />

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Stuck registrations (steps 1–4)"
          value={num(stuck.length)}
          chip={newStalls ? `+${newStalls} in last 4 hours` : 'No new stalls in 4 hours'}
          chipTone={newStalls ? 'red' : 'neutral'}
          chipPulse={newStalls > 0}
          action="Filter queue"
          onClick={() => {
            setIssueFilter('all');
            queueRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        />
        <KpiCard
          title="Failed OCR queue"
          value={num(failedOcr)}
          chip={`${resolvedToday} resolved today`}
          chipTone="emerald"
          action="Open studio"
          onClick={() => navigate('/helpdesk/documents?filter=failed_ocr')}
        />
        <KpiCard
          title="Open dispatch tickets"
          value={num(tk.open)}
          chip={`${tk.breaches} SLA breach${tk.breaches === 1 ? '' : 'es'} (>2h)`}
          chipTone={tk.breaches ? 'amber' : 'emerald'}
          action="Unreplied"
          onClick={() => navigate('/helpdesk/messages?filter=unreplied')}
        />
        <KpiCard title="Triage SLA compliance" value={`${tk.compliance.toFixed(1)}%`} chip="Target ≥ 95%" chipTone={tk.compliance >= 95 ? 'emerald' : 'amber'} action="Breaches" onClick={() => navigate('/helpdesk/messages?filter=breach')}>
          <Ring value={tk.compliance} size={64} tone={tk.compliance >= 95 ? 'emerald' : 'amber'} label="SLA compliance">
            <Icon name="shield" size={18} className="text-slate-100" />
          </Ring>
        </KpiCard>
      </div>

      {/* Funnel */}
      <Card
        className="mt-5"
        title="Ingestion funnel"
        subtitle="Share of registrants reaching each step · live from step progress"
        actions={dropDetected ? <Badge tone="red" pulse>Drop-off detected at {funnel[worstDrop].short}</Badge> : <Badge tone="emerald">No critical drop-off</Badge>}
      >
        <ol className="grid grid-cols-1 gap-3 md:grid-cols-5" aria-label="Registration funnel">
          {funnel.map((s, i) => {
            const hot = dropDetected && i === worstDrop;
            return (
              <li key={s.label} className="relative">
                <div className={cx('h-full rounded-lg border p-3', hot ? 'border-red-400/70 bg-red-500/10' : 'border-slate-700/80 bg-ink-950/40')}>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                    {s.short}: {s.label}
                  </p>
                  <p className={cx('mt-1 font-mono text-3xl font-bold tabular-nums', hot ? 'text-red-300' : 'text-white')}>{s.pct.toFixed(0)}%</p>
                  <ProgressBar value={s.pct} tone={hot ? 'red' : 'accent'} label={`${s.label} reach`} className="mt-2" />
                  <p className="mt-2 font-mono text-xs tabular-nums text-slate-200">
                    {s.reached} reached {i > 0 ? <span className={s.dropFromPrev > 0 ? 'text-red-300' : 'text-emerald-300'}>· −{s.dropFromPrev.toFixed(0)} pts</span> : null}
                  </p>
                  {hot ? <p className="mt-1.5 text-xs font-bold uppercase tracking-wide text-red-300">Drop-off detected</p> : null}
                </div>
                {i < funnel.length - 1 ? <Icon name="chevronRight" size={16} className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-slate-300 md:block" /> : null}
              </li>
            );
          })}
        </ol>
      </Card>

      {/* Priority queue */}
      <div ref={queueRef} className="mt-5 scroll-mt-20">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white">High-priority queue</h2>
            <p className="text-sm text-slate-300">
              {rows.length} of {stuck.length} stalled registrations · longest stall first
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput className="w-64" aria-label="Filter stalled registrations" placeholder="Name, ID, school…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Filter by issue">
          <Chip active={issueFilter === 'all'} count={stuck.length} onClick={() => setIssueFilter('all')}>
            All
          </Chip>
          {issues.map((i) => (
            <Chip key={i} active={issueFilter === i} count={stuck.filter((s) => s.issue === i).length} onClick={() => setIssueFilter(i)}>
              {i}
            </Chip>
          ))}
        </div>

        <DataTable maxHeight="520px">
          <thead>
            <tr>
              <Th>Applicant identifier</Th>
              <Th>Sub-location</Th>
              <Th className="min-w-[200px]">Hanging step</Th>
              <Th align="right">Stall duration</Th>
              <Th align="center">Issue flag</Th>
              <Th align="right" className="min-w-[120px]">
                Action toolbar
              </Th>
            </tr>
          </thead>
          <tbody className={tbodyCls}>
            {rows.map((s) => (
              <tr key={s.id} className={rowCls}>
                <Td>
                  <p className="font-semibold text-white">{s.name}</p>
                  <p className="mt-0.5 font-mono text-xs tabular-nums text-slate-200">
                    ID {s.nationalId} · <span className="font-sans">{s.school}</span>
                  </p>
                </Td>
                <Td>{s.subLocation}</Td>
                <Td>
                  <div className="flex items-center gap-3">
                    <ProgressBar value={(s.stepsDone / s.totalSteps) * 100} tone={s.stepsDone <= 2 ? 'red' : 'amber'} label={`${s.name} progress`} className="w-24" />
                    <span className="text-xs text-slate-100">
                      <span className="font-mono tabular-nums">{s.stepsDone}/{s.totalSteps}</span> · {s.hangingStepLabel.replace(/^\d\.\s*/, '')}
                    </span>
                  </div>
                </Td>
                <Td align="right" mono className={s.stallMs > 72 * 3600_000 ? 'text-red-300' : 'text-amber-300'}>
                  {fmtDuration(s.stallMs)}
                </Td>
                <Td align="center">
                  <Badge tone={issueTone(s.issue)}>{s.issue}</Badge>
                </Td>
                <Td align="right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="secondary" icon="eye" onClick={() => setInspect(s)}>
                      Quick Inspect
                    </Button>
                    <Button variant={isReminded(s) ? 'ghost' : 'primary'} icon={isReminded(s) ? 'check' : 'send'} disabled={isReminded(s)} onClick={() => sendReminder(s)} aria-label={`Send SMS reminder to ${s.name}`}>
                      {isReminded(s) ? 'Reminded' : 'SMS Reminder'}
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </DataTable>
        {rows.length === 0 ? <EmptyState icon="checkCircle" title="Queue clear" body="No registrations match this filter." /> : null}
      </div>

      {/* Quick Inspect drawer */}
      <Drawer
        open={!!inspect}
        onClose={() => setInspect(null)}
        width={640}
        title={inspect?.name ?? ''}
        subtitle={inspect ? <span className="font-mono tabular-nums">ID {inspect.nationalId}</span> : null}
        footer={
          inspect ? (
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" icon="users" onClick={() => navigate(`/helpdesk/applications?q=${inspect.nationalId}`)}>
                Registry record
              </Button>
              {uploadFor(inspect) ? (
                <Button variant="secondary" icon="fileCheck" onClick={() => navigate(`/helpdesk/documents?doc=${uploadFor(inspect)!.id}`)}>
                  Open document
                </Button>
              ) : null}
              <Button variant="primary" icon="send" disabled={isReminded(inspect)} onClick={() => sendReminder(inspect)}>
                {isReminded(inspect) ? 'Reminder sent' : 'Send SMS reminder'}
              </Button>
            </div>
          ) : null
        }
      >
        {inspect ? (
          <div className="space-y-5 p-5">
            <dl className="grid grid-cols-2 gap-4 rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
              <KeyValue label="Institution">{inspect.school}</KeyValue>
              <KeyValue label="Sub-location">{inspect.subLocation}</KeyValue>
              <KeyValue label="Phone" mono>
                {inspect.phone}
              </KeyValue>
              <KeyValue label="Last active" mono>
                {fmtDateTime(inspect.lastActiveIso)}
              </KeyValue>
              <KeyValue label="Stalled for" mono>
                {fmtDuration(Date.now() - new Date(inspect.lastActiveIso).getTime())}
              </KeyValue>
              <KeyValue label="Issue">
                <Badge tone={issueTone(inspect.issue)}>{inspect.issue}</Badge>
              </KeyValue>
            </dl>

            <div>
              <h3 className="mb-2 text-sm font-bold text-white">Registration progress</h3>
              <ol className="space-y-1.5">
                {STEP_LABELS.map((l, i) => {
                  const done = i < inspect.stepsDone;
                  const current = i === inspect.stepsDone;
                  return (
                    <li key={l} className={cx('flex min-h-[40px] items-center gap-3 rounded-lg border px-3', done ? 'border-emerald-400/30 bg-emerald-500/5' : current ? 'border-red-400/50 bg-red-500/10' : 'border-slate-800 bg-slate-900/40')}>
                      <span className={cx('flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs font-bold', done ? 'bg-emerald-400 text-ink-950' : current ? 'bg-red-400 text-ink-950' : 'bg-slate-700 text-slate-100')}>
                        {done ? <Icon name="check" size={13} strokeWidth={3} /> : i + 1}
                      </span>
                      <span className="flex-1 text-sm font-semibold text-slate-50">{l}</span>
                      {current ? <Badge tone="red" pulse>Stalled here</Badge> : done ? <Badge tone="emerald">Done</Badge> : <Badge>Pending</Badge>}
                    </li>
                  );
                })}
              </ol>
            </div>

            {uploadFor(inspect) ? (
              <div className="rounded-xl border border-red-400/30 bg-red-500/5 p-4">
                <h3 className="text-sm font-bold text-red-200">Blocking document</h3>
                <p className="mt-1 text-sm text-slate-50">
                  {uploadFor(inspect)!.documentType} · <span className="font-mono">{uploadFor(inspect)!.fileName}</span>
                </p>
                <p className="mt-1 text-sm text-slate-200">{uploadFor(inspect)!.failureReason}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </>
  );
}
