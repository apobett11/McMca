import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { StudentLayout } from '../components/StudentLayout.jsx';
import { RefreshButton } from '../../../components/RefreshButton.jsx';
import { useAuth } from '../../../context/AuthContext';
import { activeBursaryWindow, submitStudentCycleApplication } from '../../../lib/accountQueries';
import { useCachedQuery } from '../../../lib/useCachedQuery';
import { loadStudentRecord, studentRecordKey } from '../../../lib/portalData';
import { cycleTitle } from '../../../lib/household.js';
import { CompleteRegistrationWizard } from '../../../components/account/CompleteRegistrationWizard.jsx';

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
  const [wizardOpen, setWizardOpen] = useState(true);
  const [startAtKey, setStartAtKey] = useState(location.state?.startAtKey || null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [applying, setApplying] = useState(false);
  const [justFinished, setJustFinished] = useState(false);
  const [notice, setNotice] = useState('');

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
    <StudentLayout pageTitle="Documents" layout="dashboard">
      <div className="stitch-apps-header">
        <h1 className="stitch-apps-header__title">Documents</h1>
        <p className="stitch-apps-header__sub">
          Each step is saved to your account. A tick on the title means that step is already on file. Personal details and a parent are required before you apply.
        </p>
        <div className="btn-row" style={{ marginTop: 12 }}>
          <RefreshButton onClick={refresh} busy={refreshing} />
          {!wizardOpen ? (
            <button type="button" className="btn btn--primary" onClick={() => setWizardOpen(true)}>
              Open steps
            </button>
          ) : null}
        </div>
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
