import { useMemo, useState } from 'react';
import { fmtDateTime, kes } from '../../lib/format.ts';
import { useDataTick } from '../../lib/hooks.ts';
import { LEDGER_EVENT, appendLedger, readLedger, shortHash, verifyLedger } from '../../lib/ledger.ts';
import { RuleViolation, latency, useMutation } from '../../lib/toast.tsx';
import { Icon } from '../../ui/icons.tsx';
import { Avatar, Badge, Button, Card, DataTable, EmptyState, FieldLabel, Input, KeyValue, PageHeader, Switch, Td, Th, rowCls, tbodyCls } from '../../ui/primitives.tsx';
import { MCA_EVENTS, generateMemberKey, getMembers, getPolicy, getTranche, quorum, restoreSnapshot, saveMembers, savePolicy, saveTranche, snapshot, type Member, type Policy } from '../store.ts';
import * as mca from '../../../dashboards/mca/utils/mcaData.js';

interface Prof {
  fullName: string;
  title: string;
  ward: string;
  constituency: string;
  county: string;
  term: string;
  phone: string;
  email: string;
  officeLocation: string;
}

export function ProfilePage() {
  const run = useMutation();
  const tick = useDataTick([...MCA_EVENTS, LEDGER_EVENT]);
  const prof = mca.getMCAProfile() as Prof;
  const actor = prof.fullName;

  const [members, setMembers] = useState<Member[]>(() => getMembers());
  const tranche = useMemo(() => getTranche(), [tick]);
  const q = useMemo(() => quorum(), [tick, members]);
  const [policy, setPolicy] = useState<Policy>(() => getPolicy());
  const [hardCap, setHardCap] = useState(String(getTranche().hard_cap_amount));
  const [warn, setWarn] = useState(String(getTranche().warn_threshold_pct));
  const [minShare, setMinShare] = useState(String(getTranche().min_sublocation_share_pct));
  const [chain, setChain] = useState<{ ok: boolean; count: number; brokenAt: number | null } | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const ledger = useMemo(() => readLedger('mca').slice().reverse(), [tick]);

  const patchMember = (id: string, patch: Partial<Member>, what: string) => {
    const prev = members;
    return run({
      apply: () => setMembers((m) => m.map((x) => (x.id === id ? { ...x, ...patch } : x))),
      rollback: () => setMembers(prev),
      commit: async () => {
        await latency(200);
        saveMembers(prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
        await appendLedger('mca', { actor, kind: 'committee_config', target: id, targetLabel: prev.find((x) => x.id === id)?.name ?? id, detail: what });
      },
      success: what,
      failure: 'Committee change not saved'
    });
  };

  const genKey = async (m: Member) => {
    setBusyKey(m.id);
    try {
      const next = await generateMemberKey(m.id);
      setMembers(next);
      await appendLedger('mca', { actor, kind: 'key_issued', target: m.id, targetLabel: m.name, detail: `ECDSA P-256 sign-off key ${m.publicJwk ? 'rotated' : 'issued'} on this device (private key non-extractable)` });
      window.dispatchEvent(new CustomEvent('mcmca_ws_mca_updated'));
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyKey(null);
    }
  };

  const limitsValid = (() => {
    const cap = Number(hardCap);
    return cap >= tranche.committed_amount && cap <= tranche.total_amount && policy.perStudentCap > 0 && policy.deviationPct >= 0 && policy.deviationPct <= 100 && policy.quorumRequired >= 1 && policy.quorumRequired <= members.filter((m) => !m.revoked).length;
  })();

  const saveLimits = () => {
    const snap = snapshot();
    const prevPolicy = getPolicy();
    return run({
      apply: () => undefined,
      rollback: () => {
        restoreSnapshot(snap);
        savePolicy(prevPolicy);
        setPolicy(prevPolicy);
      },
      commit: async () => {
        await latency(300);
        const cap = Number(hardCap);
        if (cap < snap.tranche.committed_amount) throw new RuleViolation(`Hard cap cannot be below the amount already committed (${kes(snap.tranche.committed_amount)}).`);
        if (cap > snap.tranche.total_amount) throw new RuleViolation(`Hard cap cannot exceed the total ward pool (${kes(snap.tranche.total_amount)}).`);
        saveTranche({ ...snap.tranche, hard_cap_amount: cap, warn_threshold_pct: Number(warn), min_sublocation_share_pct: Number(minShare) });
        savePolicy(policy);
        await appendLedger('mca', { actor, kind: 'limits_changed', target: snap.tranche.id, targetLabel: 'Budget limits', detail: `Hard cap ${kes(cap)}; per-student ${kes(policy.perStudentCap)}; deviation ${policy.deviationPct}%; quorum ${policy.quorumRequired}; warn ${warn}%; min share ${minShare}%` });
      },
      success: 'Budget limits saved and logged',
      failure: 'Limits rejected – previous values restored'
    });
  };

  const verify = async () => {
    const r = await verifyLedger('mca');
    setChain(r);
  };

  return (
    <>
      <PageHeader eyebrow="Committee vault" title="Profile" description="Multi-signature committee configuration, cryptographic sign-off keys and hard budget limits." />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-4">
              <Avatar name={prof.fullName} size={64} />
              <div className="min-w-0">
                <p className="text-lg font-bold leading-tight text-white">{prof.fullName}</p>
                <p className="text-sm text-slate-100">{prof.title}</p>
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4">
              <KeyValue label="Ward">{prof.ward}</KeyValue>
              <KeyValue label="Term">{prof.term}</KeyValue>
              <KeyValue label="Constituency">{prof.constituency}</KeyValue>
              <KeyValue label="County">{prof.county}</KeyValue>
              <KeyValue label="Phone" mono>
                {prof.phone}
              </KeyValue>
              <KeyValue label="Email">{prof.email}</KeyValue>
            </dl>
          </Card>

          <Card title="Hard budget limits" subtitle="Enforced on every commit – the UI cannot bypass them">
            <div className="space-y-3">
              <div>
                <FieldLabel htmlFor="lim-cap" hint={`pool ${kes(tranche.total_amount)}`}>
                  Tranche hard cap (KES)
                </FieldLabel>
                <Input id="lim-cap" type="number" step={10000} value={hardCap} onChange={(e) => setHardCap(e.target.value)} className="text-right font-mono tabular-nums" />
                {Number(hardCap) < tranche.committed_amount ? <p className="mt-1 text-sm font-semibold text-red-300">Below committed amount ({kes(tranche.committed_amount)}).</p> : null}
              </div>
              <div>
                <FieldLabel htmlFor="lim-stu">Per-student maximum (KES)</FieldLabel>
                <Input id="lim-stu" type="number" step={500} value={policy.perStudentCap} onChange={(e) => setPolicy({ ...policy, perStudentCap: Number(e.target.value) })} className="text-right font-mono tabular-nums" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <FieldLabel htmlFor="lim-dev">Deviation %</FieldLabel>
                  <Input id="lim-dev" type="number" value={policy.deviationPct} onChange={(e) => setPolicy({ ...policy, deviationPct: Number(e.target.value) })} className="text-right font-mono" />
                </div>
                <div>
                  <FieldLabel htmlFor="lim-warn">Warn at %</FieldLabel>
                  <Input id="lim-warn" type="number" value={warn} onChange={(e) => setWarn(e.target.value)} className="text-right font-mono" />
                </div>
                <div>
                  <FieldLabel htmlFor="lim-min">Min share %</FieldLabel>
                  <Input id="lim-min" type="number" value={minShare} onChange={(e) => setMinShare(e.target.value)} className="text-right font-mono" />
                </div>
              </div>
              <div>
                <FieldLabel htmlFor="lim-q" hint={`of ${members.filter((m) => !m.revoked).length} signatories`}>
                  Quorum required
                </FieldLabel>
                <Input id="lim-q" type="number" min={1} value={policy.quorumRequired} onChange={(e) => setPolicy({ ...policy, quorumRequired: Number(e.target.value) })} className="text-right font-mono" />
              </div>
              <Button variant="gold" icon="lock" block disabled={!limitsValid} onClick={() => void saveLimits()}>
                Save limits
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card
            title="Signatory vault"
            subtitle="ECDSA P-256 keys are generated in this browser; the private key is non-extractable."
            actions={<Badge tone={q.met ? 'emerald' : 'amber'}>{`Quorum ${q.present}/${q.total} · need ${q.required}`}</Badge>}
            flush
          >
            <DataTable className="rounded-none border-0">
              <thead>
                <tr>
                  <Th>Signatory</Th>
                  <Th align="center">Present</Th>
                  <Th align="right">Key fingerprint (SHA-256)</Th>
                  <Th align="center">Status</Th>
                  <Th align="right" className="min-w-[120px]">
                    Actions
                  </Th>
                </tr>
              </thead>
              <tbody className={tbodyCls}>
                {members.map((m) => (
                  <tr key={m.id} className={rowCls}>
                    <Td>
                      <p className="font-semibold text-white">{m.name}</p>
                      <p className="text-xs text-slate-200">{m.role}</p>
                    </Td>
                    <Td align="center">
                      <Switch checked={m.present && !m.revoked} onChange={(v) => void patchMember(m.id, { present: v }, `${m.name} marked ${v ? 'present' : 'absent'}`)} label={`${m.name} present at sitting`} />
                    </Td>
                    <Td align="right" mono className="max-w-[260px] break-all text-xs">
                      {m.fingerprint || <span className="font-sans text-slate-300">No key issued</span>}
                      {m.keyCreatedAt ? <p className="font-sans text-[11px] text-slate-300">{fmtDateTime(m.keyCreatedAt)}</p> : null}
                    </Td>
                    <Td align="center">{m.revoked ? <Badge tone="red">Revoked</Badge> : m.publicJwk ? <Badge tone="emerald">Key active</Badge> : <Badge tone="amber">No key</Badge>}</Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="secondary" icon="key" loading={busyKey === m.id} disabled={m.revoked} onClick={() => void genKey(m)}>
                          {m.publicJwk ? 'Rotate' : 'Issue key'}
                        </Button>
                        <Button variant="ghost" onClick={() => void patchMember(m.id, { revoked: !m.revoked, present: m.revoked ? m.present : false }, `${m.name} ${m.revoked ? 'reinstated' : 'revoked'}`)}>
                          {m.revoked ? 'Reinstate' : 'Revoke'}
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
            <p className="px-4 py-3 text-xs text-slate-200">Private keys never leave this device. Sign-off from a different machine requires issuing that signatory a key there.</p>
          </Card>

          <Card
            title="Sign-off ledger"
            subtitle="Approvals, appeals, manifests and configuration changes – SHA-256 hash-chained"
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
            {ledger.length === 0 ? (
              <EmptyState icon="ledger" title="No entries yet" body="Committee approvals and configuration changes are recorded here." />
            ) : (
              <DataTable className="rounded-none border-0" maxHeight="360px">
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
                  {ledger.map((e) => (
                    <tr key={e.id} className={rowCls}>
                      <Td align="right" mono className="text-xs">
                        {fmtDateTime(e.ts)}
                      </Td>
                      <Td>
                        <Badge tone="accent">{e.kind.replace(/_/g, ' ')}</Badge>
                      </Td>
                      <Td className="max-w-[180px] truncate">{e.targetLabel}</Td>
                      <Td className="max-w-[300px] truncate text-xs text-slate-100" title={e.detail}>
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
