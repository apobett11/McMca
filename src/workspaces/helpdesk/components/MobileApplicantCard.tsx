import { useState } from 'react';
import { kes } from '../../lib/format.ts';
import type { WardApplicant } from '../../../data/scalableWardDataset.ts';
import { Badge, Button } from '../../ui/primitives.tsx';
import { Icon } from '../../ui/icons.tsx';

export interface MobileApplicantCardProps {
  applicant: WardApplicant;
  onInspect: (applicant: WardApplicant) => void;
  onSms?: (applicant: WardApplicant) => void;
}

export function MobileApplicantCard({ applicant, onInspect, onSms }: MobileApplicantCardProps) {
  const [expanded, setExpanded] = useState(false);

  const statusTone =
    applicant.chiefStatus === 'Cleared' || applicant.appealStatus === 'Accepted'
      ? 'emerald'
      : applicant.chiefStatus === 'Rejected'
      ? 'red'
      : 'amber';

  const statusLabel =
    applicant.appealStatus === 'Accepted'
      ? 'Cleared (Appeal)'
      : applicant.chiefStatus === 'Cleared'
      ? 'Verified & Cleared'
      : applicant.chiefStatus;

  return (
    <article
      className="rounded-xl border border-slate-800/80 bg-slate-900/80 p-3 shadow-md transition-all active:bg-slate-900 focus-within:ring-1 focus-within:ring-accent/40"
      aria-label={`Applicant card for ${applicant.fullName}`}
    >
      {/* Top line: Student Name + Status Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-white text-base leading-tight">
            {applicant.fullName}
          </p>
          <span className="font-mono text-xs text-slate-200">
            {applicant.serial}
          </span>
        </div>
        <Badge tone={statusTone} className="shrink-0 text-[11px] font-medium">
          {statusLabel}
        </Badge>
      </div>

      {/* Middle line: Monospace ID / NEMIS + School Level Tag */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/60 pt-2 text-xs">
        <div className="font-mono text-slate-100 flex items-center gap-1.5">
          <span>ID: {applicant.nationalId}</span>
          <span className="text-slate-500">·</span>
          <span className="text-cyan-300 font-semibold">{applicant.nemis}</span>
        </div>
        <span className="inline-flex items-center rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-200">
          {applicant.institutionCategory} · {applicant.accountClass}
        </span>
      </div>

      {/* Bottom line: Outstanding Balance + Tap to Expand Chevron */}
      <div className="mt-2.5 flex items-center justify-between pt-1">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-slate-200 block font-semibold">
            Outstanding Fee Balance
          </span>
          <span className="font-mono font-bold text-sm tabular-nums text-amber-200">
            {kes(applicant.feeBalance)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-700/80 bg-slate-800/80 text-slate-200 transition-colors hover:bg-slate-700 active:scale-95"
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse applicant details' : 'Expand applicant details'}
        >
          <Icon
            name="chevron-down"
            size={18}
            className={`transition-transform duration-200 ${expanded ? 'rotate-180 text-amber-300' : ''}`}
          />
        </button>
      </div>

      {/* Expandable Accordion Drawer */}
      {expanded ? (
        <div className="mt-3 border-t border-slate-800/80 pt-3 space-y-2.5 animate-fadeIn">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800/50">
              <span className="text-[10px] uppercase font-bold text-slate-200 block">Sub-Location &amp; Village</span>
              <p className="font-medium text-slate-100 truncate mt-0.5">{applicant.subLocation}</p>
              <p className="text-[11px] text-slate-300 truncate">{applicant.village}</p>
            </div>
            <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800/50">
              <span className="text-[10px] uppercase font-bold text-slate-200 block">Chief Need Score</span>
              <p className="font-mono font-bold text-amber-300 mt-0.5">
                {applicant.chiefScore}/99
              </p>
              <p className="text-[10px] text-slate-300 truncate">{applicant.vulnerabilityCategory.split(':')[0]}</p>
            </div>
          </div>

          <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800/50 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-200 block">Institution &amp; Contact</span>
            <p className="font-medium text-slate-100 truncate mt-0.5">{applicant.school}</p>
            <p className="text-slate-300 font-mono mt-0.5 flex items-center justify-between">
              <span>{applicant.guardianName} ({applicant.relationship})</span>
              <a
                href={`tel:${applicant.guardianPhone}`}
                className="text-accent-soft hover:underline flex items-center gap-1 font-sans"
              >
                <Icon name="phone" size={12} />
                {applicant.guardianPhone}
              </a>
            </p>
          </div>

          {/* Touch targets minimum 44px x 44px */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="secondary"
              onClick={() => onInspect(applicant)}
              className="flex-1 min-h-[44px] justify-center text-xs font-semibold"
            >
              <Icon name="eye" size={14} className="mr-1.5" />
              Inspect Dossier
            </Button>
            {onSms ? (
              <Button
                variant="ghost"
                onClick={() => onSms(applicant)}
                className="min-h-[44px] min-w-[44px] px-3 text-xs text-amber-300 border border-amber-400/20 hover:bg-amber-500/10"
                aria-label={`Send SMS notice to ${applicant.fullName}`}
              >
                <Icon name="mail" size={14} className="mr-1" />
                SMS
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}
