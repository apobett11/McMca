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

export function DocumentsPage() {
  const [analytics, setAnalytics] = useState<HelpDeskAnalyticsSummary>(getCachedAnalytics());
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMetric, setModalMetric] = useState<
    'total' | 'completed' | 'incomplete_students' | 'incomplete_parents'
  >('total');

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

  const openModal = (
    metric: 'total' | 'completed' | 'incomplete_students' | 'incomplete_parents'
  ) => {
    setModalMetric(metric);
    setModalOpen(true);
  };

  const completedPct = analytics.totalRegistrations > 0
    ? Math.round((analytics.completedRegistrations / analytics.totalRegistrations) * 100)
    : 67;

  const incompleteStudentsPct = analytics.totalRegistrations > 0
    ? Math.round((analytics.incompleteStudentRegistrations / analytics.totalRegistrations) * 100)
    : 22;

  const incompleteParentsPct = analytics.totalRegistrations > 0
    ? Math.round((analytics.incompleteParentRegistrations / analytics.totalRegistrations) * 100)
    : 11;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'ws-fade-in 0.2s ease-out' }}>
      {/* HERO BANNER (VIOLET ACCENT & DOCUMENT VERIFICATION THEME) */}
      <section
        className="dash-single-card"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(13, 21, 39, 0.95) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
          borderRadius: 16,
          backdropFilter: 'blur(16px)'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 260 }}>
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: 12,
                background: 'rgba(139, 92, 246, 0.18)',
                color: '#c084fc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(139, 92, 246, 0.25)',
                border: '1px solid rgba(139, 92, 246, 0.35)',
                flexShrink: 0
              }}
            >
              <Icon name="documents" size={24} />
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
                    background: 'rgba(139, 92, 246, 0.2)',
                    color: '#c084fc',
                    border: '1px solid rgba(139, 92, 246, 0.35)'
                  }}
                >
                  Document Verification Pipeline
                </span>
              </div>
              <h1 style={{ margin: '4px 0 0', fontSize: '1.4rem', color: '#ffffff', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Document Stages &amp; Registration Progress
              </h1>
              <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.86rem' }}>
                Live database verification of incomplete student registrations (independent, delegated, custody) and incomplete parents.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <RefreshButton busy={refreshing} onClick={handleRefresh} />
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => openModal('total')}
              style={{
                padding: '9px 18px',
                fontSize: '0.82rem',
                borderRadius: 8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Icon name="mapPin" size={16} />
              <span>Explore Ward Locations</span>
            </button>
          </div>
        </div>
      </section>

      {/* CHIEF-STYLE STRIP CARDS WITH VIOLET THEME & RESPONSIVE GRID */}
      <div
        className="dash-analytics-strips"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
          margin: 0
        }}
      >
        {/* Card 1: Completed Document Sets - PRIMARY FOCUS */}
        <ChiefStripCard
          title="Document Pipeline"
          value={`${analytics.completedRegistrations.toLocaleString()} Completed Sets`}
          statusBadge={`${completedPct}% Verified`}
          statusTone="admitted"
          themeTone="violet"
          isFocus={true}
          pct={completedPct}
          footInfo="All 5 onboarding stages verified across ward"
          actionText="Inspect Completed"
          onAction={() => openModal('completed')}
        />

        {/* Card 2: Total Ward Registrations - SECONDARY HIERARCHY */}
        <ChiefStripCard
          title="Ward Registrations"
          value={`${analytics.totalRegistrations.toLocaleString()} Total Records`}
          statusBadge="All Pipeline"
          statusTone="admitted"
          themeTone="violet"
          isFocus={false}
          pct={100}
          footInfo="Total registrations across Tendeno & Sorget"
          actionText="View Location Distribution"
          onAction={() => openModal('total')}
        />

        {/* Card 3: Incomplete Students */}
        <ChiefStripCard
          title="Incomplete Students"
          value={`${analytics.incompleteStudentRegistrations.toLocaleString()} Hanging Steps`}
          statusBadge={`${incompleteStudentsPct}% Incomplete`}
          statusTone="declined"
          themeTone="violet"
          isFocus={false}
          pct={incompleteStudentsPct}
          fillGradient="linear-gradient(90deg, #f59e0b, #ef4444)"
          footInfo="Independent, Delegated & Custody students"
          actionText="Inspect Students"
          onAction={() => openModal('incomplete_students')}
          hasUpdate={analytics.incompleteStudentRegistrations > 0}
        />

        {/* Card 4: Incomplete Parents */}
        <ChiefStripCard
          title="Incomplete Parents"
          value={`${analytics.incompleteParentRegistrations.toLocaleString()} Pending Verification`}
          statusBadge={`${incompleteParentsPct}% Incomplete`}
          statusTone="review"
          themeTone="violet"
          isFocus={false}
          pct={incompleteParentsPct}
          fillGradient="linear-gradient(90deg, #8b5cf6, #d97706)"
          footInfo="Guardian ID verification or linkage hanging"
          actionText="Inspect Parents"
          onAction={() => openModal('incomplete_parents')}
          hasUpdate={analytics.incompleteParentRegistrations > 0}
        />
      </div>

      {/* INFORMATIVE SECTION (CHIEF STYLING) */}
      <section
        className="dash-single-card"
        style={{
          padding: '20px 24px',
          background: 'rgba(13, 21, 39, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderLeft: '4px solid #a855f7',
          borderRadius: 12,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
        }}
      >
        <h3 className="stitch-section-title" style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700, color: '#c084fc' }}>
          Document Verification &amp; In-Place Dropdowns
        </h3>
        <p style={{ margin: 0, fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.6 }}>
          Click any card above to view the location breakdown. In the location popup, click &quot;View Villages List&quot; inside any sub-location card to expand its villages in place.
          Clicking a village reveals the table with sorts for Completed, Incomplete, and All records.
        </p>
      </section>

      {/* LOCATION DRILLDOWN MODAL WITH IN-PLACE VILLAGE DROPDOWN */}
      <ChiefLocationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode="documents"
        metricType={modalMetric}
        analytics={analytics}
      />
    </div>
  );
}
