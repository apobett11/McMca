import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cx, fmtDateTime, clamp } from '../../lib/format.ts';
import { useDataTick, useHotkeys } from '../../lib/hooks.ts';
import { LEDGER_EVENT, appendLedger } from '../../lib/ledger.ts';
import { fillTemplate, smsSegments } from '../../lib/text.ts';
import { useMutation } from '../../lib/toast.tsx';
import type { DocQueueFilter, ExtractedField, FlaggedUpload } from '../../types/schema.ts';
import { Drawer, Modal } from '../../ui/overlays.tsx';
import { Icon } from '../../ui/icons.tsx';
import { Badge, Button, Card, Checkbox, Chip, EmptyState, FieldLabel, IconButton, Kbd, PageHeader, Segmented, Select, Textarea } from '../../ui/primitives.tsx';
import { DocumentArt } from '../DocumentArt.tsx';
import { HD_EVENTS, SMS_TEMPLATES, buildExtraction, hd, loadRegistry, loadUploads, officer, qualityFlags, readDocState, writeDocState } from '../data.ts';

/* ───────── tiny fixed-row virtual list ───────── */

function VirtualList<T>({ items, rowH, selectedIndex, render, getKey, label }: { items: T[]; rowH: number; selectedIndex: number; render: (item: T, i: number) => React.ReactNode; getKey: (t: T) => string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(0);
  const [h, setH] = useState(600);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setH(el.clientHeight));
    ro.observe(el);
    setH(el.clientHeight);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el || selectedIndex < 0) return;
    const y = selectedIndex * rowH;
    if (y < el.scrollTop) el.scrollTop = y;
    else if (y + rowH > el.scrollTop + el.clientHeight) el.scrollTop = y + rowH - el.clientHeight;
  }, [selectedIndex, rowH]);
  const start = Math.max(0, Math.floor(top / rowH) - 3);
  const end = Math.min(items.length, Math.ceil((top + h) / rowH) + 3);
  return (
    <div ref={ref} onScroll={(e) => setTop(e.currentTarget.scrollTop)} className="min-h-0 flex-1 overflow-y-auto" role="listbox" aria-label={label}>
      <div style={{ height: items.length * rowH, position: 'relative' }}>
        {items.slice(start, end).map((it, k) => (
          <div key={getKey(it)} style={{ position: 'absolute', top: (start + k) * rowH, height: rowH, left: 0, right: 0 }}>
            {render(it, start + k)}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── raw viewport ───────── */

function Viewport({ upload }: { upload: FlaggedUpload }) {
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  const [invert, setInvert] = useState(false);
  const [contrast, setContrast] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  useEffect(() => {
    setZoom(1);
    setRot(0);
    setPos({ x: 0, y: 0 });
    setInvert(false);
    setContrast(false);
  }, [upload.id]);

  useHotkeys([
    { combo: '+', handler: () => setZoom((z) => clamp(z + 0.5, 1, 4)) },
    { combo: '=', handler: () => setZoom((z) => clamp(z + 0.5, 1, 4)) },
    { combo: '-', handler: () => setZoom((z) => clamp(z - 0.5, 1, 4)) },
    { combo: 'o', handler: () => setRot((r) => (r + 90) % 360) },
    { combo: 'i', handler: () => setInvert((v) => !v) },
    { combo: 'c', handler: () => setContrast((v) => !v) }
  ]);

  const filter = `${contrast ? 'contrast(1.7) grayscale(1)' : ''} ${invert ? 'invert(1)' : ''}`.trim() || 'none';

  return (
    <div className="flex min-h-0 flex-col">
      <div className="mb-2 flex flex-wrap items-center gap-1.5" role="toolbar" aria-label="Viewport controls">
        <IconButton label="Zoom out (-)" icon="zoomOut" variant="secondary" disabled={zoom <= 1} onClick={() => setZoom((z) => clamp(z - 0.5, 1, 4))} />
        <span className="min-w-[44px] text-center font-mono text-sm font-bold tabular-nums text-white" aria-live="polite">
          {zoom.toFixed(1)}×
        </span>
        <IconButton label="Zoom in (+)" icon="zoomIn" variant="secondary" disabled={zoom >= 4} onClick={() => setZoom((z) => clamp(z + 0.5, 1, 4))} />
        <IconButton label="Rotate 90° (O)" icon="rotate" variant="secondary" onClick={() => setRot((r) => (r + 90) % 360)} />
        <button
          type="button"
          aria-pressed={contrast}
          onClick={() => setContrast((v) => !v)}
          className={cx('inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold', contrast ? 'border-accent bg-accent/20 text-accent-soft' : 'border-slate-600 bg-slate-800/70 text-slate-50')}
        >
          <Icon name="contrast" size={14} /> Contrast
        </button>
        <button
          type="button"
          aria-pressed={invert}
          onClick={() => setInvert((v) => !v)}
          className={cx('inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold', invert ? 'border-accent bg-accent/20 text-accent-soft' : 'border-slate-600 bg-slate-800/70 text-slate-50')}
        >
          Invert
        </button>
        <Button variant="ghost" onClick={() => (setZoom(1), setRot(0), setPos({ x: 0, y: 0 }))}>
          Reset
        </Button>
      </div>
      <div
        className="relative h-[360px] cursor-grab select-none overflow-hidden rounded-lg border border-slate-700 bg-slate-950 active:cursor-grabbing xl:h-[420px]"
        onPointerDown={(e) => {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          setPos({ x: drag.current.px + e.clientX - drag.current.x, y: drag.current.py + e.clientY - drag.current.y });
        }}
        onPointerUp={() => (drag.current = null)}
        onWheel={(e) => setZoom((z) => clamp(z + (e.deltaY < 0 ? 0.25 : -0.25), 1, 4))}
        role="img"
        aria-label={`Raw document viewport, zoom ${zoom.toFixed(1)}x, rotated ${rot} degrees`}
      >
        <div className="absolute inset-0 flex items-center justify-center p-4" style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom}) rotate(${rot}deg)`, transformOrigin: 'center', filter, transition: drag.current ? 'none' : 'transform .15s ease-out' }}>
          <div className="h-full w-auto" style={{ aspectRatio: '400 / 520' }}>
            {upload.previewUrl ? <img src={upload.previewUrl} alt="" draggable={false} className="h-full w-full object-contain" /> : <DocumentArt upload={upload} />}
          </div>
        </div>
        <span className="pointer-events-none absolute bottom-2 left-2 rounded bg-ink-950/85 px-2 py-0.5 font-mono text-[11px] text-slate-100">
          {upload.fileName} · {upload.fileSize}
        </span>
      </div>
    </div>
  );
}

/* ───────── entity extractor ───────── */

const fieldStyle = {
  match: { box: 'border-emerald-400/60 bg-emerald-500/10', tag: 'emerald' as const, icon: 'check', text: 'Match' },
  discrepancy: { box: 'border-amber-400/70 bg-amber-500/10', tag: 'amber' as const, icon: 'alert', text: 'Discrepancy' },
  missing: { box: 'border-red-400/70 bg-red-500/10', tag: 'red' as const, icon: 'x', text: 'Unextracted' }
};

function Extractor({ fields }: { fields: ExtractedField[] }) {
  return (
    <div className="space-y-2.5">
      {fields.map((f) => {
        const s = fieldStyle[f.state];
        return (
          <div key={f.key} className={cx('rounded-lg border p-3', s.box)}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-100">{f.label}</p>
              <Badge tone={s.tag}>
                <Icon name={s.icon} size={12} strokeWidth={3} />
                {s.text}
                {f.state === 'discrepancy' && f.distance !== null ? <span className="font-mono">Δ{f.distance}</span> : null}
              </Badge>
            </div>
            <p className="mt-1.5 font-mono text-base font-bold tabular-nums text-white">{f.extracted ?? <span className="text-red-200">— null —</span>}</p>
            <p className="mt-0.5 text-xs text-slate-200">
              Registered: <span className="font-mono tabular-nums">{f.expected}</span>
            </p>
          </div>
        );
      })}
      <p className="text-xs text-slate-300">Extraction preview is derived from the upload’s recorded diagnostics; edit-distance is Levenshtein vs. the registered value.</p>
    </div>
  );
}

/* ───────── page ───────── */

const FILTERS: { key: DocQueueFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'failed_ocr', label: 'Failed OCR' },
  { key: 'hanging', label: 'Hanging' },
  { key: 'stamp_missing', label: 'Stamp Missing' }
];

export function DocumentsPage() {
  const [params, setParams] = useSearchParams();
  const run = useMutation();
  const tick = useDataTick([...HD_EVENTS, LEDGER_EVENT]);

  const filter = (params.get('filter') as DocQueueFilter) || 'all';
  const [selectedId, setSelectedId] = useState<string | null>(params.get('doc'));
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [smsOpen, setSmsOpen] = useState(false);
  const [local, setLocal] = useState<Record<string, FlaggedUpload['verification']>>({});

  const registry = useMemo(() => loadRegistry(), [tick]);
  const uploads = useMemo(() => loadUploads().map((u) => ({ ...u, verification: local[u.id] ?? u.verification })), [tick, local]);
  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.key, uploads.filter((u) => u.categories.includes(f.key) && u.verification !== 'manual_override').length])) as Record<DocQueueFilter, number>, [uploads]);
  const queue = useMemo(() => uploads.filter((u) => u.categories.includes(filter) && u.verification !== 'manual_override'), [uploads, filter]);

  const selIdx = Math.max(0, queue.findIndex((u) => u.id === selectedId));
  const selected = queue[selIdx] ?? null;

  useEffect(() => {
    if (!selectedId && queue[0]) setSelectedId(queue[0].id);
  }, [queue, selectedId]);

  const move = (d: number) => {
    const n = queue[clamp(selIdx + d, 0, queue.length - 1)];
    if (n) setSelectedId(n.id);
  };

  const openOverride = () => selected && selected.verification === 'uploaded' && setOverrideOpen(true);
  const openSms = () => selected && setSmsOpen(true);

  const rescan = useCallback(() => {
    if (!selected) return;
    const u = selected;
    const prev = readDocState();
    return run({
      apply: () => setLocal((l) => ({ ...l, [u.id]: 'rescan_queued' })),
      rollback: () =>
        setLocal((l) => {
          const n = { ...l };
          delete n[u.id];
          return n;
        }),
      commit: async () => {
        writeDocState({ ...prev, [u.id]: { verification: 'rescan_queued', at: new Date().toISOString(), by: officer().name, rescanQueuedAt: new Date().toISOString() } });
        await appendLedger('helpdesk', { actor: officer().name, kind: 'doc_rescan', target: u.id, targetLabel: `${u.applicantName} · ${u.documentType}`, detail: 'Force re-scan queued with enhanced OCR pipeline' });
      },
      success: 'Re-scan queued – result will appear in this queue',
      failure: 'Could not queue re-scan'
    });
  }, [selected, run]);

  useHotkeys([
    { combo: 'j', handler: () => move(1) },
    { combo: 'k', handler: () => move(-1) },
    { combo: 'a', handler: openOverride },
    { combo: 'u', handler: openSms },
    { combo: 's', handler: () => void rescan() }
  ], !overrideOpen && !smsOpen);

  const fields = useMemo(() => (selected ? buildExtraction(selected, registry) : []), [selected, registry]);
  const flags = selected ? qualityFlags(selected) : [];

  const setFilter = (f: DocQueueFilter) => {
    const next = new URLSearchParams(params);
    if (f === 'all') next.delete('filter');
    else next.set('filter', f);
    setParams(next, { replace: true });
    setSelectedId(null);
  };

  return (
    <>
      <PageHeader eyebrow="Quality control" title="Documents" description="Inspect, validate and resolve flagged uploads without leaving the queue." />

      <div className="grid min-h-[640px] grid-cols-1 gap-4 lg:h-[calc(100vh-190px)] lg:grid-cols-[35%_minmax(0,1fr)]">
        {/* Left queue */}
        <Card flush className="flex min-h-[420px] flex-col overflow-hidden">
          <div className="space-y-3 border-b border-slate-800/60 p-3">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Queue filters">
              {FILTERS.map((f) => (
                <Chip key={f.key} active={filter === f.key} count={counts[f.key]} onClick={() => setFilter(f.key)}>
                  {f.label}
                </Chip>
              ))}
            </div>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-200">
              <span>
                <Kbd>J</Kbd> <Kbd>K</Kbd> navigate
              </span>
              <span>
                <Kbd>A</Kbd> accept
              </span>
              <span>
                <Kbd>U</Kbd> re-upload
              </span>
              <span>
                <Kbd>S</Kbd> re-scan
              </span>
            </p>
          </div>
          {queue.length === 0 ? (
            <EmptyState icon="checkCircle" title="Queue clear" body="No uploads match this filter." />
          ) : (
            <VirtualList
              items={queue}
              rowH={104}
              selectedIndex={selIdx}
              label="Flagged uploads"
              getKey={(u) => u.id}
              render={(u) => {
                const on = u.id === selected?.id;
                return (
                  <button
                    type="button"
                    role="option"
                    aria-selected={on}
                    onClick={() => setSelectedId(u.id)}
                    className={cx('flex h-full w-full items-center gap-3 border-b border-slate-800/50 px-3 text-left transition-colors', on ? 'bg-accent/10 shadow-[inset_3px_0_0_rgb(var(--ws-accent))]' : 'hover:bg-slate-800/40')}
                  >
                    <span className="h-[78px] w-[60px] shrink-0 overflow-hidden rounded border border-slate-600 bg-white">
                      <DocumentArt upload={u} detailed={false} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-white">{u.applicantName}</span>
                        <span className={cx('font-mono text-sm font-bold tabular-nums', u.ocrConfidence < 45 ? 'text-red-300' : u.ocrConfidence < 70 ? 'text-amber-300' : 'text-emerald-300')} title="OCR confidence">
                          {u.ocrConfidence}%
                        </span>
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge tone="cyan">{u.documentType}</Badge>
                        {u.verification === 'manual_override' ? <Badge tone="emerald">Overridden</Badge> : u.verification === 'rescan_queued' ? <Badge tone="violet">Re-scan queued</Badge> : u.reuploadRequested ? <Badge tone="amber">Re-upload sent</Badge> : null}
                      </span>
                      <span className="mt-1 block truncate font-mono text-xs text-slate-200">{u.fileName}</span>
                    </span>
                  </button>
                );
              }}
            />
          )}
        </Card>

        {/* Right studio */}
        {selected ? (
          <div className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-1">
            <Card
              flush
              title={
                <span className="flex flex-wrap items-center gap-2">
                  {selected.applicantName} <Badge tone="cyan">{selected.documentType}</Badge>
                  {selected.verification === 'manual_override' ? <Badge tone="emerald">Manually verified</Badge> : null}
                </span>
              }
              subtitle={
                <span className="font-mono tabular-nums">
                  ID {selected.nationalId} · uploaded {fmtDateTime(selected.uploadedAt)} · {selected.location}
                </span>
              }
            >
              <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-2">
                <section aria-label="Raw viewport">
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-200">Pane 1 · Raw viewport</h3>
                  <Viewport upload={selected} />
                </section>
                <section aria-label="Entity extractor">
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-200">Pane 2 · Entity extractor</h3>
                  <Extractor fields={fields} />
                </section>
              </div>
            </Card>

            <Card title="Actions & diagnostics" subtitle={selected.failureReason}>
              <div className="flex flex-wrap gap-2" aria-label="Quality flags">
                {flags.map((f) => (
                  <Badge key={f.key} tone={f.pass ? 'emerald' : 'red'}>
                    <Icon name={f.pass ? 'check' : 'x'} size={12} strokeWidth={3} />
                    {f.label}: {f.detail}
                  </Badge>
                ))}
                <Badge tone="neutral">
                  OCR confidence <span className="font-mono">{selected.ocrConfidence}%</span>
                </Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="warn" icon="pen" disabled={selected.verification === 'manual_override'} onClick={openOverride}>
                  Manual Override &amp; Accept
                </Button>
                <Button variant="primary" icon="send" onClick={openSms}>
                  Request Re-upload via SMS
                </Button>
                <Button variant="secondary" icon="refresh" disabled={selected.verification === 'rescan_queued'} onClick={() => void rescan()}>
                  {selected.verification === 'rescan_queued' ? 'Re-scan queued' : 'Force Re-scan'}
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          <Card className="flex items-center justify-center">
            <EmptyState icon="fileCheck" title="Select an upload" body="Choose a flagged document from the queue to inspect it." />
          </Card>
        )}
      </div>

      {selected ? (
        <>
          <OverrideModal open={overrideOpen} onClose={() => setOverrideOpen(false)} upload={selected} fields={fields} setLocal={setLocal} onDone={() => move(1)} />
          <SmsDrawer open={smsOpen} onClose={() => setSmsOpen(false)} upload={selected} />
        </>
      ) : null}
    </>
  );
}

/* ───────── certification modal ───────── */

const OVERRIDE_REASONS = ['Verified against original document in person', 'Verified with school registrar by phone', 'OCR error – document is legible to officer', 'Supporting letter received (Sub-Chief / school)'];

function OverrideModal({ open, onClose, upload, fields, setLocal, onDone }: { open: boolean; onClose: () => void; upload: FlaggedUpload; fields: ExtractedField[]; setLocal: React.Dispatch<React.SetStateAction<Record<string, FlaggedUpload['verification']>>>; onDone: () => void }) {
  const run = useMutation();
  const [cert, setCert] = useState(false);
  const [reason, setReason] = useState(OVERRIDE_REASONS[0]);
  const [note, setNote] = useState('');
  useEffect(() => {
    if (open) {
      setCert(false);
      setNote('');
      setReason(OVERRIDE_REASONS[0]);
    }
  }, [open]);
  const unresolved = fields.filter((f) => f.state !== 'match').length;
  const valid = cert && note.trim().length >= 15;

  const submit = () =>
    run({
      apply: () => {
        setLocal((l) => ({ ...l, [upload.id]: 'manual_override' }));
        onClose();
      },
      rollback: () =>
        setLocal((l) => {
          const n = { ...l };
          delete n[upload.id];
          return n;
        }),
      commit: async () => {
        const who = officer().name;
        const actorId = officer().id;
        writeDocState({ ...readDocState(), [upload.id]: { verification: 'manual_override', note: `${reason}: ${note.trim()}`, at: new Date().toISOString(), by: actorId } });
        await appendLedger('helpdesk', { actor: `${who} (${actorId})`, kind: 'doc_override', target: upload.id, targetLabel: `${upload.applicantName} · ${upload.documentType}`, detail: `Manual override – ${reason}. ${note.trim()} (${unresolved} unresolved fields, OCR ${upload.ocrConfidence}%)` });
      },
      success: `${upload.applicantName}: document accepted by manual override`,
      failure: 'Override failed – document returned to queue',
      onSuccess: onDone
    });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Certify manual override"
      subtitle="This accepts a document the system could not verify. The action is signed into the immutable ledger."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="warn" icon="pen" disabled={!valid} onClick={submit}>
            Manual Override &amp; Accept
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-3 text-sm text-amber-100">
          <strong className="font-bold">{unresolved}</strong> of {fields.length} extracted fields are not an exact match for <strong>{upload.applicantName}</strong>.
        </div>
        <div>
          <FieldLabel htmlFor="ov-reason">Basis for override</FieldLabel>
          <Select id="ov-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
            {OVERRIDE_REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
        </div>
        <div>
          <FieldLabel htmlFor="ov-note" hint={`${note.trim().length}/15 min`}>
            Officer note (min 15 chars)
          </FieldLabel>
          <Textarea id="ov-note" data-autofocus value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did you verify, and against what?" />
        </div>
        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-700 bg-slate-900/60 p-2 text-sm text-slate-50">
          <Checkbox checked={cert} onChange={setCert} label="Certification" />
          <span className="pt-2">I certify that I have personally verified this document against the applicant’s registered record and accept responsibility for this override.</span>
        </label>
      </div>
    </Modal>
  );
}

/* ───────── SMS template drawer ───────── */

function SmsDrawer({ open, onClose, upload }: { open: boolean; onClose: () => void; upload: FlaggedUpload }) {
  const run = useMutation();
  const [lang, setLang] = useState<'EN' | 'SW'>('EN');
  const [tplId, setTplId] = useState('reup');
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);

  const topics = SMS_TEMPLATES.filter((t) => t.lang === lang);
  const vars = useMemo(() => ({ name: 'Parent/Guardian', student: upload.applicantName.split(' ')[0], doc: upload.documentType }), [upload]);

  useEffect(() => {
    if (!open) return;
    const t = SMS_TEMPLATES.find((x) => x.id.startsWith(tplId) && x.lang === lang) ?? topics[0];
    setText(fillTemplate(t.text, vars));
    setSent(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lang, tplId, vars]);

  const seg = smsSegments(text);

  const send = () =>
    run({
      apply: () => setSent(true),
      rollback: () => setSent(false),
      commit: async () => {
        hd.requestReupload(upload.id);
        await appendLedger('helpdesk', { actor: officer().name, kind: 'sms_reupload', target: upload.id, targetLabel: `${upload.applicantName} · ${upload.documentType}`, detail: `Re-upload SMS (${lang}, ${seg.segments} segment${seg.segments === 1 ? '' : 's'}) to ${upload.phone}` });
      },
      success: `Re-upload SMS dispatched to ${upload.phone}`,
      failure: 'SMS dispatch failed',
      onSuccess: onClose
    });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={600}
      title="Request re-upload via SMS"
      subtitle={
        <span>
          To <span className="font-mono tabular-nums">{upload.phone}</span> · {upload.applicantName}
        </span>
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-sm tabular-nums text-slate-100" aria-live="polite">
            {seg.units} chars · <strong className={seg.segments > 2 ? 'text-amber-300' : 'text-emerald-300'}>{seg.segments} SMS</strong> · {seg.encoding}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" icon="send" disabled={!text.trim() || sent} onClick={send}>
              Send SMS
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented label="Language" value={lang} onChange={setLang} options={[{ key: 'EN', label: 'English' }, { key: 'SW', label: 'Kiswahili' }]} />
        </div>
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-200">Template</p>
          <div className="flex flex-wrap gap-2">
            {topics.map((t) => {
              const key = t.id.split('-')[0];
              return (
                <Chip key={t.id} active={tplId === key} onClick={() => setTplId(key)}>
                  {t.topic}
                </Chip>
              );
            })}
          </div>
        </div>
        <div>
          <FieldLabel htmlFor="sms-body">Message</FieldLabel>
          <Textarea id="sms-body" value={text} onChange={(e) => setText(e.target.value)} className="min-h-[180px]" />
        </div>
        <p className="text-xs text-slate-200">Variables are filled from the applicant record. {seg.encoding === 'UCS-2' ? 'Special characters force UCS-2 (70 chars/SMS).' : 'GSM-7 encoding: 160 chars per SMS, 153 when concatenated.'}</p>
      </div>
    </Drawer>
  );
}
