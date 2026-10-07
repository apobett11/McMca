import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HelpDeskLayout } from '../components/HelpDeskLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { getTimeGreeting } from '../../../utils/greeting.js';
import { SessionHoursModal } from '../components/SessionHoursModal.jsx';
import {
  getHelpDeskProfile,
  calculateHelpDeskMetrics
} from '../utils/helpDeskData.js';

export function HelpDeskDashboardPage() {
  const navigate = useNavigate();
  const greeting = getTimeGreeting();

  const [profile, setProfile] = useState(() => getHelpDeskProfile());
  const [metrics, setMetrics] = useState(() => calculateHelpDeskMetrics());
  const [refreshing, setRefreshing] = useState(false);
  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [visualModal, setVisualModal] = useState(null); // null | 'apps' | 'steps' | 'messages' | 'uploads'
  const [feedbackToast, setFeedbackToast] = useState('');
  const toastTimerRef = useRef(null);

  function triggerToast(msg, duration = 4000) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setFeedbackToast(msg);
    toastTimerRef.current = setTimeout(() => {
      setFeedbackToast('');
    }, duration);
  }

  function reloadData() {
    setRefreshing(true);
    setProfile(getHelpDeskProfile());
    setMetrics(calculateHelpDeskMetrics());
    setTimeout(() => {
      setRefreshing(false);
      triggerToast('Help Desk analytics refreshed successfully.');
    }, 250);
  }

  useEffect(() => {
    function onDataUpdate() {
      setMetrics(calculateHelpDeskMetrics());
    }
    window.addEventListener('mcmca_helpdesk_apps_updated', onDataUpdate);
    window.addEventListener('mcmca_helpdesk_steps_updated', onDataUpdate);
    window.addEventListener('mcmca_helpdesk_messages_updated', onDataUpdate);
    window.addEventListener('mcmca_helpdesk_profile_updated', () => setProfile(getHelpDeskProfile()));

    return () => {
      window.removeEventListener('mcmca_helpdesk_apps_updated', onDataUpdate);
      window.removeEventListener('mcmca_helpdesk_steps_updated', onDataUpdate);
      window.removeEventListener('mcmca_helpdesk_messages_updated', onDataUpdate);
    };
  }, []);

  const officerName = profile?.fullName || 'Clara Chelangat';
  const roleTitle = profile?.roleTitle || 'Help Desk Operations Lead';
  const shift = profile?.shiftUnit || 'Day Shift (08:00 - 17:00)';

  const { applications: appStats, steps: stepStats, messages: msgStats, uploads: uploadStats } = metrics;

  return (
    <HelpDeskLayout
      pageTitle="Help Desk Home"
      layout="dashboard"
      officerName={officerName}
    >
      <div className="stitch-dashboard">
        {/* Floating Success / Status Toast with Cancel Button */}
        {feedbackToast && (
          <div className="hd-toast notice" role="status">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="check" size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
              <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{feedbackToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackToast('')}
              className="hd-toast__close"
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {/* Officer identity hero with top-right sleek refresh icon */}
        <section className="student-hero hd-card" style={{ padding: '20px 24px' }}>
          <div className="student-hero__identity">
            <div className="student-hero__avatar" aria-hidden="true">
              {officerName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="student-hero__copy">
              <h1 className="student-hero__title">{greeting}, {officerName}</h1>
              <p className="student-hero__meta">
                {roleTitle} &bull; {shift} &bull; {profile.officerId}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <div className="student-hero__readiness">
              <div className="student-hero__ring" aria-hidden="true">
                <span>{appStats.passRate}%</span>
              </div>
              <div>
                <p className="student-hero__readiness-label">Pass Ratio</p>
                <p className="student-hero__readiness-desc">
                  {appStats.passed} Passed vs {appStats.failed} Failed ({appStats.ratio} : 1 Ratio)
                </p>
              </div>
            </div>

            {/* Sleek Icon Refresh Button at top right */}
            <button
              type="button"
              onClick={reloadData}
              disabled={refreshing}
              className="btn btn--secondary"
              aria-label="Refresh telemetry data"
              title="Refresh telemetry"
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Icon name="refresh" size={18} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </section>

        {/* Minimalist Dashboard Body (Bulky header removed) */}
        <section className="dash-single-card hd-card" style={{ padding: 0 }}>
          {/* 3 Analytics Strips with Thin Progress Ranges - Homepage exclusive */}
          <div className="dash-analytics-strips" style={{ margin: 0, padding: 16, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            {/* Range 1: Applications Passed vs Failed - Clickable */}
            <div
              className="dash-strip-card dash-strip-card--interactive"
              onClick={() => setVisualModal('apps')}
              title="Click to view full Pass / Fail breakdown telemetry"
            >
              <div className="dash-strip-card__head">
                <div>
                  <span className="dash-strip-card__label" style={{ fontSize: '0.68rem', letterSpacing: '0.06em', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                    Applications Passed vs Failed
                  </span>
                  <h3 className="dash-strip-card__val" style={{ margin: '4px 0 0', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#10b981' }}>{appStats.passed}</span> <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>Passed</span> &bull; <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ef4444' }}>{appStats.failed}</span> <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>Failed</span>
                  </h3>
                </div>
                <span className="stitch-status-badge stitch-status-badge--admitted" style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
                  <strong style={{ fontSize: '1.15rem', fontWeight: 800 }}>{appStats.passRate}%</strong> <span style={{ fontSize: '0.68rem', opacity: 0.85 }}>Pass Rate</span>
                </span>
              </div>
              <div className="dash-strip-card__track" role="progressbar" aria-valuenow={appStats.passRate} aria-valuemin="0" aria-valuemax="100">
                <div
                  className="dash-strip-card__fill dash-strip-card__fill--gold"
                  style={{ width: `${appStats.passRate}%` }}
                />
              </div>
              <div className="dash-strip-card__foot" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                <span>Total Monitored: <strong style={{ color: '#fff', fontSize: '0.86rem' }}>{appStats.total}</strong> Applications</span>
                <span>Ratio: <strong style={{ color: 'var(--gold-champagne, #ddbb6a)', fontSize: '0.86rem' }}>{appStats.ratio} : 1</strong></span>
              </div>
            </div>

            {/* Range 2: Registration Steps Completion & Hanging Steps - Clickable */}
            <div
              className="dash-strip-card dash-strip-card--interactive"
              onClick={() => setVisualModal('steps')}
              title="Click to view Registration Step Progress breakdown"
            >
              <div className="dash-strip-card__head">
                <div>
                  <span className="dash-strip-card__label" style={{ fontSize: '0.68rem', letterSpacing: '0.06em', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                    Applicant Step Progress
                  </span>
                  <h3 className="dash-strip-card__val" style={{ margin: '4px 0 0', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#10b981' }}>{stepStats.completed}</span> <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>Finished</span> &bull; <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f59e0b' }}>{stepStats.incomplete}</span> <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>Hanging</span>
                  </h3>
                </div>
                <span className={`stitch-status-badge ${stepStats.incomplete > 0 ? 'stitch-status-badge--review' : 'stitch-status-badge--admitted'}`} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
                  <strong style={{ fontSize: '1.15rem', fontWeight: 800 }}>{stepStats.completionRate}%</strong> <span style={{ fontSize: '0.68rem', opacity: 0.85 }}>Fully Filed</span>
                </span>
              </div>
              <div className="dash-strip-card__track" role="progressbar" aria-valuenow={stepStats.completionRate} aria-valuemin="0" aria-valuemax="100">
                <div
                  className="dash-strip-card__fill dash-strip-card__fill--green"
                  style={{ width: `${stepStats.completionRate}%` }}
                />
              </div>
              <div className="dash-strip-card__foot" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                <span><strong style={{ color: '#fff', fontSize: '0.86rem' }}>{stepStats.incomplete}</strong> applicants left steps incomplete</span>
                <span><strong style={{ color: '#fff', fontSize: '0.86rem' }}>{stepStats.total}</strong> Total Records</span>
              </div>
            </div>

            {/* Range 3: Omni-Desk Messages & Reply Rate - Clickable */}
            <div
              className="dash-strip-card dash-strip-card--interactive"
              onClick={() => setVisualModal('messages')}
              title="Click to view Omni-Desk Communications breakdown"
            >
              <div className="dash-strip-card__head">
                <div>
                  <span className="dash-strip-card__label" style={{ fontSize: '0.68rem', letterSpacing: '0.06em', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                    Messages &amp; Reply Rate
                  </span>
                  <h3 className="dash-strip-card__val" style={{ margin: '4px 0 0', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#10b981' }}>{msgStats.overall.replied}</span> <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>Replied</span> &bull; <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f59e0b' }}>{msgStats.overall.pending}</span> <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>Pending</span>
                  </h3>
                </div>
                <span className="stitch-status-badge stitch-status-badge--review" style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
                  <strong style={{ fontSize: '1.15rem', fontWeight: 800 }}>{msgStats.overall.rate}%</strong> <span style={{ fontSize: '0.68rem', opacity: 0.85 }}>Replied</span>
                </span>
              </div>
              <div className="dash-strip-card__track" role="progressbar" aria-valuenow={msgStats.overall.rate} aria-valuemin="0" aria-valuemax="100">
                <div
                  className="dash-strip-card__fill dash-strip-card__fill--gold"
                  style={{ width: `${msgStats.overall.rate}%` }}
                />
              </div>
              <div className="dash-strip-card__foot" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                <span>MCA: <strong style={{ color: '#fff', fontSize: '0.86rem' }}>{msgStats.mca.rate}%</strong> &bull; Desk: <strong style={{ color: '#fff', fontSize: '0.86rem' }}>{msgStats.helpdesk.rate}%</strong></span>
                <span>Total: <strong style={{ color: '#fff', fontSize: '0.86rem' }}>{msgStats.overall.total}</strong> Messages</span>
              </div>
            </div>
          </div>

          {/* Chief-inspired Minimalist Analytics Sections */}
          <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {/* Section 1: Processing Telemetry (2x2 grid of compact metric tiles) */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 className="stitch-section-title" style={{ margin: 0, fontSize: '1.05rem' }}>
                  Processing Telemetry
                </h3>
                <span className="badge badge--neutral">Live Overview</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div
                  onClick={() => setVisualModal('apps')}
                  className="hd-card--interactive"
                  style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', cursor: 'pointer' }}
                  title="Click to view full Pass / Fail breakdown telemetry"
                >
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Pass Rate</span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#10b981', marginTop: 3 }}>{appStats.passRate}%</div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{appStats.passed} of {appStats.total} approved</span>
                </div>

                <div
                  onClick={() => setVisualModal('steps')}
                  className="hd-card--interactive"
                  style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', cursor: 'pointer' }}
                  title="Click to view Registration Step Progress breakdown"
                >
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Hanging Steps</span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, color: stepStats.incomplete > 0 ? '#f59e0b' : '#10b981', marginTop: 3 }}>
                    {stepStats.incomplete}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{stepStats.completionRate}% fully filed</span>
                </div>

                <div
                  onClick={() => setVisualModal('uploads')}
                  className="hd-card--interactive"
                  style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', cursor: 'pointer' }}
                  title="Click to view Document Upload Errors breakdown"
                >
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Upload Errors</span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, color: uploadStats.totalFailed > 0 ? '#ef4444' : '#10b981', marginTop: 3 }}>
                    {uploadStats.totalFailed}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Flagged documents</span>
                </div>

                <div
                  onClick={() => setVisualModal('messages')}
                  className="hd-card--interactive"
                  style={{ padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', cursor: 'pointer' }}
                  title="Click to view Communications & Reply Rate breakdown"
                >
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Reply Rate</span>
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--gold-champagne, #ddbb6a)', marginTop: 3 }}>
                    {msgStats.overall.rate}%
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{msgStats.overall.replied} of {msgStats.overall.total} replied</span>
                </div>
              </div>
            </div>

            {/* Section 2: Pre-determined Location Distribution */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 className="stitch-section-title" style={{ margin: 0, fontSize: '1.05rem' }}>
                  Location Distribution
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{appStats.locationBreakdown?.length || 4} Localities</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(appStats.locationBreakdown || []).map((loc) => (
                  <div key={loc.location}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                      <span style={{ fontWeight: 500, color: 'var(--text)' }}>{loc.location}</span>
                      <span style={{ color: '#94a3b8' }}>{loc.passed} passed &bull; {loc.failed} failed ({loc.passRate}%)</span>
                    </div>
                    <div style={{ width: '100%', height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{ width: `${loc.passRate}%`, height: '100%', borderRadius: 4, background: 'var(--gold-champagne, #ddbb6a)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Quick Action Workflows (Chief-inspired 4 compact action links) */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 className="stitch-section-title" style={{ margin: 0, fontSize: '1.05rem' }}>
                  Help Desk Workflows
                </h3>
                <span className="badge badge--neutral">4 Modules</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                <Link
                  to="/helpdesk/documents"
                  className="btn btn--secondary"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    padding: '12px 8px',
                    textAlign: 'center',
                    borderRadius: 10
                  }}
                >
                  <Icon name="documents" size={22} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Documents</span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{stepStats.incomplete} Hanging</span>
                </Link>

                <Link
                  to="/helpdesk/applications"
                  className="btn btn--secondary"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    padding: '12px 8px',
                    textAlign: 'center',
                    borderRadius: 10
                  }}
                >
                  <Icon name="applications" size={22} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Applications</span>
                  <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>{appStats.failed} In Queue</span>
                </Link>

                <Link
                  to="/helpdesk/messages"
                  className="btn btn--secondary"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    padding: '12px 8px',
                    textAlign: 'center',
                    borderRadius: 10
                  }}
                >
                  <Icon name="support" size={22} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Messages</span>
                  <span style={{ fontSize: '0.7rem', color: '#f59e0b' }}>{msgStats.overall.pending} Pending</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setSessionModalOpen(true)}
                  className="btn btn--secondary"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    padding: '12px 8px',
                    textAlign: 'center',
                    borderRadius: 10,
                    cursor: 'pointer'
                  }}
                  title="View Operator Session Hours & Shift Analytics"
                >
                  <Icon name="clock" size={22} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Profile / Hours</span>
                  <span style={{ fontSize: '0.7rem', color: '#10b981' }}>{shift}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Location Summary Footer Bar */}
          <div className="dash-apps-footer-note">
            <span>
              <strong>Pre-determined Locations:</strong> Tendeno &bull; Sorget &bull; Parklands &bull; Westlands
            </span>
            <span>
              Realtime Disabled &bull; Transparent Local Persistence
            </span>
          </div>
        </section>

        {/* Visual Cards Detail Modal */}
        {visualModal && (
          <div className="modal-root" role="presentation">
            <button
              type="button"
              className="modal-root__backdrop"
              onClick={() => setVisualModal(null)}
              aria-label="Close modal backdrop"
            />
            <div
              className="modal-panel hd-card"
              role="dialog"
              aria-modal="true"
              style={{
                maxWidth: 540,
                background: '#070d18',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: 14,
                padding: '24px'
              }}
            >
              <header
                className="modal-panel__header"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingBottom: 12,
                  marginBottom: 16
                }}
              >
                <h2 className="modal-panel__title" style={{ margin: 0, color: '#fff', fontSize: '1.15rem' }}>
                  {visualModal === 'apps' && 'Applications Pass / Fail Telemetry'}
                  {visualModal === 'steps' && 'Applicant Registration Steps Telemetry'}
                  {visualModal === 'messages' && 'Communications & Reply Rate Telemetry'}
                  {visualModal === 'uploads' && 'Document Upload Errors Telemetry'}
                </h2>
                <button
                  type="button"
                  className="modal-panel__close"
                  onClick={() => setVisualModal(null)}
                  aria-label="Close dialog"
                >
                  ×
                </button>
              </header>

              {/* Modal Body */}
              {visualModal === 'apps' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div style={{ background: '#0b1422', padding: 12, borderRadius: 8, textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Approved</span>
                      <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#10b981' }}>{appStats.passed}</div>
                    </div>
                    <div style={{ background: '#0b1422', padding: 12, borderRadius: 8, textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Rejected</span>
                      <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ef4444' }}>{appStats.failed}</div>
                    </div>
                    <div style={{ background: '#0b1422', padding: 12, borderRadius: 8, textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Pass Ratio</span>
                      <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--gold-champagne, #ddbb6a)' }}>{appStats.ratio} : 1</div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>
                      Location Distribution:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {appStats.locationBreakdown?.map(l => (
                        <div key={l.location} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#cbd5e1', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                          <span>{l.location}</span>
                          <span><strong style={{ color: '#10b981' }}>{l.passed} Passed</strong> &bull; <strong style={{ color: '#ef4444' }}>{l.failed} Failed</strong> ({l.total} Total)</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                    <Link to="/helpdesk/applications?table=assessment" className="btn btn--primary" style={{ fontSize: '0.84rem' }}>
                      <Icon name="applications" size={16} />
                      Open Rejected Applications Queue
                    </Link>
                  </div>
                </div>
              )}

              {visualModal === 'steps' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ background: '#0b1422', padding: 14, borderRadius: 8, textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Fully Completed</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981' }}>{stepStats.completed}</div>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>All 5 Steps Filed</span>
                    </div>
                    <div style={{ background: '#0b1422', padding: 14, borderRadius: 8, textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Hanging Incomplete</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b' }}>{stepStats.incomplete}</div>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Targetable for Reminders</span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.5 }}>
                    Applicants with hanging registration steps have saved drafts but not finished declaration. Help Desk can dispatch batch SMS reminders to accelerate submissions.
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                    <Link to="/helpdesk/documents?table=steps" className="btn btn--primary" style={{ fontSize: '0.84rem' }}>
                      <Icon name="documents" size={16} />
                      Open Step Progress Table
                    </Link>
                  </div>
                </div>
              )}

              {visualModal === 'messages' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div style={{ background: '#0b1422', padding: 12, borderRadius: 8, textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Total Messages</span>
                      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>{msgStats.overall.total}</div>
                    </div>
                    <div style={{ background: '#0b1422', padding: 12, borderRadius: 8, textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Replied Sent</span>
                      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#10b981' }}>{msgStats.overall.replied}</div>
                    </div>
                    <div style={{ background: '#0b1422', padding: 12, borderRadius: 8, textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Reply Rate</span>
                      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--gold-champagne, #ddbb6a)' }}>{msgStats.overall.rate}%</div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                    To MCA: <strong>{msgStats.mca.rate}%</strong> &bull; To Help Desk: <strong>{msgStats.helpdesk.rate}%</strong> &bull; Area Chiefs: <strong>{msgStats.chief.rate}%</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                    <Link to="/helpdesk/messages?table=desk" className="btn btn--primary" style={{ fontSize: '0.84rem' }}>
                      <Icon name="support" size={16} />
                      Open Messages Management Desk
                    </Link>
                  </div>
                </div>
              )}

              {visualModal === 'uploads' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: '#0b1422', padding: 14, borderRadius: 8, textAlign: 'center', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <span style={{ fontSize: '0.75rem', color: '#f87171' }}>Failed / Flagged Uploads</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{uploadStats.totalFailed}</div>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Requires re-upload or bursar verification</span>
                  </div>

                  <div style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
                    Review document errors such as unreadable OCR, missing official rubber stamps, or invalid fee voucher structures.
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                    <Link to="/helpdesk/documents?table=failed_uploads" className="btn btn--primary" style={{ fontSize: '0.84rem' }}>
                      <Icon name="alert" size={16} />
                      Open Failed Uploads Table
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Session Hours & Shift Analytics Popup */}
        <SessionHoursModal
          isOpen={sessionModalOpen}
          onClose={() => setSessionModalOpen(false)}
        />
      </div>
    </HelpDeskLayout>
  );
}
