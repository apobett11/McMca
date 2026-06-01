import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell.jsx';
import { SectionCard } from '../components/SectionCard.jsx';
import { MinimalDocChecklist } from '../components/MinimalDocChecklist.jsx';
import { Icon } from '../components/Icon.jsx';
import { STUDENT_SHELL } from './studentShell.js';

const STEPS = ['Student details', 'Guardian contact', 'Review and submit'];

const DOC_ITEMS = [
  { label: 'Fee structure', status: 'missing' },
  { label: 'Student ID or birth certificate', status: 'ok' },
  { label: 'Admission / enrollment proof', status: 'ok' },
  { label: 'Guardian consent form', status: 'missing' }
];

export function WizardPage() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    institution: '',
    cycle: '2025/2026 Bursary Cycle',
    guardianName: '',
    guardianPhone: ''
  });

  const formsComplete = step >= 2 && form.firstName && form.institution && form.guardianName;

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function goNext() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    setSubmitted(true);
    window.alert(
      'Your application would be submitted securely. This demo stops here — you will get confirmation and next steps when the backend is connected.'
    );
  }

  function goBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  const docChecklist = DOC_ITEMS.map((doc) => ({
    ...doc,
    status: formsComplete && doc.status === 'missing' ? 'missing' : doc.status
  }));

  return (
    <PageShell pageTitle="Application" {...STUDENT_SHELL}>
      <Link className="back-link" to="/applications">
        <Icon name="chevronLeft" size={18} />
        Back to applications
      </Link>

      <MinimalDocChecklist items={docChecklist} />

      <SectionCard title="Application Wizard" titleLevel="h1">
        <div className="wizard-progress" aria-hidden="true">
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`wizard-progress__step ${idx <= step ? 'wizard-progress__step--active' : ''} ${idx < step ? 'wizard-progress__step--done' : ''}`}
            />
          ))}
        </div>
        <p className="wizard-step-label">
          Step {step + 1} of {STEPS.length}: {STEPS[step]}
        </p>
      </SectionCard>

      <SectionCard title="Form section">
        {step === 0 ? (
          <>
            <div className="field">
              <label htmlFor="firstName">Student first name</label>
              <input
                id="firstName"
                type="text"
                placeholder="e.g. Brian"
                value={form.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="lastName">Student last name</label>
              <input
                id="lastName"
                type="text"
                placeholder="e.g. Kamau"
                value={form.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="institution">Institution name</label>
              <input
                id="institution"
                type="text"
                placeholder="e.g. St. Mary Primary School"
                value={form.institution}
                onChange={(e) => updateField('institution', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="cycle">Bursary cycle</label>
              <select
                id="cycle"
                value={form.cycle}
                onChange={(e) => updateField('cycle', e.target.value)}
              >
                <option>2025/2026 Bursary Cycle</option>
                <option>2024/2025 Bursary Cycle</option>
              </select>
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <div className="field">
              <label htmlFor="guardianName">Parent or guardian name</label>
              <input
                id="guardianName"
                type="text"
                placeholder="Full name"
                value={form.guardianName}
                onChange={(e) => updateField('guardianName', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="guardianPhone">Phone number for updates</label>
              <input
                id="guardianPhone"
                type="tel"
                placeholder="e.g. 07XX XXX XXX"
                value={form.guardianPhone}
                onChange={(e) => updateField('guardianPhone', e.target.value)}
              />
              <p className="field__help">
                We will use this for OTP verification and important alerts only.
              </p>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <div role="region" aria-label="Review your details">
            <p className="field__help" style={{ marginTop: 0 }}>
              Please check your details before submitting.
            </p>
            <dl className="detail-grid">
              <div className="detail-grid__row">
                <dt>Student</dt>
                <dd>
                  {form.firstName || '—'} {form.lastName}
                </dd>
              </div>
              <div className="detail-grid__row">
                <dt>Institution</dt>
                <dd>{form.institution || '—'}</dd>
              </div>
              <div className="detail-grid__row">
                <dt>Cycle</dt>
                <dd>{form.cycle}</dd>
              </div>
              <div className="detail-grid__row">
                <dt>Guardian</dt>
                <dd>{form.guardianName || '—'}</dd>
              </div>
              <div className="detail-grid__row">
                <dt>Guardian phone</dt>
                <dd>{form.guardianPhone || '—'}</dd>
              </div>
            </dl>
          </div>
        ) : null}

        <div className="btn-row" style={{ marginTop: 14 }}>
          {step > 0 ? (
            <button type="button" className="btn btn--secondary" onClick={goBack}>
              <Icon name="chevronLeft" size={18} />
              Save &amp; previous
            </button>
          ) : null}
          <button type="button" className="btn btn--primary" onClick={goNext}>
            {step < STEPS.length - 1 ? 'Next step' : 'Submit application'}
            <Icon name="chevronRight" size={18} />
          </button>
        </div>
      </SectionCard>

      <SectionCard
        title="Document upload"
        className={!formsComplete ? 'section-card--locked' : ''}
      >
        {!formsComplete ? (
          <p className="field__help" style={{ margin: 0 }}>
            Complete all form steps above to unlock document uploads.
          </p>
        ) : (
          <>
            <p className="field__help" style={{ marginTop: 0 }}>
              Upload required documents after your application details are saved.
            </p>
            <Link className="btn btn--primary" to="/documents">
              <Icon name="upload" size={20} />
              Go to document uploads
            </Link>
          </>
        )}
      </SectionCard>

      {submitted ? (
        <div className="notice block" role="status">
          <strong>Success</strong>
          Your application has been recorded in this demo. You will receive confirmation when the
          live system is connected.
        </div>
      ) : null}
    </PageShell>
  );
}
