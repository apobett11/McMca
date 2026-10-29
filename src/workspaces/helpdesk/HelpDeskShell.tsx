import { useCallback, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { WorkspaceShell, type ShellConfig } from '../shell/WorkspaceShell.tsx';
import { fmtClock } from '../lib/format.ts';
import { useDataTick, useNow, useStored } from '../lib/hooks.ts';
import { LEDGER_EVENT, appendLedger, isToday, readLedger } from '../lib/ledger.ts';
import { useMutation } from '../lib/toast.tsx';
import { Modal } from '../ui/overlays.tsx';
import { Icon } from '../ui/icons.tsx';
import { Badge, Button, FieldLabel, Textarea } from '../ui/primitives.tsx';
import { HD_EVENTS, loadAlerts, loadStuck, loadTickets, loadUploads, officer, isOpenTicket, searchHelpDesk } from './data.ts';

const CYCLE = '2026/2027';

interface Shift {
  startedAt: number;
}

function useShift() {
  const [shift, setShift] = useStored<Shift>('mcmca_ws_hd_shift_v1', { startedAt: Date.now() });
  const now = useNow(1000);
  useDataTick([LEDGER_EVENT]);
  const actionsToday = readLedger('helpdesk').filter((e) => isToday(e.ts) && e.kind !== 'shift_handover').length;
  return { shift, setShift, elapsed: now - shift.startedAt, actionsToday };
}

function ShiftCard() {
  const { shift, setShift, elapsed, actionsToday } = useShift();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const run = useMutation();
  const tick = useDataTick(HD_EVENTS);
  const summary = useMemo(
    () => ({
      openTickets: loadTickets().filter(isOpenTicket).length,
      unresolvedDocs: loadUploads().filter((u) => u.verification === 'uploaded').length,
      stalled: loadStuck().length
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick, open]
  );

  const submit = useCallback(async () => {
    const prev = shift;
    const handoverActions = actionsToday;
    await run({
      apply: () => {
        setShift({ startedAt: Date.now() });
        setOpen(false);
      },
      rollback: () => setShift(prev),
      commit: async () => {
        await appendLedger('helpdesk', {
          actor: officer().name,
          kind: 'shift_handover',
          target: 'shift',
          targetLabel: `Shift ${fmtClock(Date.now() - prev.startedAt)}`,
          detail: `Handover: ${handoverActions} actions, ${summary.openTickets} open tickets, ${summary.unresolvedDocs} unresolved docs. ${notes.trim() || 'No notes.'}`
        });
      },
      success: 'Shift closed – handover note logged to the immutable ledger',
      failure: 'Could not record handover',
      onSuccess: () => setNotes('')
    });
  }, [shift, actionsToday, run, setShift, summary, notes]);

  return (
    <>
      <div className="rounded-xl border border-slate-700/80 bg-ink-950/60 p-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-300">Active shift</p>
          <Badge tone="emerald" pulse>
            On duty
          </Badge>
        </div>
        <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-white" aria-label="Elapsed shift time">
          {fmtClock(elapsed)}
        </p>
        <p className="mt-0.5 text-xs text-slate-200">
          <span className="font-mono font-bold tabular-nums text-accent-soft">{actionsToday}</span> actions logged today
        </p>
        <Button variant="secondary" block icon="logout" className="mt-3" onClick={() => setOpen(true)}>
          Clock-Out / Handover
        </Button>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Clock-out & handover"
        subtitle="Closes this shift and writes a signed handover entry to the ledger."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" icon="check" onClick={submit}>
              Confirm clock-out
            </Button>
          </>
        }
      >
        <dl className="mb-4 grid grid-cols-3 gap-3">
          {[
            ['Open tickets', summary.openTickets],
            ['Unresolved docs', summary.unresolvedDocs],
            ['Stalled signups', summary.stalled]
          ].map(([l, v]) => (
            <div key={l as string} className="rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-center">
              <dd className="font-mono text-2xl font-bold tabular-nums text-white">{v}</dd>
              <dt className="text-xs text-slate-200">{l}</dt>
            </div>
          ))}
        </dl>
        <FieldLabel htmlFor="handover-notes">Handover notes for the next officer</FieldLabel>
        <Textarea id="handover-notes" data-autofocus value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Escalations, promised call-backs, anything in flight…" />
      </Modal>
    </>
  );
}

function ShiftBanner() {
  const { elapsed } = useShift();
  return (
    <div className="flex items-center gap-3 rounded-full border border-slate-700/80 bg-slate-900/60 px-4 py-1.5 text-sm">
      <span className="flex items-center gap-1.5 font-semibold text-slate-100">
        <Icon name="layers" size={14} /> Active Cycle: <span className="font-mono tabular-nums text-accent-soft">{CYCLE}</span>
      </span>
      <span className="h-4 w-px bg-slate-600" />
      <span className="flex items-center gap-1.5 font-semibold text-slate-100">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Shift <span className="font-mono tabular-nums">{fmtClock(elapsed)}</span>
      </span>
    </div>
  );
}

export function HelpDeskShell() {
  const tick = useDataTick([...HD_EVENTS, LEDGER_EVENT]);

  const config = useMemo<ShellConfig>(() => {
    const stuck = loadStuck().length;
    const failedOcr = loadUploads().filter((u) => u.verification === 'uploaded' && u.categories.includes('failed_ocr')).length;
    const openTickets = loadTickets().filter(isOpenTicket).length;
    const off = officer();
    return {
      workspace: 'helpdesk',
      brand: { title: 'Operational Support Terminal', division: 'Tendeno/Sorget Division', seal: 'shield' },
      groups: [
        {
          title: 'Primary Operations',
          items: [
            { to: '/helpdesk/dashboard', label: 'Triage Dashboard', icon: 'chart', count: stuck, countTone: 'red', end: true },
            { to: '/helpdesk/documents', label: 'Document Studio', icon: 'fileCheck', count: failedOcr, countTone: 'amber' },
            { to: '/helpdesk/messages', label: 'Dispatch Tickets', icon: 'message', count: openTickets, countTone: 'accent' }
          ]
        },
        { title: 'Secondary Management', items: [{ to: '/helpdesk/applications', label: 'Applicant Registry', icon: 'users' }] },
        { title: 'Audit & System Config', items: [{ to: '/helpdesk/profile', label: 'Session Console & Signatory', icon: 'pen' }] }
      ],
      footer: <ShiftCard />,
      banner: <ShiftBanner />,
      shortcuts: [
        { label: 'Open Document Studio', icon: 'fileCheck', to: '/helpdesk/documents' },
        { label: 'Compose SMS in Dispatch Tickets', icon: 'send', to: '/helpdesk/messages' }
      ],
      user: { name: off.name, role: 'Help Desk Officer' },
      search: searchHelpDesk,
      alerts: loadAlerts(),
      switchTargets: [
        { label: 'MCA Executive Suite', to: '/mca/dashboard', icon: 'bank' },
        { label: 'Chief Portal', to: '/chief/dashboard', icon: 'shield' },
        { label: 'Public Portal', to: '/', icon: 'home' }
      ]
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  return (
    <WorkspaceShell config={config}>
      <Outlet />
    </WorkspaceShell>
  );
}
