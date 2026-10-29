import { useMemo, useState } from 'react';
import { cx, fmtDateTime, num } from '../../lib/format.ts';
import { useDataTick, useStored } from '../../lib/hooks.ts';
import { appendLedger } from '../../lib/ledger.ts';
import { smsSegments } from '../../lib/text.ts';
import { latency, useMutation } from '../../lib/toast.tsx';
import { Icon } from '../../ui/icons.tsx';
import { Badge, Button, Card, Chip, EmptyState, FieldLabel, Input, PageHeader, Segmented, Select, Textarea } from '../../ui/primitives.tsx';
import { MCA_EVENTS, loadAwardRows } from '../store.ts';
import * as mca from '../../../dashboards/mca/utils/mcaData.js';

interface Inbound {
  id: string;
  senderName: string;
  village: string;
  phone: string;
  subject: string;
  message: string;
  category: string;
  forwardedBy: string;
  forwardedAt: string;
  priority: string;
  status: string;
}
interface Broadcast {
  id: string;
  at: string;
  title: string;
  audience: string;
  recipients: number;
  segments: number;
  message: string;
  status: 'Queued' | 'Dispatched';
}

const NOTICES = [
  { id: 'res', label: 'Bursary results', en: 'NG-CDF Tendeno/Sorget: 2026/2027 bursary results are out. Check your portal account or visit the Ward Office. Appeals close in 14 days.', sw: 'NG-CDF Tendeno/Sorget: matokeo ya bursary 2026/2027 yametoka. Angalia akaunti yako au tembelea Afisi ya Wadi. Rufaa zitafungwa baada ya siku 14.' },
  { id: 'chq', label: 'Cheque collection', en: 'NG-CDF Tendeno/Sorget: bursary cheques have been issued to schools. Please confirm fee receipts with your institution within 7 days.', sw: 'NG-CDF Tendeno/Sorget: hundi za bursary zimetumwa shuleni. Tafadhali thibitisha risiti za ada na taasisi yako ndani ya siku 7.' },
  { id: 'bar', label: 'Public baraza', en: 'The Hon. MCA invites all residents to a public baraza at Tendeno Civic Centre on Saturday 10:00 AM. Bursary updates will be presented.', sw: 'Mhe. MCA anawaalika wakazi wote kwenye baraza la umma katika Tendeno Civic Centre Jumamosi saa nne asubuhi. Taarifa za bursary zitawasilishwa.' }
];

export function MessagesPage() {
  const run = useMutation();
  const tick = useDataTick([...MCA_EVENTS, 'mcmca_mca_messages_updated']);
  const [inbox, setInbox] = useState<Inbound[]>(() => mca.getMCAMessages() as unknown as Inbound[]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [history, setHistory] = useStored<Broadcast[]>('mcmca_ws_mca_broadcasts_v1', []);

  const rows = useMemo(() => loadAwardRows(), [tick]);
  const subs = useMemo(() => Array.from(new Set(rows.map((r) => r.subLocation))).sort(), [rows]);

  const [audience, setAudience] = useState('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [lang, setLang] = useState<'en' | 'sw'>('en');

  const recipients = useMemo(() => {
    const pick = rows.filter((r) => (audience === 'all' ? true : audience === 'awarded' ? r.state === 'approved' || r.state === 'locked' : audience === 'appeal' ? r.state === 'chief_rejected' : r.subLocation === audience.replace('sub:', '')));
    return new Set(pick.map((r) => r.phone.replace(/\s/g, ''))).size;
  }, [rows, audience]);
  const seg = smsSegments(body);
  const audienceLabel = audience === 'all' ? 'All applicant households' : audience === 'awarded' ? 'Awarded households' : audience === 'appeal' ? 'Households with Chief rejection' : audience.replace('sub:', '');
  const canSend = title.trim().length >= 3 && body.trim().length >= 10 && recipients > 0;

  const markReviewed = (m: Inbound) => {
    const prev = inbox;
    return run({
      apply: () => setInbox((l) => l.map((x) => (x.id === m.id ? { ...x, status: 'Reviewed' } : x))),
      rollback: () => setInbox(prev),
      commit: async () => {
        await latency(200);
        const all = mca.getMCAMessages() as unknown as Inbound[];
        mca.saveMCAMessages(all.map((x) => (x.id === m.id ? { ...x, status: 'Reviewed' } : x)));
      },
      success: 'Marked as reviewed',
      failure: 'Could not update message'
    });
  };

  const send = () => {
    const entry: Broadcast = { id: `bc-${Date.now().toString(36)}`, at: new Date().toISOString(), title: title.trim(), audience: audienceLabel, recipients, segments: seg.segments, message: body.trim(), status: 'Queued' };
    const prevHistory = history;
    const prevForm = { title, body };
    return run({
      apply: () => {
        setHistory((h) => [entry, ...h]);
        setTitle('');
        setBody('');
      },
      rollback: () => {
        setHistory(prevHistory);
        setTitle(prevForm.title);
        setBody(prevForm.body);
      },
      commit: async () => {
        await latency(500);
        await appendLedger('mca', { actor: (mca.getMCAProfile() as { fullName: string }).fullName, kind: 'official_notice', target: entry.id, targetLabel: entry.title, detail: `SMS broadcast to ${recipients} recipients (${audienceLabel}), ${seg.segments} segment(s) each = ${recipients * seg.segments} SMS` });
        setHistory((h) => h.map((x) => (x.id === entry.id ? { ...x, status: 'Dispatched' } : x)));
      },
      success: `Notice queued for ${recipients} recipients`,
      failure: 'Broadcast failed – draft restored'
    });
  };

  const open = inbox.find((m) => m.id === openId) ?? null;

  return (
    <>
      <PageHeader eyebrow="Official communications" title="Notices & Correspondence" description="Broadcast official notices to constituents and handle matters forwarded by the Help Desk." />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card title="Official notice broadcaster" subtitle="Automated SMS dispatch to ward constituents">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Template</span>
              {NOTICES.map((n) => (
                <Chip
                  key={n.id}
                  onClick={() => {
                    setTitle(n.label);
                    setBody(lang === 'en' ? n.en : n.sw);
                  }}
                >
                  {n.label}
                </Chip>
              ))}
              <span className="ml-auto">
                <Segmented
                  label="Template language"
                  value={lang}
                  onChange={setLang}
                  options={[
                    { key: 'en', label: 'EN' },
                    { key: 'sw', label: 'SW' }
                  ]}
                />
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="bc-aud">Audience</FieldLabel>
                <Select id="bc-aud" value={audience} onChange={(e) => setAudience(e.target.value)}>
                  <option value="all">All applicant households</option>
                  <option value="awarded">Awarded households</option>
                  <option value="appeal">Households with Chief rejection</option>
                  {subs.map((s) => (
                    <option key={s} value={`sub:${s}`}>
                      Sub-location: {s}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <FieldLabel htmlFor="bc-title">Notice title (internal)</FieldLabel>
                <Input id="bc-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Bursary results" />
              </div>
            </div>
            <div>
              <FieldLabel htmlFor="bc-body">SMS text</FieldLabel>
              <Textarea id="bc-body" value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[140px]" />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-700/80 bg-ink-950/40 p-3">
              <p className="font-mono text-sm tabular-nums text-slate-100" aria-live="polite">
                {seg.units} chars · <strong className={seg.segments > 2 ? 'text-amber-300' : 'text-emerald-300'}>{seg.segments} SMS</strong> × {num(recipients)} recipients = <strong className="text-white">{num(seg.segments * recipients)}</strong> messages
              </p>
              <Button variant="emerald" icon="megaphone" disabled={!canSend} onClick={() => void send()}>
                Broadcast notice
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card title="Forwarded by Help Desk" subtitle={`${inbox.filter((m) => m.status !== 'Reviewed').length} awaiting MCA action`} flush>
            <ul className="divide-y divide-slate-800/50">
              {inbox.map((m) => (
                <li key={m.id}>
                  <button type="button" aria-expanded={openId === m.id} onClick={() => setOpenId(openId === m.id ? null : m.id)} className="flex min-h-[64px] w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-800/40">
                    <Badge tone={m.priority === 'Urgent' ? 'red' : m.priority === 'Normal' ? 'amber' : 'neutral'}>{m.priority}</Badge>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">{m.subject}</span>
                      <span className="block text-xs text-slate-200">
                        {m.senderName} · {m.village} · <span className="font-mono">{m.forwardedAt}</span>
                      </span>
                    </span>
                    {m.status === 'Reviewed' ? <Badge tone="emerald">Reviewed</Badge> : <Badge tone="amber">Pending</Badge>}
                    <Icon name="chevronDown" size={16} className={cx('mt-1 transition-transform', openId === m.id && 'rotate-180')} />
                  </button>
                  {open?.id === m.id ? (
                    <div className="space-y-3 bg-ink-950/40 px-4 py-3">
                      <p className="text-sm text-slate-50">{m.message}</p>
                      <p className="text-xs text-slate-200">
                        Forwarded by {m.forwardedBy} · <span className="font-mono">{m.phone}</span>
                      </p>
                      <div className="flex gap-2">
                        <Button variant="primary" icon="check" disabled={m.status === 'Reviewed'} onClick={() => void markReviewed(m)}>
                          Mark reviewed
                        </Button>
                        <Button
                          variant="secondary"
                          icon="megaphone"
                          onClick={() => {
                            setTitle(`Re: ${m.subject}`);
                            setAudience(`sub:${m.village}`);
                          }}
                        >
                          Notice to {m.village}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
            {inbox.length === 0 ? <EmptyState icon="message" title="Inbox is empty" /> : null}
          </Card>

          <Card title="Broadcast history" flush>
            {history.length === 0 ? (
              <EmptyState icon="megaphone" title="No broadcasts yet" body="Sent notices and their delivery state appear here." />
            ) : (
              <ul className="divide-y divide-slate-800/50">
                {history.map((h) => (
                  <li key={h.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-white">{h.title}</p>
                      <Badge tone={h.status === 'Dispatched' ? 'emerald' : 'amber'} pulse={h.status === 'Queued'}>
                        {h.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-200">
                      {h.audience} · <span className="font-mono tabular-nums">{num(h.recipients)}</span> recipients · <span className="font-mono tabular-nums">{h.segments}</span> SMS each · <span className="font-mono tabular-nums">{fmtDateTime(h.at)}</span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
