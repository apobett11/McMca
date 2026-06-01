import React from 'react';
import { PageShell } from '../../components/PageShell.jsx';
import { PageIntro } from '../../components/student/PageIntro.jsx';
import { Icon } from '../../components/Icon.jsx';
import { STUDENT_SHELL } from '../studentShell.js';
import { STUDENT } from '../../data/studentMock.js';

export function StudentProfilePage() {
  function demoAction(label) {
    window.alert(`${label} — demo not connected yet.`);
  }

  return (
    <PageShell pageTitle="Profile" {...STUDENT_SHELL}>
      <PageIntro lead="Your student account and security settings for this portal." />

      <section className="upload-panel page-section--full" aria-label="Student information">
        <h2 className="upload-panel__title">Student information</h2>
        <dl className="detail-grid">
          <div className="detail-grid__row detail-grid__row--verified">
            <dt>Full name</dt>
            <dd>{STUDENT.fullName}</dd>
          </div>
          <div className="detail-grid__row">
            <dt>Institution</dt>
            <dd>{STUDENT.institutionName}</dd>
          </div>
          <div className="detail-grid__row">
            <dt>Student ID</dt>
            <dd>•••• {STUDENT.studentId.slice(-4)}</dd>
          </div>
          <div className="detail-grid__row detail-grid__row--verified">
            <dt>Phone</dt>
            <dd>{STUDENT.phone}</dd>
          </div>
          <div className="detail-grid__row">
            <dt>Email</dt>
            <dd>{STUDENT.email}</dd>
          </div>
          <div className="detail-grid__row">
            <dt>Bursary cycle</dt>
            <dd>{STUDENT.cycle}</dd>
          </div>
        </dl>
      </section>

      <section className="upload-panel page-section--full" aria-label="Account security">
        <h2 className="upload-panel__title">Account security</h2>
        <div className="btn-row">
          <button type="button" className="btn btn--secondary" onClick={() => demoAction('Verify phone')}>
            <Icon name="profile" size={18} />
            Verify phone (OTP)
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => demoAction('Change password')}>
            Change password
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => demoAction('Log out')}
          >
            <Icon name="logout" size={18} />
            Log out
          </button>
        </div>
        <p className="field__help">
          Never share your OTP with anyone. Ward staff will not ask for it over the phone.
        </p>
      </section>
    </PageShell>
  );
}
