import React, { useEffect, useState } from 'react';
import { Icon } from '../../../components/Icon.jsx';
import { useSecureData } from '../../../lib/useSecureData.js';
import { fetchMcaApplication, mcaDecide, openMcaDocument } from '../../../lib/mcaQueries.js';
import { DOCUMENT_REQUIREMENTS, documentState } from '../../../domain/requirements.js';
import { formatDate, formatKes } from '../../../utils/format.js';
import { MCA_STAGE_BADGES } from './mcaStage.js';

const DOCUMENT_LABELS = Object.fromEntries(DOCUMENT_REQUIREMENTS.map((item) => [item.key, item.label]));

const DOCUMENT_STATE = {
  verified: { label: 'Verified', icon: 'approved' },
  inline_passed: { label: 'Checked on upload', icon: 'check' },
  rejected: { label: 'Rejected', icon: 'rejected' },
  missing: { label: 'Missing', icon: 'info' }
};

function Detail({ label, children }) {
  return (
    <div className="detail-grid__row">
      <dt>{label}</dt>
      <dd>{children || '—'}</dd>
    </div>
  );
}

function DecisionForm({ application, onDecided }) {
  const requested = Number(application.amount_requested) || 0;
  const [amount, setAmount] = useState(requested ? String(requested) : '');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');

  async function decide(action) {
    setError('');
    const value = Number(amount);
    if (action === 'approve' && (!value || value <= 0)) {
      setError('Enter the amount to allocate.');
      return;
    }
    if (action === 'approve' && requested && value > requested) {
      setError(`The allocation cannot exceed the ${formatKes(requested)} requested.`);
      return;
    }
    if (action === 'decline' && !note.trim()) {
      setError('Add a note so the student knows why the application was declined.');
      return;
    }
    setSaving(action);
    try {
      await mcaDecide(application.id, action, { amount: value, note: note.trim() });
      onDecided();
    } catch (err) {
      setError(err.message || 'The decision could not be saved.');
    } finally {
      setSaving('');
    }
  }

  return (
    <form className="review-action-form" onSubmit={(event) => event.preventDefault()}>
      <div className="field">
        <label htmlFor="mca-amount">Allocation (KES)</label>
        <input
          id="mca-amount"
          type="number"
          inputMode="numeric"
          min="1"
          max={requested || undefined}
          step="1"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="mca-note">Note to the student</label>
        <textarea
          id="mca-note"
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Required when declining"
        />
      </div>
      {error ? (
        <div className="notice" role="alert">
          <strong>Not saved</strong>
          <p>{error}</p>
        </div>
      ) : null}
      <div className="btn-row">
        <button type="button" className="btn btn--danger" disabled={!!saving} onClick={() => decide('decline')}>
          <Icon name="rejected" size={18} />
          {saving === 'decline' ? 'Declining…' : 'Decline'}
        </button>
        <button type="button" className="btn btn--primary" disabled={!!saving} onClick={() => decide('approve')}>
          <Icon name="approved" size={18} />
          {saving === 'approve' ? 'Approving…' : 'Approve'}
        </button>
      </div>
    </form>
  );
}

export function McaApplicationDrawer({ applicationId, onClose, onDecided }) {
  const { data, loading, error, refresh } = useSecureData(
    () => fetchMcaApplication(applicationId),
    [applicationId]
  );
  const [openError, setOpenError] = useState('');

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  async function openDocument(path) {
    setOpenError('');
    try {
      const url = await openMcaDocument(path);
      if (url) window.open(url, '_blank', 'noopener');
    } catch (err) {
      setOpenError(err.message || 'The document could not be opened.');
    }
  }

  function handleDecided() {
    refresh();
    onDecided();
  }

  const application = data?.application;
  const stage = MCA_STAGE_BADGES[application?.mca_stage];

  return (
    <div className="modal-root" role="dialog" aria-modal="true" aria-labelledby="mca-drawer-title">
      <button type="button" className="modal-root__backdrop" onClick={onClose} aria-label="Close" />
      <div className="modal-panel modal-panel--wide">
        <div className="modal-panel__header">
          <h2 className="modal-panel__title" id="mca-drawer-title">
            {application?.student_name || 'Application'}
          </h2>
          <button type="button" className="modal-panel__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-panel__body">
          {error ? (
            <div className="notice" role="alert">
              <strong>Could not load this application</strong>
              <p>{error.message}</p>
            </div>
          ) : loading && !application ? (
            <div className="skeleton-wrap">
              <div className="skeleton skeleton--line" />
              <div className="skeleton skeleton--line" />
              <div className="skeleton skeleton--line-short" />
            </div>
          ) : application ? (
            <div className="mca-page">
              <div>
                {stage ? <span className={stage.className}>{stage.label}</span> : null}
                {application.returning_beneficiary ? (
                  <span className="badge badge--info" style={{ marginLeft: 8 }}>Returning beneficiary</span>
                ) : null}
              </div>

              <dl className="detail-grid">
                <Detail label="Admission no.">{application.admission_number}</Detail>
                <Detail label="School">{application.school}</Detail>
                <Detail label="Education level">{application.education_level}</Detail>
                <Detail label="Ward">{application.ward}</Detail>
                <Detail label="Chief location">
                  {[application.location, application.sub_location].filter(Boolean).join(' · ')}
                </Detail>
                <Detail label="Polling station">{application.polling_station}</Detail>
                <Detail label="Cycle">{application.cycle}</Detail>
                <Detail label="Requested">{formatKes(application.amount_requested)}</Detail>
                {application.amount_allocated ? (
                  <Detail label="Allocated">{formatKes(application.amount_allocated)}</Detail>
                ) : null}
                <Detail label="Chief">
                  {[application.chief_name, formatDate(application.chief_approved_at)].filter(Boolean).join(' · ')}
                </Detail>
                {application.mca_decided_at ? (
                  <Detail label="Decided">{formatDate(application.mca_decided_at)}</Detail>
                ) : null}
                {application.mca_note ? <Detail label="Note">{application.mca_note}</Detail> : null}
              </dl>

              <section>
                <h3 className="section-card__title">
                  <Icon name="users" size={18} /> Parents and guardians
                </h3>
                {data.guardians.length ? (
                  <ul className="mca-legend">
                    {data.guardians.map((guardian) => (
                      <li key={guardian.id} className="mca-legend__item">
                        <span className="mca-legend__label">
                          {guardian.full_name}
                          {guardian.relationship ? ` · ${guardian.relationship}` : ''}
                        </span>
                        <span className="mca-legend__value">{guardian.phone_number}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mca-empty-note">No guardian on record.</p>
                )}
              </section>

              <section>
                <h3 className="section-card__title">
                  <Icon name="documents" size={18} /> Documents
                </h3>
                {data.documents.length ? (
                  <ul className="mca-legend">
                    {data.documents.map((document) => {
                      const state = DOCUMENT_STATE[documentState(document)];
                      return (
                        <li key={document.id} className="mca-legend__item">
                          <Icon name={state.icon} size={16} />
                          <span className="mca-legend__label">
                            {DOCUMENT_LABELS[document.document_type] || document.document_type} · {state.label}
                          </span>
                          {document.storage_path ? (
                            <button
                              type="button"
                              className="stitch-table-action"
                              onClick={() => openDocument(document.storage_path)}
                            >
                              View
                            </button>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mca-empty-note">No documents on record.</p>
                )}
                {openError ? (
                  <p className="mca-empty-note" role="alert">
                    {openError}
                  </p>
                ) : null}
              </section>

              {application.mca_stage === 'awaiting' ? (
                <section>
                  <h3 className="section-card__title">
                    <Icon name="review" size={18} /> Decision
                  </h3>
                  <DecisionForm key={application.id} application={application} onDecided={handleDecided} />
                </section>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
