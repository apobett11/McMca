import React, { useState } from 'react';
import { PageShell } from '../components/PageShell.jsx';
import { SectionCard } from '../components/SectionCard.jsx';
import { Icon } from '../components/Icon.jsx';
import { STUDENT_SHELL } from './studentShell.js';

export function AppealsPage() {
  const [reason, setReason] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    window.alert(
      'Your appeal would be sent to the review committee. You will see confirmation and next steps here when the system is live.'
    );
  }

  return (
    <PageShell pageTitle="Appeals" {...STUDENT_SHELL}>
      <SectionCard title="Appeals" titleLevel="h1">
        <p className="section-card__lead">
          If your application was not approved, you can ask for another review. Explain in simple
          words what we should reconsider.
        </p>
      </SectionCard>

      <SectionCard title="Current decision">
        <p className="field__help" style={{ margin: 0 }}>
          Your 2025/2026 application was not approved because required documents were incomplete.
          You may appeal before <strong>30 June 2026</strong>.
        </p>
      </SectionCard>

      <SectionCard title="Submit your appeal">
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
      </SectionCard>
    </PageShell>
  );
}
