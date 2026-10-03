import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { StudentLayout } from '../components/StudentLayout.jsx';
import { useAuth } from '../../../context/AuthContext';
import { activeBursaryWindow, submitStudentCycleApplication } from '../../../lib/accountQueries';
import { useCachedQuery } from '../../../lib/useCachedQuery';
import { loadStudentRecord, studentRecordKey } from '../../../lib/portalData';
import { cycleTitle } from '../../../lib/household.js';
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
    <StudentLayout pageTitle="Documents" layout="dashboard">
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
