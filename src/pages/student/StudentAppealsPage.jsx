import React, { useState } from 'react';
import { PageShell } from '../../components/PageShell.jsx';
import { PageIntro } from '../../components/student/PageIntro.jsx';
import { Icon } from '../../components/Icon.jsx';
import { STUDENT_SHELL } from '../studentShell.js';

export function StudentAppealsPage() {
  const [reason, setReason] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    window.alert(
      'Your appeal would be sent to the review committee. You will see confirmation and next steps here when the system is live.'
    );
  }

  return (
    <PageShell pageTitle="Appeals" {...STUDENT_SHELL}>
      <PageIntro
        lead="If your application was not approved, you can ask for another review. Explain in simple words what we should reconsider."
      />

      <details className="collapsible-panel notice page-section--full" open>
        <summary className="collapsible-panel__summary">Current decision</summary>
        <p className="field__help" style={{ margin: 0 }}>
          Your 2025/2026 application was not approved because required documents were incomplete.
          You may appeal before <strong>30 June 2026</strong>.
        </p>
      </details>

      <section className="upload-panel page-section--full" aria-label="Submit your appeal">
        <h2 className="upload-panel__title">Submit your appeal</h2>
        <form onSubmit={handleSubmit} aria-label="Appeal form">
          <div className="field">
            <label htmlFor="reason">Why are you appealing?</label>
            <textarea
              id="reason"
              placeholder="Write your explanation clearly. For example: you uploaded the missing document after the deadline because..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="evidence">Attach supporting evidence (optional)</label>
            <input id="evidence" type="file" accept="image/*,application/pdf" />
            <p className="field__help">Photos or PDFs only. Do not upload passwords or OTP codes.</p>
          </div>

          <button type="submit" className="btn btn--primary">
            <Icon name="appeal" size={20} />
            Submit appeal
          </button>
        </form>
      </section>
    </PageShell>
  );
}
