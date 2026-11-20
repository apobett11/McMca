import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StudentLayout } from '../components/StudentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { RefreshButton } from '../../../components/RefreshButton.jsx';
import { useAuth } from '../../../context/AuthContext';
import { useCachedQuery } from '../../../lib/useCachedQuery';
import { loadStudentRecord, studentRecordKey } from '../../../lib/portalData';
import { DASHBOARD_STUDENT_STEPS } from '../../../lib/accountAllocation/wizardFlows';
import { getTimeGreeting } from '../../../utils/greeting.js';
import { applicationSerial, cycleTitle, formatMoney } from '../../../lib/household.js';
import { EDUCATION_LEVEL_LABEL } from '../../../lib/accountAllocation/constants.js';
import { getStatusConfig } from '../../../utils/statusConfig.js';
import { activeBursaryWindow } from '../../../lib/accountQueries';

function preparednessCopy(done, total) {
  if (!total || done <= 0) return 'Start your details to build a bursary record.';
  if (done >= total) return 'Every form step is on file.';
  if (done < total / 2) return 'Several steps still need your attention.';
  return 'Most steps are done. Finish the rest to apply.';
}

function statusClass(status) {
  const map = {
    submitted: 'stitch-status-badge--review',
    under_review: 'stitch-status-badge--review',
    chief_approved: 'stitch-status-badge--admitted',
    approved: 'stitch-status-badge--admitted',
    funds_sent: 'stitch-status-badge--admitted',
    disbursed: 'stitch-status-badge--admitted',
    rejected: 'stitch-status-badge--declined',
    appealed: 'stitch-status-badge--review',
    draft: 'stitch-status-badge--withdrawn'
  };
  return map[String(status || '').toLowerCase()] || 'stitch-status-badge--withdrawn';
}

function levelLabel(value) {
  if (!value) return '—';
  return EDUCATION_LEVEL_LABEL[value] || value;
}

export function StudentDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const greeting = getTimeGreeting();
  const { data, loading, refreshing, error, refresh } = useCachedQuery(
    user?.id ? studentRecordKey(user.id) : null,
    () => loadStudentRecord(user.id),
    { enabled: Boolean(user?.id) }
  );

  const [extraCompleted, setExtraCompleted] = useState([]);
  useEffect(() => {
    function onStepCompleted(e) {
      if (e.detail?.completedKeys) {
        setExtraCompleted(e.detail.completedKeys);
      }
    }
    function onAppsUpdated() {
      refresh();
    }
    window.addEventListener('mcmca_registration_step_completed', onStepCompleted);
    window.addEventListener('mcmca_apps_updated', onAppsUpdated);
    return () => {
      window.removeEventListener('mcmca_registration_step_completed', onStepCompleted);
      window.removeEventListener('mcmca_apps_updated', onAppsUpdated);
    };
  }, [refresh]);

  // Merge session profile with DB profile
  const sessionProfile = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('wizard_data_dashboard_student') || '{}');
    } catch {
      return {};
    }
  })();
  const profile = { ...(data?.registration?.profile || {}), ...sessionProfile };

  // Merge session completed keys with DB completed keys, localStorage, and pre-checked personal info
  const sessionCompleted = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('wizard_completed_dashboard_student') || '[]');
    } catch {
      return [];
    }
  })();
  const localCompleted = (() => {
    try {
      if (user?.id && (localStorage.getItem(`mcmca_student_documents_completed_${user.id}`) === 'true' || localStorage.getItem('mcmca_student_documents_completed') === 'true')) {
        return DASHBOARD_STUDENT_STEPS.map((s) => s.key);
      }
      return JSON.parse(localStorage.getItem('wizard_completed_dashboard_student') || '[]');
    } catch {
      return [];
    }
  })();
  const dbCompleted = data?.registration?.completedKeys || [];
  const completedKeys = Array.from(new Set([...dbCompleted, ...sessionCompleted, ...localCompleted, ...extraCompleted, 'personal_information']));

  // Merge submitted applications (from storage) with session and DB applications
  const sessionApps = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('mcmca_session_applications') || '[]');
    } catch {
      return [];
    }
  })();
  const localApps = (() => {
    try {
      const list = JSON.parse(localStorage.getItem('mcmca_submitted_applications') || '[]');
      return list.map(a => ({
        ...a,
        id: a.id || a.serial,
        institution_name: a.school || a.institution_name,
        institution_level: a.educationLevel || a.institution_level,
        application_status: a.application_status || (a.status === 'allocated' || a.status === 'Allocated' ? 'approved' : a.chief_recommended ? 'chief_approved' : 'submitted'),
        allocated_amount: a.allocatedAmount || a.allocated_amount,
        requested_amount: a.amountRequested || a.requested_amount,
        fee_balance: a.feeBalance || a.fee_balance,
        created_at: a.submittedDate || a.submitted_at || a.created_at
      }));
    } catch {
      return [];
    }
  })();
  const dbApps = data?.applications || [];
  const mergedApps = [...sessionApps, ...localApps, ...dbApps];
  const apps = Array.from(new Map(mergedApps.map((item) => [item.id, item])).values());
  const sortedApps = [...apps].sort(
    (a, b) => new Date(b.submitted_at || b.created_at || b.submittedDate || 0) - new Date(a.submitted_at || a.created_at || a.submittedDate || 0)
  );

  const windows = data?.windows || [];
  const cycleGate = activeBursaryWindow(windows);
  const activeCycle = cycleGate.window;
  const cycleName = activeCycle ? cycleTitle({ application_window_id: activeCycle.id }, windows) : '';
  const hasAppliedThisCycle = Boolean(
    activeCycle && apps.some((app) => app.application_window_id === activeCycle.id)
  );

  const showSkeleton = loading && !data;
  const steps = DASHBOARD_STUDENT_STEPS;
  const isDocumentsDone = completedKeys.length >= steps.length || apps.length > 0;
  const doneCount = isDocumentsDone ? steps.length : steps.filter((step) => completedKeys.includes(step.key)).length;
  const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;
  const studentName = [profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean).join(' ')
    || user?.user_metadata?.full_name
    || 'Student';
  const complete = isDocumentsDone || (doneCount === steps.length && steps.length > 0);

  const appStripPct = hasAppliedThisCycle || apps.length > 0 ? 100 : 0;

  // Calculate current bursary lifecycle milestone (0 to 4)
  const latestApp = sortedApps[0];
  const rawStatus = String(latestApp?.application_status || latestApp?.status || '').toLowerCase();
  
  let currentMilestone = 0; // 0: Profile Draft
  if (sortedApps.length > 0) {
    if (['funds_sent', 'disbursed'].includes(rawStatus)) {
      currentMilestone = 4; // Funds Sent
    } else if (['approved'].includes(rawStatus)) {
      currentMilestone = 3; // Committee Approved
    } else if (['chief_approved', 'under_review'].includes(rawStatus)) {
      currentMilestone = 2; // Chief Vetted
    } else {
      currentMilestone = 1; // Submitted
    }
  }

  const MILESTONES = [
    { label: 'Profile Ready', num: 1 },
    { label: 'Submitted', num: 2 },
    { label: 'Chief Vetted', num: 3 },
    { label: 'Committee Review', num: 4 },
    { label: 'Funds Disbursed', num: 5 }
  ];

  useEffect(() => {
    function onAppUpdated() {
      refresh();
    }
    window.addEventListener('mcmca_apps_updated', onAppUpdated);
    return () => window.removeEventListener('mcmca_apps_updated', onAppUpdated);
  }, [refresh]);

  return (
    <StudentLayout pageTitle="Student Mission Control" layout="dashboard" studentName={profile ? studentName : ''}>
      <div className="stitch-dashboard">
        {/* ========================================================
            1. DOMINANT STATUS HERO (MISSION CONTROL ANCHOR)
            ======================================================== */}
        <section className="student-status-hero">
          <div className="student-status-hero__top">
            <div className="student-identity-cluster">
              <div className="student-avatar-ring">
                <div className="student-avatar-inner">
                  {studentName.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2)}
                </div>
              </div>
              <div className="student-identity-text">
                <h1>{greeting}, {studentName}</h1>
                <div className="student-identity-meta">
                  <span className="school-name">{profile?.school_name || 'Independent Student Portal'}</span>
                  <span>•</span>
                  <span>{activeCycle ? cycleName : '2026/2027 Bursary Cycle'}</span>
                </div>
              </div>
            </div>

            <div className="student-readiness-pill">
              <div className="student-readiness-meter">
                {showSkeleton ? '…' : `${pct}%`}
              </div>
              <div className="student-readiness-desc">
                <span className="title">Preparedness</span>
                <span className="subtitle">{showSkeleton ? 'Loading…' : preparednessCopy(doneCount, steps.length)}</span>
              </div>
            </div>
          </div>

          {/* 5-Step Connected Milestone Stepper */}
          <div className="student-stepper-wrap">
            <div className="student-stepper" role="progressbar" aria-label="Bursary application milestones">
              {MILESTONES.map((m, idx) => {
                const isPast = idx < currentMilestone;
                const isCurrent = idx === currentMilestone;
                return (
                  <div
                    key={m.label}
                    className={`student-stepper__node ${isPast ? 'is-complete' : isCurrent ? 'is-active' : ''}`}
                  >
                    <div className="student-stepper__circle">
                      {isPast ? <Icon name="check" size={14} /> : <span>{idx + 1}</span>}
                    </div>
                    <span className="student-stepper__label">{m.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Callout Row */}
          <div className="student-status-hero__action-bar">
            <div className="student-status-hero__status-text">
              <span className={`student-status-pill ${
                rawStatus === 'approved' || rawStatus === 'disbursed'
                  ? 'student-status-pill--admitted'
                  : rawStatus === 'rejected'
                    ? 'student-status-pill--declined'
                    : sortedApps.length > 0
                      ? 'student-status-pill--review'
                      : 'student-status-pill--neutral'
              }`}>
                {sortedApps.length > 0 ? getStatusConfig(rawStatus).label : complete ? 'Eligible to Apply' : 'Profile Incomplete'}
              </span>
              <span className="student-status-note">
                {sortedApps.length > 0
                  ? `Application ${applicationSerial(latestApp)}: Review in progress by Ward Bursary Committee.`
                  : complete
                    ? 'All steps completed. Submit your application for the open cycle.'
                    : `Please complete the remaining ${steps.length - doneCount} steps to unlock funding.`}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <RefreshButton onClick={refresh} busy={refreshing} />
              {complete && !hasAppliedThisCycle ? (
                <button
                  type="button"
                  className="btn-student-cta"
                  onClick={() => navigate('/student/forms?apply=1')}
                >
                  <Icon name="applications" size={18} />
                  <span>Apply for Bursary</span>
                </button>
              ) : hasAppliedThisCycle ? (
                <Link className="btn-student-cta" to="/student/applications">
                  <Icon name="applications" size={18} />
                  <span>View Active Application</span>
                </Link>
              ) : (
                <Link
                  className="btn-student-cta"
                  to="/student/documents"
                  state={{ continueRegistration: true }}
                >
                  <Icon name="chevronRight" size={18} />
                  <span>Finish Registration ({steps.length - doneCount} left)</span>
                </Link>
              )}
            </div>
          </div>
        </section>

        {error ? (
          <div className="notice" role="alert" style={{ marginBottom: 20 }}>
            <strong>Could not load record</strong>
            <p>{error}</p>
          </div>
        ) : null}

        {/* ========================================================
            2. TWO-COLUMN INTEGRATED WORKSPACE STAGE (60% / 40%)
            ======================================================== */}
        <div className="student-grid">
          {/* LEFT COLUMN: ACTIVE APPLICATION & HISTORY LEDGER */}
          <div className="student-col">
            {/* Active Application Dossier Panel */}
            <div className="student-card-panel">
              <div className="student-panel-head">
                <div>
                  <h2 className="student-panel-title">Active Cycle Application</h2>
                  <p className="student-panel-sub">
                    {activeCycle ? cycleName : '2026/2027 Ward Allocation Cycle'}
                  </p>
                </div>
                {sortedApps.length > 0 && (
                  <Link
                    to="/student/applications"
                    style={{ fontSize: '0.8rem', color: 'var(--stu-accent-cyan)', fontWeight: 600, textDecoration: 'none' }}
                  >
                    View Full Details →
                  </Link>
                )}
              </div>

              {showSkeleton ? (
                <div className="skeleton-wrap" style={{ padding: 16 }}>
                  <div className="skeleton skeleton--hero" />
                </div>
              ) : latestApp ? (
                <div className="student-app-dossier">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--stu-text-muted)', fontWeight: 700 }}>
                        Institution
                      </span>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--stu-text-primary)' }}>
                        {latestApp.institution_name || latestApp.school || 'Educational Institution'}
                      </div>
                    </div>
                    <span className={`student-status-pill ${
                      rawStatus === 'approved' ? 'student-status-pill--admitted' : 'student-status-pill--review'
                    }`}>
                      {getStatusConfig(rawStatus).label}
                    </span>
                  </div>

                  <div className="student-dossier-grid">
                    <div className="student-dossier-item">
                      <span className="student-dossier-lbl">Tracking Code</span>
                      <span className="student-dossier-val student-dossier-val--accent">
                        {applicationSerial(latestApp)}
                      </span>
                    </div>
                    <div className="student-dossier-item">
                      <span className="student-dossier-lbl">Academic Tier</span>
                      <span className="student-dossier-val">
                        {levelLabel(latestApp.institution_level || latestApp.educationLevel)}
                      </span>
                    </div>
                    <div className="student-dossier-item">
                      <span className="student-dossier-lbl">Requested Amount</span>
                      <span className="student-dossier-val">
                        {formatMoney(latestApp.requested_amount || latestApp.fee_balance || 0)}
                      </span>
                    </div>
                    <div className="student-dossier-item">
                      <span className="student-dossier-lbl">Allocated Grant</span>
                      <span className="student-dossier-val" style={{ color: 'var(--stu-status-green)' }}>
                        {latestApp.allocated_amount ? formatMoney(latestApp.allocated_amount) : 'Pending Vetting'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '24px 16px', textAlign: 'center', background: 'var(--stu-surface-card)', borderRadius: 'var(--stu-radius-lg)' }}>
                  <div style={{ display: 'inline-flex', padding: 12, borderRadius: '50%', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--stu-accent-cyan)', marginBottom: 10 }}>
                    <Icon name="applications" size={28} />
                  </div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', color: 'var(--stu-text-primary)' }}>
                    {complete ? 'Ready for Application Submission' : 'Complete Form Steps to Apply'}
                  </h3>
                  <p style={{ margin: '0 auto 16px', maxWidth: 420, fontSize: '0.84rem', color: 'var(--stu-text-secondary)', lineHeight: 1.5 }}>
                    {complete
                      ? 'All required documents and family background data are verified on file.'
                      : `You have ${steps.length - doneCount} remaining steps in your registration checklist before you can submit.`}
                  </p>
                  {complete ? (
                    <button
                      type="button"
                      className="btn-student-cta"
                      onClick={() => navigate('/student/forms?apply=1')}
                    >
                      <Icon name="applications" size={16} />
                      <span>Start Bursary Application Now</span>
                    </button>
                  ) : (
                    <Link
                      to="/student/documents"
                      state={{ continueRegistration: true }}
                      className="btn-student-cta"
                    >
                      <Icon name="chevronRight" size={16} />
                      <span>Complete Remaining Steps</span>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Application History Ledger */}
            <div className="student-card-panel">
              <div className="student-panel-head">
                <div>
                  <h3 className="student-panel-title">Application Records</h3>
                  <p className="student-panel-sub">Historical bursary grant submissions and outcomes</p>
                </div>
                {sortedApps.length > 0 && (
                  <Link
                    to="/student/applications"
                    style={{ fontSize: '0.8rem', color: 'var(--stu-text-muted)', textDecoration: 'none' }}
                  >
                    All History ({sortedApps.length})
                  </Link>
                )}
              </div>

              {sortedApps.length === 0 ? (
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--stu-text-muted)', fontSize: '0.85rem' }}>
                  No prior bursary applications found on file.
                </div>
              ) : (
                <div className="stitch-apps-table" style={{ border: 'none', borderRadius: 0 }}>
                  <table style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>Cycle</th>
                        <th>Tracking Code</th>
                        <th>Institution</th>
                        <th>Status</th>
                        <th>Award</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedApps.slice(0, 5).map((app) => {
                        const appRaw = app.application_status || app.status || 'submitted';
                        return (
                          <tr key={app.id}>
                            <td data-label="Cycle" style={{ fontSize: '0.82rem' }}>
                              {cycleTitle(app, windows, app.created_at)}
                            </td>
                            <td data-label="Tracking" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--stu-accent-cyan)' }}>
                              {applicationSerial(app)}
                            </td>
                            <td data-label="Institution" style={{ fontWeight: 600, fontSize: '0.84rem' }}>
                              {app.institution_name || app.school || '—'}
                            </td>
                            <td data-label="Status">
                              <span className={`student-status-pill ${
                                appRaw === 'approved' ? 'student-status-pill--admitted' : 'student-status-pill--review'
                              }`}>
                                {getStatusConfig(appRaw).label}
                              </span>
                            </td>
                            <td data-label="Award" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.84rem' }}>
                              {formatMoney(app.allocated_amount ?? app.allocatedAmount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: CHECKLIST & QUICK ACTION TILES */}
          <div className="student-col">
            {/* Registration Checklist Panel */}
            <div className="student-card-panel">
              <div className="student-panel-head">
                <div>
                  <h3 className="student-panel-title">Registration Checklist</h3>
                  <p className="student-panel-sub">
                    {doneCount} of {steps.length} required steps verified
                  </p>
                </div>
                <span className={`student-status-pill ${complete ? 'student-status-pill--admitted' : 'student-status-pill--review'}`}>
                  {complete ? 'Ready' : `${steps.length - doneCount} Pending`}
                </span>
              </div>

              {showSkeleton ? (
                <div className="skeleton-wrap" style={{ padding: 12 }}>
                  <div className="skeleton skeleton--hero" />
                </div>
              ) : (
                <ul className="student-checklist">
                  {steps.map((step) => {
                    const done = completedKeys.includes(step.key);
                    const isOrphan = profile?.parentStatus === 'orphan' || sessionProfile?.parentStatus === 'orphan';
                    const stepTitle = step.key === 'parent_information'
                      ? (isOrphan ? "Guardian's Details" : "Parent's Details")
                      : step.title;
                    return (
                      <li
                        key={step.key}
                        className={`student-checklist-row ${done ? 'is-done' : ''}`}
                        onClick={() => navigate('/student/documents', { state: { startAtKey: step.key } })}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && navigate('/student/documents', { state: { startAtKey: step.key } })}
                      >
                        <div className="student-checklist-left">
                          <div className="student-checklist-icon">
                            {done ? <Icon name="check" size={14} /> : <span style={{ fontSize: 10 }}>○</span>}
                          </div>
                          <span className="student-checklist-title">{stepTitle}</span>
                        </div>
                        <span className={`student-status-pill ${done ? 'student-status-pill--admitted' : 'student-status-pill--neutral'}`} style={{ padding: '2px 8px', fontSize: '0.68rem' }}>
                          {done ? 'Verified' : 'Required'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Quick Action Tiles */}
            <div className="student-card-panel">
              <div className="student-panel-head">
                <div>
                  <h3 className="student-panel-title">Direct Services</h3>
                  <p className="student-panel-sub">Fast access to bursary student tools</p>
                </div>
              </div>

              <div className="student-tiles-grid">
                <Link to="/student/documents" className="student-tile">
                  <div className="student-tile-icon">
                    <Icon name="documents" size={18} />
                  </div>
                  <div className="student-tile-title">Documents Hub</div>
                  <div className="student-tile-desc">Upload &amp; manage certified statements</div>
                </Link>

                <Link to="/student/forms" className="student-tile">
                  <div className="student-tile-icon">
                    <Icon name="applications" size={18} />
                  </div>
                  <div className="student-tile-title">Official Forms</div>
                  <div className="student-tile-desc">Download award slips &amp; templates</div>
                </Link>

                <Link to="/student/appeals" className="student-tile">
                  <div className="student-tile-icon">
                    <Icon name="support" size={18} />
                  </div>
                  <div className="student-tile-title">Lodge Appeal</div>
                  <div className="student-tile-desc">Contest bursary committee verdict</div>
                </Link>

                <Link to="/student/support" className="student-tile">
                  <div className="student-tile-icon">
                    <Icon name="support" size={18} />
                  </div>
                  <div className="student-tile-title">Help Desk</div>
                  <div className="student-tile-desc">Constituency agent direct support</div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
