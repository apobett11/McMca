import React, { useState, useEffect } from 'react';
import { Icon } from '../../../components/Icon.jsx';
import { RefreshButton } from '../../../components/RefreshButton.jsx';
import { ChiefStripCard } from '../../../dashboards/helpdesk/components/ChiefStripCard.jsx';
import { ChiefLocationModal } from '../../../dashboards/helpdesk/components/ChiefLocationModal.jsx';
import {
  fetchHelpDeskAnalytics,
  getCachedAnalytics,
  type HelpDeskAnalyticsSummary
} from '../services/helpDeskService.ts';

export function ApplicationsPage() {
  const [analytics, setAnalytics] = useState<HelpDeskAnalyticsSummary>(getCachedAnalytics());
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMetric, setModalMetric] = useState<'total' | 'successful' | 'flagged'>('total');

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const data = await fetchHelpDeskAnalytics();
      setAnalytics(data);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchHelpDeskAnalytics().then(setAnalytics).catch(() => {});
  }, []);

  const openModal = (metric: 'total' | 'successful' | 'flagged') => {
    setModalMetric(metric);
    setModalOpen(true);
  };

  const approvalPct = analytics.totalApplications > 0
    ? Math.round((analytics.successfulApplications / analytics.totalApplications) * 100)
    : 73;

  const flaggedPct = analytics.totalApplications > 0
    ? Math.round((analytics.flaggedApplications / analytics.totalApplications) * 100)
    : 27;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        animation: 'emilPageFade 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* HERO BANNER WITH DISTINCTIVE CYAN/TEAL PAGE PERSONALITY */}
      <section
        className="dash-single-card"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, var(--surface-elevated, #1a2234) 65%)',
          border: '1px solid rgba(6, 182, 212, 0.35)',
          boxShadow: '0 8px 30px rgba(6, 182, 212, 0.1)'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(6, 182, 212, 0.38)'
              }}
            >
              <Icon name="applications" size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text)', fontWeight: 700 }}>
                  Applications Registry
                </h1>
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: 'rgba(6, 182, 212, 0.2)',
                    color: '#22d3ee',
                    fontWeight: 700,
                    border: '1px solid rgba(6, 182, 212, 0.4)'
                  }}
                >
                  Ingestion Funnel
                </span>
              </div>
              <p style={{ margin: '4px 0 0', color: 'var(--text-2, #94a3b8)', fontSize: '0.88rem' }}>
                Tendeno / Sorget Ward bursary ingestion funnels, geographic breakdowns &amp; village allocations.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <RefreshButton busy={refreshing} onClick={handleRefresh} />
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => openModal('total')}
              style={{
                padding: '8px 18px',
                fontSize: '0.82rem',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#06b6d4',
                color: '#02131e',
                border: '1px solid #22d3ee',
                boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)'
              }}
            >
              <Icon name="mapPin" size={16} />
              <span>Explore Ward Locations</span>
            </button>
          </div>
        </div>
      </section>

      {/* STRIP CARDS WITH CLEAR HIERARCHY (ONE FOCUS THING: WARD APPLICATIONS) */}
      <div className="dash-analytics-strips" style={{ margin: 0 }}>
        {/* ONE FOCUS CARD: TOTAL INGESTION (CYAN THEME, PROMINENT FOCUS) */}
        <ChiefStripCard
          title="Ward Applications"
          value={`${analytics.totalApplications.toLocaleString()} Total Applications`}
          statusBadge="All Ingested"
          statusTone="admitted"
          themeTone="cyan"
          isFocus={true}
          pct={100}
          footInfo="Submitted across Tendeno &amp; Sorget Ward"
          actionText="View Location Distribution"
          onAction={() => openModal('total')}
        />

        {/* SECONDARY HIERARCHY: APPROVED APPLICATIONS (EMERALD) */}
        <ChiefStripCard
          title="Successful Applications"
          value={`${analytics.successfulApplications.toLocaleString()} Approved Applications`}
          statusBadge={`${approvalPct}% Cleared`}
          statusTone="admitted"
          themeTone="cyan"
          pct={approvalPct}
          fillGradient="linear-gradient(90deg, #10b981, #22c55e)"
          footInfo="Cleared by Area Chief &amp; Bursary Committee"
          actionText="Inspect Cleared"
          onAction={() => openModal('successful')}
        />

        {/* SECONDARY HIERARCHY: FLAGGED APPLICATIONS (CORAL / ROSE) */}
        <ChiefStripCard
          title="Flagged Applications"
          value={`${analytics.flaggedApplications.toLocaleString()} Flagged Cases`}
          statusBadge={`${flaggedPct}% In Review`}
          statusTone="declined"
          themeTone="cyan"
          pct={flaggedPct}
          fillGradient="linear-gradient(90deg, #f59e0b, #ef4444)"
          footInfo="Pending residency cross-check or appeals"
          actionText="Inspect Flagged"
          onAction={() => openModal('flagged')}
          hasUpdate={analytics.flaggedApplications > 0}
        />
      </div>

      {/* INFORMATIVE SECTION WITH DISTINCTIVE CYAN BORDER ACCENTS */}
      <section
        className="dash-single-card"
        style={{
          padding: '22px 26px',
          background: 'var(--surface-elevated)',
          borderLeft: '4px solid #06b6d4'
        }}
      >
        <h3 className="stitch-section-title" style={{ margin: '0 0 10px', fontSize: '1.05rem', color: '#22d3ee' }}>
          Geographic Distribution Workflow
        </h3>
        <p style={{ margin: 0, fontSize: '0.86rem', color: '#94a3b8', lineHeight: 1.6 }}>
          Click any card above or &quot;Explore Ward Locations&quot; to inspect sub-locations and villages.
          Inside each sub-location card, the &quot;Villages&quot; button opens a floating hover dropdown directly above the cards without shifting the layout.
          Selecting any village loads the applications table labelled with that village at the top.
        </p>
      </section>

      {/* LOCATION DRILLDOWN MODAL */}
      <ChiefLocationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode="applications"
        metricType={modalMetric}
        analytics={analytics}
      />
    </div>
  );
}
