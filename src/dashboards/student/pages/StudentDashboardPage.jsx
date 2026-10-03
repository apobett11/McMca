import React from 'react';
import { Link } from 'react-router-dom';
import { StudentLayout } from '../components/StudentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { RefreshButton } from '../../../components/RefreshButton.jsx';
import { useAuth } from '../../../context/AuthContext';
import { useCachedQuery } from '../../../lib/useCachedQuery';
import { loadStudentRecord, studentRecordKey } from '../../../lib/portalData';
import { DASHBOARD_STUDENT_STEPS } from '../../../lib/accountAllocation/wizardFlows';
import { getTimeGreeting } from '../../../utils/greeting.js';
import { ContinueRegistrationPrompt } from '../../../components/account/ContinueRegistrationPrompt.jsx';
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
  const greeting = getTimeGreeting();
  const { data, loading, refreshing, error, refresh } = useCachedQuery(
    user?.id ? studentRecordKey(user.id) : null,
    () => loadStudentRecord(user.id),
    { enabled: Boolean(user?.id) }
  );

  // Merge session profile with DB profile
  const sessionProfile = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('wizard_data_dashboard_student') || '{}');
    } catch {
      return {};
    }
  })();
  const profile = { ...(data?.registration?.profile || {}), ...sessionProfile };

  // Merge session completed keys with DB completed keys
  const sessionCompleted = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('wizard_completed_dashboard_student') || '[]');
    } catch {
      return [];
    }
  })();
  const dbCompleted = data?.registration?.completedKeys || [];
  const completedKeys = Array.from(new Set([...dbCompleted, ...sessionCompleted]));

  // Merge session applications with DB applications
  const sessionApps = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('mcmca_session_applications') || '[]');
    } catch {
      return [];
    }
  })();
  const dbApps = data?.applications || [];
  const mergedApps = [...sessionApps, ...dbApps];
  const apps = Array.from(new Map(mergedApps.map((item) => [item.id, item])).values());
  const sortedApps = [...apps].sort(
    (a, b) => new Date(b.submitted_at || b.created_at || 0) - new Date(a.submitted_at || a.created_at || 0)
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
  const doneCount = steps.filter((step) => completedKeys.includes(step.key)).length;
  const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;
  const studentName = [profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean).join(' ')
    || user?.user_metadata?.full_name
    || 'Student';
  const complete = doneCount === steps.length && steps.length > 0;

  const appStripPct = hasAppliedThisCycle || apps.length > 0 ? 100 : 0;

  return (
    <StudentLayout pageTitle="Overview" layout="dashboard" studentName={profile ? studentName : ''}>
      <ContinueRegistrationPrompt formsPath="/student/documents" />
      <div className="stitch-dashboard">
        {/* Student identity hero */}
        <section className="student-hero">
          <div className="student-hero__identity">
            <div className="student-hero__avatar" aria-hidden="true">
              {studentName.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div className="student-hero__copy">
              <h1 className="student-hero__title">{greeting}, {studentName}</h1>
              <p className="student-hero__meta">{profile?.school_name || 'Student overview'}</p>
            </div>
          </div>
          <div className="student-hero__readiness">
            <div className="student-hero__ring" aria-hidden="true">
              <span>{showSkeleton ? '…' : `${pct}%`}</span>
            </div>
            <div>
              <p className="student-hero__readiness-label">Preparedness</p>
              <p className="student-hero__readiness-desc">
                {showSkeleton ? 'Checking your saved steps.' : preparednessCopy(doneCount, steps.length)}
              </p>
            </div>
          </div>
        </section>

        {/* Analytics cards with thin progress ranges */}
        <section className="dash-analytics-strips" aria-label="Portal Analytics">
          <div className="dash-strip-card">
            <div className="dash-strip-card__head">
              <div>
                <span className="dash-strip-card__label">Bursary Applications</span>
                <h3 className="dash-strip-card__val">
                  {apps.length > 0 ? `${apps.length} ${apps.length === 1 ? 'Application' : 'Applications'}` : '0 Applications'}
                </h3>
              </div>
              <span className={`stitch-status-badge ${hasAppliedThisCycle ? 'stitch-status-badge--admitted' : activeCycle ? 'stitch-status-badge--review' : 'stitch-status-badge--withdrawn'}`}>
                {hasAppliedThisCycle ? 'Submitted' : activeCycle ? 'Cycle open' : 'No cycle'}
              </span>
            </div>
            <div className="dash-strip-card__track" role="progressbar" aria-valuenow={appStripPct} aria-valuemin="0" aria-valuemax="100">
              <div
                className="dash-strip-card__fill dash-strip-card__fill--gold"
                style={{ width: `${appStripPct}%` }}
              />
            </div>
            <div className="dash-strip-card__foot">
              <span>{activeCycle ? cycleName : 'Cycle status'}</span>
              <span>{hasAppliedThisCycle ? '100%' : apps.length > 0 ? 'Submitted' : '0%'}</span>
            </div>
          </div>

          <div className="dash-strip-card">
            <div className="dash-strip-card__head">
              <div>
                <span className="dash-strip-card__label">Form Fields</span>
                <h3 className="dash-strip-card__val">
                  {doneCount} of {steps.length} Steps
                </h3>
              </div>
              <span className={`stitch-status-badge ${complete ? 'stitch-status-badge--admitted' : 'stitch-status-badge--withdrawn'}`}>
                {complete ? 'Complete' : `${steps.length - doneCount} Needed`}
              </span>
            </div>
            <div className="dash-strip-card__track" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
              <div
                className={`dash-strip-card__fill ${complete ? 'dash-strip-card__fill--green' : 'dash-strip-card__fill--gold'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="dash-strip-card__foot">
              <span>{complete ? 'Every step on file' : preparednessCopy(doneCount, steps.length)}</span>
              <span>{pct}%</span>
            </div>
          </div>
        </section>

        {/* Consolidated checklist single card */}
        <section className="dash-single-card">
          <div className="dash-single-card__head">
            <div>
              <h2 className="stitch-section-title" style={{ margin: 0 }}>Registration Checklist</h2>
              <p className="field__help" style={{ margin: '4px 0 0' }}>
                Complete every form step to build your profile and unlock bursary applications.
              </p>
            </div>
            <div className="btn-row">
              <RefreshButton onClick={refresh} busy={refreshing} />
              <Link
                className="btn btn--primary"
                to="/student/documents"
                state={{ continueRegistration: !complete }}
              >
                <Icon name={complete ? 'applications' : 'chevronRight'} size={18} />
                {complete ? 'Review forms' : 'Finish remaining steps'}
              </Link>
            </div>
          </div>

          {error ? (
            <div className="notice" role="alert" style={{ margin: 16 }}>
              <strong>Could not load</strong>
              <p>{error}</p>
            </div>
          ) : null}

          {showSkeleton ? (
            <div className="skeleton-wrap" style={{ padding: 16 }}>
              <div className="skeleton skeleton--hero" />
            </div>
          ) : (
            <ul className="checklist-single-card__list">
              {steps.map((step) => {
                const done = completedKeys.includes(step.key);
                return (
                  <li key={step.key} className={`checklist-single-card__row${done ? ' checklist-single-card__row--done' : ''}`}>
                    <input
                      type="checkbox"
                      checked={done}
                      readOnly
                      onChange={() => {}}
                      tabIndex={-1}
                      aria-label={`${step.title} ${done ? 'completed' : 'not completed'}`}
                    />
                    <span className="checklist-single-card__title">{step.title}</span>
                    <span className={`stitch-status-badge ${done ? 'stitch-status-badge--admitted' : 'stitch-status-badge--withdrawn'}`}>
                      {done ? 'Done' : 'Needed'}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Applications section below checklist */}
        <section className="dash-single-card dash-apps-section">
          <div className="dash-single-card__head">
            <div>
              <h2 className="stitch-section-title" style={{ margin: 0 }}>Applications</h2>
              <p className="field__help" style={{ margin: '4px 0 0' }}>
                {sortedApps.length > 0
                  ? 'Your latest bursary applications and award status.'
                  : 'Track cycle applications and submission status.'}
              </p>
            </div>
            {sortedApps.length > 0 && (
              <Link className="btn btn--outline" to="/student/applications" style={{ borderRadius: 999 }}>
                View all history
              </Link>
            )}
          </div>

          {showSkeleton ? (
            <div className="skeleton-wrap" style={{ padding: 16 }}>
              <div className="skeleton skeleton--hero" />
            </div>
          ) : sortedApps.length === 0 ? (
            <div className="dash-apps-empty">
              <p className="dash-apps-empty__msg">
                You have made no application. Complete the form registration.
              </p>
              <Link className="btn btn--primary" to="/student/documents" style={{ borderRadius: 999, display: 'inline-flex', width: 'auto' }}>
                Complete form registration
              </Link>
            </div>
          ) : (
            <div>
              <div className="stitch-apps-table" style={{ border: 'none', borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Cycle</th>
                      <th>Serial number</th>
                      <th>Institution</th>
                      <th>Level</th>
                      <th>Status</th>
                      <th>Allocated</th>
                      <th>Requested</th>
                      <th>Fee balance</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedApps.slice(0, 5).map((app) => {
                      const status = getStatusConfig(app.application_status);
                      return (
                        <tr key={app.id}>
                          <td data-label="Cycle">{cycleTitle(app, windows, app.created_at)}</td>
                          <td data-label="Serial number" style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                            {applicationSerial(app)}
                          </td>
                          <td data-label="Institution" style={{ fontWeight: 600 }}>
                            {app.institution_name || '—'}
                          </td>
                          <td data-label="Level">{levelLabel(app.institution_level)}</td>
                          <td data-label="Status">
                            <span className={`stitch-status-badge ${statusClass(app.application_status)}`}>
                              {status.label}
                            </span>
                          </td>
                          <td data-label="Allocated">{formatMoney(app.allocated_amount)}</td>
                          <td data-label="Requested">{formatMoney(app.requested_amount)}</td>
                          <td data-label="Fee balance">{formatMoney(app.fee_balance)}</td>
                          <td data-label="Submitted">
                            {app.submitted_at || app.created_at
                              ? new Date(app.submitted_at || app.created_at).toLocaleDateString()
                              : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="dash-apps-footer-note">
                <span>
                  {complete
                    ? 'Your profile registration is up to date.'
                    : 'Complete the form registration to keep your bursary details up to date.'}
                </span>
                <Link className="btn btn--outline" to="/student/documents" style={{ borderRadius: 999, fontSize: '0.85rem' }}>
                  {complete ? 'Review forms' : 'Complete forms'}
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </StudentLayout>
  );
}
