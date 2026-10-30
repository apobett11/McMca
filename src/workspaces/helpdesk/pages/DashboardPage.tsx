import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../../components/Icon.jsx';
import { RefreshButton } from '../../../components/RefreshButton.jsx';
import { getTimeGreeting } from '../../../utils/greeting.js';
import { ChiefStripCard } from '../../../dashboards/helpdesk/components/ChiefStripCard.jsx';
import { ChiefLocationModal } from '../../../dashboards/helpdesk/components/ChiefLocationModal.jsx';
import {
  fetchHelpDeskAnalytics,
  getCachedAnalytics,
  type HelpDeskAnalyticsSummary
} from '../services/helpDeskService.ts';
import { officer } from '../data.ts';

export function DashboardPage() {
  const navigate = useNavigate();
  const greeting = getTimeGreeting();
  const off = useMemo(() => officer(), []);
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

  const approvalPct = analytics.totalApplications > 0
    ? Math.round((analytics.successfulApplications / analytics.totalApplications) * 100)
    : 73;

  const docCompletedPct = analytics.totalRegistrations > 0
    ? Math.round((analytics.completedRegistrations / analytics.totalRegistrations) * 100)
    : 67;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* HERO BANNER (MATCHING CHIEF DASHBOARD EXACTLY) */}
      <section className="dash-single-card" style={{ padding: '24px 28px', background: 'var(--surface-elevated)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.25rem',
                boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)'
              }}
            >
              HD
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.45rem', color: 'var(--text)' }}>
                {greeting}, {off?.name || 'Clara Chelangat'}.
              </h1>
              <p style={{ margin: '4px 0 0', color: 'var(--text-2, #94a3b8)', fontSize: '0.9rem' }}>
                Tendeno / Sorget Ward · Operations Terminal · Assessment, Verification &amp; Appeals Desk
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <RefreshButton busy={refreshing} onClick={handleRefresh} />
            <span className="badge badge--success" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              ● Ward Active
            </span>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => navigate('/helpdesk/profile')}
              style={{ fontSize: '0.82rem', padding: '6px 12px' }}
            >
              Officer Profile
            </button>
          </div>
        </div>
      </section>

      {/* CHIEF-STYLE THIN RANGES (DASH-STRIP-CARD) WITH TITLES & PROGRESS BARS */}
      <div className="dash-analytics-strips" style={{ margin: 0 }}>
        {/* Applications Strip Card */}
        <ChiefStripCard
          title="Ward Applications"
          value={`${analytics.totalApplications.toLocaleString()} Total Applications`}
          statusBadge={`${approvalPct}% Cleared`}
          statusTone="admitted"
          pct={approvalPct}
          footInfo={`${analytics.successfulApplications.toLocaleString()} Approved · ${analytics.flaggedApplications.toLocaleString()} In Review`}
          actionText="View Applications"
          onAction={() => navigate('/helpdesk/applications')}
          hasUpdate={analytics.flaggedApplications > 0}
        />

        {/* Documents Strip Card */}
        <ChiefStripCard
          title="Document Pipeline"
          value={`${analytics.completedRegistrations.toLocaleString()} Completed Sets`}
          statusBadge={`${analytics.incompleteStudentRegistrations} Incomplete`}
          statusTone={analytics.incompleteStudentRegistrations > 0 ? 'review' : 'admitted'}
          pct={docCompletedPct}
          footInfo={`${analytics.incompleteStudentRegistrations} Students · ${analytics.incompleteParentRegistrations} Parents Hanging`}
          actionText="View Documents"
          onAction={() => navigate('/helpdesk/documents')}
          hasUpdate={analytics.incompleteStudentRegistrations > 0}
        />

        {/* Messages Strip Card */}
        <ChiefStripCard
          title="Inquiries & Messages"
          value={`${analytics.openMessages} Open Tickets`}
          statusBadge="Action Queue"
          statusTone="review"
          pct={75}
          footInfo="4 Escalations to MCA / Chief Desk"
          actionText="View Messages"
          onAction={() => navigate('/helpdesk/messages')}
          hasUpdate={analytics.openMessages > 0}
        />

        {/* Profile / Shift Strip Card */}
        <ChiefStripCard
          title="Operations Terminal"
          value="Day Shift (08:00 - 17:00)"
          statusBadge="On Duty"
          statusTone="admitted"
          pct={100}
          footInfo="Assigned: Tendeno & Sorget Locations"
          actionText="View Profile"
          onAction={() => navigate('/helpdesk/profile')}
        />
      </div>

      {/* STRUCTURED ANALYTICS CAREFULLY CRAFTED INTO SECTIONS (CHIEF STYLE) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Section 1: Processing Telemetry */}
        <section className="dash-single-card" style={{ padding: 24, background: 'var(--surface-elevated)' }}>
          <h3 className="stitch-section-title" style={{ margin: '0 0 16px', fontSize: '1.1rem' }}>
            Processing Telemetry
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Approval Rate</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981', marginTop: 4 }}>{approvalPct}%</div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{analytics.successfulApplications.toLocaleString()} of {analytics.totalApplications.toLocaleString()}</span>
            </div>

            <div style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Flagged Cases</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b', marginTop: 4 }}>{analytics.flaggedApplications.toLocaleString()}</div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Individual appeal/residency review</span>
            </div>

            <div style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Incomplete Students</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#eab308', marginTop: 4 }}>{analytics.incompleteStudentRegistrations}</div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Hanging registration steps</span>
            </div>

            <div style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Incomplete Parents</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#8b5cf6', marginTop: 4 }}>{analytics.incompleteParentRegistrations}</div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Pending guardian verification</span>
            </div>
          </div>
        </section>

        {/* Section 2: Administrative Jurisdiction & Geographic Breakdown */}
        <section className="dash-single-card" style={{ padding: 24, background: 'var(--surface-elevated)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 className="stitch-section-title" style={{ margin: 0, fontSize: '1.1rem' }}>
              Ward Jurisdiction Breakdown
            </h3>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => {
                setModalMetric('total');
                setModalOpen(true);
              }}
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            >
              Explore Locations
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {analytics.locations.map((loc) => {
              const locPct = analytics.totalApplications > 0
                ? Math.round((loc.total / analytics.totalApplications) * 100)
                : 50;

              return (
                <div key={loc.location} style={{ padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>
                      {loc.location} Location
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#d97706' }}>
                      {loc.total.toLocaleString()} ({locPct}%)
                    </span>
                  </div>
                  <div className="dash-strip-card__track" style={{ height: 6 }}>
                    <div
                      className="dash-strip-card__fill dash-strip-card__fill--gold"
                      style={{ width: `${locPct}%` }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.75rem', color: '#94a3b8' }}>
                    <span>{loc.successful} Approved · {loc.flagged} Flagged</span>
                    <span>4 Sub-Locations</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* LOCATION DRILLDOWN MODAL WITH IN-PLACE VILLAGE DROPDOWN */}
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
