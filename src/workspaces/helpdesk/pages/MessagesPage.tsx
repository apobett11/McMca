import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cx, fmtDateTime, fmtDuration } from '../../lib/format.ts';
import { useDataTick, useNow } from '../../lib/hooks.ts';
import { LEDGER_EVENT, appendLedger } from '../../lib/ledger.ts';
import { fillTemplate, smsSegments } from '../../lib/text.ts';
import { latency, useMutation } from '../../lib/toast.tsx';
import { Modal } from '../../ui/overlays.tsx';
import { Icon } from '../../ui/icons.tsx';
import { Avatar, Badge, Button, Card, Chip, EmptyState, FieldLabel, PageHeader, Segmented, Textarea } from '../../ui/primitives.tsx';
import { HD_EVENTS, SLA_MS, SMS_TEMPLATES, hd, isOpenTicket, isSlaBreach, loadTickets, officer, type LegacyMessage } from '../data.ts';

type TicketFilter = 'all' | 'unreplied' | 'breach';

export function MessagesPage() {
  const [params, setParams] = useSearchParams();
  const run = useMutation();
  const tick = useDataTick([...HD_EVENTS, LEDGER_EVENT]);
  const now = useNow(30_000);
  const feedEnd = useRef<HTMLDivElement>(null);

  const filter = (params.get('filter') as TicketFilter) || 'all';
  const [activeId, setActiveId] = useState<string | null>(params.get('ticket'));
  const [draft, setDraft] = useState('');
  const [lang, setLang] = useState<'EN' | 'SW'>('EN');
  const [pending, setPending] = useState<Record<string, { body: string; at: string }[]>>({});
  const [fwdOpen, setFwdOpen] = useState(false);
  const [fwdNote, setFwdNote] = useState('');
  const [fwdLocal, setFwdLocal] = useState<Set<string>>(new Set());

  const all = useMemo(() => loadTickets(), [tick]);
  const tickets = useMemo(() => {
    const list = all.filter((m) => (filter === 'unreplied' ? isOpenTicket(m) : filter === 'breach' ? isSlaBreach(m, now) : true));
    return list.slice().sort((a, b) => Number(isSlaBreach(b, now)) - Number(isSlaBreach(a, now)) || +new Date(b.sentDate) - +new Date(a.sentDate));
  }, [all, filter, now]);

  const active: LegacyMessage | null = tickets.find((m) => m.id === activeId) ?? tickets[0] ?? null;
  useEffect(() => {
    if (active && active.id !== activeId) setActiveId(active.id);
  }, [active, activeId]);
  useEffect(() => {
    feedEnd.current?.scrollIntoView({ block: 'end' });
  }, [active?.id, active?.replies.length, pending]);

  const seg = smsSegments(draft);
  const setFilter = (f: TicketFilter) => {
    const n = new URLSearchParams(params);
    if (f === 'all') n.delete('filter');
    else n.set('filter', f);
    setParams(n, { replace: true });
  };

  const send = () => {
    if (!active || !draft.trim()) return;
    const m = active;
    const body = draft.trim();
    const entry = { body, at: new Date().toISOString() };
    return run({
      apply: () => {
        setPending((p) => ({ ...p, [m.id]: [...(p[m.id] ?? []), entry] }));
        setDraft('');
      },
      rollback: () => {
        setPending((p) => ({ ...p, [m.id]: (p[m.id] ?? []).filter((x) => x !== entry) }));
        setDraft(body);
      },
      commit: async () => {
        await latency(350);
        (hd.replyToMessage as (id: string, t: string, who?: string) => unknown)(m.id, body, `${officer().name} (Help Desk)`);
        await appendLedger('helpdesk', { actor: officer().name, kind: 'ticket_reply', target: m.id, targetLabel: `${m.senderName} · ${m.subject}`, detail: `Reply sent (${seg.segments} SMS segment${seg.segments === 1 ? '' : 's'}, ${seg.encoding})` });
      },
      success: `Reply sent to ${m.senderName}`,
      failure: 'Reply failed – draft restored',
      onSuccess: () => setPending((p) => ({ ...p, [m.id]: (p[m.id] ?? []).filter((x) => x !== entry) }))
    });
  };

  const forward = () => {
    if (!active) return;
    const m = active;
    return run({
      apply: () => {
        setFwdLocal((s) => new Set(s).add(m.id));
        setFwdOpen(false);
      },
      rollback: () =>
        setFwdLocal((s) => {
          const n = new Set(s);
          n.delete(m.id);
          return n;
        }),
      commit: async () => {
        await latency(300);
        (hd.forwardMessageToMca as (id: string, n: string, o: string) => unknown)(m.id, fwdNote.trim(), officer().name);
        await appendLedger('helpdesk', { actor: officer().name, kind: 'ticket_forward_mca', target: m.id, targetLabel: m.subject, detail: `Forwarded to MCA: ${fwdNote.trim()}` });
      },
      success: 'Ticket forwarded to the MCA office',
      failure: 'Forward failed – ticket remains with Help Desk',
      onSuccess: () => setFwdNote('')
    });
  };

  const topics = Array.from(new Set(SMS_TEMPLATES.map((t) => t.topic)));
  const insert = (text: string) => {
    if (!active) return;
    setDraft(fillTemplate(text, { name: active.senderName, student: active.studentName, doc: 'document' }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'ws-fade-in 0.2s ease-out' }} className="pb-12">
      {/* HERO BANNER (HELPDESK DISPATCH & TICKET OPERATIONS THEME) */}
      <section
        className="dash-single-card"
        style={{
          padding: '22px 26px',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(13, 21, 39, 0.95) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
          borderRadius: 16,
          backdropFilter: 'blur(16px)'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 260 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(6, 182, 212, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                flexShrink: 0
              }}
            >
              <Icon name="support" size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: 'rgba(6, 182, 212, 0.18)',
                    color: '#22d3ee',
                    border: '1px solid rgba(6, 182, 212, 0.35)'
                  }}
                >
                  Help Desk Dispatch
                </span>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  2-Hour SLA Queue &bull; SMS Gateway
                </span>
              </div>
              <h1 style={{ margin: '4px 0 0', fontSize: '1.35rem', color: '#ffffff', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Constituent Inquiries &amp; Messages
              </h1>
              <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.84rem' }}>
                Reply to families, escalate complex boundary and hardship cases to the MCA, and manage SLA adherence.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.74rem',
                padding: '5px 12px',
                borderRadius: 999,
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                fontWeight: 600,
                fontFamily: 'monospace'
              }}
            >
              {all.filter(isOpenTicket).length} Open &bull; {all.filter((m) => isSlaBreach(m, now)).length} Breached
            </span>
          </div>
        </div>
      </section>

      <div className="grid min-h-[620px] grid-cols-1 gap-4 lg:h-[calc(100vh-250px)] lg:grid-cols-[320px_minmax(0,1fr)_320px]">
        {/* Threads */}
        <Card flush className="flex min-h-[320px] flex-col overflow-hidden" aria-label="Ticket threads">
          <div className="flex flex-wrap gap-2 border-b border-slate-800/60 p-3">
            <Chip active={filter === 'all'} count={all.length} onClick={() => setFilter('all')}>
              All
            </Chip>
            <Chip active={filter === 'unreplied'} count={all.filter(isOpenTicket).length} onClick={() => setFilter('unreplied')}>
              Unreplied
            </Chip>
            <Chip active={filter === 'breach'} count={all.filter((m) => isSlaBreach(m, now)).length} onClick={() => setFilter('breach')}>
              SLA breach
            </Chip>
          </div>
          <ul className="min-h-0 flex-1 divide-y divide-slate-800/50 overflow-y-auto">
            {tickets.map((m) => {
              const on = m.id === active?.id;
              const breach = isSlaBreach(m, now);
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    aria-current={on}
                    onClick={() => setActiveId(m.id)}
                    className={cx('flex min-h-[88px] w-full items-start gap-3 px-3 py-3 text-left transition-colors', on ? 'bg-accent/10 shadow-[inset_3px_0_0_rgb(var(--ws-accent))]' : 'hover:bg-slate-800/40')}
                  >
                    <Avatar name={m.senderName} size={36} tone={breach ? 'red' : isOpenTicket(m) ? 'amber' : 'emerald'} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-white">{m.senderName}</span>
                        <span className="shrink-0 font-mono text-[11px] tabular-nums text-slate-200">{fmtDateTime(m.sentDate).slice(5, 10)}</span>
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-xs text-slate-100">{m.subject}</span>
                      <span className="mt-1.5 flex flex-wrap gap-1.5">
                        {breach ? (
                          <Badge tone="red" pulse>
                            SLA +{fmtDuration(now - +new Date(m.sentDate) - SLA_MS)}
                          </Badge>
                        ) : isOpenTicket(m) ? (
                          <Badge tone="amber">Open</Badge>
                        ) : (
                          <Badge tone="emerald">Replied</Badge>
                        )}
                        {m.destinationOffice === 'mca' || m.forwardedToMca || fwdLocal.has(m.id) ? <Badge tone="violet">MCA</Badge> : null}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {tickets.length === 0 ? <EmptyState icon="checkCircle" title="No tickets" body="Nothing matches this filter." /> : null}
        </Card>

        {/* Chat */}
        <Card flush className="flex min-h-[480px] flex-col overflow-hidden" aria-label="Active conversation">
          {active ? (
            <>
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 px-4 py-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-white">{active.subject}</h2>
                  <p className="text-xs text-slate-200">
                    {active.senderName} ({active.senderRole}) · re <strong className="text-slate-50">{active.studentName}</strong> · {active.location}
                  </p>
                </div>
                <Button variant="secondary" icon="external" disabled={!!active.forwardedToMca || fwdLocal.has(active.id)} onClick={() => setFwdOpen(true)}>
                  {active.forwardedToMca || fwdLocal.has(active.id) ? 'Forwarded to MCA' : 'Forward to MCA'}
                </Button>
              </header>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4" role="log" aria-live="polite" aria-label="Conversation">
                <div className="max-w-[85%]">
                  <div className="rounded-2xl rounded-tl-sm border border-slate-700 bg-slate-800/70 px-4 py-3 text-sm text-slate-50">{active.body}</div>
                  <p className="mt-1 font-mono text-[11px] tabular-nums text-slate-200">
                    {active.senderName} · {fmtDateTime(active.sentDate)}
                  </p>
                </div>
                {active.replies.map((r, i) => (
                  <div key={i} className="ml-auto max-w-[85%]">
                    <div className="rounded-2xl rounded-tr-sm border border-accent/40 bg-accent/15 px-4 py-3 text-sm text-white">{r.body}</div>
                    <p className="mt-1 text-right font-mono text-[11px] tabular-nums text-slate-200">
                      {r.sender} · {fmtDateTime(r.sentAt)}
                    </p>
                  </div>
                ))}
                {(pending[active.id] ?? []).map((r, i) => (
                  <div key={`p${i}`} className="ml-auto max-w-[85%] opacity-70">
                    <div className="rounded-2xl rounded-tr-sm border border-dashed border-accent/50 bg-accent/10 px-4 py-3 text-sm text-white">{r.body}</div>
                    <p className="mt-1 text-right text-[11px] text-slate-200">Sending…</p>
                  </div>
                ))}
                <div ref={feedEnd} />
              </div>

              <footer className="border-t border-slate-800/60 p-3">
                <FieldLabel htmlFor="reply-box">Reply</FieldLabel>
                <Textarea
                  id="reply-box"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  placeholder="Type a reply, or pick a template →   (Ctrl+Enter to send)"
                  className="min-h-[96px]"
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-sm tabular-nums text-slate-100" aria-live="polite">
                    <span className={seg.segments > 2 ? 'text-amber-300' : ''}>{seg.units}</span> chars · <strong className={seg.segments > 2 ? 'text-amber-300' : 'text-emerald-300'}>{seg.segments}</strong> SMS · {seg.encoding} · {seg.remaining} left
                  </p>
                  <Button variant="primary" icon="send" disabled={!draft.trim()} onClick={() => void send()}>
                    Send reply
                  </Button>
                </div>
              </footer>
            </>
          ) : (
            <EmptyState icon="message" title="Select a ticket" />
          )}
        </Card>

        {/* Templates */}
        <Card flush className="flex min-h-[320px] flex-col overflow-hidden" aria-label="Template palette" title="Fast template palette" actions={<Segmented label="Template language" value={lang} onChange={setLang} options={[{ key: 'EN', label: 'EN' }, { key: 'SW', label: 'SW' }]} />}>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
            {topics.map((topic) => (
              <div key={topic}>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-200">{topic}</p>
                {SMS_TEMPLATES.filter((t) => t.topic === topic && t.lang === lang).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    disabled={!active}
                    onClick={() => insert(t.text)}
                    className="group w-full rounded-lg border border-slate-700/80 bg-ink-950/40 p-3 text-left text-xs text-slate-100 transition-colors hover:border-accent/60 hover:bg-slate-800/50 disabled:opacity-50"
                  >
                    <span className="line-clamp-3">{t.text}</span>
                    <span className="mt-1.5 flex items-center gap-1 font-semibold text-accent-soft">
                      <Icon name="plus" size={12} /> Insert · <span className="font-mono">{smsSegments(t.text).segments} SMS</span>
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal
        open={fwdOpen}
        onClose={() => setFwdOpen(false)}
        title="Forward ticket to MCA"
        subtitle={active?.subject}
        footer={
          <>
            <Button variant="ghost" onClick={() => setFwdOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" icon="external" disabled={fwdNote.trim().length < 10} onClick={() => void forward()}>
              Forward
            </Button>
          </>
        }
      >
        <FieldLabel htmlFor="fwd-note" hint={`${fwdNote.trim().length}/10 min`}>
          Internal note for the MCA office
        </FieldLabel>
        <Textarea id="fwd-note" data-autofocus value={fwdNote} onChange={(e) => setFwdNote(e.target.value)} placeholder="Why does this need the Honourable’s attention?" />
      </Modal>
    </div>
  );
}
