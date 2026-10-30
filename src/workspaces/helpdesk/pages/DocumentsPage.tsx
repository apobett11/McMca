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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* HERO BANNER (CHIEF STYLING) */}
      <section className="dash-single-card" style={{ padding: '22px 26px', background: 'var(--surface-elevated)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 10,
                background: 'rgba(217, 119, 6, 0.15)',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Icon name="documents" size={24} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--text)', fontWeight: 700 }}>
                Document Stages &amp; Registration Progress
              </h1>
              <p style={{ margin: '4px 0 0', color: 'var(--text-2, #94a3b8)', fontSize: '0.88rem' }}>
                Live database verification of incomplete student registrations (all types: independent, delegated, custody) and incomplete parents.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <RefreshButton busy={refreshing} onClick={handleRefresh} />
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => openModal('total')}
              style={{ padding: '8px 18px', fontSize: '0.82rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Icon name="mapPin" size={16} />
              <span>Explore Ward Locations</span>
            </button>
          </div>
        </div>
      </section>

      {/* CHIEF-STYLE STRIP CARDS WITH TITLES */}
      <div className="dash-analytics-strips" style={{ margin: 0 }}>
        {/* Card 1: Total Registrations */}
        <ChiefStripCard
          title="Ward Registrations"
          value={`${analytics.totalRegistrations.toLocaleString()} Registrations`}
          statusBadge="All Pipeline"
          statusTone="admitted"
          pct={100}
          footInfo="Total registrations across Tendeno & Sorget"
          actionText="View Location Distribution"
          onAction={() => openModal('total')}
        />

        {/* Card 2: Completed Document Sets */}
        <ChiefStripCard
          title="Completed Documents"
          value={`${analytics.completedRegistrations.toLocaleString()} Completed Sets`}
          statusBadge={`${completedPct}% Verified`}
          statusTone="admitted"
          pct={completedPct}
          footInfo="All 5 onboarding stages verified"
          actionText="Inspect Completed"
          onAction={() => openModal('completed')}
        />

        {/* Card 3: Incomplete Students */}
        <ChiefStripCard
          title="Incomplete Students"
          value={`${analytics.incompleteStudentRegistrations.toLocaleString()} Hanging Steps`}
          statusBadge={`${incompleteStudentsPct}% Incomplete`}
          statusTone="declined"
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
          pct={incompleteParentsPct}
          fillGradient="linear-gradient(90deg, #8b5cf6, #d97706)"
          footInfo="Guardian ID verification or linkage hanging"
          actionText="Inspect Parents"
          onAction={() => openModal('incomplete_parents')}
          hasUpdate={analytics.incompleteParentRegistrations > 0}
        />
      </div>

      {/* INFORMATIVE SECTION (CHIEF STYLING) */}
      <section className="dash-single-card" style={{ padding: '20px 24px', background: 'var(--surface-elevated)' }}>
        <h3 className="stitch-section-title" style={{ margin: '0 0 12px', fontSize: '1.05rem' }}>
          Document Verification &amp; In-Place Dropdowns
        </h3>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6 }}>
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
