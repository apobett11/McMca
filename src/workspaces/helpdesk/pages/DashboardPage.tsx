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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        animation: 'ws-fade-in 0.2s ease-out'
      }}
    >
      {/* HOMEPAGE HERO BANNER (THEME: TACTICAL CYAN & WARM GOLD OPERATIONS TERMINAL) */}
      <section
        className="dash-single-card"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.09) 0%, rgba(13, 21, 39, 0.95) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.22)',
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
                background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.2rem',
                boxShadow: '0 4px 16px rgba(6, 182, 212, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                flexShrink: 0
              }}
            >
              HD
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#ffffff', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  {greeting}, {off?.name || 'Clara Chelangat'}.
                </h1>
                <span
                  style={{
                    fontSize: '0.68rem',
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: 'rgba(6, 182, 212, 0.16)',
                    color: '#22d3ee',
                    fontWeight: 700,
                    border: '1px solid rgba(6, 182, 212, 0.35)'
                  }}
                >
                  Operations Terminal
                </span>
              </div>
              <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '0.86rem' }}>
                Tendeno / Sorget Ward &bull; Live Intake Triage &bull; Verification, Inquiries &amp; Appeals Desk
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <RefreshButton busy={refreshing} onClick={handleRefresh} />
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 999,
                background: 'rgba(52, 211, 153, 0.12)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                color: '#34d399',
                fontSize: '0.76rem',
                fontWeight: 600
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
              Live &bull; Ward Active
            </span>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => navigate('/helpdesk/profile')}
              style={{
                fontSize: '0.8rem',
                padding: '7px 14px',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#e2e8f0',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Officer Profile
            </button>
          </div>
        </div>
      </section>

      {/* CHIEF-STYLE ANALYTICS STRIPS (RESPONSIVE GRID FOR DESKTOP / TABLET / MOBILE) */}
      <div
        className="dash-analytics-strips"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
          margin: 0
        }}
      >
        {/* ONE FOCUS CARD: WARD APPLICATIONS (ELEVATED HIERARCHY) */}
        <ChiefStripCard
          title="Ward Applications"
          value={`${analytics.totalApplications.toLocaleString()} Total Applications`}
          statusBadge={`${approvalPct}% Cleared`}
          statusTone="admitted"
          themeTone="cyan"
          isFocus={true}
          pct={approvalPct}
          footInfo={`${analytics.successfulApplications.toLocaleString()} Approved · ${analytics.flaggedApplications.toLocaleString()} In Review`}
          actionText="Open Applications"
          onAction={() => navigate('/helpdesk/applications')}
          hasUpdate={analytics.flaggedApplications > 0}
        />

        {/* SECONDARY HIERARCHY: DOCUMENTS */}
        <ChiefStripCard
          title="Document Pipeline"
          value={`${analytics.completedRegistrations.toLocaleString()} Completed Sets`}
          statusBadge={`${analytics.incompleteStudentRegistrations} Incomplete`}
          statusTone={analytics.incompleteStudentRegistrations > 0 ? 'review' : 'admitted'}
          themeTone="gold"
          pct={docCompletedPct}
          footInfo={`${analytics.incompleteStudentRegistrations} Students · ${analytics.incompleteParentRegistrations} Parents Hanging`}
          actionText="Open Documents"
          onAction={() => navigate('/helpdesk/documents')}
          hasUpdate={analytics.incompleteStudentRegistrations > 0}
        />

        {/* SECONDARY HIERARCHY: MESSAGES */}
        <ChiefStripCard
          title="Inquiries & Messages"
          value={`${analytics.openMessages} Open Tickets`}
          statusBadge="Action Queue"
          statusTone="review"
          themeTone="gold"
          pct={75}
          footInfo="4 Escalations to MCA / Chief Desk"
          actionText="Open Messages"
          onAction={() => navigate('/helpdesk/messages')}
          hasUpdate={analytics.openMessages > 0}
        />

        {/* TERTIARY HIERARCHY: PROFILE / TERMINAL */}
        <ChiefStripCard
          title="Operations Terminal"
          value="Day Shift (08:00 - 17:00)"
          statusBadge="On Duty"
          statusTone="admitted"
          themeTone="gold"
          pct={100}
          footInfo="Assigned: Tendeno & Sorget Locations"
          actionText="Open Profile"
          onAction={() => navigate('/helpdesk/profile')}
        />
      </div>

      {/* STRUCTURED ANALYTICS SECTIONS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {/* Section 1: Processing Telemetry */}
        <section
          className="dash-single-card"
          style={{
            padding: 24,
            background: 'rgba(13, 21, 39, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 14,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 className="stitch-section-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
              Processing Telemetry
            </h3>
            <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
              Triage Health
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ padding: 14, borderRadius: 10, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>Approval Rate</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: 4, fontFamily: 'monospace' }}>{approvalPct}%</div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{analytics.successfulApplications.toLocaleString()} of {analytics.totalApplications.toLocaleString()}</span>
            </div>

            <div style={{ padding: 14, borderRadius: 10, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>Flagged Cases</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b', marginTop: 4, fontFamily: 'monospace' }}>{analytics.flaggedApplications.toLocaleString()}</div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Individual appeal/residency review</span>
            </div>

            <div style={{ padding: 14, borderRadius: 10, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>Incomplete Students</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#eab308', marginTop: 4, fontFamily: 'monospace' }}>{analytics.incompleteStudentRegistrations}</div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Hanging registration steps</span>
            </div>

            <div style={{ padding: 14, borderRadius: 10, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>Incomplete Parents</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#a855f7', marginTop: 4, fontFamily: 'monospace' }}>{analytics.incompleteParentRegistrations}</div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Pending guardian verification</span>
            </div>
          </div>
        </section>

        {/* Section 2: Administrative Jurisdiction & Geographic Breakdown */}
        <section
          className="dash-single-card"
          style={{
            padding: 24,
            background: 'rgba(13, 21, 39, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 14,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 className="stitch-section-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
              Ward Jurisdiction Breakdown
            </h3>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => {
                setModalMetric('total');
                setModalOpen(true);
              }}
              style={{
                padding: '5px 12px',
                fontSize: '0.75rem',
                borderRadius: 6,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                cursor: 'pointer',
                fontWeight: 600
              }}
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
                <div key={loc.location} style={{ padding: 14, borderRadius: 10, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#ffffff' }}>
                      {loc.location} Location
                    </span>
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#22d3ee', fontFamily: 'monospace' }}>
                      {loc.total.toLocaleString()} ({locPct}%)
                    </span>
                  </div>
                  <div className="dash-strip-card__track" style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
                    <div
                      className="dash-strip-card__fill"
                      style={{
                        width: `${locPct}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #0891b2, #22d3ee)',
                        borderRadius: 999,
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.74rem', color: '#94a3b8' }}>
                    <span>{loc.successful} Approved &bull; {loc.flagged} Flagged</span>
                    <span>4 Sub-Locations</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

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
