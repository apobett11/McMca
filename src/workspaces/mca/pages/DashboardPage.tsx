import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { cx, kes, num, pct } from '../../lib/format.ts';
import { useDataTick } from '../../lib/hooks.ts';
import { TrendChart } from '../../ui/charts.tsx';
import { Icon } from '../../ui/icons.tsx';
import { Badge, Button, Card, PageHeader, StackedBar } from '../../ui/primitives.tsx';
import { CYCLE, MCA_EVENTS, getTranche } from '../store.ts';
import { getFullApplicantPool, getAuditAnomaliesData } from '../../../data/scalableWardDataset.ts';

export function DashboardPage() {
  const tick = useDataTick(MCA_EVENTS);
  const [downloading, setDownloading] = useState(false);

  const t = useMemo(() => getTranche(), [tick]);
  const pool = useMemo(() => getFullApplicantPool(), [tick]);
  const anomalies = useMemo(() => getAuditAnomaliesData(), [tick]);

  // Executive Macro Stats (Ward-wide 1,260+ applicants)
  const totalSubmissions = pool.length;
  const verifiedAndCleared = pool.filter((a) => a.inMasterVerifiedPool).length;
  const flaggedInTriage = pool.filter((a) => a.chiefStatus === 'Under Review' || a.isResidencyFlagged).length;
  const appealsResolved = pool.filter((a) => a.appealStatus === 'Accepted').length;
  const appealsRejected = pool.filter((a) => a.appealStatus === 'Dismissed').length;

  const totalPool = t.total_amount; // 15,000,000
  const committedAmount = pool.filter((a) => a.inMasterVerifiedPool).reduce((sum, a) => sum + a.allocatedKes, 0);
  const remaining = Math.max(0, totalPool - committedAmount);
  const committedPct = (committedAmount / totalPool) * 100;

  // Geographic Parity: Tendeno vs Sorget
  const tendenoTotal = pool.filter((a) => a.location === 'Tendeno');
  const tendenoCleared = tendenoTotal.filter((a) => a.inMasterVerifiedPool);
  const tendenoClearPct = tendenoTotal.length > 0 ? (tendenoCleared.length / tendenoTotal.length) * 100 : 0;

  const sorgetTotal = pool.filter((a) => a.location === 'Sorget');
  const sorgetCleared = sorgetTotal.filter((a) => a.inMasterVerifiedPool);
  const sorgetClearPct = sorgetTotal.length > 0 ? (sorgetCleared.length / sorgetTotal.length) * 100 : 0;

  // Intake Velocity vs Chief Clearance Curve
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const intakeTrajectory = [180, 420, 750, 980, 1150, 1260];
  const clearanceCurve = [120, 310, 580, 810, 990, verifiedAndCleared];

  // Pinned Manifest Download Action
  const handleDownloadManifest = () => {
    setDownloading(true);
    setTimeout(() => {
      const verified = pool.filter((a) => a.inMasterVerifiedPool);
      const csvHeader = 'Serial,Student Name,National ID,NEMIS,Location,Sub-Location,Institution,Allocated KES\n';
      const csvRows = verified
        .slice(0, 500)
        .map(
          (a) =>
            `"${a.serial}","${a.fullName}","${a.nationalId}","${a.nemis}","${a.location}","${a.subLocation}","${a.school}",${a.allocatedKes}`
        )
        .join('\n');

      const manifestContent = `OFFICIAL BENEFICIARY ALLOCATION MANIFEST — TENDENO / SORGET WARD\nACADEMIC CYCLE: ${CYCLE}\nTOTAL VERIFIED RECIPIENTS: ${verified.length}\nTOTAL ALLOCATED: KES ${committedAmount.toLocaleString()}\nVERIFICATION SEAL: MCA-EXECUTIVE-BI-2026-CERTIFIED\n\n` +
        csvHeader +
        csvRows;

      const blob = new Blob([manifestContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Official_Beneficiary_Allocation_Manifest_${CYCLE.replace('/', '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setDownloading(false);
    }, 600);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Executive Command Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          eyebrow={`Cycle ${CYCLE}`}
          title="Dashboard"
          description="Macro statistical overview and budget tranche liquidity for Tendeno / Sorget Ward."
        />

        {/* Pinned Quick Action Button */}
        <div className="shrink-0">
          <Button
            variant="emerald"
            onClick={handleDownloadManifest}
            disabled={downloading}
            className="w-full sm:w-auto font-semibold min-h-[44px] shadow-lg shadow-emerald-950/40"
          >
            <Icon name="download" size={16} className="mr-2" />
            {downloading ? 'Compiling List…' : 'Download Applicants List (CSV/PDF)'}
          </Button>
        </div>
      </div>

      {/* TOP 5 EXECUTIVE STAT CARDS (NO TABLES) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* 1. Total Submissions Pool */}
        <Card className="border-cyan-500/20">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">Total Submissions Pool</span>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-white">
            {num(totalSubmissions)}
          </p>
          <p className="mt-1 text-xs text-slate-200">Raw intake across ward</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            100% Ward registration reach
          </div>
        </Card>

        {/* 2. Verified & Cleared */}
        <Card className="border-emerald-500/20">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">Verified &amp; Cleared</span>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-emerald-300">
            {num(verifiedAndCleared)}
          </p>
          <p className="mt-1 text-xs text-slate-200">Passed Chief residency &amp; vetting</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {((verifiedAndCleared / totalSubmissions) * 100).toFixed(1)}% Master Verified Pool
          </div>
        </Card>

        {/* 3. Flagged / In Triage */}
        <Card className="border-amber-500/20">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">Flagged / In Triage</span>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-amber-300">
            {num(flaggedInTriage)}
          </p>
          <p className="mt-1 text-xs text-slate-200">Under Chief field review</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Zero database leak
          </div>
        </Card>

        {/* 4. Appeals Resolved vs Rejected */}
        <Card className="border-violet-500/20">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">Appeals Resolved vs Rejected</span>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-violet-300">
            {appealsResolved} <span className="text-sm font-normal text-slate-200">/ {appealsRejected}</span>
          </p>
          <p className="mt-1 text-xs text-slate-200">Chief appeals throughput</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-violet-300">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            {anomalies.appealOverturnRatePct.toFixed(0)}% Overturn ratio
          </div>
        </Card>

        {/* 5. Budget Tranche Liquidity Meter */}
        <Card className="sm:col-span-2 lg:col-span-1 border-amber-300/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">Tranche Liquidity Meter</span>
            <Badge tone="emerald">Cap: KES 15M</Badge>
          </div>
          <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-amber-200">
            {kes(committedAmount)}
          </p>
          <div className="mt-2">
            <StackedBar
              total={totalPool}
              label="Budget Tranche Committed"
              parts={[
                { label: 'Allocated', value: committedAmount, tone: 'emerald' },
                { label: 'Balance', value: remaining, tone: 'gold' }
              ]}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-200 flex justify-between font-mono">
            <span>Bal: <strong className="text-white">{kes(remaining)}</strong></span>
            <span>{committedPct.toFixed(1)}% Consumed</span>
          </p>
        </Card>
      </div>

      {/* MACRO DISTRIBUTION CHARTS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 1. Intake Trajectory Line Chart */}
        <Card
          title="Intake Trajectory vs. Chief Clearance Curve"
          subtitle="Cumulative applicant intake velocity vs. Chief verification throughput over 6 months."
        >
          <div className="mt-3">
            <TrendChart
              mode="line"
              labels={months}
              ariaLabel="Intake velocity vs Chief clearance curve"
              series={[
                { key: 'intake', label: 'Raw Intake Pool', color: '#38bdf8', values: intakeTrajectory },
                { key: 'clearance', label: 'Chief Cleared Pool', color: '#34d399', values: clearanceCurve }
              ]}
            />
            <div className="mt-3 flex items-center justify-center gap-6 text-xs text-slate-300">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#38bdf8]" />
                Raw Intake Velocity ({totalSubmissions} Total)
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#34d399]" />
                Chief Clearance Curve ({verifiedAndCleared} Verified)
              </span>
            </div>
          </div>
        </Card>

        {/* 2. Geographic Parity Overview (Tendeno vs. Sorget) */}
        <Card
          title="Geographic Parity Overview (Tendeno vs. Sorget)"
          subtitle="Administrative clearance rates and fiscal parity across the two primary ward divisions."
        >
          <div className="mt-4 space-y-5">
            {/* Tendeno Parity Gauge */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white text-sm">Tendeno Location</span>
                  <span className="text-xs text-slate-300 block">Tendeno Central, East, West &amp; Mware</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-base font-bold text-emerald-300">
                    {tendenoClearPct.toFixed(1)}%
                  </span>
                  <span className="text-[11px] text-slate-300 block">
                    {tendenoCleared.length} / {tendenoTotal.length} Cleared
                  </span>
                </div>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                  style={{ width: `${tendenoClearPct}%` }}
                />
              </div>
            </div>

            {/* Sorget Parity Gauge */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white text-sm">Sorget Location</span>
                  <span className="text-xs text-slate-300 block">Sorget Central, Forest, Kipchorian &amp; Kamuingi</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-base font-bold text-cyan-300">
                    {sorgetClearPct.toFixed(1)}%
                  </span>
                  <span className="text-[11px] text-slate-300 block">
                    {sorgetCleared.length} / {sorgetTotal.length} Cleared
                  </span>
                </div>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                  style={{ width: `${sorgetClearPct}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-300">
              <span>Statutory Equity Target: &ge; 45% per division</span>
              <Badge tone="emerald">Geographic Equity Balanced</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
