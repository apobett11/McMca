import React, { useEffect, useState } from 'react';

const RELATIONSHIPS = ['Mother', 'Father', 'Guardian', 'Other'];
const EDUCATION_LEVELS = ['Primary', 'Secondary', 'Tertiary'];

export function AddChildModal({ open, onClose, onAdded }) {
  const [delegated, setDelegated] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
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

  function handleSubmit(e) {
    e.preventDefault();
    onAdded?.();
    onClose();
    window.alert(
      'Child link request submitted. Verification will complete in the live system — demo only.'
    );
  }

  return (
    <div className="modal-root" role="dialog" aria-modal="true" aria-labelledby="add-child-title">
      <button type="button" className="modal-root__backdrop" onClick={onClose} aria-label="Close" />
      <div className="modal-panel modal-panel--wide">
        <div className="modal-panel__header">
          <h2 className="modal-panel__title" id="add-child-title">
            Link a child
          </h2>
          <button type="button" className="modal-panel__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form className="modal-panel__body add-child-form" onSubmit={handleSubmit}>
          <p className="add-child-form__intro">
            Add a dependent student to your household. Operational tasks stay in their student
            dashboard after linking.
          </p>

          <div className="field">
            <label htmlFor="childName">Full name</label>
            <input id="childName" name="fullName" required placeholder="Student full name" />
          </div>
          <div className="field">
            <label htmlFor="childDob">Date of birth</label>
            <input id="childDob" name="dob" type="date" required />
          </div>
          <div className="field">
            <label htmlFor="childLevel">Education level</label>
            <select id="childLevel" name="educationLevel" required>
              {EDUCATION_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="childSchool">School</label>
            <input id="childSchool" name="school" required placeholder="Institution name" />
          </div>
          <div className="field">
            <label htmlFor="childGrade">Grade / form / year</label>
            <input id="childGrade" name="grade" required placeholder="e.g. Grade 7, Form 2" />
          </div>
          <div className="field">
            <label htmlFor="admissionNo">Admission number</label>
            <input id="admissionNo" name="admissionNumber" required />
          </div>
          <div className="field">
            <label htmlFor="birthCert">Birth certificate number</label>
            <input id="birthCert" name="birthCertificate" required />
          </div>
          <div className="field">
            <label htmlFor="nationalId">National ID (optional)</label>
            <input id="nationalId" name="nationalId" />
          </div>
          <div className="field">
            <label htmlFor="studentPhone">Student phone (optional)</label>
            <input id="studentPhone" name="studentPhone" type="tel" />
          </div>
          <div className="field">
            <label htmlFor="relationship">Parent relationship type</label>
            <select id="relationship" name="relationship" required>
              {RELATIONSHIPS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="add-child-form__toggle card card--toggle">
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={delegated}
                onChange={(e) => setDelegated(e.target.checked)}
              />
              <span>
                <strong>Delegated access</strong>
                <small>Allow the student to log in independently</small>
              </span>
            </label>
          </div>

          {delegated ? (
            <div className="add-child-form__delegated">
              <div className="field">
                <label htmlFor="username">Username</label>
                <input id="username" name="username" required={delegated} />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" required={delegated} />
              </div>
              <div className="field">
                <label htmlFor="verifyPhone">Phone for verification</label>
                <input id="verifyPhone" name="verifyPhone" type="tel" required={delegated} />
              </div>
            </div>
          ) : null}

          <div className="btn-row">
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              Link child
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
