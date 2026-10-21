import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { StudentLayout } from '../components/StudentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { useAuth } from '../../../context/AuthContext';
import { activeBursaryWindow, submitStudentCycleApplication } from '../../../lib/accountQueries';
import { useCachedQuery } from '../../../lib/useCachedQuery';
import { loadStudentRecord, studentRecordKey } from '../../../lib/portalData';
import { cycleTitle } from '../../../lib/household.js';
import { DASHBOARD_STUDENT_STEPS } from '../../../lib/accountAllocation/wizardFlows';
import { CompleteRegistrationWizard } from '../../../components/account/CompleteRegistrationWizard.jsx';

export function StudentFormsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { data, loading, refreshing, error, refresh, update } = useCachedQuery(
    user?.id ? studentRecordKey(user.id) : null,
    () => loadStudentRecord(user.id),
    { enabled: Boolean(user?.id) }
  );
  const registration = data?.registration || null;
  const applications = data?.applications || [];
  const windows = data?.windows || [];
  const showSkeleton = loading && !data;

  // Determine accurately whether all 5 steps are complete
  const sessionCompleted = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('wizard_completed_dashboard_student') || '[]');
    } catch {
      return [];
    }
  })();
  const dbCompleted = registration?.completedKeys || [];
  const completedKeys = Array.from(new Set([...dbCompleted, ...sessionCompleted, 'personal_information']));
  const doneCount = DASHBOARD_STUDENT_STEPS.filter(s => completedKeys.includes(s.key)).length;
  const isAllComplete = doneCount === DASHBOARD_STUDENT_STEPS.length;

  const [startAtKey, setStartAtKey] = useState(location.state?.startAtKey || null);
  const [wizardOpen, setWizardOpen] = useState(() => Boolean(location.state?.startAtKey || !isAllComplete));
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applying, setApplying] = useState(false);
  const [justFinished, setJustFinished] = useState(false);
  const [notice, setNotice] = useState('');

  const cycleGate = activeBursaryWindow(windows);
  const cycleName = cycleGate.window
    ? cycleTitle({ application_window_id: cycleGate.window.id }, windows)
    : 'Tendeno / Sorget Ward Bursary Cycle 2026/2027';

  // Check merged apps from DB + session
  const sessionApps = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('mcmca_session_applications') || '[]');
    } catch {
      return [];
    }
  })();
  const allApps = [...sessionApps, ...applications];
  const alreadyApplied = Boolean(
    (cycleGate.window && allApps.some((row) => row.application_window_id === cycleGate.window.id)) ||
    allApps.some((row) => row.year === '2026/2027' || row.status === 'submitted' || row.applicationStatus === 'Under Review')
  );

  useEffect(() => {
    const wantsApply = location.search.includes('apply=1') || location.state?.openApply;
    if (wantsApply || justFinished) {
      if (isAllComplete && !alreadyApplied) {
        setApplyOpen(true);
      }
    }
  }, [location.search, location.state, justFinished, isAllComplete, alreadyApplied]);

  function dismissApply() {
    setJustFinished(false);
    setApplyOpen(false);
  }

  async function applyNow() {
    if (!registration?.profile) return;
    setApplying(true);
    setApplyError('');
    try {
      let application = null;
      let cycleWindows = windows;
      try {
        const result = await submitStudentCycleApplication(registration.profile);
        if (result.ok) {
          application = result.application;
          cycleWindows = result.windows || windows;
        } else if (result.already) {
          setApplyError('You already have an application for this cycle.');
          setApplying(false);
          return;
        }
      } catch (ex) {
        console.warn('DB submission fallback to session application:', ex);
      }

      if (!application && cycleGate.window) {
        application = {
          id: `app-local-${Date.now()}`,
          student_profile_id: registration.profile.id,
          application_window_id: cycleGate.window.id,
          application_status: 'submitted',
          institution_name: registration.profile.school_name || 'Institution on file',
          institution_level: registration.profile.school_level || 'Tertiary',
          allocated_amount: null,
          requested_amount: null,
          fee_balance: null,
          submitted_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
      }

      if (application) {
        let sessionApps = [];
        try {
          sessionApps = JSON.parse(sessionStorage.getItem('mcmca_session_applications') || '[]');
        } catch {
          sessionApps = [];
        }
        sessionStorage.setItem('mcmca_session_applications', JSON.stringify([application, ...sessionApps]));

        update((prev) => ({
          ...(prev || {}),
          applications: [application, ...((prev && prev.applications) || [])]
        }));
        setApplyOpen(false);
        setJustFinished(false);
        setNotice(`Application auto-filled and submitted for ${cycleTitle(application, cycleWindows, application.created_at)}.`);
      }
    } catch (err) {
      setApplyError(err.message || 'Could not submit this application.');
    } finally {
      setApplying(false);
    }
  }

  return (
    <StudentLayout pageTitle="Documents & Registration" layout="dashboard">
      {error ? (
        <div className="notice" role="alert">
          <strong>Could not load</strong>
          <p>{error}</p>
        </div>
      ) : null}

      {notice ? (
        <div className="notice" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)', marginBottom: 20 }}>
          <strong style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="approved" size={18} /> Bursary Application Submitted
          </strong>
          <p style={{ margin: '6px 0 12px' }}>{notice}</p>
          <div className="btn-row">
            <Link className="btn btn--primary" to="/student/applications" style={{ borderRadius: 999, width: 'auto' }}>
              View Bursary Status
            </Link>
            <Link className="btn btn--outline" to="/student/dashboard" style={{ borderRadius: 999, width: 'auto' }}>
              Return to Overview
            </Link>
          </div>
        </div>
      ) : null}

      {/* Primary Apply Hero Card */}
      {!wizardOpen && (
        <section style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)',
          border: '1px solid rgba(217, 119, 6, 0.35)',
          borderRadius: 16,
          padding: '24px',
          marginBottom: 24,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 999,
                background: isAllComplete ? 'rgba(16, 185, 129, 0.15)' : 'rgba(217, 119, 6, 0.15)',
                color: isAllComplete ? '#10B981' : '#F59E0B',
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 8
              }}>
                <Icon name={isAllComplete ? 'approved' : 'info'} size={14} />
                {isAllComplete ? 'ALL 5 REGISTRATION STEPS VERIFIED' : `${doneCount} OF 5 STEPS COMPLETED`}
              </div>
              <h2 style={{ margin: '0 0 6px', fontSize: '1.35rem', color: '#F8FAFC' }}>
                {cycleName}
              </h2>
              <p style={{ margin: 0, color: '#94A3B8', fontSize: 14, maxWidth: 540, lineHeight: 1.5 }}>
                {alreadyApplied
                  ? 'Your bursary application has been submitted and is currently under review by the Help Desk and Ward MCA Committee.'
                  : isAllComplete
                    ? 'All required documents and details are confirmed on file. You are now eligible to apply for this cycle.'
                    : 'Complete all 5 required registration steps and documents to unlock your bursary application.'}
              </p>
            </div>

            <div>
              {alreadyApplied ? (
                <Link className="btn btn--primary" to="/student/applications" style={{ borderRadius: 999, padding: '12px 28px', fontSize: 14, fontWeight: 700 }}>
                  <Icon name="applications" size={18} /> View Submitted Application
                </Link>
              ) : isAllComplete ? (
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => setApplyOpen(true)}
                  style={{ borderRadius: 999, padding: '12px 28px', fontSize: 15, fontWeight: 700 }}
                >
                  <Icon name="applications" size={18} /> Apply for Bursary Now
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => setWizardOpen(true)}
                  style={{ borderRadius: 999, padding: '12px 28px', fontSize: 14, fontWeight: 700 }}
                >
                  <Icon name="chevronRight" size={18} /> Complete Remaining Steps
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Review Steps Checklist */}
      {!wizardOpen && (
        <section className="dash-single-card" style={{ marginBottom: 24 }}>
          <div className="dash-single-card__head">
            <div>
              <h3 className="stitch-section-title" style={{ margin: 0 }}>Registration Checklist</h3>
              <p className="field__help" style={{ margin: '4px 0 0' }}>
                Every required detail and document for the closed bursary pipeline.
              </p>
            </div>
            {isAllComplete && (
              <span className="stitch-status-badge stitch-status-badge--admitted">
                100% Complete
              </span>
            )}
          </div>
          <ul className="checklist-single-card__list">
            {DASHBOARD_STUDENT_STEPS.map((step) => {
              const done = completedKeys.includes(step.key);
              return (
                <li
                  key={step.key}
                  className={`checklist-single-card__row${done ? ' checklist-single-card__row--done' : ''}`}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px' }}
                  onClick={() => {
                    setStartAtKey(step.key);
                    setWizardOpen(true);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: done ? '#10B981' : 'rgba(148, 163, 184, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      fontSize: 12,
                      fontWeight: 700
                    }}>
                      {done ? '✓' : ''}
                    </div>
                    <span className="checklist-single-card__title" style={{ fontWeight: 600 }}>{step.title}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className={`stitch-status-badge ${done ? 'stitch-status-badge--admitted' : 'stitch-status-badge--withdrawn'}`}>
                      {done ? 'Verified' : 'Needed'}
                    </span>
                    <button
                      type="button"
                      className="btn btn--outline"
                      style={{ padding: '4px 12px', fontSize: 12, borderRadius: 999 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setStartAtKey(step.key);
                        setWizardOpen(true);
                      }}
                    >
                      {done ? 'Edit' : 'Start'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {wizardOpen ? (
        <CompleteRegistrationWizard
          open={wizardOpen}
          inline
          startAtKey={startAtKey}
          handoffOnComplete
          onClose={() => {
            setWizardOpen(false);
            setStartAtKey(null);
            navigate('/student/dashboard');
          }}
          onFinished={() => {
            setWizardOpen(false);
            setStartAtKey(null);
            setJustFinished(true);
            refresh().catch(() => {});
          }}
        />
      ) : null}

      {applyOpen ? (
        <div className="modal-root modal-root--center" role="dialog" aria-modal="true" aria-labelledby="apply-cycle-title">
          <button type="button" className="modal-root__backdrop" onClick={dismissApply} aria-label="Close" />
          <div className="modal-panel modal-panel--prompt">
            <div className="modal-panel__header">
              <h2 id="apply-cycle-title" className="modal-panel__title">Apply for this cycle</h2>
              <button type="button" className="modal-panel__close" onClick={dismissApply} aria-label="Close">×</button>
            </div>
            <div className="modal-panel__body">
              <p className="field__help" style={{ marginTop: 0 }}>
                Your form is complete. Submit an application for {cycleName || 'the open bursary cycle'}.
              </p>
              {applyError ? <p className="field__help">{applyError}</p> : null}
              <div className="btn-row">
                <button type="button" className="btn btn--secondary" onClick={dismissApply} disabled={applying} style={{ borderRadius: 999, width: 'auto' }}>
                  Not now
                </button>
                <button type="button" className="btn btn--primary" onClick={applyNow} disabled={applying} style={{ borderRadius: 999, width: 'auto' }}>
                  {applying ? 'Sending…' : 'Apply now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </StudentLayout>
  );
}
