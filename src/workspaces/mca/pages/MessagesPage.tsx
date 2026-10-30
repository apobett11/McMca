import { useMemo, useState } from 'react';
import { cx, fmtDateTime } from '../../lib/format.ts';
import { useDataTick } from '../../lib/hooks.ts';
import { useMutation } from '../../lib/toast.tsx';
import { Icon } from '../../ui/icons.tsx';
import { Badge, Button, Card, FieldLabel, PageHeader, Textarea } from '../../ui/primitives.tsx';
import { Modal } from '../../ui/overlays.tsx';
import { MCA_EVENTS } from '../store.ts';

export interface EscalatedInquiry {
  incidentSerial: string;
  constituentName: string;
  phone: string;
  location: string;
  subLocation: string;
  category: 'Severe Boundary Dispute' | 'Complex Appeal' | 'Special Hardship Intervention';
  forwardingOfficer: string;
  forwardedAt: string;
  officerNotes: string;
  chiefDossierRef: string;
  chiefFindings: string;
  status: 'Pending MCA Decision' | 'Hardship Quota Authorized' | 'SMS Dispatched';
  mcaActionNote?: string;
}

const INITIAL_ESCALATIONS: EscalatedInquiry[] = [
  {
    incidentSerial: 'ESC-2026-081',
    constituentName: 'Eunice Chepngetich (Guardian to Dennis Kiprotich)',
    phone: '+254 715 678 123',
    location: 'Sorget',
    subLocation: 'Kapchelach',
    category: 'Special Hardship Intervention',
    forwardingOfficer: 'Mercy Cherono (Help Desk Lead)',
    forwardedAt: '2026-10-28 09:30 AM',
    officerNotes: 'Household faced severe hail damage destroying tea yield; student enrolled at Kericho Boys High with KES 14,000 outstanding fee balance. Standard allocation threshold capped at KES 8,000. Recommend MCA Hardship Quota augmentation.',
    chiefDossierRef: 'DOS-CHF-SORGET-441',
    chiefFindings: 'Chief verified single-mother breadwinner with 4 dependents. High Need Score 94/99. Recommend affirmative relief.',
    status: 'Pending MCA Decision'
  },
  {
    incidentSerial: 'ESC-2026-082',
    constituentName: 'Elder Kipngetich Sang',
    phone: '+254 721 776 543',
    location: 'Tendeno',
    subLocation: 'Tendeno West',
    category: 'Severe Boundary Dispute',
    forwardingOfficer: 'David Langat (Assessment Officer)',
    forwardedAt: '2026-10-27 02:15 PM',
    officerNotes: 'Cluster of 14 applicant families reside in Kipkelion Border Village along the river buffer. Automated residency check flagged birthplace as Kipkelion East. Physical homestead and voter registration confirm Tendeno West residency.',
    chiefDossierRef: 'DOS-CHF-TENDENO-198',
    chiefFindings: 'Sub-Chief verified residency for 12+ years. Boundary map discrepancy verified at local Baraza.',
    status: 'Pending MCA Decision'
  },
  {
    incidentSerial: 'ESC-2026-083',
    constituentName: 'Peter Koech (Parent to Sharon Chepkirui)',
    phone: '+254 718 223 344',
    location: 'Sorget',
    subLocation: 'Sorget Central',
    category: 'Complex Appeal',
    forwardingOfficer: 'Clara Chelangat (Help Desk Operations)',
    forwardedAt: '2026-10-26 11:45 AM',
    officerNotes: 'Chief initially rejected based on incomplete death certificate of second breadwinner. Auxiliary verification affidavit from Sorget Forest Baraza now provided.',
    chiefDossierRef: 'DOS-CHF-SORGET-312',
    chiefFindings: 'Appeal dossier validated by Area Chief. Overturn recommended for secondary boarding bursary.',
    status: 'Pending MCA Decision'
  }
];

export function MessagesPage() {
  const run = useMutation();
  const tick = useDataTick([...MCA_EVENTS, 'mcmca_escalations_updated']);

  const [escalations, setEscalations] = useState<EscalatedInquiry[]>(() => {
    try {
      const saved = localStorage.getItem('mcmca_mca_escalations_v1');
      return saved ? JSON.parse(saved) : INITIAL_ESCALATIONS;
    } catch {
      return INITIAL_ESCALATIONS;
    }
  });

  const [activeReply, setActiveReply] = useState<EscalatedInquiry | null>(null);
  const [activeQuota, setActiveQuota] = useState<EscalatedInquiry | null>(null);
  const [replyText, setReplyText] = useState('');
  const [quotaAmount, setQuotaAmount] = useState('10000');
  const [quotaJustification, setQuotaJustification] = useState('');

  const saveEscalations = (next: EscalatedInquiry[]) => {
    setEscalations(next);
    localStorage.setItem('mcmca_mca_escalations_v1', JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('mcmca_escalations_updated'));
  };

  const handleSendDirectSms = () => {
    if (!activeReply || !replyText.trim()) return;

    const target = activeReply;
    const prev = escalations;
    const next = escalations.map((e) =>
      e.incidentSerial === target.incidentSerial
        ? { ...e, status: 'SMS Dispatched' as const, mcaActionNote: `Direct SMS sent: "${replyText.trim()}"` }
        : e
    );

    return run({
      apply: () => saveEscalations(next),
      rollback: () => saveEscalations(prev),
      commit: async () => {
        setActiveReply(null);
        setReplyText('');
      },
      success: `Official SMS dispatched to ${target.constituentName} (${target.phone})`,
      failure: 'Failed to send SMS'
    });
  };

  const handleAuthorizeQuota = () => {
    if (!activeQuota) return;

    const target = activeQuota;
    const prev = escalations;
    const next = escalations.map((e) =>
      e.incidentSerial === target.incidentSerial
        ? {
            ...e,
            status: 'Hardship Quota Authorized' as const,
            mcaActionNote: `Special Hardship Quota approved: KES ${Number(quotaAmount).toLocaleString()} (${quotaJustification || 'Special Executive hard-case directive'})`
          }
        : e
    );

    return run({
      apply: () => saveEscalations(next),
      rollback: () => saveEscalations(prev),
      commit: async () => {
        setActiveQuota(null);
        setQuotaJustification('');
      },
      success: `Hardship Quota of KES ${Number(quotaAmount).toLocaleString()} authorized for ${target.incidentSerial}`,
      failure: 'Failed to authorize hardship quota'
    });
  };

  const categoryTone = (cat: EscalatedInquiry['category']) =>
    cat === 'Severe Boundary Dispute' ? 'amber' : cat === 'Special Hardship Intervention' ? 'emerald' : 'cyan';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'ws-fade-in 0.2s ease-out' }} className="pb-12">
      {/* HERO BANNER (MCA EXECUTIVE STYLING - AMBER THEME) */}
      <section
        className="dash-single-card"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(11, 19, 41, 0.95) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
          borderRadius: 16,
          backdropFilter: 'blur(16px)'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 260 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: 'rgba(245, 158, 11, 0.16)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.25)',
                flexShrink: 0
              }}
            >
              <Icon name="megaphone" size={26} />
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
                    background: 'rgba(245, 158, 11, 0.18)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245, 158, 11, 0.35)'
                  }}
                >
                  Help Desk Direct Escalations
                </span>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  Tendeno / Sorget Constituents &bull; Executive Queue
                </span>
              </div>
              <h1 style={{ margin: '4px 0 0', fontSize: '1.4rem', color: '#ffffff', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Constituent Inquiries &amp; Help Desk Escalations
              </h1>
              <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.86rem' }}>
                Direct constituent hardship petitions, border dispute inquiries, and special quota directives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 METRIC TILES */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div
          style={{
            padding: '18px 20px',
            borderRadius: 14,
            background: 'rgba(13, 21, 39, 0.75)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
          }}
        >
          <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fbbf24' }}>Active Escalations</span>
          <p style={{ margin: '6px 0 2px', fontFamily: 'monospace', fontSize: '1.75rem', fontWeight: 800, color: '#fbbf24' }}>
            {escalations.filter((e) => e.status === 'Pending MCA Decision').length}
          </p>
          <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Awaiting executive intervention</span>
        </div>

        <div
          style={{
            padding: '18px 20px',
            borderRadius: 14,
            background: 'rgba(13, 21, 39, 0.75)',
            border: '1px solid rgba(52, 211, 153, 0.25)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
          }}
        >
          <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#34d399' }}>Hardship Quotas Authorized</span>
          <p style={{ margin: '6px 0 2px', fontFamily: 'monospace', fontSize: '1.75rem', fontWeight: 800, color: '#34d399' }}>
            {escalations.filter((e) => e.status === 'Hardship Quota Authorized').length}
          </p>
          <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Affirmative relief deployed</span>
        </div>

        <div
          style={{
            padding: '18px 20px',
            borderRadius: 14,
            background: 'rgba(13, 21, 39, 0.75)',
            border: '1px solid rgba(34, 211, 238, 0.25)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
          }}
        >
          <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#22d3ee' }}>Direct SMS Responses</span>
          <p style={{ margin: '6px 0 2px', fontFamily: 'monospace', fontSize: '1.75rem', fontWeight: 800, color: '#22d3ee' }}>
            {escalations.filter((e) => e.status === 'SMS Dispatched').length}
          </p>
          <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Constituent communications logged</span>
        </div>
      </div>

      {/* Escalated Inquiries List */}
      <div className="space-y-4">
        {escalations.map((item) => (
          <Card key={item.incidentSerial} className="border-slate-800">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-bold text-accent-soft">{item.incidentSerial}</span>
                  <Badge tone={categoryTone(item.category)}>{item.category}</Badge>
                  <span className="text-xs text-slate-300">
                    Forwarded by <strong className="text-white">{item.forwardingOfficer}</strong> ({item.forwardedAt})
                  </span>
                </div>
                <Badge
                  tone={
                    item.status === 'Hardship Quota Authorized'
                      ? 'emerald'
                      : item.status === 'SMS Dispatched'
                      ? 'cyan'
                      : 'amber'
                  }
                >
                  {item.status}
                </Badge>
              </div>

              {/* Constituent Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                <div>
                  <span className="text-slate-200 uppercase font-bold text-[10px] block">Constituent Name &amp; Contact</span>
                  <p className="font-semibold text-white text-sm mt-0.5">{item.constituentName}</p>
                  <p className="font-mono text-slate-300">{item.phone}</p>
                  <p className="text-slate-300 mt-1">
                    Jurisdiction: <strong className="text-white">{item.subLocation}</strong>, {item.location} Location
                  </p>
                </div>
                <div>
                  <span className="text-slate-200 uppercase font-bold text-[10px] block">Chief's Dossier Reference</span>
                  <p className="font-mono text-cyan-300 font-semibold text-sm mt-0.5">{item.chiefDossierRef}</p>
                  <p className="text-slate-300 mt-1 italic">"{item.chiefFindings}"</p>
                </div>
              </div>

              {/* Officer Notes */}
              <div className="text-xs space-y-1">
                <span className="text-slate-200 font-bold uppercase text-[10px] block">Forwarding Help Desk Officer Notes</span>
                <p className="text-slate-200 bg-slate-900/80 p-3 rounded-lg border border-slate-800 leading-relaxed">
                  {item.officerNotes}
                </p>
              </div>

              {item.mcaActionNote ? (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-400/30 p-2.5 text-xs text-emerald-200">
                  <strong className="font-bold">Executive Action Executed:</strong> {item.mcaActionNote}
                </div>
              ) : null}

              {/* Action Options */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-800/80">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setActiveReply(item);
                    setReplyText(`Hon. MCA Office: Dear ${item.constituentName.split(' ')[0]}, your bursary appeal ref ${item.incidentSerial} has been reviewed and verified for assistance.`);
                  }}
                  className="min-h-[44px] text-xs font-semibold"
                >
                  <Icon name="mail" size={14} className="mr-1.5" />
                  Direct SMS Reply
                </Button>

                <Button
                  variant="emerald"
                  onClick={() => {
                    setActiveQuota(item);
                    setQuotaAmount('12000');
                    setQuotaJustification(`Affirmative action under Special Hardship Quota following Chief Dossier ${item.chiefDossierRef}.`);
                  }}
                  className="min-h-[44px] text-xs font-semibold"
                >
                  <Icon name="shield" size={14} className="mr-1.5" />
                  Authorize Hardship Quota Review
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Direct SMS Reply Modal */}
      <Modal
        open={!!activeReply}
        onClose={() => setActiveReply(null)}
        title={activeReply ? `Direct SMS Reply — ${activeReply.constituentName}` : 'SMS Reply'}
      >
        {activeReply ? (
          <div className="space-y-4 text-xs">
            <p className="text-slate-300">
              Dispatches an authenticated SMS from the official <strong className="text-white">NG-CDF Tendeno/Sorget</strong> notification gateway to constituent mobile ({activeReply.phone}).
            </p>
            <div>
              <FieldLabel htmlFor="sms-body">Message Body (Official Character Limit: 160)</FieldLabel>
              <Textarea
                id="sms-body"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                className="font-mono text-xs"
              />
              <span className="text-[11px] text-slate-200 mt-1 block">
                Length: {replyText.length} characters (1 SMS segment)
              </span>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button variant="ghost" onClick={() => setActiveReply(null)} className="min-h-[44px]">
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSendDirectSms}
                className="min-h-[44px]"
              >
                Send SMS Now
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Authorize Hardship Quota Modal */}
      <Modal
        open={!!activeQuota}
        onClose={() => setActiveQuota(null)}
        title={activeQuota ? `Authorize Special Hardship Quota — ${activeQuota.incidentSerial}` : 'Hardship Quota'}
      >
        {activeQuota ? (
          <div className="space-y-4 text-xs">
            <div className="rounded-xl bg-amber-500/10 border border-amber-400/30 p-3 text-amber-200 leading-relaxed">
              <strong>Statutory Quota Governance:</strong> Hardship augmentations are funded via the Ward Hardship Reserve (Cap: KES 1,000,000). Every authorization is immutably stamped in the legislative audit log.
            </div>
            <div>
              <FieldLabel htmlFor="quota-amt">Authorized Relief Amount (KES)</FieldLabel>
              <input
                id="quota-amt"
                type="number"
                value={quotaAmount}
                onChange={(e) => setQuotaAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white font-mono text-sm"
              />
            </div>
            <div>
              <FieldLabel htmlFor="quota-just">Executive Justification Note</FieldLabel>
              <Textarea
                id="quota-just"
                value={quotaJustification}
                onChange={(e) => setQuotaJustification(e.target.value)}
                rows={3}
                placeholder="Detail reason for emergency hardship allocation…"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button variant="ghost" onClick={() => setActiveQuota(null)} className="min-h-[44px]">
                Cancel
              </Button>
              <Button
                variant="emerald"
                onClick={handleAuthorizeQuota}
                className="min-h-[44px] font-semibold"
              >
                Confirm Hardship Authorization
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
