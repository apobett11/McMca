import React, { useState } from 'react';
import { StudentLayout } from '../components/StudentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';

export function StudentAppealsPage() {
  const { userId } = useAuth();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const { error: insertError } = await supabase
        .from('appeals')
        .insert({
          user_id: userId,
          reason: reason.trim(),
          status: 'submitted'
        });
      if (insertError) throw insertError;
      setSubmitted(true);
      setReason('');
    } catch (err) {
      setError(err.message || 'Failed to submit appeal. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <StudentLayout pageTitle="Appeals" layout="dashboard">
      <div className="stitch-support-hero">
        <h1 className="stitch-support-hero__title">Appeals</h1>
        <p className="stitch-support-hero__desc">
          If your application was not approved, you can ask for another review. Explain in simple words what we should reconsider.
        </p>
      </div>

      <details className="collapsible-panel notice page-section--full" open>
        <summary className="collapsible-panel__summary">Current decision</summary>
        <p className="field__help" style={{ margin: 0 }}>
          Your application may require reconsideration. Submit an appeal explaining your case before the deadline.
        </p>
      </details>

      {error && (
        <div className="notice page-section--full" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
          <strong>Error</strong>
          <p>{error}</p>
        </div>
      )}

      {submitted ? (
        <div className="notice page-section--full" style={{ background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' }} role="status">
          <strong>Appeal Submitted</strong>
          <p>Your appeal has been received and will be reviewed by the committee. You will receive a notification with the outcome.</p>
        </div>
      ) : (
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

            <button
              type="submit"
              className="btn btn--primary"
              disabled={submitting}
              style={{ borderRadius: 999, width: 'auto', padding: '10px 24px' }}
            >
              <Icon name="appeal" size={20} />
              {submitting ? 'Submitting...' : 'Submit appeal'}
            </button>
          </form>
        </section>
      )}
    </StudentLayout>
  );
}