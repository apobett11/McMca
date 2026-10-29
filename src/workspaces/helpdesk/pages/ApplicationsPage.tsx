import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cx, fmtDate, fmtDateTime, kes } from '../../lib/format.ts';
import { useDataTick } from '../../lib/hooks.ts';
import { LEDGER_EVENT, appendLedger, readLedger, shortHash } from '../../lib/ledger.ts';
import { useMutation } from '../../lib/toast.tsx';
import type { AccountClass, RegistryRow } from '../../types/schema.ts';
import { Drawer } from '../../ui/overlays.tsx';
import { Icon } from '../../ui/icons.tsx';
import { Avatar, Badge, Button, Card, Chip, DataTable, EmptyState, FieldLabel, KeyValue, PageHeader, SearchInput, Select, Tabs, Td, Textarea, Th, rowCls, tbodyCls } from '../../ui/primitives.tsx';
import { HD_EVENTS, hd, loadRegistry, officer } from '../data.ts';

type ClassFilter = 'all' | AccountClass;
type DossierTab = 'identity' | 'academic' | 'chief' | 'ledger';

const CLASS_LABEL: Record<AccountClass, string> = { IND: 'Independent', DEL: 'Delegated', CUS: 'Custody' };
const CLASS_TONE: Record<AccountClass, 'cyan' | 'violet' | 'amber'> = { IND: 'cyan', DEL: 'violet', CUS: 'amber' };
const STATUS_TONE = { Approved: 'emerald', Rejected: 'red', 'Under Review': 'amber', 'Proceeded to MCA Direct': 'violet' } as const;

export function ApplicationsPage() {
  const [params, setParams] = useSearchParams();
  const tick = useDataTick([...HD_EVENTS, LEDGER_EVENT]);
  const [q, setQ] = useState(params.get('q') ?? '');
  const [loc, setLoc] = useState('all');
  const [cls, setCls] = useState<ClassFilter>('all');
  const [openId, setOpenId] = useState<string | null>(params.get('open'));
  const [tab, setTab] = useState<DossierTab>((params.get('tab') as DossierTab) || 'identity');
  const [statusOverride, setStatusOverride] = useState<Record<string, RegistryRow['chiefStatus']>>({});

  useEffect(() => {
    const o = params.get('open');
    if (o) setOpenId(o);
    const t = params.get('tab') as DossierTab | null;
    if (t && ['identity', 'academic', 'chief', 'ledger'].includes(t)) {
      setTab(t);
    }
  }, [params]);

  useEffect(() => {
    void (hd.syncHelpDeskApplicationsFromDB as () => Promise<unknown>)().then(() => window.dispatchEvent(new CustomEvent('mcmca_helpdesk_apps_updated')));
  }, []);

  const rows = useMemo(() => loadRegistry().map((r) => (statusOverride[r.id] ? { ...r, chiefStatus: statusOverride[r.id], sentToMca: true } : r)), [tick, statusOverride]);
  const locations = useMemo(() => Array.from(new Set(rows.map((r) => r.subLocation))).sort(), [rows]);

  const filtered = rows.filter((r) => {
    if (loc !== 'all' && r.subLocation !== loc) return false;
    if (cls !== 'all' && r.accountClass !== cls) return false;
    const t = q.trim().toLowerCase();
    return !t || `${r.name} ${r.serial} ${r.nationalId} ${r.upi} ${r.birthCert} ${r.guardianName}`.toLowerCase().includes(t);
  });

  const current = rows.find((r) => r.id === openId) ?? null;
  const openDossier = (id: string, t: DossierTab = 'identity') => {
    setOpenId(id);
    setTab(t);
  };
  const closeDossier = () => {
    setOpenId(null);
    if (params.get('open')) {
      const n = new URLSearchParams(params);
      n.delete('open');
      setParams(n, { replace: true });
    }
  };

  const classCount = (c: ClassFilter) => (c === 'all' ? rows.length : rows.filter((r) => r.accountClass === c).length);

  return (
    <>
      <PageHeader eyebrow="Registry & dossiers" title="Applicant Registry" description="Instant applicant lookup and family custody verification." />

      <Card className="mb-4" flush>
        <div className="flex flex-wrap items-end gap-3 p-3">
          <div className="min-w-[260px] flex-1">
            <FieldLabel htmlFor="reg-search">Search</FieldLabel>
            <SearchInput id="reg-search" placeholder="National ID / UPI / name / serial…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="w-52">
            <FieldLabel htmlFor="reg-loc">Sub-location</FieldLabel>
            <Select id="reg-loc" value={loc} onChange={(e) => setLoc(e.target.value)}>
              <option value="all">All sub-locations</option>
              {locations.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </Select>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">Account class</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Account class">
              {(['all', 'IND', 'DEL', 'CUS'] as ClassFilter[]).map((c) => (
                <Chip key={c} active={cls === c} count={classCount(c)} onClick={() => setCls(c)}>
                  {c === 'all' ? 'All' : `${CLASS_LABEL[c]} · ${c}`}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <DataTable maxHeight="calc(100vh - 330px)">
        <thead>
          <tr>
            <Th align="right">Serial &amp; photo</Th>
            <Th>Student details</Th>
            <Th align="right">Identifier index</Th>
            <Th>Guardianship link</Th>
            <Th>Institution &amp; request</Th>
            <Th align="center">Chief status</Th>
            <Th align="right" className="ws-stick-r min-w-[120px]">
              Actions
            </Th>
          </tr>
        </thead>
        <tbody className={tbodyCls}>
          {filtered.map((r) => (
            <tr key={r.id} className={rowCls}>
              <Td align="right">
                <div className="flex items-center justify-end gap-3">
                  <span className="font-mono text-xs font-bold tabular-nums text-slate-100">{r.serial}</span>
                  <Avatar name={r.name} src={r.photoUrl} size={40} tone={CLASS_TONE[r.accountClass]} />
                </div>
              </Td>
              <Td>
                <p className="font-semibold text-white">{r.name}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-200">
                  {r.grade} · {r.level} · {r.subLocation}
                  <Badge tone={CLASS_TONE[r.accountClass]}>{r.accountClass}</Badge>
                </p>
              </Td>
              <Td align="right" mono>
                <p className="text-sm text-white">ID {r.nationalId}</p>
                <p className="mt-0.5 text-xs text-slate-200">
                  BC {r.birthCert} · UPI {r.upi}
                </p>
              </Td>
              <Td>
                <p className="font-semibold text-white">{r.guardianName}</p>
                <p className="mt-0.5 text-xs text-slate-200">
                  <span className="font-mono tabular-nums">{r.guardianPhone || '—'}</span> · {r.relationship}
                </p>
              </Td>
              <Td>
                <p className="text-white">{r.school}</p>
                <p className="mt-0.5 font-mono text-xs tabular-nums text-slate-200">Requested {kes(r.requestedKes)}</p>
              </Td>
              <Td align="center">
                <Badge tone={STATUS_TONE[r.chiefStatus]}>{r.chiefStatus}</Badge>
              </Td>
              <Td align="right" className="ws-stick-r">
                <div className="flex flex-col items-stretch gap-1.5">
                  <Button variant="primary" icon="eye" onClick={() => openDossier(r.id)}>
                    Open Dossier
                  </Button>
                  <Button variant="secondary" icon="ledger" onClick={() => openDossier(r.id, 'ledger')} aria-label={`Audit log for ${r.name}`}>
                    Audit Log
                  </Button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </DataTable>
      {filtered.length === 0 ? <EmptyState title="No applicants match" body="Adjust the search, sub-location, or account class filters." /> : null}

      <Dossier row={current} tab={tab} setTab={setTab} onClose={closeDossier} setStatusOverride={setStatusOverride} />
    </>
  );
}

/* ───────── Dossier drawer ───────── */

function Dossier({ row, tab, setTab, onClose, setStatusOverride }: { row: RegistryRow | null; tab: DossierTab; setTab: (t: DossierTab) => void; onClose: () => void; setStatusOverride: React.Dispatch<React.SetStateAction<Record<string, RegistryRow['chiefStatus']>>> }) {
  const run = useMutation();
  const tick = useDataTick([LEDGER_EVENT]);
  const [note, setNote] = useState('');
  useEffect(() => {
    setNote('');
  }, [row?.id]);

  const ledger = useMemo(() => {
    if (!row) return [];
    return readLedger('helpdesk')
      .filter((e) => e.target === row.id || e.targetLabel.toLowerCase().includes(row.name.toLowerCase()))
      .reverse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row, tick]);

  const proceed = () => {
    if (!row) return;
    const r = row;
    return run({
      apply: () => setStatusOverride((m) => ({ ...m, [r.id]: 'Proceeded to MCA Direct' })),
      rollback: () =>
        setStatusOverride((m) => {
          const n = { ...m };
          delete n[r.id];
          return n;
        }),
      commit: async () => {
        const who = officer().name;
        (hd.proceedApplicationToMca as (id: string, n: string, o: string) => unknown)(r.id, note.trim(), who);
        await appendLedger('helpdesk', { actor: who, kind: 'proceed_to_mca', target: r.id, targetLabel: r.name, detail: `Proceeded to MCA direct: ${note.trim()}` });
      },
      success: `${r.name} forwarded to the MCA committee`,
      failure: 'Forwarding to MCA failed – status restored',
      onSuccess: () => setNote('')
    });
  };

  return (
    <Drawer
      open={!!row}
      onClose={onClose}
      width={700}
      title={row?.name ?? ''}
      subtitle={row ? <span className="font-mono tabular-nums">{row.serial} · ID {row.nationalId}</span> : null}
      headerExtra={row ? <Badge tone={STATUS_TONE[row.chiefStatus]}>{row.chiefStatus}</Badge> : null}
    >
      {row ? (
        <>
          <Tabs
            label="Student dossier"
            value={tab}
            onChange={setTab}
            tabs={[
              { key: 'identity', label: '1. Identity & Custody', icon: 'user' },
              { key: 'academic', label: '2. Academic & Fees', icon: 'cap' },
              { key: 'chief', label: '3. Chief Vetting', icon: 'shield' },
              { key: 'ledger', label: '4. Event Ledger', icon: 'ledger' }
            ]}
          />
          <div className="space-y-4 p-5" role="tabpanel">
            {tab === 'identity' ? (
              <>
                <Card title="Applicant">
                  <div className="flex items-start gap-4">
                    <Avatar name={row.name} src={row.photoUrl} size={64} tone={CLASS_TONE[row.accountClass]} />
                    <dl className="grid flex-1 grid-cols-2 gap-4">
                      <KeyValue label="Full name">{row.name}</KeyValue>
                      <KeyValue label="Account class">
                        <Badge tone={CLASS_TONE[row.accountClass]}>
                          {CLASS_LABEL[row.accountClass]} · {row.accountClass}
                        </Badge>
                      </KeyValue>
                      <KeyValue label="National ID" mono>
                        {row.nationalId}
                      </KeyValue>
                      <KeyValue label="Birth certificate" mono>
                        {row.birthCert}
                      </KeyValue>
                      <KeyValue label="NEMIS UPI" mono>
                        {row.upi}
                      </KeyValue>
                      <KeyValue label="Sub-location">{row.subLocation}</KeyValue>
                    </dl>
                  </div>
                </Card>
                <Card title="Guardianship link" subtitle="Family custody verification">
                  <dl className="grid grid-cols-2 gap-4">
                    <KeyValue label="Linked guardian">{row.guardianName}</KeyValue>
                    <KeyValue label="Relationship">{row.relationship}</KeyValue>
                    <KeyValue label="Phone" mono>
                      {row.guardianPhone || '—'}
                    </KeyValue>
                    <KeyValue label="Custody basis">{row.accountClass === 'CUS' ? 'Parent-held account (minor)' : row.accountClass === 'DEL' ? 'Delegated access to parent' : 'Applicant manages own account'}</KeyValue>
                  </dl>
                  {row.guardianPhone ? (
                    <a href={`tel:${row.guardianPhone.replace(/\s/g, '')}`} className="mt-4 inline-flex min-h-[36px] items-center gap-2 rounded-lg border border-slate-600 bg-slate-800/70 px-3.5 text-sm font-semibold text-slate-50 hover:bg-slate-700/70">
                      <Icon name="phone" size={16} /> Call guardian
                    </a>
                  ) : null}
                </Card>
              </>
            ) : null}

            {tab === 'academic' ? (
              <Card title="Academic & fees">
                <dl className="grid grid-cols-2 gap-4">
                  <KeyValue label="Institution">{row.school}</KeyValue>
                  <KeyValue label="Level">{row.level}</KeyValue>
                  <KeyValue label="Grade / year">{row.grade}</KeyValue>
                  <KeyValue label="Submitted" mono>
                    {fmtDate(row.submittedAt)}
                  </KeyValue>
                  <KeyValue label="Amount requested" mono>
                    {kes(row.requestedKes)}
                  </KeyValue>
                  <KeyValue label="Cycle" mono>
                    2026/2027
                  </KeyValue>
                </dl>
              </Card>
            ) : null}

            {tab === 'chief' ? (
              <>
                <Card title="Chief vetting report">
                  <dl className="grid grid-cols-2 gap-4">
                    <KeyValue label="Decision">
                      <Badge tone={STATUS_TONE[row.chiefStatus]}>{row.chiefStatus}</Badge>
                    </KeyValue>
                    <KeyValue label="Risk flag">
                      <Badge tone={row.riskFlag === 'Clean' ? 'emerald' : 'amber'}>{row.riskFlag}</Badge>
                    </KeyValue>
                  </dl>
                  <div className="mt-4 rounded-lg border border-slate-700 bg-ink-950/50 p-3 text-sm text-slate-50">{row.chiefReason || 'No adverse findings recorded by the Chief.'}</div>
                  {row.notes ? (
                    <p className="mt-3 text-sm text-slate-100">
                      <span className="font-bold text-white">Help Desk note: </span>
                      {row.notes}
                    </p>
                  ) : null}
                </Card>
                {row.chiefStatus === 'Rejected' && !row.sentToMca ? (
                  <Card title="Proceed to MCA directly" subtitle="Use when verified evidence overturns the Chief’s finding before the appeal cut-off.">
                    <FieldLabel htmlFor="proceed-note" hint={`${note.trim().length}/20 min`}>
                      Override justification
                    </FieldLabel>
                    <Textarea id="proceed-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Evidence reviewed (lease, utility bill, Sub-Chief letter)…" />
                    <Button variant="warn" icon="send" className="mt-3" disabled={note.trim().length < 20} onClick={proceed}>
                      Proceed to MCA
                    </Button>
                  </Card>
                ) : null}
              </>
            ) : null}

            {tab === 'ledger' ? (
              <Card title="Immutable event ledger" subtitle="SHA-256 hash-chained · append only" flush>
                <ol className="divide-y divide-slate-800/60">
                  {ledger.map((e) => (
                    <li key={e.id} className="px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <Badge tone="accent">{e.kind.replace(/_/g, ' ')}</Badge>
                        <span className="font-mono text-xs tabular-nums text-slate-200">{fmtDateTime(e.ts)}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-50">{e.detail}</p>
                      <p className="mt-1 font-mono text-[11px] text-slate-300" title={e.hash}>
                        {e.actor} · <Icon name="hash" size={11} className="inline" /> {shortHash(e.hash)}
                      </p>
                    </li>
                  ))}
                  <li className={cx('px-4 py-3')}>
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone="neutral">submitted</Badge>
                      <span className="font-mono text-xs tabular-nums text-slate-200">{fmtDateTime(row.submittedAt)}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-50">Application {row.serial} submitted for the 2026/2027 cycle.</p>
                    <p className="mt-1 text-[11px] text-slate-300">System record (pre-ledger)</p>
                  </li>
                </ol>
              </Card>
            ) : null}
          </div>
        </>
      ) : null}
    </Drawer>
  );
}
