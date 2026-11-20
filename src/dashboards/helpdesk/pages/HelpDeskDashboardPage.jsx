import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HelpDeskLayout } from '../components/HelpDeskLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { getTimeGreeting } from '../../../utils/greeting.js';
import { SessionHoursModal } from '../components/SessionHoursModal.jsx';
import { StitchRadialDial } from '../../../components/StitchRadialDial.jsx';
import {
  getHelpDeskProfile,
  calculateHelpDeskMetrics,
  syncHelpDeskApplicationsFromDB
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

  async function reloadData() {
    setRefreshing(true);
    await syncHelpDeskApplicationsFromDB();
    setProfile(getHelpDeskProfile());
    setMetrics(calculateHelpDeskMetrics());
    setRefreshing(false);
    triggerToast('Help Desk analytics refreshed with database registry.');
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

        {/* 1. Google Stitch Help Desk Command Hero */}
        <section className="helpdesk-command-hero">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #10B981, #06B6D4)',
                  padding: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.25)',
                  flexShrink: 0
                }}
              >
                <div style={{ width: '100%', height: '100%', background: '#070C16', borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.15rem', color: '#10B981' }}>
                  {officerName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 700, color: '#F8FAFC' }}>
                  {greeting}, {officerName}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 4, fontSize: '0.82rem', color: '#94A3B8' }}>
                  <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '3px 10px', borderRadius: 999, fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>
                    Triage Operations Lead
                  </span>
                  <span>•</span>
                  <span>{shift}</span>
                  <span>•</span>
                  <span>{profile.officerId}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={reloadData}
                disabled={refreshing}
                className="btn btn--secondary"
                aria-label="Refresh telemetry data"
                title="Refresh telemetry"
                style={{
                  width: 40,
                  height: 40,
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

              <button
                type="button"
                className="btn btn--outline btn--compact"
                onClick={() => setSessionModalOpen(true)}
                style={{ borderRadius: 999 }}
              >
                <Icon name="clock" size={16} />
                <span>Shift Hours</span>
              </button>

              <Link
                to="/helpdesk/applications?table=assessment"
                className="btn btn--primary btn--compact"
                style={{ borderRadius: 999, background: '#10B981', borderColor: '#10B981', color: '#051A10', fontWeight: 700 }}
              >
                <Icon name="applications" size={16} />
                <span>Rejected Queue ({appStats.failed})</span>
              </Link>
            </div>
          </div>

          {/* Interactive Google Stitch Telemetry Dial Dock (Clickable Radial Micro-Modals) */}
          <div className="stitch-dial-dock" style={{ marginTop: 20 }}>
            <StitchRadialDial
              percentage={appStats.passRate}
              size={84}
              strokeWidth={7}
              color="#10B981"
              label="Intake Pass Rate"
              sublabel={`${appStats.passed} Approved · ${appStats.failed} Rejected`}
              interactive={true}
              onClick={() => setVisualModal('apps')}
            />

            <StitchRadialDial
              percentage={stepStats.completionRate}
              size={84}
              strokeWidth={7}
              color="#F59E0B"
              label="Hanging Drafts"
              sublabel={`${stepStats.incomplete} Incomplete Steps`}
              interactive={true}
              onClick={() => setVisualModal('steps')}
            />

            <StitchRadialDial
              percentage={msgStats.overall.rate}
              size={84}
              strokeWidth={7}
              color="#00F0FF"
              label="Inquiries Velocity"
              sublabel={`${msgStats.overall.replied} of ${msgStats.overall.total} Replied`}
              interactive={true}
              onClick={() => setVisualModal('messages')}
            />

            <StitchRadialDial
              percentage={uploadStats.totalFailed > 0 ? Math.max(10, 100 - uploadStats.totalFailed * 15) : 100}
              size={84}
              strokeWidth={7}
              color={uploadStats.totalFailed > 0 ? '#EF4444' : '#10B981'}
              label="Document Health"
              sublabel={uploadStats.totalFailed > 0 ? `${uploadStats.totalFailed} Flagged Uploads` : 'Zero Discrepancies'}
              interactive={true}
              onClick={() => setVisualModal('uploads')}
            />
          </div>
        </section>

        {/* 2. Google Stitch Operational Workstation Split */}
        <div className="helpdesk-stage-grid">
          {/* Left Column: Location Intake & Document Discrepancies */}
          <div>
            {/* Location Vetting Distribution */}
            <section className="hd-card" style={{ padding: 24, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <h3 className="stitch-section-title" style={{ margin: 0, fontSize: '1.15rem', color: '#F8FAFC' }}>
                    Ward Locality Vetting Distribution
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#94A3B8' }}>
                    {appStats.locationBreakdown?.length || 4} Localities monitored across Tendeno / Sorget Ward
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {(appStats.locationBreakdown || []).map((loc) => (
                  <div key={loc.location}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, color: '#F8FAFC' }}>{loc.location}</span>
                      <span style={{ color: '#94A3B8' }}>
                        <strong style={{ color: '#10B981' }}>{loc.passed} Passed</strong> • <strong style={{ color: '#EF4444' }}>{loc.failed} Failed</strong> ({loc.passRate}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 6, borderRadius: 999, background: 'rgba(255, 255, 255, 0.06)', overflow: 'hidden' }}>
                      <div style={{ width: `${loc.passRate}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #10B981, #06B6D4)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Document Errors & Upload Flagging Review */}
            <section className="hd-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <h3 className="stitch-section-title" style={{ margin: 0, fontSize: '1.15rem', color: '#F8FAFC' }}>
                    Document Upload Discrepancies
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#94A3B8' }}>
                    Flagged submissions requiring applicant verification or re-upload
                  </p>
                </div>
                <Link to="/helpdesk/documents?table=failed_uploads" className="btn btn--outline btn--compact" style={{ borderRadius: 999 }}>
                  Inspect ({uploadStats.totalFailed}) →
                </Link>
              </div>

              {uploadStats.totalFailed > 0 ? (
                <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderLeft: '4px solid #EF4444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '0.88rem', color: '#F8FAFC' }}>{uploadStats.totalFailed} Document Upload Errors Detected</strong>
                    <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#F87171' }}>
                      Unreadable OCR, missing institutional rubber stamps, or corrupted fee vouchers.
                    </p>
                  </div>
                  <Link to="/helpdesk/documents?table=failed_uploads" className="btn btn--table" style={{ fontSize: '0.78rem', padding: '6px 12px' }}>
                    Triage Now
                  </Link>
                </div>
              ) : (
                <div style={{ padding: '20px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '0.88rem' }}>
                  <span style={{ color: '#10B981', fontWeight: 600 }}>✓ Zero flagged upload errors</span> detected in current shift.
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Processing Telemetry & Workflow Access Hub */}
          <div>
            {/* Processing Telemetry */}
            <section className="hd-card" style={{ padding: 24, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <h3 className="stitch-section-title" style={{ margin: 0, fontSize: '1.15rem', color: '#F8FAFC' }}>
                    Processing Telemetry
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#94A3B8' }}>
                    Live shift throughput and operator metrics
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div
                  onClick={() => setVisualModal('apps')}
                  className="hd-metric-tile hd-card--interactive"
                  style={{ cursor: 'pointer' }}
                  title="Click to view Pass / Fail telemetry"
                >
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Pass Ratio</span>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10B981', marginTop: 4 }}>{appStats.ratio} : 1</div>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{appStats.passRate}% Approval Rate</span>
                </div>

                <div
                  onClick={() => setVisualModal('steps')}
                  className="hd-metric-tile hd-card--interactive"
                  style={{ cursor: 'pointer' }}
                  title="Click to view Registration Step Progress"
                >
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Hanging Steps</span>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, color: stepStats.incomplete > 0 ? '#F59E0B' : '#10B981', marginTop: 4 }}>
                    {stepStats.incomplete}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{stepStats.completionRate}% fully filed</span>
                </div>

                <div
                  onClick={() => setVisualModal('messages')}
                  className="hd-metric-tile hd-card--interactive"
                  style={{ cursor: 'pointer' }}
                  title="Click to view Communications Telemetry"
                >
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Avg Turnaround</span>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#F8FAFC', marginTop: 4 }}>1.2 Hrs</div>
                  <span style={{ fontSize: '0.72rem', color: '#10B981' }}>Well within SLA</span>
                </div>

                <div
                  onClick={() => setVisualModal('messages')}
                  className="hd-metric-tile hd-card--interactive"
                  style={{ cursor: 'pointer' }}
                  title="Click to view Communications Telemetry"
                >
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Open Inquiries</span>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, color: msgStats.overall.pending > 0 ? '#F59E0B' : '#10B981', marginTop: 4 }}>
                    {msgStats.overall.pending}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{msgStats.overall.rate}% Replied</span>
                </div>
              </div>
            </section>

            {/* Direct Triage Workflows Hub */}
            <section className="hd-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <h3 className="stitch-section-title" style={{ margin: 0, fontSize: '1.15rem', color: '#F8FAFC' }}>
                    Triage Workflows
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#94A3B8' }}>
                    Immediate access to bursary registers and support channels
                  </p>
                </div>
              </div>

              <div className="helpdesk-action-tiles">
                <Link to="/helpdesk/documents" className="helpdesk-action-tile">
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="documents" size={24} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#F8FAFC' }}>Documents</span>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{stepStats.incomplete} Hanging steps</span>
                </Link>

                <Link to="/helpdesk/applications" className="helpdesk-action-tile">
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="applications" size={24} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#F8FAFC' }}>Applications</span>
                  <span style={{ fontSize: '0.72rem', color: '#EF4444' }}>{appStats.failed} Rejected queue</span>
                </Link>

                <Link to="/helpdesk/messages" className="helpdesk-action-tile">
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="support" size={24} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#F8FAFC' }}>Messages</span>
                  <span style={{ fontSize: '0.72rem', color: '#F59E0B' }}>{msgStats.overall.pending} Pending</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setSessionModalOpen(true)}
                  className="helpdesk-action-tile"
                  style={{ width: '100%', cursor: 'pointer', font: 'inherit' }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(6, 182, 212, 0.12)', color: '#06B6D4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="clock" size={24} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#F8FAFC' }}>Shift Hours</span>
                  <span style={{ fontSize: '0.72rem', color: '#10B981' }}>Shift analytics</span>
                </button>
              </div>
            </section>
          </div>
        </div>

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
              className="modal-panel hd-card stitch-glass-surface"
              role="dialog"
              aria-modal="true"
              style={{
                maxWidth: 540,
                background: 'rgba(13, 27, 54, 0.88)',
                backdropFilter: 'blur(32px) saturate(200%)',
                WebkitBackdropFilter: 'blur(32px) saturate(200%)',
                border: '1.5px solid rgba(255, 255, 255, 0.16)',
                borderTop: '1.5px solid rgba(0, 240, 255, 0.4)',
                boxShadow: '0 24px 60px -8px rgba(0, 5, 20, 0.85), 0 0 30px rgba(0, 240, 255, 0.12)',
                borderRadius: 18,
                padding: '26px'
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
                  className="modal-panel__close hd-close-icon-btn"
                  onClick={() => setVisualModal(null)}
                  aria-label="Close dialog"
                  title="Close"
                >
                  ✕
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
