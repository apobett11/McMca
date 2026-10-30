import React, { useState, useMemo } from 'react';
import { Icon } from '../../../components/Icon.jsx';
import { RefreshButton } from '../../../components/RefreshButton.jsx';
import { ChiefStripCard } from '../../../dashboards/helpdesk/components/ChiefStripCard.jsx';
import { ChiefLocationModal } from '../../../dashboards/helpdesk/components/ChiefLocationModal.jsx';
import { McaAnalyticsHub } from '../components/McaAnalyticsHub.tsx';
import { getFullApplicantPool } from '../../../data/scalableWardDataset.ts';
import { kes, num } from '../../lib/format.ts';

export function ApplicationsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMetric, setModalMetric] = useState<'total' | 'successful' | 'flagged'>('total');
  const [refreshing, setRefreshing] = useState(false);

  const pool = useMemo(() => getFullApplicantPool(), [refreshing]);

  const total = pool.length;
  const verified = pool.filter((a) => a.inMasterVerifiedPool).length;
  const flagged = pool.filter((a) => a.chiefStatus === 'Under Review' || a.isResidencyFlagged).length;
  const totalAllocated = pool.filter((a) => a.inMasterVerifiedPool).reduce((sum, a) => sum + a.allocatedKes, 0);

  const verifiedPct = total > 0 ? Math.round((verified / total) * 100) : 0;
  const flaggedPct = total > 0 ? Math.round((flagged / total) * 100) : 0;

  const openDrilldown = (metric: 'total' | 'successful' | 'flagged') => {
    setModalMetric(metric);
    setModalOpen(true);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 300);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* HERO BANNER (CHIEF STYLING - CYAN / TEAL THEME) */}
      <section
        className="dash-single-card"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, var(--surface-elevated, #101c38) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          boxShadow: '0 4px 20px rgba(6, 182, 212, 0.08)'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: 'rgba(6, 182, 212, 0.18)',
                color: '#22d3ee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(6, 182, 212, 0.25)'
              }}
            >
              <Icon name="applications" size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: 'rgba(6, 182, 212, 0.2)',
                    color: '#22d3ee',
                    border: '1px solid rgba(6, 182, 212, 0.35)'
                  }}
                >
                  Ward Applications Intake
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Tendeno &amp; Sorget Divisions
                </span>
              </div>
              <h1 style={{ margin: '4px 0 0', fontSize: '1.45rem', color: 'var(--text, #fff)', fontWeight: 800 }}>
                Ward Applications &amp; Geographic Distribution
              </h1>
              <p style={{ margin: '4px 0 0', color: 'var(--text-2, #94a3b8)', fontSize: '0.88rem' }}>
                Complete applicant roster analytics, sub-location clearance rates, and anomaly vetting.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <RefreshButton busy={refreshing} onClick={handleRefresh} />
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => openDrilldown('total')}
              style={{
                padding: '9px 18px',
                fontSize: '0.82rem',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                border: 'none',
                boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)',
                fontWeight: 600
              }}
            >
              <Icon name="mapPin" size={16} />
              <span>Explore Ward Locations</span>
            </button>
          </div>
        </div>
      </section>

      {/* CHIEF-STYLE STRIP CARDS (CYAN THEME WITH HIERARCHY) */}
      <div className="dash-analytics-strips" style={{ margin: 0 }}>
        {/* Card 1: Ward Applications - PRIMARY FOCUS */}
        <ChiefStripCard
          title="Ward Ingestion"
          value={`${num(total)} Applications`}
          statusBadge="100% Ward Reach"
          statusTone="admitted"
          themeTone="cyan"
          isFocus={true}
          pct={100}
          footInfo="Total applicant intake across all 8 sub-locations"
          actionText="View Location Breakdown"
          onAction={() => openDrilldown('total')}
        />

        {/* Card 2: Verified & Cleared */}
        <ChiefStripCard
          title="Cleared / Approved"
          value={`${num(verified)} Cleared`}
          statusBadge={`${verifiedPct}% Master Verified`}
          statusTone="admitted"
          themeTone="cyan"
          isFocus={false}
          pct={verifiedPct}
          footInfo="Passed Chief residency & vetting protocols"
          actionText="Inspect Cleared"
          onAction={() => openDrilldown('successful')}
        />

        {/* Card 3: Flagged Applications */}
        <ChiefStripCard
          title="Flagged Applications"
          value={`${num(flagged)} Flagged`}
          statusBadge={`${flaggedPct}% In Triage`}
          statusTone="declined"
          themeTone="cyan"
          isFocus={false}
          pct={flaggedPct}
          fillGradient="linear-gradient(90deg, #f59e0b, #ef4444)"
          footInfo="Under investigation or residency anomaly"
          actionText="Inspect Flagged"
          onAction={() => openDrilldown('flagged')}
          hasUpdate={flagged > 0}
        />

        {/* Card 4: Bursary Allocated */}
        <ChiefStripCard
          title="Bursary Allocation"
          value={kes(totalAllocated)}
          statusBadge="Active Allocation"
          statusTone="review"
          themeTone="cyan"
          isFocus={false}
          pct={Math.round((totalAllocated / 15000000) * 100)}
          footInfo="Cumulative allocated award across verified students"
          actionText="View Location Breakdown"
          onAction={() => openDrilldown('total')}
        />
      </div>

      {/* DEEP ANALYTICS MATRIX & DEMOGRAPHICS */}
      <McaAnalyticsHub />

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
