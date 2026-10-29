import { useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { WorkspaceShell, type ShellConfig } from '../shell/WorkspaceShell.tsx';
import { kes, num } from '../lib/format.ts';
import { useDataTick } from '../lib/hooks.ts';
import { LEDGER_EVENT } from '../lib/ledger.ts';
import type { AlertItem, SearchHit } from '../types/schema.ts';
import { Icon } from '../ui/icons.tsx';
import { Ring } from '../ui/primitives.tsx';
import { CYCLE, MCA_EVENTS, equity, getAppealDecisions, getTranche, loadAwardRows, loadPayables, quorum } from './store.ts';
import * as mca from '../../dashboards/mca/utils/mcaData.js';

function TrancheMeter({ committedPct, remaining, warn }: { committedPct: number; remaining: number; warn: boolean }) {
  return (
    <div className="rounded-xl border border-slate-700/80 bg-ink-950/60 p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-300">Tranche liquidity</p>
      <div className="mt-2 flex items-center gap-3">
        <Ring value={committedPct} size={76} stroke={8} tone={committedPct >= 100 ? 'red' : warn ? 'gold' : 'emerald'} label="Tranche committed">
          <span className="font-mono text-sm font-bold tabular-nums text-white">{committedPct.toFixed(0)}%</span>
        </Ring>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">Remaining</p>
          <p className="break-words font-mono text-sm font-bold leading-tight tabular-nums text-amber-200">{kes(remaining)}</p>
          <p className="mt-1 text-[11px] text-slate-300">{committedPct.toFixed(1)}% committed</p>
        </div>
      </div>
    </div>
  );
}

function QuorumBanner() {
  const tick = useDataTick(MCA_EVENTS);
  const q = useMemo(() => quorum(), [tick]);
  return (
    <div className="flex items-center gap-3 rounded-full border border-slate-700/80 bg-slate-900/60 px-4 py-1.5 text-sm">
      <span className="flex items-center gap-1.5 font-semibold text-slate-100">
        <Icon name="layers" size={14} /> Active Cycle: <span className="font-mono tabular-nums text-accent-soft">{CYCLE}</span>
      </span>
      <span className="h-4 w-px bg-slate-600" />
      <span className="flex items-center gap-1.5 font-semibold text-slate-100">
        <span className={`h-2 w-2 rounded-full ${q.met ? 'bg-emerald-400' : 'animate-pulse bg-amber-400'}`} />
        Ward Quorum{' '}
        <span className="font-mono tabular-nums">
          {q.present}/{q.total}
        </span>
        <span className={q.met ? 'text-emerald-300' : 'text-amber-300'}>{q.met ? 'met' : `need ${q.required}`}</span>
      </span>
    </div>
  );
}

export function MCAShell() {
  const tick = useDataTick([...MCA_EVENTS, LEDGER_EVENT]);

  const config = useMemo<ShellConfig>(() => {
    const t = getTranche();
    const rows = loadAwardRows();
    const awaiting = rows.filter((r) => r.state === 'awaiting').length;
    const decided = getAppealDecisions();
    const appeals = rows.filter((r) => r.state === 'chief_rejected' && !decided[r.id]).length;
    const drafts = loadPayables().filter((p) => p.status === 'Draft').length;
    const pct = (t.committed_amount / t.total_amount) * 100;
    const remaining = t.total_amount - t.committed_amount;
    const prof = mca.getMCAProfile() as { fullName: string };
    const eq = equity(rows, 'sub');
    const low = eq.filter((e) => e.share < t.min_sublocation_share_pct);
    const unverified = loadPayables().filter((p) => !p.accountVerified);

    const alerts: AlertItem[] = [];
    const nowIso = new Date().toISOString();
    if (pct >= t.warn_threshold_pct) alerts.push({ id: 'pool', tone: pct >= 95 ? 'red' : 'amber', title: `Tranche ${pct.toFixed(1)}% committed`, body: `Only ${kes(remaining)} remains before the hard cap.`, at: nowIso, to: '/mca/dashboard' });
    if (low.length) alerts.push({ id: 'equity', tone: 'amber', title: `Equity warning: ${low.length} sub-location${low.length > 1 ? 's' : ''} below ${t.min_sublocation_share_pct}%`, body: low.map((l) => `${l.key} ${l.share.toFixed(1)}%`).join(' · '), at: nowIso, to: '/mca/dashboard' });
    if (appeals) alerts.push({ id: 'appeals', tone: 'amber', title: `${appeals} appeal${appeals > 1 ? 's' : ''} awaiting a tribunal decision`, body: 'Petitions from Chief rejections.', at: nowIso, to: '/mca/appeals' });
    if (unverified.length) alerts.push({ id: 'acct', tone: 'red', title: `${unverified.length} institution account${unverified.length > 1 ? 's' : ''} unverified`, body: 'EFT export is blocked until bank details are verified.', at: nowIso, to: '/mca/disbursements' });

    return {
      workspace: 'mca',
      brand: { title: 'Legislative Emerald Suite', division: 'Tendeno/Sorget Division', seal: 'bank' },
      groups: [
        {
          title: 'Primary Operations',
          items: [
            { to: '/mca/dashboard', label: 'Command Center', icon: 'chart', end: true },
            { to: '/mca/applications', label: 'Allocation Suite', icon: 'scale', count: awaiting, countTone: 'accent' },
            { to: '/mca/appeals', label: 'Appeals Bench', icon: 'shield', count: appeals, countTone: 'amber' }
          ]
        },
        {
          title: 'Secondary Management',
          items: [
            { to: '/mca/disbursements', label: 'Disbursements', icon: 'cheque', count: drafts, countTone: 'amber' },
            { to: '/mca/messages', label: 'Official Notices', icon: 'megaphone' }
          ]
        },
        { title: 'Audit & System Config', items: [{ to: '/mca/profile', label: 'Committee Vault', icon: 'key' }] }
      ],
      footer: <TrancheMeter committedPct={pct} remaining={remaining} warn={pct >= t.warn_threshold_pct} />,
      banner: <QuorumBanner />,
      shortcuts: [
        { label: 'Open Allocation Suite', icon: 'scale', to: '/mca/applications' },
        { label: 'Open Disbursements', icon: 'cheque', to: '/mca/disbursements' }
      ],
      user: { name: prof.fullName, role: 'Member of County Assembly' },
      search: (q: string): SearchHit[] => {
        const s = q.toLowerCase();
        const hits: SearchHit[] = loadAwardRows()
          .filter((r) => `${r.name} ${r.serial} ${r.school}`.toLowerCase().includes(s))
          .map((r) => ({ id: `aw-${r.id}`, title: r.name, subtitle: `${r.serial} · ${r.school} · KES ${num(r.proposed)}`, kind: 'Award', to: `/mca/applications?q=${encodeURIComponent(r.name)}` }));
        loadPayables()
          .filter((p) => `${p.name} ${p.code}`.toLowerCase().includes(s))
          .forEach((p) => hits.push({ id: `in-${p.code}`, title: p.name, subtitle: `${p.code} · ${p.bank}`, kind: 'Institution', to: `/mca/disbursements?open=${p.code}` }));
        return hits;
      },
      alerts,
      switchTargets: [
        { label: 'Help Desk Terminal', to: '/helpdesk/dashboard', icon: 'users' },
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
