import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ParentLayout } from '../components/ParentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { useAuth } from '../../../context/AuthContext';
import { fetchDashboardRegistrationState } from '../../../lib/accountQueries';
import { CompleteRegistrationWizard } from '../../../components/account/CompleteRegistrationWizard.jsx';

export function ParentApplicationsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [wizardOpen, setWizardOpen] = useState(Boolean(location.state?.continueRegistration));
  const [registrationIncomplete, setRegistrationIncomplete] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user?.id) return;
      try {
        const state = await fetchDashboardRegistrationState(user.id, 'parent');
        if (active) setRegistrationIncomplete(state.incomplete);
      } catch {
        if (active) setRegistrationIncomplete(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [user?.id, wizardOpen]);

  return (
    <ParentLayout pageTitle="Applications" layout="dashboard">
      <div className="stitch-apps-header">
        <h1 className="stitch-apps-header__title">Applications</h1>
        <p className="stitch-apps-header__sub">
          Confirm your details, then manage applications for linked students.
        </p>
      </div>

      {registrationIncomplete ? (
        <div className="notice continue-reg-banner">
          <strong>Verify your information</strong>
          <p>Your details are on file. Open the form to confirm them and add both sides of your ID.</p>
          <button
            type="button"
            className="btn btn--primary"
            style={{ borderRadius: 999, width: 'auto', marginTop: 12 }}
            onClick={() => setWizardOpen(true)}
          >
            <Icon name="profile" size={18} />
            Continue
          </button>
        </div>
      ) : (
        <div className="notice">
          <strong>No applications yet</strong>
          <p>Applications for your children will appear here.</p>
        </div>
      )}

      <section className="stitch-apps-support">
        <Link to="/parent/dashboard" className="stitch-apps-support__card">
          <div className="stitch-apps-support__icon"><Icon name="profile" size={22} /></div>
          <div>
            <p className="stitch-apps-support__title">Your children</p>
            <p className="stitch-apps-support__desc">Open a student record and continue where you left off.</p>
          </div>
        </Link>
        <Link to="/parent/documents" className="stitch-apps-support__card">
          <div className="stitch-apps-support__icon"><Icon name="documents" size={22} /></div>
          <div>
            <p className="stitch-apps-support__title">Documents</p>
            <p className="stitch-apps-support__desc">See which certificates and school papers are still needed.</p>
          </div>
        </Link>
        <Link to="/parent/children/new" className="stitch-apps-support__card">
          <div className="stitch-apps-support__icon"><Icon name="plus" size={22} /></div>
          <div>
            <p className="stitch-apps-support__title">Add a child</p>
            <p className="stitch-apps-support__desc">Register a student under 18 and upload their birth certificate.</p>
          </div>
        </Link>
      </section>

      {wizardOpen ? (
        <CompleteRegistrationWizard
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          onFinished={() => setRegistrationIncomplete(false)}
        />
      ) : null}
    </ParentLayout>
  );
}
