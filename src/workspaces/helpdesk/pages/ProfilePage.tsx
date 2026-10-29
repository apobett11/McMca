import { useEffect, useMemo, useRef, useState } from 'react';
import { fmtDateTime } from '../../lib/format.ts';
import { useDataTick, useStored } from '../../lib/hooks.ts';
import { LEDGER_EVENT, appendLedger, readLedger, shortHash, verifyLedger } from '../../lib/ledger.ts';
import { useMutation } from '../../lib/toast.tsx';
import { Icon } from '../../ui/icons.tsx';
import { Avatar, Badge, Button, Card, DataTable, EmptyState, KeyValue, PageHeader, ProgressBar, Td, Th, rowCls, tbodyCls } from '../../ui/primitives.tsx';
import { hd, officer } from '../data.ts';

interface Week {
  weekNumber: number;
  label: string;
  totalHours: number;
  daily: { day: string; hours: number; target: number; date: string }[];
}
interface Month {
  month: string;
  totalHours: number;
  targetHours: number;
  weeks: Week[];
}

function SignaturePad() {
  const run = useMutation();
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useStored<{ png: string; at: string } | null>('mcmca_ws_hd_signature_v1', null);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#e2e8f0';
  }, []);

  const pt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * e.currentTarget.width, y: ((e.clientY - r.top) / r.height) * e.currentTarget.height };
  };

  const clear = () => {
    const c = canvas.current;
    c?.getContext('2d')?.clearRect(0, 0, c.width, c.height);
    setDirty(false);
  };

  const save = () => {
    const c = canvas.current;
    if (!c) return;
    const png = c.toDataURL('image/png');
    const prev = saved;
    return run({
      apply: () => setSaved({ png, at: new Date().toISOString() }),
      rollback: () => setSaved(prev),
      commit: async () => {
        await appendLedger('helpdesk', { actor: officer().name, kind: 'signature_updated', target: officer().id, targetLabel: officer().name, detail: 'Digital signature specimen replaced' });
      },
      success: 'Signature specimen saved',
      failure: 'Could not save signature',
      onSuccess: clear
    });
  };

  return (
    <Card title="Digital signature" subtitle="Used to certify manual overrides">
      <canvas
        ref={canvas}
        width={640}
        height={200}
        aria-label="Signature drawing area"
        className="h-[140px] w-full touch-none cursor-crosshair rounded-lg border border-dashed border-slate-500 bg-ink-950/70"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drawing.current = true;
          const ctx = e.currentTarget.getContext('2d');
          const p = pt(e);
          ctx?.beginPath();
          ctx?.moveTo(p.x, p.y);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = e.currentTarget.getContext('2d');
          const p = pt(e);
          ctx?.lineTo(p.x, p.y);
          ctx?.stroke();
          setDirty(true);
        }}
        onPointerUp={() => (drawing.current = false)}
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button variant="primary" icon="check" disabled={!dirty} onClick={() => void save()}>
          Save specimen
        </Button>
        <Button variant="ghost" onClick={clear} disabled={!dirty}>
          Clear
        </Button>
        {saved ? (
          <span className="ml-auto flex items-center gap-3 text-xs text-slate-100">
            <img src={saved.png} alt="Saved signature specimen" className="h-10 rounded border border-slate-600 bg-ink-950 px-2" />
            <span className="font-mono tabular-nums">{fmtDateTime(saved.at)}</span>
          </span>
        ) : null}
      </div>
    </Card>
  );
}

export function ProfilePage() {
  const run = useMutation();
  const tick = useDataTick([LEDGER_EVENT]);
  const me = officer();
  const profile = hd.getHelpDeskProfile() as { assignedLocations: string[]; department: string };
  const hours = hd.getHelpDeskSessionHours() as { today: number; thisWeek: number; thisMonth: number; shiftAdherenceRate: number; shiftSchedule: string; monthlyBreakdown: Month[] };
  const [monthIdx, setMonthIdx] = useState(0);
  const month = hours.monthlyBreakdown[monthIdx];
  const [chain, setChain] = useState<{ ok: boolean; count: number; brokenAt: number | null } | null>(null);

  const entries = useMemo(
    () => readLedger('helpdesk').filter((e) => ['doc_override', 'proceed_to_mca', 'ticket_forward_mca', 'signature_updated', 'shift_handover'].includes(e.kind)).reverse(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick]
  );

  const verify = async () => {
    const r = await verifyLedger('helpdesk');
    setChain(r);
    await run({
      apply: () => undefined,
      rollback: () => undefined,
      commit: () => {
        if (!r.ok) throw new Error(`Chain broken at entry #${(r.brokenAt ?? 0) + 1} – the ledger may have been tampered with.`);
      },
      success: `Chain intact – ${r.count} entries verified`,
      failure: 'Ledger verification failed'
    });
  };

  return (
    <>
      <PageHeader eyebrow="Session console" title="Officer Profile" description="Shift timesheets, signature specimen and your personal override ledger." />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-4">
              <Avatar name={me.name} size={64} />
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-white">{me.name}</p>
                <p className="text-sm text-slate-100">{me.roleTitle}</p>
                <Badge tone="emerald" dot>
                  On duty
                </Badge>
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4">
              <KeyValue label="Officer ID" mono>
                {me.id}
              </KeyValue>
              <KeyValue label="Shift">{me.shiftUnit}</KeyValue>
              <KeyValue label="Phone" mono>
                {me.phone}
              </KeyValue>
              <KeyValue label="Email">{me.email}</KeyValue>
              <KeyValue label="Department">{profile.department}</KeyValue>
              <KeyValue label="Assigned">{profile.assignedLocations.join(', ')}</KeyValue>
            </dl>
          </Card>
          <SignaturePad />
        </div>

        <div className="space-y-4">
          <Card title="Shift timesheet" subtitle={`${hours.shiftSchedule} · adherence ${hours.shiftAdherenceRate}%`}>
            <div className="grid grid-cols-3 gap-3">
              {[
                ['Today', hours.today],
                ['This week', hours.thisWeek],
                ['This month', hours.thisMonth]
              ].map(([l, v]) => (
                <div key={l as string} className="rounded-lg border border-slate-700/80 bg-ink-950/40 p-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-200">{l}</p>
                  <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-white">
                    {v}
                    <span className="text-sm font-semibold text-slate-200"> h</span>
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Month">
              {hours.monthlyBreakdown.slice(0, 3).map((m, i) => (
                <Button key={m.month} variant={i === monthIdx ? 'primary' : 'secondary'} onClick={() => setMonthIdx(i)}>
                  {m.month}
                </Button>
              ))}
              <span className="ml-auto font-mono text-sm tabular-nums text-slate-100">
                {month.totalHours} / {month.targetHours} h
              </span>
            </div>
            <ProgressBar value={(month.totalHours / month.targetHours) * 100} tone={month.totalHours >= month.targetHours ? 'emerald' : 'accent'} label="Monthly hours vs target" className="mt-2" />
            <DataTable className="mt-4">
              <thead>
                <tr>
                  <Th>Week</Th>
                  <Th>Daily hours</Th>
                  <Th align="right">Total (h)</Th>
                </tr>
              </thead>
              <tbody className={tbodyCls}>
                {month.weeks.map((w) => (
                  <tr key={w.weekNumber} className={rowCls}>
                    <Td>{w.label}</Td>
                    <Td>
                      <div className="flex gap-1.5">
                        {w.daily.map((d) => (
                          <span key={d.date} title={`${d.day} ${d.date}: ${d.hours}/${d.target} h`} className={`inline-flex h-7 min-w-[34px] items-center justify-center rounded font-mono text-xs font-bold tabular-nums ${d.hours >= d.target ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-500/20 text-amber-200'}`}>
                            {d.hours}
                          </span>
                        ))}
                      </div>
                    </Td>
                    <Td align="right" mono>
                      {w.totalHours}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </Card>

          <Card
            title="Personal override ledger"
            subtitle="Every override, forward and handover – SHA-256 hash-chained"
            actions={
              <>
                {chain ? <Badge tone={chain.ok ? 'emerald' : 'red'}>{chain.ok ? `Chain intact · ${chain.count}` : `Broken at #${(chain.brokenAt ?? 0) + 1}`}</Badge> : null}
                <Button variant="secondary" icon="shield" onClick={() => void verify()}>
                  Verify chain
                </Button>
              </>
            }
            flush
          >
            {entries.length === 0 ? (
              <EmptyState icon="ledger" title="No ledger entries yet" body="Overrides, forwards and shift handovers you perform will be recorded here." />
            ) : (
              <DataTable className="rounded-none border-0">
                <thead>
                  <tr>
                    <Th align="right">Timestamp</Th>
                    <Th>Action</Th>
                    <Th>Target</Th>
                    <Th>Detail</Th>
                    <Th align="right">Hash</Th>
                  </tr>
                </thead>
                <tbody className={tbodyCls}>
                  {entries.map((e) => (
                    <tr key={e.id} className={rowCls}>
                      <Td align="right" mono className="text-xs">
                        {fmtDateTime(e.ts)}
                      </Td>
                      <Td>
                        <Badge tone="accent">{e.kind.replace(/_/g, ' ')}</Badge>
                      </Td>
                      <Td className="max-w-[200px] truncate">{e.targetLabel}</Td>
                      <Td className="max-w-[320px] truncate text-xs text-slate-100" title={e.detail}>
                        {e.detail}
                      </Td>
                      <Td align="right" mono className="text-xs" title={e.hash}>
                        <Icon name="hash" size={11} className="mr-1 inline" />
                        {shortHash(e.hash)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
