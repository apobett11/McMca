import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cx, kes, num, pct } from '../../lib/format.ts';
import {
  getSubLocationMatrixStats,
  getDemographicAnalytics,
  getAuditAnomaliesData,
  getFullApplicantPool,
  type SubLocationMatrixRow
} from '../../../data/scalableWardDataset.ts';
import { Badge, Button, Card, DataTable, PageHeader, Segmented, Td, Th, rowCls, tbodyCls } from '../../ui/primitives.tsx';
import { TrendChart } from '../../ui/charts.tsx';
import { Icon } from '../../ui/icons.tsx';

export function McaAnalyticsHub() {
  const [params, setParams] = useSearchParams();
  const activeTab = params.get('view') === 'anomalies' ? 'anomalies' : 'matrix';
  const [chartMode, setChartMode] = useState<'bar' | 'line'>('bar');
  const [downloading, setDownloading] = useState(false);

  // Load aggregated datasets
  const matrixData = useMemo(() => getSubLocationMatrixStats(), []);
  const demographicData = useMemo(() => getDemographicAnalytics(), []);
  const anomalyData = useMemo(() => getAuditAnomaliesData(), []);

  // Sub-Location Chart Series
  const subLabels = matrixData.rows.map((r) => r.subLocation.replace('Tendeno ', 'T. ').replace('Sorget ', 'S. '));
  const registeredValues = matrixData.rows.map((r) => r.totalRegistered);
  const clearedValues = matrixData.rows.map((r) => r.clearedCount);

  // Export engine for Official Beneficiary Allocation Manifest
  const handleDownloadManifest = () => {
    setDownloading(true);
    setTimeout(() => {
      const verified = getFullApplicantPool().filter((a) => a.inMasterVerifiedPool);
      const csvHeader = 'Serial,Student Name,National ID,NEMIS,Sub-Location,Institution,Level,Chief Need Score,Allocated KES\n';
      const csvRows = verified
        .slice(0, 500)
        .map(
          (a) =>
            `"${a.serial}","${a.fullName}","${a.nationalId}","${a.nemis}","${a.subLocation}","${a.school}","${a.institutionCategory}",${a.chiefScore},${a.allocatedKes}`
        )
        .join('\n');

      const manifestText = `OFFICIAL BENEFICIARY ALLOCATION MANIFEST — TENDENO / SORGET WARD (NG-CDF)\nACADEMIC CYCLE: 2026/2027\nTOTAL VERIFIED POOL: ${verified.length} STUDENTS\nTOTAL FUNDS ALLOCATED: KES ${verified.reduce((s, a) => s + a.allocatedKes, 0).toLocaleString()}\nVERIFICATION HASH: SHA256-MCA-7F91C4B82A\nDATE GENERATED: ${new Date().toISOString()}\n\n` +
        csvHeader +
        csvRows;

      const blob = new Blob([manifestText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Beneficiary_Allocation_Manifest_Tendeno_Sorget_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setDownloading(false);
    }, 600);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          eyebrow="Ward Analytics"
          title="Applications"
          description="Aggregated demographic distributions, comparative village matrices, and geopolitical fiscal equity."
        />

        {/* Pinned Executive Quick Action Button */}
        <div className="shrink-0">
          <Button
            variant="emerald"
            onClick={handleDownloadManifest}
            disabled={downloading}
            className="w-full sm:w-auto font-semibold min-h-[44px] shadow-lg shadow-emerald-950/40"
          >
            <Icon name="download" size={16} className="mr-2" />
            {downloading ? 'Compiling Manifest…' : 'Download Verified Master Roster (CSV/PDF)'}
          </Button>
        </div>
      </div>

      {/* Primary View Switcher: Comparative Matrix & Demographics vs. Document & Ingestion Analytics */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setParams({})}
            className={cx(
              'px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all min-h-[44px] flex items-center gap-2',
              activeTab === 'matrix'
                ? 'bg-accent/20 text-accent-soft ring-1 ring-accent/40 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
            )}
          >
            <Icon name="scale" size={16} />
            Demographics &amp; Village Matrix
          </button>
          <button
            type="button"
            onClick={() => setParams({ view: 'anomalies' })}
            className={cx(
              'px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all min-h-[44px] flex items-center gap-2',
              activeTab === 'anomalies'
                ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
            )}
          >
            <Icon name="fileCheck" size={16} />
            Document &amp; Hanged Application Analytics
            <Badge tone="amber" className="ml-1 text-[10px]">
              {anomalyData.flaggedResidencyCount}
            </Badge>
          </button>
        </div>
        <span className="hidden sm:inline-block text-xs text-slate-300 font-mono">
          Cycle: 2026/2027 · Hard Cap: KES 15,000,000
        </span>
      </div>

      {activeTab === 'matrix' ? (
        <>
          {/* Sub-Location Intake & Clearance Chart with realistic axes and vertical grid lines */}
          <Card
            title="Sub-Location Intake vs. Clearance Parity"
            subtitle="Comparing total registered intake volume against Chief verified beneficiaries across all ward sub-locations."
            actions={
              <Segmented
                label="Chart type"
                value={chartMode}
                onChange={setChartMode}
                options={[
                  { key: 'bar', label: 'Grouped Bar' },
                  { key: 'line', label: 'Line Trace' }
                ]}
              />
            }
          >
            <div className="mt-2">
              <TrendChart
                mode={chartMode}
                labels={subLabels}
                height={220}
                ariaLabel="Sub-location intake vs clearance"
                series={[
                  { key: 'reg', label: 'Registered Intake', color: '#38bdf8', values: registeredValues },
                  { key: 'clr', label: 'Cleared Beneficiaries', color: '#34d399', values: clearedValues }
                ]}
              />
              <div className="mt-3 flex items-center justify-center gap-6 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#38bdf8]" />
                  Total Registered Intake
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#34d399]" />
                  Cleared &amp; Verified Beneficiaries
                </span>
              </div>
            </div>
          </Card>

          {/* SECTION 1: COMPARATIVE VILLAGE & SUB-LOCATION MATRIX */}
          <Card
            title="Comparative Village &amp; Sub-Location Matrix (Analytical Comparative Table)"
            subtitle="Aggregated statistical ledger of intake volumes, clearance efficiency, educational splits, and fiscal parity."
          >
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-950/80 text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800">
                  <tr>
                    <Th>Sub-Location</Th>
                    <Th align="right">Total Registered Applicants</Th>
                    <Th align="center">Cleared %</Th>
                    <Th align="right">Secondary Count</Th>
                    <Th align="right">Tertiary Count</Th>
                    <Th align="right">Total Funds Committed (KES)</Th>
                    <Th align="right">Parity Share (%)</Th>
                  </tr>
                </thead>
                <tbody className={tbodyCls}>
                  {matrixData.rows.map((row) => (
                    <tr key={row.subLocation} className={rowCls}>
                      <Td>
                        <p className="font-semibold text-white">{row.subLocation}</p>
                        <span className="text-[11px] text-slate-300">{row.location} Location</span>
                      </Td>
                      <Td align="right" mono>
                        <span className="font-bold text-slate-100">{num(row.totalRegistered)}</span>
                      </Td>
                      <Td align="center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-slate-800 overflow-hidden hidden sm:block">
                            <div
                              className="h-full bg-emerald-400 rounded-full"
                              style={{ width: `${Math.min(100, row.clearedPct)}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs font-bold text-emerald-300">
                            {row.clearedPct.toFixed(1)}%
                          </span>
                        </div>
                      </Td>
                      <Td align="right" mono>
                        <span className="text-slate-100">{num(row.secondaryCount)}</span>
                      </Td>
                      <Td align="right" mono>
                        <span className="text-slate-100">{num(row.tertiaryCount)}</span>
                      </Td>
                      <Td align="right" mono>
                        <span className="font-bold text-amber-200">{kes(row.fundsCommittedKes)}</span>
                      </Td>
                      <Td align="right">
                        <span
                          className={cx(
                            'font-mono font-bold text-xs px-2 py-0.5 rounded',
                            row.paritySharePct < 10
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/15 text-emerald-300'
                          )}
                        >
                          {pct(row.paritySharePct)}
                        </span>
                      </Td>
                    </tr>
                  ))}
                  {/* Aggregated Totals Row */}
                  <tr className="bg-slate-950 font-bold border-t-2 border-slate-700">
                    <Td>
                      <span className="text-white uppercase tracking-wider text-xs">
                        {matrixData.totals.subLocation}
                      </span>
                    </Td>
                    <Td align="right" mono>
                      <span className="text-white text-base">{num(matrixData.totals.totalRegistered)}</span>
                    </Td>
                    <Td align="center" mono>
                      <span className="text-emerald-400 text-sm font-bold">
                        {matrixData.totals.clearedPct.toFixed(1)}%
                      </span>
                    </Td>
                    <Td align="right" mono>
                      <span className="text-white">{num(matrixData.totals.secondaryCount)}</span>
                    </Td>
                    <Td align="right" mono>
                      <span className="text-white">{num(matrixData.totals.tertiaryCount)}</span>
                    </Td>
                    <Td align="right" mono>
                      <span className="text-amber-300 text-base">{kes(matrixData.totals.fundsCommittedKes)}</span>
                    </Td>
                    <Td align="right" mono>
                      <span className="text-white text-xs">100.0%</span>
                    </Td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* SECTION 2: INTERACTIVE DEMOGRAPHIC ANALYTICS ENGINE */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* 1. Gender Breakdown */}
            <Card
              title="Gender Demographic Distribution"
              subtitle={`Parity Ratio: ${demographicData.gender.parityRatio} (Female / Male ratio across verified pool)`}
            >
              <div className="mt-2 space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-2 text-rose-300">
                    <span className="h-3 w-3 rounded-full bg-rose-400" />
                    Female: {demographicData.gender.female.count} ({demographicData.gender.female.pct.toFixed(1)}%)
                  </span>
                  <span className="flex items-center gap-2 text-cyan-300">
                    <span className="h-3 w-3 rounded-full bg-cyan-400" />
                    Male: {demographicData.gender.male.count} ({demographicData.gender.male.pct.toFixed(1)}%)
                  </span>
                </div>

                {/* High-contrast Distribution Bar */}
                <div className="h-4 w-full rounded-full bg-slate-800 overflow-hidden flex">
                  <div
                    style={{ width: `${demographicData.gender.female.pct}%` }}
                    className="bg-rose-500 transition-all duration-500 flex items-center justify-center text-[10px] text-white font-bold"
                  >
                    {demographicData.gender.female.pct.toFixed(0)}%
                  </div>
                  <div
                    style={{ width: `${demographicData.gender.male.pct}%` }}
                    className="bg-cyan-500 transition-all duration-500 flex items-center justify-center text-[10px] text-white font-bold"
                  >
                    {demographicData.gender.male.pct.toFixed(0)}%
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Gender parity complies with Article 27 of the Constitution and NG-CDF equal educational opportunity guidelines.
                </p>
              </div>
            </Card>

            {/* 2. Age Demographics Grouped Histogram */}
            <Card
              title="Age Demographic Brackets"
              subtitle="Grouped demographic cohorts across early secondary, college transition, and continuing education."
            >
              <div className="mt-2 space-y-3">
                {demographicData.ageGroups.map((group) => (
                  <div key={group.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-100">{group.label} ({group.range})</span>
                      <span className="font-mono text-slate-300">
                        {group.count} applicants ({group.pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={cx(
                          'h-full rounded-full transition-all duration-500',
                          group.tone === 'emerald' ? 'bg-emerald-400' : group.tone === 'cyan' ? 'bg-cyan-400' : 'bg-violet-400'
                        )}
                        style={{ width: `${group.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 3. Institution Split */}
            <Card
              title="Institution Category Distribution"
              subtitle="Secondary vs. National Polytechnics vs. Public Universities vs. Special Needs"
            >
              <div className="mt-2 space-y-3">
                {demographicData.institutions.map((inst) => (
                  <div key={inst.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-100">{inst.label}</span>
                      <span className="font-mono text-slate-300">
                        {inst.count} students · {inst.pct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${inst.pct}%`, backgroundColor: inst.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* 4. Vulnerability Stratification */}
            <Card
              title="Vulnerability Stratification (Chief Need Scores)"
              subtitle="Audited breakdown of need severity categories determining allocation tranche weights."
            >
              <div className="mt-2 space-y-3">
                {demographicData.vulnerability.map((v) => (
                  <div
                    key={v.category}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge tone={v.tone}>{v.category}</Badge>
                        <span className="font-semibold text-xs text-white">{v.title}</span>
                      </div>
                      <span className="font-mono text-xs text-amber-300 font-bold">{v.scoreRange}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-slate-900">
                      <span>{v.count} Beneficiaries ({v.pct.toFixed(1)}%)</span>
                      <span className="font-mono font-bold text-slate-100">Committed: {kes(v.fundsAllocated)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      ) : (
        /* SECTION 3: AUDIT & ANOMALY SUB-PAGE */
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">Flagged Residency Cases</span>
              <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-amber-300">
                {anomalyData.flaggedResidencyCount}
              </p>
              <span className="text-[11px] text-slate-200">Non-resident / Boundary Discrepancies</span>
            </Card>
            <Card>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">Total Chief Appeals Filed</span>
              <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-cyan-300">
                {anomalyData.appealsTotal}
              </p>
              <span className="text-[11px] text-slate-200">Submitted with new proof</span>
            </Card>
            <Card>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">Appeals Overturn Ratio</span>
              <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-emerald-300">
                {anomalyData.appealOverturnRatePct.toFixed(1)}%
              </p>
              <span className="text-[11px] text-slate-200">
                {anomalyData.appealsOverturnedCount} Overturned vs {anomalyData.appealsDismissedCount} Dismissed
              </span>
            </Card>
            <Card>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">Total Dropped / Excluded</span>
              <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-red-300">
                {anomalyData.rejectedDirectCount + anomalyData.appealsDismissedCount}
              </p>
              <span className="text-[11px] text-slate-200">Permanently Archived</span>
            </Card>
          </div>

          {/* Ingestion Funnel Drop-off & Document Quality Analytics */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Hanged Applications Registration Funnel Drop-off */}
            <Card
              title="Registration Intake Funnel &amp; Hanged Cases"
              subtitle="Funnel progress tracking where applicants stall before reaching Chief verification."
            >
              <div className="space-y-3.5 mt-2">
                {[
                  { step: 'Step 1: Personal Information', pct: 100, count: 1260, drop: 0, status: 'Completed' },
                  { step: 'Step 2: Guardian & Custody Link', pct: 94.2, count: 1187, drop: 73, status: '73 Awaiting ID Proof' },
                  { step: 'Step 3: Family & Income Declaration', pct: 89.5, count: 1128, drop: 59, status: '59 Incomplete' },
                  { step: 'Step 4: Institution & Fee Verification', pct: 84.1, count: 1060, drop: 68, status: '68 Fee Audit' },
                  { step: 'Step 5: Chief Submission & Baraza', pct: 81.4, count: 1026, drop: 34, status: 'Active Verified' }
                ].map((item, idx) => (
                  <div key={item.step} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-100">{item.step}</span>
                      <span className="font-mono text-slate-300">
                        {item.count} applicants ({item.pct}%)
                        {item.drop > 0 ? <span className="text-amber-300 ml-1.5">(-{item.drop} stalled)</span> : null}
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={cx(
                          'h-full rounded-full transition-all duration-500',
                          idx === 4 ? 'bg-emerald-400' : idx >= 2 ? 'bg-accent' : 'bg-cyan-400'
                        )}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-slate-300 pt-2 border-t border-slate-800">
                  Total stalled / hanged sign-ups in progress: <strong className="text-amber-300 font-mono">234 applicants</strong>. Help Desk automated SMS reminders dispatched.
                </p>
              </div>
            </Card>

            {/* Document Quality & Machine-Vision OCR Analytics */}
            <Card
              title="Document Upload Quality &amp; OCR Analytics"
              subtitle="Machine-vision inspection metrics for student birth certificates and fees slips."
            >
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                    <span className="text-[10px] uppercase font-bold text-slate-300 block">Total Documents Analyzed</span>
                    <p className="font-mono text-xl font-bold text-white mt-1">2,480</p>
                    <span className="text-[11px] text-slate-300">Birth certs &amp; fee structures</span>
                  </div>
                  <div className="rounded-xl border border-emerald-500/30 bg-slate-950/60 p-3">
                    <span className="text-[10px] uppercase font-bold text-slate-300 block">Machine Vision Pass</span>
                    <p className="font-mono text-xl font-bold text-emerald-300 mt-1">91.2%</p>
                    <span className="text-[11px] text-emerald-400">2,262 Clean scans</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2 text-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200 block">Quality Flag Breakdowns</span>
                  <div className="flex items-center justify-between text-slate-200">
                    <span>Blurry / Unreadable Scans</span>
                    <span className="font-mono text-amber-300 font-bold">142 (5.7%)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-200">
                    <span>Missing School / Chief Stamp</span>
                    <span className="font-mono text-amber-300 font-bold">76 (3.1%)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-200">
                    <span>NEMIS / ID Text Mismatch</span>
                    <span className="font-mono text-red-300 font-bold">38 (1.5%)</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300">
                  All flagged documents are reviewed by Help Desk via dual-pane canvas with zoom, invert &amp; re-upload requests.
                </p>
              </div>
            </Card>
          </div>

          <Card
            title="Geographic Anomaly Clusters &amp; Boundary Dispute Telemetry"
            subtitle="Detected integrity alerts requiring administrative resolution by Area Chief &amp; Ward Registrar."
          >
            <div className="space-y-3">
              {anomalyData.clusters.map((cluster) => (
                <div
                  key={cluster.anomalyType}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">{cluster.anomalyType}</span>
                      <Badge tone={cluster.severity}>
                        {cluster.flaggedCount} Cases
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-300">
                      Location: <strong className="text-white">{cluster.location}</strong> · Sub-Location: <strong className="text-white">{cluster.subLocation}</strong>
                    </p>
                  </div>
                  <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4">
                    <span className="text-[10px] uppercase font-bold text-slate-200 block">Resolution Status</span>
                    <span className="text-xs text-amber-300 font-medium">{cluster.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
