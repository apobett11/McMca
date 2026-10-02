import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchDashboardRegistrationState } from '../../lib/accountQueries';

export function ContinueRegistrationPrompt({ formsPath }) {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user?.id || !role) return;
      const key = `mcmca.reg-prompt.${user.id}`;
      if (sessionStorage.getItem(key)) return;
      try {
        const state = await fetchDashboardRegistrationState(user.id, role);
        if (active && state.incomplete) setOpen(true);
      } catch (err) {
        console.error('Could not check registration progress', err);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [user?.id, role]);

  if (!open) return null;

  function dismiss() {
    if (user?.id) sessionStorage.setItem(`mcmca.reg-prompt.${user.id}`, '1');
    setOpen(false);
  }

  return (
    <div className="modal-root modal-root--center" role="dialog" aria-modal="true" aria-labelledby="continue-reg-title">
      <button type="button" className="modal-root__backdrop" onClick={dismiss} aria-label="Close" />
      <div className="modal-panel modal-panel--prompt">
        <div className="modal-panel__header">
          <h2 id="continue-reg-title" className="modal-panel__title">Finish registration</h2>
          <button type="button" className="modal-panel__close" onClick={dismiss} aria-label="Close">×</button>
        </div>
        <div className="modal-panel__body">
          <p className="field__help" style={{ marginTop: 0 }}>
            Your account is ready. Open Forms to finish the remaining details.
          </p>
          <div className="btn-row">
            <button type="button" className="btn btn--secondary" onClick={dismiss} style={{ borderRadius: 999, width: 'auto' }}>
              Later
            </button>
            <button
              type="button"
              className="btn btn--primary"
              style={{ borderRadius: 999, width: 'auto' }}
              onClick={() => {
                dismiss();
                navigate(formsPath, { state: { continueRegistration: true } });
              }}
            >
              Go to forms
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
