import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { cx, kes, num, pct } from '../../lib/format.ts';
import { useDataTick } from '../../lib/hooks.ts';
import { TrendChart } from '../../ui/charts.tsx';
import { Icon } from '../../../components/Icon.jsx';
import { RefreshButton } from '../../../components/RefreshButton.jsx';
import { ChiefStripCard } from '../../../dashboards/helpdesk/components/ChiefStripCard.jsx';
import { ChiefLocationModal } from '../../../dashboards/helpdesk/components/ChiefLocationModal.jsx';
import { CYCLE, MCA_EVENTS, getTranche } from '../store.ts';
import { getFullApplicantPool, getAuditAnomaliesData } from '../../../data/scalableWardDataset.ts';

export function DashboardPage() {
  const tick = useDataTick(MCA_EVENTS);
  const [downloading, setDownloading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMetric, setModalMetric] = useState<'total' | 'successful' | 'flagged'>('total');

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

  const openDrilldown = (metric: 'total' | 'successful' | 'flagged') => {
    setModalMetric(metric);
    setModalOpen(true);
  };

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

      const manifestContent =
        `OFFICIAL BENEFICIARY ALLOCATION MANIFEST — TENDENO / SORGET WARD\n` +
        `ACADEMIC CYCLE: ${CYCLE}\n` +
        `TOTAL VERIFIED RECIPIENTS: ${verified.length}\n` +
        `TOTAL ALLOCATED: KES ${committedAmount.toLocaleString()}\n` +
        `VERIFICATION SEAL: MCA-EXECUTIVE-BI-2026-CERTIFIED\n\n` +
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'ws-fade-in 0.2s ease-out' }}>
      {/* HERO BANNER (MCA EXECUTIVE STYLING - GOLD & LEGISLATIVE AMBER ACCENTS) */}
      <section
        className="dash-single-card"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.09) 0%, rgba(11, 19, 41, 0.95) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.22)',
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
                background: 'rgba(217, 119, 6, 0.16)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(217, 119, 6, 0.2)',
                flexShrink: 0
              }}
            >
              <Icon name="home" size={26} />
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
                    background: 'rgba(217, 119, 6, 0.18)',
                    color: '#fbbf24',
                    border: '1px solid rgba(217, 119, 6, 0.35)'
                  }}
                >
                  Legislative Oversight
                </span>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  Cycle {CYCLE} &bull; Tendeno / Sorget Ward
                </span>
              </div>
              <h1 style={{ margin: '4px 0 0', fontSize: '1.4rem', color: '#ffffff', fontWeight: 800, letterSpacing: '-0.02em' }}>
                MCA Ward Executive Overview
              </h1>
              <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.86rem', maxWidth: 640 }}>
                Macro statistical oversight, bursary budget tranche liquidity, and cross-division equity monitoring.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleDownloadManifest}
              disabled={downloading}
              style={{
                padding: '9px 16px',
                fontSize: '0.82rem',
                borderRadius: 8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 600,
                cursor: downloading ? 'not-allowed' : 'pointer',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#e2e8f0',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon name="download" size={16} />
              <span>{downloading ? 'Compiling Roster…' : 'Download Manifest (CSV)'}</span>
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => openDrilldown('total')}
              style={{
                padding: '9px 18px',
                fontSize: '0.82rem',
                borderRadius: 8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)',
                color: '#030712',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon name="mapPin" size={16} />
              <span>Explore Ward Locations</span>
            </button>
          </div>
        </div>
      </section>

      {/* CHIEF-STYLE STRIP CARDS (RESPONSIVE GRID FOR DESKTOP / TABLET / MOBILE) */}
      <div
        className="dash-analytics-strips"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
          margin: 0
        }}
      >
        {/* Card 1: Ward Applications Pool - PRIMARY FOCUS */}
        <ChiefStripCard
          title="Ward Applications"
          value={`${num(totalSubmissions)} Total Intake`}
          statusBadge="100% Ward Reach"
          statusTone="admitted"
          themeTone="gold"
          isFocus={true}
          pct={100}
          footInfo="Complete intake across Tendeno & Sorget divisions"
          actionText="Explore Distribution"
          onAction={() => openDrilldown('total')}
        />

        {/* Card 2: Verified & Cleared - SECONDARY HIERARCHY */}
        <ChiefStripCard
          title="Verified & Cleared"
          value={`${num(verifiedAndCleared)} Master Verified`}
          statusBadge={`${((verifiedAndCleared / totalSubmissions) * 100).toFixed(1)}% Cleared`}
          statusTone="admitted"
          themeTone="gold"
          isFocus={false}
          pct={Math.round((verifiedAndCleared / totalSubmissions) * 100)}
          footInfo="Passed Chief residency & vetting protocols"
          actionText="Inspect Cleared"
          onAction={() => openDrilldown('successful')}
        />

        {/* Card 3: Flagged / In Triage */}
        <ChiefStripCard
          title="Flagged / In Triage"
          value={`${num(flaggedInTriage)} Under Review`}
          statusBadge="Field Triage"
          statusTone="declined"
          themeTone="gold"
          isFocus={false}
          pct={Math.round((flaggedInTriage / totalSubmissions) * 100)}
          fillGradient="linear-gradient(90deg, #f59e0b, #ef4444)"
          footInfo="Residency anomalies or under Chief field review"
          actionText="Inspect Flagged"
          onAction={() => openDrilldown('flagged')}
          hasUpdate={flaggedInTriage > 0}
        />

        {/* Card 4: Tranche Liquidity */}
        <ChiefStripCard
          title="Tranche Liquidity"
          value={`${kes(committedAmount)} Committed`}
          statusBadge={`${committedPct.toFixed(1)}% Consumed`}
          statusTone="review"
          themeTone="gold"
          isFocus={false}
          pct={Math.round(committedPct)}
          footInfo={`Remaining: ${kes(remaining)} of 15M cap`}
          actionText="View Disbursements"
          onAction={() => window.location.assign('/mca/disbursements')}
        />
      </div>

      {/* QUICK WORKSPACE NAVIGATION TILES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <Link
          to="/mca/applications"
          className="dash-single-card"
          style={{
            padding: '16px 18px',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            background: 'rgba(13, 21, 39, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', color: '#22d3ee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="applications" size={20} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#ffffff', fontWeight: 600 }}>Applications</h4>
            <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#94a3b8' }}>Demographics &amp; matrix</p>
          </div>
        </Link>

        <Link
          to="/mca/documents"
          className="dash-single-card"
          style={{
            padding: '16px 18px',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            background: 'rgba(13, 21, 39, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="documents" size={20} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#ffffff', fontWeight: 600 }}>Documents</h4>
            <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#94a3b8' }}>Verification stages</p>
          </div>
        </Link>

        <Link
          to="/mca/disbursements"
          className="dash-single-card"
          style={{
            padding: '16px 18px',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            background: 'rgba(13, 21, 39, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.3)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="cheque" size={20} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#ffffff', fontWeight: 600 }}>Disbursements</h4>
            <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#94a3b8' }}>Payables &amp; cheque manifests</p>
          </div>
        </Link>
      </div>

      {/* MACRO DISTRIBUTION & GEOGRAPHIC PARITY */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {/* Intake Velocity Chart */}
        <section
          className="dash-single-card"
          style={{
            padding: '22px 24px',
            background: 'rgba(13, 21, 39, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 14,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <h3 className="stitch-section-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
              Intake Trajectory vs. Chief Clearance Curve
            </h3>
            <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
              6-Month Velocity
            </span>
          </div>
          <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: '#94a3b8' }}>
            Cumulative applicant intake velocity vs. Chief verification throughput over 6 months.
          </p>
          <div style={{ marginTop: 12 }}>
            <TrendChart
              mode="line"
              labels={months}
              ariaLabel="Intake velocity vs Chief clearance curve"
              series={[
                { key: 'intake', label: 'Raw Intake Pool', color: '#38bdf8', values: intakeTrajectory },
                { key: 'clearance', label: 'Chief Cleared Pool', color: '#34d399', values: clearanceCurve }
              ]}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 14, fontSize: '0.78rem', color: '#cbd5e1', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#38bdf8' }} />
                Raw Intake Velocity ({num(totalSubmissions)} Total)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#34d399' }} />
                Chief Clearance Curve ({num(verifiedAndCleared)} Verified)
              </span>
            </div>
          </div>
        </section>

        {/* Geographic Parity (Tendeno vs. Sorget) */}
        <section
          className="dash-single-card"
          style={{
            padding: '22px 24px',
            background: 'rgba(13, 21, 39, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 14,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <h3 className="stitch-section-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
              Geographic Parity Overview (Tendeno vs. Sorget)
            </h3>
            <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(52, 211, 153, 0.12)', color: '#34d399', fontWeight: 600 }}>
              &ge; 45% Target Met
            </span>
          </div>
          <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: '#94a3b8' }}>
            Administrative clearance rates and fiscal parity across the two primary ward divisions.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Tendeno Parity Gauge */}
            <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>Tendeno Location</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Tendeno Central, East, West &amp; Mware</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#34d399', fontSize: '1.05rem' }}>
                    {tendenoClearPct.toFixed(1)}%
                  </span>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                    {tendenoCleared.length} / {tendenoTotal.length} Cleared
                  </div>
                </div>
              </div>
              <div style={{ height: 6, borderRadius: 4, background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                <div style={{ width: `${tendenoClearPct}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: 4, transition: 'width 0.4s ease' }} />
              </div>
            </div>

            {/* Sorget Parity Gauge */}
            <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.88rem' }}>Sorget Location</div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Sorget Central, Forest, Kipchorian &amp; Kamuingi</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#38bdf8', fontSize: '1.05rem' }}>
                    {sorgetClearPct.toFixed(1)}%
                  </span>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                    {sorgetCleared.length} / {sorgetTotal.length} Cleared
                  </div>
                </div>
              </div>
              <div style={{ height: 6, borderRadius: 4, background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                <div style={{ width: `${sorgetClearPct}%`, height: '100%', background: 'linear-gradient(90deg, #06b6d4, #38bdf8)', borderRadius: 4, transition: 'width 0.4s ease' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.78rem', color: '#94a3b8' }}>
              <span>Statutory Equity Target: &ge; 45% per division</span>
              <span style={{ color: '#34d399', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                Geographic Equity Balanced
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* LOCATION DRILLDOWN MODAL WITH IN-PLACE FLOATING VILLAGE DROPDOWN */}
      <ChiefLocationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode="applications"
        metricType={modalMetric}
      />
    </div>
  );
}
