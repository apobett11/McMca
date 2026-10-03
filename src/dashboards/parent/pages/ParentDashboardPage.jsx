import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ParentLayout } from '../components/ParentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { RefreshButton } from '../../../components/RefreshButton.jsx';
import { useAuth } from '../../../context/AuthContext';
import { useCachedQuery } from '../../../lib/useCachedQuery';
import { loadParentBoard, parentBoardKey } from '../../../lib/portalData';
import { DASHBOARD_PARENT_STEPS } from '../../../lib/accountAllocation/wizardFlows';
import { joinFullName } from '../../../lib/accountAllocation';
import { cycleTitle, formatMoney } from '../../../lib/household.js';
import { EDUCATION_LEVEL_LABEL } from '../../../lib/accountAllocation/constants.js';
import { getStatusConfig } from '../../../utils/statusConfig.js';
import { ContinueRegistrationPrompt } from '../../../components/account/ContinueRegistrationPrompt.jsx';
import { getTimeGreeting } from '../../../utils/greeting.js';
import { AddChildModal } from '../../../components/account/AddChildModal.jsx';

function preparednessCopy(done, total) {
  if (!total || done <= 0) return 'Start your details to build a household record.';
  if (done >= total) return 'Every household step is on file.';
  if (done < total / 2) return 'Several steps still need your attention.';
  return 'Most steps are done. Finish the rest to add a child.';
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

const QUICK_LINKS = [
  { to: '/parent/applications', icon: 'applications', title: 'Applications', desc: 'Bursary records', tone: 'primary' },
  { to: '/parent/documents', icon: 'documents', title: 'Documents', desc: 'Shared details and each child', tone: 'secondary' },
  { to: '/parent/messages', icon: 'support', title: 'Contact Office', desc: 'MCA & Chief messages', tone: 'tertiary' },
  { to: '/parent/children/new', icon: 'plus', title: 'Add a child', desc: 'Register a student', tone: 'error' }
];

export function ParentDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const greeting = getTimeGreeting();
  const { data, loading, refreshing, error, refresh } = useCachedQuery(
    user?.id ? parentBoardKey(user.id) : null,
    () => loadParentBoard(user.id),
    { enabled: Boolean(user?.id) }
  );

  const [extraCompleted, setExtraCompleted] = useState([]);
  const [addChildModalOpen, setAddChildModalOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  useEffect(() => {
    function onStepCompleted(e) {
      if (e.detail?.completedKeys) {
        setExtraCompleted(e.detail.completedKeys);
      }
    }
    window.addEventListener('mcmca_registration_step_completed', onStepCompleted);
    return () => window.removeEventListener('mcmca_registration_step_completed', onStepCompleted);
  }, []);

  const parent = data?.parent || null;
  const children = data?.children || [];
  const applications = data?.applications || [];
  const windows = data?.windows || [];
  const showSkeleton = loading && !data;

  const parentName = parent
    ? joinFullName({ firstName: parent.first_name, middleName: parent.middle_name, lastName: parent.last_name })
    : 'Parent';
  const initials = parentName.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2) || 'PR';

  // Merge session completed keys with DB completed keys and pre-checked personal info
  const sessionCompleted = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('wizard_completed_dashboard_parent') || '[]');
    } catch {
      return [];
    }
  })();
  const dbCompleted = data?.registration?.completedKeys || [];
  const completedKeys = Array.from(new Set([...dbCompleted, ...sessionCompleted, ...extraCompleted, 'personal_information']));

  const steps = DASHBOARD_PARENT_STEPS;
  const doneCount = steps.filter((step) => completedKeys.includes(step.key)).length;
  const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;
  const complete = doneCount === steps.length && steps.length > 0;

  // The parent must never be allowed to add another student child before they finish one.
  const hasIncompleteChild = children.some(
    (c) => !c.school_name || (!c.admission_number && !c.birth_certificate_number)
  );

  function handleAddChildClick() {
    if (!complete) {
      setActionNotice('You must finish your household registration steps (Personal, Family, General) before adding a child.');
      setTimeout(() => setActionNotice(''), 6000);
      return;
    }
    if (hasIncompleteChild) {
      setActionNotice('You must finish adding the current child before adding another student.');
      setTimeout(() => setActionNotice(''), 6000);
      return;
    }
    setAddChildModalOpen(true);
  }

  const sortedApps = [...applications].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );

  return (
    <ParentLayout pageTitle="Home" parentName={parentName} layout="dashboard">
      <ContinueRegistrationPrompt formsPath="/parent/documents" />
      <div className="stitch-dashboard">
        {/* Parent identity hero */}
        <section className="student-hero">
          <div className="student-hero__identity">
            <div className="student-hero__avatar" aria-hidden="true">{initials}</div>
            <div className="student-hero__copy">
              <h1 className="student-hero__title">{greeting}, {parentName}</h1>
              <p className="student-hero__meta">
                {showSkeleton ? 'Loading your household…' : `${children.length} linked student${children.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>
          <div className="student-hero__readiness">
            <div className="student-hero__ring" aria-hidden="true">
              <span>{showSkeleton ? '…' : `${pct}%`}</span>
            </div>
            <div>
              <p className="student-hero__readiness-label">Household</p>
              <p className="student-hero__readiness-desc">
                {showSkeleton
                  ? 'Checking linked students.'
                  : !complete
                    ? 'Finish your household steps to add students.'
                    : children.length
                      ? `${children.length} linked student${children.length === 1 ? '' : 's'} on file.`
                      : 'Add a child to start an application.'}
              </p>
            </div>
          </div>
        </section>

        {/* Quick actions */}
        <section className="dash-suite">
          <div className="dash-suite__head">
            <h2 className="stitch-section-title">Quick actions</h2>
          </div>
          <div className="dash-suite__grid">
            {QUICK_LINKS.map((item) => (
              item.to === '/parent/children/new' ? (
                <button
                  key={item.to}
                  type="button"
                  className="dash-suite__card luxury-gradient-card"
                  onClick={handleAddChildClick}
                  style={{ textAlign: 'left', cursor: 'pointer', background: 'none', border: 'none', font: 'inherit' }}
                >
                  <div className={`dash-suite__icon dash-suite__icon--${item.tone}`}>
                    <Icon name={item.icon} size={22} />
                  </div>
                  <p className="dash-suite__card-title">{item.title}</p>
                  <p className="dash-suite__card-desc">{item.desc}</p>
                </button>
              ) : (
                <Link key={item.to} to={item.to} className="dash-suite__card luxury-gradient-card">
                  <div className={`dash-suite__icon dash-suite__icon--${item.tone}`}>
                    <Icon name={item.icon} size={22} />
                  </div>
                  <p className="dash-suite__card-title">{item.title}</p>
                  <p className="dash-suite__card-desc">{item.desc}</p>
                </Link>
              )
            ))}
          </div>
        </section>

        {actionNotice ? (
          <div className="notice" style={{ marginBottom: 16, background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
            <p style={{ margin: 0, color: 'var(--text, #111827)' }}>{actionNotice}</p>
          </div>
        ) : null}

        {/* Consolidated single card: ranges, checklist, and applications */}
        <section className="dash-single-card">
          <div className="dash-single-card__head">
            <div>
              <h2 className="stitch-section-title" style={{ margin: 0 }}>Registration & Household Overview</h2>
              <p className="field__help" style={{ margin: '4px 0 0' }}>
                Complete every household step before adding a student and applying for bursaries.
              </p>
            </div>
            <div className="btn-row">
              <RefreshButton onClick={refresh} busy={refreshing} />
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleAddChildClick}
                disabled={!complete || hasIncompleteChild}
                title={
                  !complete
                    ? 'Finish household registration first'
                    : hasIncompleteChild
                      ? 'Finish current child before adding another'
                      : 'Add a child'
                }
              >
                <Icon name="plus" size={18} />
                Add a child
              </button>
            </div>
          </div>

          {/* Analytics cards with thin progress ranges inside card */}
          <div className="dash-analytics-strips" style={{ margin: 0, padding: 16, borderBottom: '1px solid var(--glass-border)' }}>
            <div className="dash-strip-card">
              <div className="dash-strip-card__head">
                <div>
                  <span className="dash-strip-card__label">Linked Students & Applications</span>
                  <h3 className="dash-strip-card__val">
                    {children.length} {children.length === 1 ? 'Student' : 'Students'} · {applications.length} {applications.length === 1 ? 'App' : 'Apps'}
                  </h3>
                </div>
                <span className={`stitch-status-badge ${children.length > 0 ? 'stitch-status-badge--admitted' : 'stitch-status-badge--withdrawn'}`}>
                  {children.length > 0 ? 'Linked' : 'No students'}
                </span>
              </div>
              <div className="dash-strip-card__track" role="progressbar" aria-valuenow={children.length > 0 ? 100 : 0} aria-valuemin="0" aria-valuemax="100">
                <div
                  className="dash-strip-card__fill dash-strip-card__fill--gold"
                  style={{ width: `${children.length > 0 ? 100 : 0}%` }}
                />
              </div>
              <div className="dash-strip-card__foot">
                <span>{children.length > 0 ? `${children.length} student${children.length === 1 ? '' : 's'} registered` : 'Add your children'}</span>
                <span>{children.length > 0 ? 'Active' : '0%'}</span>
              </div>
            </div>

            <div className="dash-strip-card">
              <div className="dash-strip-card__head">
                <div>
                  <span className="dash-strip-card__label">Household Form Steps</span>
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
          </div>

          {error ? (
            <div className="notice" role="alert" style={{ margin: 16 }}>
              <strong>Could not load</strong>
              <p>{error}</p>
            </div>
          ) : null}

          {/* Registration Checklist */}
          <div style={{ padding: '16px 22px 10px', borderBottom: '1px solid rgba(148, 163, 184, 0.12)' }}>
            <h3 className="stitch-section-title" style={{ margin: 0, fontSize: '1.05rem' }}>Registration Checklist</h3>
            <p className="field__help" style={{ margin: '4px 0 0' }}>
              Personal information is pre-checked from registration. Click any step to open and complete it.
            </p>
          </div>

          {showSkeleton ? (
            <div className="skeleton-wrap" style={{ padding: 16 }}>
              <div className="skeleton skeleton--hero" />
            </div>
          ) : (
            <ul className="checklist-single-card__list">
              {steps.map((step) => {
                const done = completedKeys.includes(step.key);
                return (
                  <li
                    key={step.key}
                    className={`checklist-single-card__row${done ? ' checklist-single-card__row--done' : ''}`}
                    onClick={() => navigate('/parent/documents', { state: { startAtKey: step.key, continueRegistration: true } })}
                    style={{ cursor: 'pointer' }}
                  >
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={() => {
                        navigate('/parent/documents', { state: { startAtKey: step.key, continueRegistration: true } });
                      }}
                      tabIndex={0}
                      aria-label={`${step.title} ${done ? 'completed' : 'not completed'}`}
                      style={{ cursor: 'pointer' }}
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

          {/* Applications inside single card */}
          <div className="dash-single-card__head" style={{ borderTop: '1px solid var(--glass-border)' }}>
            <div>
              <h3 className="stitch-section-title" style={{ margin: 0, fontSize: '1.05rem' }}>Applications & Linked Students</h3>
              <p className="field__help" style={{ margin: '4px 0 0' }}>
                {children.length > 0
                  ? 'Bursary applications and records for your linked students.'
                  : 'Track cycle applications and submission status for your children.'}
              </p>
            </div>
            {sortedApps.length > 0 && (
              <Link className="btn btn--outline" to="/parent/applications" style={{ borderRadius: 999 }}>
                View all history
              </Link>
            )}
          </div>

          {showSkeleton ? (
            <div className="skeleton-wrap" style={{ padding: 16 }}>
              <div className="skeleton skeleton--hero" />
            </div>
          ) : children.length === 0 ? (
            <div className="dash-apps-empty">
              <p className="dash-apps-empty__msg">
                You have no students linked yet. Complete your household details above, then add a child.
              </p>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleAddChildClick}
                style={{ borderRadius: 999, display: 'inline-flex', width: 'auto' }}
              >
                Add a child
              </button>
            </div>
          ) : sortedApps.length === 0 ? (
            <div style={{ padding: 16 }}>
              <p className="field__help" style={{ marginTop: 0 }}>
                {children.length} linked student{children.length === 1 ? '' : 's'} registered. Continue their records or submit bursary applications.
              </p>
              <div className="student-cards-grid">
                {children.map((child) => {
                  const name = joinFullName({
                    firstName: child.first_name,
                    middleName: child.middle_name,
                    lastName: child.last_name
                  });
                  return (
                    <article key={child.id} className="linked-student-card">
                      <div className="linked-student-card__head">
                        <div className="linked-student-card__avatar linked-student-card__avatar--blue" aria-hidden="true">
                          {name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="linked-student-card__name">{name}</h3>
                          <p className="linked-student-card__school">{child.school_name || 'School not added yet'}</p>
                        </div>
                      </div>
                      <div className="linked-student-card__actions" style={{ marginTop: 12 }}>
                        <Link className="btn btn--primary btn--compact" to={`/parent/children/${child.id}`}>
                          <Icon name="applications" size={16} />
                          Continue record
                        </Link>
                        <Link className="btn btn--secondary btn--compact" to="/parent/applications">
                          <Icon name="documents" size={16} />
                          Applications
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <div className="stitch-apps-table" style={{ border: 'none', borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Cycle</th>
                      <th>Institution</th>
                      <th>Level</th>
                      <th>Status</th>
                      <th>Allocated</th>
                      <th>Requested</th>
                      <th>Fee balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedApps.slice(0, 5).map((app) => {
                      const child = children.find((c) => c.id === app.student_profile_id);
                      const name = child ? joinFullName({
                        firstName: child.first_name,
                        middleName: child.middle_name,
                        lastName: child.last_name
                      }) : 'Student';
                      const status = getStatusConfig(app.application_status);
                      return (
                        <tr key={app.id}>
                          <td data-label="Student" style={{ fontWeight: 600 }}>{name}</td>
                          <td data-label="Cycle">{cycleTitle(app, windows, app.created_at)}</td>
                          <td data-label="Institution">{app.institution_name || '—'}</td>
                          <td data-label="Level">{levelLabel(app.institution_level)}</td>
                          <td data-label="Status">
                            <span className={`stitch-status-badge ${statusClass(app.application_status)}`}>
                              {status.label}
                            </span>
                          </td>
                          <td data-label="Allocated">{formatMoney(app.allocated_amount)}</td>
                          <td data-label="Requested">{formatMoney(app.requested_amount)}</td>
                          <td data-label="Fee balance">{formatMoney(app.fee_balance)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="dash-apps-footer-note">
                <span>
                  {complete
                    ? 'Household registration is up to date.'
                    : 'Complete household registration steps to keep bursary details current.'}
                </span>
                <Link className="btn btn--outline" to="/parent/documents" style={{ borderRadius: 999, fontSize: '0.85rem' }}>
                  {complete ? 'Review forms' : 'Complete forms'}
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>

      {addChildModalOpen && parent ? (
        <AddChildModal
          parent={parent}
          existingChildren={children}
          onClose={() => setAddChildModalOpen(false)}
          onSaved={() => {
            setAddChildModalOpen(false);
            refresh().catch(() => {});
          }}
        />
      ) : null}
    </ParentLayout>
  );
}
