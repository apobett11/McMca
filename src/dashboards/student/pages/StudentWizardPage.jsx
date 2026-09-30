import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StudentLayout } from '../components/StudentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { MinimalDocChecklist } from '../../../components/MinimalDocChecklist.jsx';
import { useStudentCase } from '../context/StudentCaseContext.jsx';
import { submitBursaryApplication } from '../../../lib/queries.js';
import { useAuth } from '../../../context/AuthContext.jsx';

export function StudentWizardPage() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { data, loading, error, refresh } = useStudentCase();
  const [school, setSchool] = useState(null);
  const [cycle, setCycle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const evaluation = data?.evaluation;
  const profile = data?.profile;
  const cycles = data?.cycles || [];
  const selectedCycle = cycle || cycles[0]?.label || '';
  const schoolName = school ?? profile?.school_name ?? '';
  const guardian = data?.guardians?.[0];

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError('');
    try {
      await submitBursaryApplication(userId, {
        cycle: selectedCycle,
        institutionName: schoolName
      });
    } catch (err) {
      setSubmitError(err.message || 'Could not send the application.');
      setSubmitting(false);
      return;
    }
    await refresh();
    navigate('/student/applications');
  }

  return (
    <StudentLayout pageTitle="New application" layout="dashboard">
      <Link className="back-link" to="/student/applications">
        <Icon name="chevronLeft" size={18} />
        Back to applications
      </Link>

      <div className="stitch-support-hero">
        <h1 className="stitch-support-hero__title" style={{ fontSize: 32 }}>Apply</h1>
        <p className="stitch-support-hero__desc">
          The application uses the ID, parent, and documents already on this profile. It is sent to the chief as pending.
        </p>
      </div>

      {loading ? (
        <div className="skeleton-wrap">
          <div className="skeleton skeleton--line" />
          <div className="skeleton skeleton--line-short" />
        </div>
      ) : error ? (
        <div className="notice" role="alert">
          <strong>Application unavailable</strong>
          <p>{error.message}</p>
        </div>
      ) : (
        <section className="wizard-panel page-section--full" aria-label="Apply">
          {!evaluation.profile.active ? (
            <>
              <p className="wizard-step-label">Profile inactive</p>
              <ul className="mini-checklist">
                {evaluation.profile.missing.map((item) => (
                  <li key={item.key} className="mini-checklist__item">
                    <span className="mini-checklist__label">
                      <Icon name="profile" size={16} /> {item.label}
                      <span className="field__help">{item.hint}</span>
                    </span>
                    <span className="mini-checklist__mark mini-checklist__mark--missing" aria-label="Missing">
                      <Icon name="rejected" size={14} />
                    </span>
                  </li>
                ))}
              </ul>
              <Link className="btn btn--primary" to="/student/profile" style={{ borderRadius: 999, width: 'auto', padding: '10px 24px' }}>
                <Icon name="profile" size={18} />
                Activate profile
              </Link>
            </>
          ) : evaluation.applicationNeeds.length ? (
            <>
              <p className="wizard-step-label">Documents still needed</p>
              <MinimalDocChecklist
                items={evaluation.checklist
                  .filter((item) => item.requiredToApply)
                  .map((item) => ({
                    label: item.label,
                    status: item.satisfied ? 'ok' : 'missing'
                  }))}
              />
              <Link className="btn btn--primary" to="/student/documents" style={{ borderRadius: 999, width: 'auto', padding: '10px 24px' }}>
                <Icon name="upload" size={18} />
                Upload documents
              </Link>
            </>
          ) : evaluation.openApplication ? (
            <>
              <p className="wizard-step-label">Application already open</p>
              <p className="field__help">{evaluation.blockReason}</p>
              <Link className="btn btn--secondary" to="/student/applications" style={{ borderRadius: 999, width: 'auto' }}>
                View application
              </Link>
            </>
          ) : (
            <>
              <p className="wizard-step-label">Confirm and send to the chief</p>
              {submitError ? (
                <div className="notice" role="alert">
                  <strong>Not sent</strong>
                  <p>{submitError}</p>
                </div>
              ) : null}
              <dl className="detail-grid">
                <div className="detail-grid__row">
                  <dt>Student</dt>
                  <dd>{[profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ') || '—'}</dd>
                </div>
                <div className="detail-grid__row">
                  <dt>Parent</dt>
                  <dd>{guardian ? `${guardian.full_name} · ${guardian.phone_number}` : '—'}</dd>
                </div>
              </dl>
              <div className="field">
                <label htmlFor="schoolName">School</label>
                <input
                  id="schoolName"
                  value={schoolName}
                  onChange={(event) => setSchool(event.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="cycle">Bursary cycle</label>
                <select id="cycle" value={selectedCycle} onChange={(event) => setCycle(event.target.value)}>
                  {cycles.map((item) => (
                    <option key={item.label} value={item.label}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <MinimalDocChecklist
                items={evaluation.checklist.map((item) => ({
                  label: item.locked ? `${item.label} (kept)` : item.label,
                  status: item.satisfied ? 'ok' : 'missing'
                }))}
              />
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleSubmit}
                disabled={!evaluation.canApply || submitting || !schoolName.trim()}
                style={{ borderRadius: 999, width: 'auto', padding: '10px 24px' }}
              >
                <Icon name="arrowRight" size={18} />
                {submitting ? 'Sending…' : 'Send to chief'}
              </button>
            </>
          )}
        </section>
      )}
    </StudentLayout>
  );
}
