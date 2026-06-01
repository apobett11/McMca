import React, { useEffect, useState } from 'react';
import { CLARIFICATION_REASONS, REJECTION_REASONS } from '../../data/chiefMock.js';

export function ReviewActionModal({ open, onClose, action, title, onSubmit }) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) {
      setReason('');
      setNotes('');
      return undefined;
    }

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const reasons = action === 'reject' ? REJECTION_REASONS : CLARIFICATION_REASONS;
  const requiresReason = action === 'reject' || action === 'clarify';
  const submitLabel =
    action === 'approve' ? 'Approve' : action === 'reject' ? 'Reject' : 'Send clarification request';
  const submitClass =
    action === 'approve'
      ? 'btn btn--primary'
      : action === 'reject'
        ? 'btn btn--danger'
        : 'btn btn--accent';

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit?.({ reason, notes });
    onClose();
    window.alert(
      `${submitLabel} recorded — demo only. In production this updates the application and notifies the student/parent.`
    );
  }

  return (
    <div className="modal-root" role="dialog" aria-modal="true" aria-labelledby="review-action-title">
      <button type="button" className="modal-root__backdrop" onClick={onClose} aria-label="Close" />
      <div className="modal-panel modal-panel--wide">
        <div className="modal-panel__header">
          <h2 className="modal-panel__title" id="review-action-title">
            {title}
          </h2>
          <button type="button" className="modal-panel__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form className="modal-panel__body review-action-form" onSubmit={handleSubmit}>
          {requiresReason ? (
            <div className="field">
              <label htmlFor="reviewReason">
                {action === 'reject' ? 'Rejection reason' : 'Clarification reason'}
              </label>
              <select
                id="reviewReason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              >
                <option value="">Select a reason</option>
                {reasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="field">
            <label htmlFor="reviewNotes">
              {action === 'approve' ? 'Review notes (optional)' : 'Notes'}
            </label>
            <textarea
              id="reviewNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                action === 'approve'
                  ? 'Optional notes for the review record…'
                  : 'Add details for the student and parent…'
              }
              rows={4}
              required={action === 'clarify' && reason === 'Other — specify in notes'}
            />
          </div>

          <div className="btn-row">
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={submitClass}>
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
