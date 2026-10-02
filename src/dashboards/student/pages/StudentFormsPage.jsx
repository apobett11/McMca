import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { StudentLayout } from '../components/StudentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { RefreshButton } from '../../../components/RefreshButton.jsx';
import { useAuth } from '../../../context/AuthContext';
import { activeBursaryWindow, submitStudentCycleApplication } from '../../../lib/accountQueries';
import { useCachedQuery } from '../../../lib/useCachedQuery';
import { loadStudentRecord, studentRecordKey } from '../../../lib/portalData';
import { DASHBOARD_STUDENT_STEPS } from '../../../lib/accountAllocation/wizardFlows';
import { cycleTitle } from '../../../lib/household.js';
import { CompleteRegistrationWizard } from '../../../components/account/CompleteRegistrationWizard.jsx';
import { StudentDocumentsSection } from './StudentDocumentsPage.jsx';

export function StudentFormsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const { data, loading, refreshing, error, refresh, update } = useCachedQuery(
    user?.id ? studentRecordKey(user.id) : null,
    () => loadStudentRecord(user.id),
    { enabled: Boolean(user?.id) }
  );
  const registration = data?.registration || null;
  const applications = data?.applications || [];
  const windows = data?.windows || [];
  const showSkeleton = loading && !data;
  const [wizardOpen, setWizardOpen] = useState(Boolean(location.state?.continueRegistration));
  const [startAtKey, setStartAtKey] = useState(location.state?.startAtKey || null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applying, setApplying] = useState(false);
  const [justFinished, setJustFinished] = useState(false);
  const [notice, setNotice] = useState('');

  const steps = registration?.steps?.length ? registration.steps : DASHBOARD_STUDENT_STEPS;
  const completed = new Set(registration?.completedKeys || []);
  const complete = Boolean(registration?.position?.complete);
  const cycleGate = activeBursaryWindow(windows);
  const cycleName = cycleGate.window
    ? cycleTitle({ application_window_id: cycleGate.window.id }, windows)
    : '';
  const alreadyApplied = Boolean(
    cycleGate.window && applications.some((row) => row.application_window_id === cycleGate.window.id)
  );

  useEffect(() => {
    if (showSkeleton || !complete || !user?.id || !cycleGate.window || cycleGate.reason || alreadyApplied) return;
    const key = `mcmca.apply-prompt.${user.id}.${cycleGate.window.id}`;
    if (!justFinished && sessionStorage.getItem(key)) return;
    setApplyOpen(true);
  }, [showSkeleton, complete, user?.id, cycleGate.window, cycleGate.reason, alreadyApplied, justFinished]);

  function openStep(key) {
    const reached = complete || completed.has(key);
    setStartAtKey(reached ? key : null);
    setWizardOpen(true);
  }

  function dismissApply() {
    if (user?.id && cycleGate.window) {
      sessionStorage.setItem(`mcmca.apply-prompt.${user.id}.${cycleGate.window.id}`, '1');
    }
    setJustFinished(false);
    setApplyOpen(false);
  }

  async function applyNow() {
    if (!registration?.profile) return;
    setApplying(true);
    setApplyError('');
    try {
      const result = await submitStudentCycleApplication(registration.profile);
      if (!result.ok) {
        setApplyError(result.reason || 'Could not submit this application.');
        if (result.already && result.application) {
          update((prev) => ({
            ...(prev || {}),
            applications: [result.application, ...((prev && prev.applications) || [])]
          }));
        }
        return;
      }
      update((prev) => ({
        ...(prev || {}),
        applications: [result.application, ...((prev && prev.applications) || [])]
      }));
      setApplyOpen(false);
      setJustFinished(false);
      setNotice(`Application sent for ${cycleTitle(result.application, result.windows, result.application.created_at)}.`);
    } catch (err) {
      setApplyError(err.message || 'Could not submit this application.');
    } finally {
      setApplying(false);
    }
  }

  return (
    <StudentLayout pageTitle="Forms" layout="dashboard">
      <div className="stitch-apps-header">
        <h1 className="stitch-apps-header__title">Forms</h1>
        <p className="stitch-apps-header__sub">
          Personal details, parent, school, home, and family, then the documents for this record. Open any saved step to update it.
        </p>
      </div>

      {error ? (
        <div className="notice" role="alert">
          <strong>Could not load</strong>
          <p>{error}</p>
        </div>
      ) : null}

      {notice ? (
        <div className="notice">
          <strong>Application sent</strong>
          <p>{notice}</p>
          <Link className="btn btn--primary" to="/student/applications" style={{ borderRadius: 999, width: 'auto', marginTop: 12 }}>
            View applications
          </Link>
        </div>
      ) : null}

      <section className="stitch-apps-history">
        <div className="dash-suite__head">
          <h2 className="stitch-section-title">Steps</h2>
          <div className="btn-row">
            <RefreshButton onClick={refresh} busy={refreshing} />
          {!complete ? (
            <button type="button" className="btn btn--primary" onClick={() => openStep(null)} disabled={showSkeleton}>
              <Icon name="chevronRight" size={18} />
              Continue
            </button>
          ) : null}
          </div>
        </div>

        {showSkeleton ? (
          <div className="skeleton-wrap">
            <div className="skeleton skeleton--hero" />
          </div>
        ) : (
          <ul className="prep-list">
            {steps.map((step) => {
              const done = completed.has(step.key);
              return (
                <li key={step.key} className={`prep-list__item${done ? ' prep-list__item--done' : ''}`}>
                  <input type="checkbox" checked={done} readOnly onChange={() => {}} tabIndex={-1} aria-label={`${step.title} ${done ? 'completed' : 'not completed'}`} />
                  <span className="prep-list__title">{step.title}</span>
                  <button type="button" className="btn btn--secondary btn--compact" onClick={() => openStep(step.key)}>
                    {done ? 'Update' : 'Open'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

          {complete && cycleGate.window && !alreadyApplied && !cycleGate.reason ? (
          <div className="btn-row" style={{ marginTop: 16 }}>
            <button type="button" className="btn btn--primary" onClick={() => setApplyOpen(true)}>
              Apply for {cycleName}
            </button>
          </div>
        ) : null}

        {complete && alreadyApplied ? (
          <p className="field__help">You already have an application for {cycleName}. Open any step above if something needs an update.</p>
        ) : null}

        {complete && cycleGate.reason && !alreadyApplied ? (
          <p className="field__help">{cycleGate.reason} Your saved details stay on file.</p>
        ) : null}
      </section>

      <StudentDocumentsSection />

      {wizardOpen ? (
        <CompleteRegistrationWizard
          open={wizardOpen}
          startAtKey={startAtKey}
          handoffOnComplete
          onClose={() => {
            setWizardOpen(false);
            setStartAtKey(null);
            refresh().catch(() => {});
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
