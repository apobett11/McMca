import { Fragment, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cx, fmtDate, kes, num } from '../../lib/format.ts';
import { useDataTick } from '../../lib/hooks.ts';
import { appendLedger } from '../../lib/ledger.ts';
import { csvEscape, downloadText } from '../../lib/text.ts';
import { RuleViolation, latency, useMutation } from '../../lib/toast.tsx';
import type { InstitutionPayable, ManifestStatus } from '../../types/schema.ts';
import { Icon } from '../../ui/icons.tsx';
import { Badge, Button, Card, DataTable, EmptyState, PageHeader, Td, Th, rowCls, tbodyCls } from '../../ui/primitives.tsx';
import { CYCLE, MCA_EVENTS, getManifests, getMembers, getTranche, loadPayables, restoreManifests, setManifestStatus } from '../store.ts';
import * as mca from '../../../dashboards/mca/utils/mcaData.js';

const STATUS_TONE: Record<ManifestStatus, 'neutral' | 'amber' | 'emerald'> = { Draft: 'neutral', 'Cheque Drawn': 'amber', 'EFT Dispatched': 'emerald' };
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);

function openChequeSchedule(p: InstitutionPayable, chair: string, secretary: string): void {
  const w = window.open('', '_blank', 'width=900,height=1100');
  if (!w) throw new RuleViolation('The browser blocked the print window. Allow pop-ups for this site and retry.');
  const rows = p.roster.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.name)}</td><td class="m">${esc(r.admissionNo)}</td><td class="m r">${num(r.award)}.00</td></tr>`).join('');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Cheque Schedule – ${esc(p.name)}</title><style>
    body{font:13px/1.45 system-ui,Segoe UI,Arial,sans-serif;color:#0f172a;margin:36px}
    h1{font-size:18px;margin:0}h2{font-size:13px;font-weight:600;margin:2px 0 18px;color:#334155}
    table{width:100%;border-collapse:collapse;margin-top:14px}th,td{padding:7px 8px;border-bottom:1px solid #cbd5e1;text-align:left}
    th{background:#f1f5f9;font-size:11px;text-transform:uppercase;letter-spacing:.05em}.m{font-family:ui-monospace,Consolas,monospace}.r{text-align:right}
    .tot td{font-weight:700;border-top:2px solid #0f172a}.meta{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;margin:10px 0}
    .sig{display:flex;gap:48px;margin-top:70px}.sig div{flex:1;border-top:1px solid #0f172a;padding-top:6px;font-size:12px}
    @media print{body{margin:14mm}}</style></head><body>
    <h1>NG-CDF TENDENO/SORGET WARD — BURSARY CHEQUE SCHEDULE</h1><h2>Cycle ${CYCLE} · Generated ${fmtDate(new Date())}</h2>
    <div class="meta"><div><b>Payee:</b> ${esc(p.name)} (${p.code})</div><div><b>Bank:</b> ${esc(p.bank)} — ${esc(p.branch)}</div>
    <div><b>Account No.:</b> <span class="m">${p.accountNo}</span></div><div><b>Beneficiaries:</b> ${p.roster.length}</div></div>
    <table><thead><tr><th>#</th><th>Student</th><th>Admission No.</th><th class="r">Award (KES)</th></tr></thead><tbody>${rows}
    <tr class="tot"><td colspan="3">TOTAL PAYABLE</td><td class="m r">${num(p.total)}.00</td></tr></tbody></table>
    <div class="sig"><div>${esc(chair)}<br>Chair, Ward Bursary Committee</div><div>${esc(secretary)}<br>Secretary</div></div>
    <script>window.onload=function(){setTimeout(function(){window.print()},250)}</script></body></html>`);
  w.document.close();
}

function eftCsv(p: InstitutionPayable): string {
  const head = ['Beneficiary Account Name', 'Bank', 'Branch', 'Account Number', 'Amount (KES)', 'Reference', 'Narration'];
  const line = [p.name, p.bank, p.branch, p.accountNo, p.total.toFixed(2), `BUR-${CYCLE.replace('/', '')}-${p.code}`, `NG-CDF Bursary ${CYCLE} (${p.roster.length} beneficiaries)`];
  return `${head.map(csvEscape).join(',')}\r\n${line.map(csvEscape).join(',')}\r\n`;
}

export function DisbursementsPage() {
  const [params] = useSearchParams();
  const run = useMutation();
  const tick = useDataTick(MCA_EVENTS);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(params.get('open') ? [params.get('open') as string] : []));
  const [local, setLocal] = useState<Record<string, ManifestStatus>>({});

  const payables = useMemo(() => loadPayables().map((p) => ({ ...p, status: local[p.code] ?? p.status })), [tick, local]);
  const tranche = useMemo(() => getTranche(), [tick]);
  const totals = {
    payable: payables.reduce((a, p) => a + p.total, 0),
    beneficiaries: payables.reduce((a, p) => a + p.roster.length, 0),
    draft: payables.filter((p) => p.status === 'Draft').length,
    cheque: payables.filter((p) => p.status === 'Cheque Drawn').length,
    eft: payables.filter((p) => p.status === 'EFT Dispatched').length
  };

  const toggle = (code: string) =>
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(code)) n.delete(code);
      else n.add(code);
      return n;
    });

  const advance = (p: InstitutionPayable, to: ManifestStatus, action: () => void, ledgerDetail: string, okMsg: string) => {
    const prevManifests = getManifests();
    const prevLocal = p.status;
    return run({
      apply: () => setLocal((l) => ({ ...l, [p.code]: to })),
      rollback: () =>
        setLocal((l) => {
          const n = { ...l };
          if (prevLocal === 'Draft') delete n[p.code];
          else n[p.code] = prevLocal;
          return n;
        }),
      commit: async () => {
        await latency(250);
        action();
        // never downgrade EFT Dispatched
        if (p.status !== 'EFT Dispatched') setManifestStatus(p.code, to);
        const actor = (mca.getMCAProfile() as { fullName: string }).fullName;
        await appendLedger('mca', { actor, kind: to === 'EFT Dispatched' ? 'eft_export' : 'cheque_schedule', target: p.code, targetLabel: p.name, detail: ledgerDetail });
      },
      success: okMsg,
      failure: `${p.name}: manifest action failed`,
      onSuccess: () => setLocal((l) => {
        const n = { ...l };
        delete n[p.code];
        return n;
      })
    }).then((ok) => {
      if (!ok) restoreManifests(prevManifests);
      return ok;
    });
  };

  const members = getMembers();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="pb-12">
      {/* HERO BANNER (CHIEF STYLING - EMERALD THEME) */}
      <section
        className="dash-single-card"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, var(--surface-elevated, #101c38) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.08)'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: 'rgba(16, 185, 129, 0.18)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(16, 185, 129, 0.25)'
              }}
            >
              <Icon name="cheque" size={26} />
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
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.35)'
                  }}
                >
                  Cheque Manifest &amp; EFT Engine
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Tendeno / Sorget Bursary Fund
                </span>
              </div>
              <h1 style={{ margin: '4px 0 0', fontSize: '1.45rem', color: 'var(--text, #fff)', fontWeight: 800 }}>
                Institutional Disbursements
              </h1>
              <p style={{ margin: '4px 0 0', color: 'var(--text-2, #94a3b8)', fontSize: '0.88rem' }}>
                Awards grouped by verified learning institutions into print-ready schedules and automated bank EFT files.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mb-4 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          ['Total payable', kes(totals.payable), 'text-amber-200'],
          ['Institutions', `${payables.length}`, 'text-white'],
          ['Beneficiaries', `${totals.beneficiaries}`, 'text-white'],
          ['Draft · Cheque · EFT', `${totals.draft} · ${totals.cheque} · ${totals.eft}`, 'text-white']
        ].map(([l, v, c]) => (
          <Card key={l}>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-200">{l}</p>
            <p className={cx('mt-1 break-words font-mono text-xl font-bold tabular-nums', c)}>{v}</p>
          </Card>
        ))}
      </div>
      {totals.payable > tranche.committed_amount ? (
        <p role="alert" className="mb-4 rounded-lg border border-red-400/60 bg-red-500/10 p-3 text-sm font-semibold text-red-200">
          Payables ({kes(totals.payable)}) exceed the tranche’s committed total ({kes(tranche.committed_amount)}). Reconcile before dispatching.
        </p>
      ) : null}

      <DataTable maxHeight="calc(100vh - 380px)">
        <thead>
          <tr>
            <Th className="w-10">
              <span className="sr-only">Expand</span>
            </Th>
            <Th>Institution &amp; code</Th>
            <Th>Designated bank &amp; branch</Th>
            <Th align="right">Account no.</Th>
            <Th align="right">Beneficiaries</Th>
            <Th align="right">Total (KES)</Th>
            <Th align="center">Manifest status</Th>
            <Th align="right" className="ws-stick-r min-w-[120px]">
              Actions
            </Th>
          </tr>
        </thead>
        <tbody className={tbodyCls}>
          {payables.map((p) => {
            const open = expanded.has(p.code);
            return (
              <Fragment key={p.code}>
                <tr className={rowCls}>
                  <Td>
                    <button type="button" aria-expanded={open} aria-label={`${open ? 'Collapse' : 'Expand'} roster for ${p.name}`} onClick={() => toggle(p.code)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-700/60">
                      <Icon name="chevronRight" size={16} className={cx('transition-transform', open && 'rotate-90')} />
                    </button>
                  </Td>
                  <Td>
                    <p className="font-semibold text-white">{p.name}</p>
                    <p className="mt-0.5 font-mono text-xs tabular-nums text-slate-200">{p.code}</p>
                  </Td>
                  <Td>
                    <p className="text-white">{p.bank}</p>
                    <p className="mt-0.5 text-xs text-slate-200">{p.branch} Branch</p>
                  </Td>
                  <Td align="right" mono>
                    <span className="inline-flex items-center gap-1.5">
                      {p.accountVerified ? <Icon name="checkCircle" size={14} className="text-emerald-300" aria-label="Verified" /> : <Icon name="alert" size={14} className="text-red-300" aria-label="Unverified" />}
                      {p.accountNo}
                    </span>
                    {!p.accountVerified ? <p className="text-[11px] font-semibold text-red-300">Unverified</p> : null}
                  </Td>
                  <Td align="right" mono>
                    {p.roster.length}
                  </Td>
                  <Td align="right" mono className="font-bold text-amber-200">
                    {num(p.total)}.00
                  </Td>
                  <Td align="center">
                    <Badge tone={STATUS_TONE[p.status]} dot>
                      {p.status}
                    </Badge>
                  </Td>
                  <Td align="right" className="ws-stick-r">
                    <div className="flex flex-col items-stretch gap-1.5">
                      <Button
                        variant="primary"
                        icon="printer"
                        onClick={() =>
                          void advance(
                            p,
                            p.status === 'Draft' ? 'Cheque Drawn' : p.status,
                            () => openChequeSchedule(p, members[0]?.name ?? 'Chair', members[1]?.name ?? 'Secretary'),
                            `Cheque schedule generated for ${p.roster.length} beneficiaries totalling ${kes(p.total)}`,
                            `Cheque schedule for ${p.name} opened for printing`
                          )
                        }
                      >
                        Cheque Schedule PDF
                      </Button>
                      <Button
                        variant="gold"
                        icon="download"
                        disabled={!p.accountVerified || p.status === 'EFT Dispatched'}
                        title={!p.accountVerified ? 'Verify the institution bank account first' : undefined}
                        onClick={() =>
                          void advance(
                            p,
                            'EFT Dispatched',
                            () => downloadText(`EFT_${p.code}_${CYCLE.replace('/', '-')}.csv`, eftCsv(p)),
                            `Bank EFT file exported: ${p.bank} ${p.accountNo}, ${kes(p.total)}`,
                            `EFT file for ${p.name} exported`
                          )
                        }
                      >
                        Bank EFT Export
                      </Button>
                    </div>
                  </Td>
                </tr>
                {open ? (
                  <tr className="bg-ink-950/50">
                    <td colSpan={8} className="px-4 py-3">
                      <div className="ml-12 overflow-hidden rounded-lg border border-slate-800/80">
                        <table className="w-full text-sm">
                          <thead>
                            <tr>
                              <Th>Student name</Th>
                              <Th align="right">Admission no.</Th>
                              <Th align="right">Approved award (KES)</Th>
                            </tr>
                          </thead>
                          <tbody className={tbodyCls}>
                            {p.roster.map((r) => (
                              <tr key={r.id} className={rowCls}>
                                <Td>{r.name}</Td>
                                <Td align="right" mono>
                                  {r.admissionNo}
                                </Td>
                                <Td align="right" mono>
                                  {num(r.award)}.00
                                </Td>
                              </tr>
                            ))}
                            <tr>
                              <Td className="font-bold text-white">Total</Td>
                              <Td />
                              <Td align="right" mono className="font-bold text-amber-200">
                                {num(p.total)}.00
                              </Td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </DataTable>
      {payables.length === 0 ? <EmptyState icon="cheque" title="Nothing to disburse yet" body="Approve awards in the Allocation Suite and they will appear here grouped by institution." /> : null}
    </div>
  );
}
