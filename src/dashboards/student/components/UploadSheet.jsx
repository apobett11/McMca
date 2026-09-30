import React, { useState } from 'react';
import { Icon } from '../../../components/Icon.jsx';
import { verifyUpload } from '../../../domain/inlineVerification.js';
import { uploadStudentDocument } from '../../../lib/queries.js';
import { useAuth } from '../../../context/AuthContext.jsx';

export function UploadSheet({ open, requirement, guardianId, onClose, onUploaded }) {
  const { userId } = useAuth();
  const [file, setFile] = useState(null);
  const [inline, setInline] = useState(null);
  const [checking, setChecking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  if (!open || !requirement) return null;

  async function onFile(next) {
    setFile(next);
    setError('');
    setInline(null);
    if (!next) return;
    setChecking(true);
    try {
      setInline(await verifyUpload(next));
    } finally {
      setChecking(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!inline?.passed || !file) return;
    setUploading(true);
    setError('');
    try {
      await uploadStudentDocument(userId, null, requirement.key, file, {
        guardianId: guardianId || null,
        scope: requirement.scope,
        inline
      });
      setFile(null);
      setInline(null);
      onUploaded?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="modal-root" role="presentation">
      <button type="button" className="modal-root__backdrop" onClick={onClose} aria-label="Close" />
      <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="upload-sheet-title">
        <header className="modal-panel__header">
          <h2 id="upload-sheet-title" className="modal-panel__title">
            {requirement.label}
          </h2>
          <button type="button" className="modal-panel__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <form className="modal-panel__body" onSubmit={handleSubmit}>
          <p className="field__help" style={{ marginTop: 0 }}>
            {requirement.hint} A photo or a PDF scan is checked before it is saved.
          </p>
          {error ? (
            <div className="notice" role="alert">
              <strong>Upload stopped</strong>
              <p>{error}</p>
            </div>
          ) : null}
          <div className="field">
            <label htmlFor="channelFile">Photo or scan</label>
            <input
              id="channelFile"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(event) => onFile(event.target.files?.[0] || null)}
              required
            />
          </div>
          {checking ? <p className="field__help">Checking the file…</p> : null}
          {inline ? (
            <ul className="mini-checklist" aria-label="Inline check">
              {inline.passed ? (
                <li className="mini-checklist__item">
                  <span className="mini-checklist__label">Readable file</span>
                  <span className="mini-checklist__mark mini-checklist__mark--ok" aria-label="Passed">
                    <Icon name="check" size={14} />
                  </span>
                </li>
              ) : (
                inline.checks.map((check) => (
                  <li key={check} className="mini-checklist__item">
                    <span className="mini-checklist__label">{check}</span>
                    <span className="mini-checklist__mark mini-checklist__mark--error" aria-label="Failed">
                      <Icon name="rejected" size={14} />
                    </span>
                  </li>
                ))
              )}
            </ul>
          ) : null}
          <button
            type="submit"
            className="btn btn--primary"
            disabled={!inline?.passed || uploading}
            style={{ borderRadius: 999, width: 'auto', padding: '10px 24px' }}
          >
            <Icon name="upload" size={18} />
            {uploading ? 'Saving…' : 'Save document'}
          </button>
        </form>
      </div>
    </div>
  );
}
