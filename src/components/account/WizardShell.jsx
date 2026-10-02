import React from 'react';
import { Icon } from '../Icon.jsx';

export function WizardShell({
  title,
  description,
  steps,
  stepIndex,
  error,
  children,
  onBack,
  onNext,
  nextLabel = 'Continue',
  backLabel = 'Previous',
  nextDisabled,
  submitting,
  extraAction
}) {
  const current = steps[stepIndex];

  return (
    <section className="wizard-panel page-section--full" aria-label={title}>
      {title ? <h1>{title}</h1> : null}
      {description ? <p className="field__help">{description}</p> : null}

      <div className="wizard-progress" aria-hidden="true">
        {steps.map((step, idx) => (
          <div
            key={step.key}
            className={`wizard-progress__step ${idx <= stepIndex ? 'wizard-progress__step--active' : ''} ${idx < stepIndex ? 'wizard-progress__step--done' : ''}`}
          />
        ))}
      </div>
      <p className="wizard-step-label">
        Step {stepIndex + 1} of {steps.length}: {current?.title}
      </p>

      {error ? (
        <div className="notice" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', marginBottom: 16 }}>
          <strong>Could not continue</strong>
          <p>{error}</p>
        </div>
      ) : null}

      {children}

      <div className="btn-row" style={{ marginTop: 14 }}>
        {stepIndex > 0 ? (
          <button type="button" className="btn btn--secondary" onClick={onBack} disabled={submitting} style={{ borderRadius: 999, width: 'auto' }}>
            <Icon name="chevronLeft" size={18} />
            {backLabel}
          </button>
        ) : extraAction}
        <button
          type="button"
          className="btn btn--primary"
          onClick={onNext}
          disabled={nextDisabled || submitting}
          style={{ borderRadius: 999, width: 'auto', padding: '10px 24px' }}
        >
          {submitting ? 'Saving…' : nextLabel}
          <Icon name="chevronRight" size={18} />
        </button>
      </div>
      <p className="field__help" style={{ marginTop: 12 }}>
        Finished steps are stored on your account. If the network drops or the phone dies, you resume here — you are not asked to start over.
      </p>
    </section>
  );
}
