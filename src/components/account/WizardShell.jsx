import React from 'react';
import { Icon } from '../Icon.jsx';
import { WizardStepsBar } from './WizardStepsBar.jsx';

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
  backLabel = 'Back',
  nextDisabled,
  submitting,
  extraAction,
  embedded = false,
  onStepSelect,
  canSelectStep
}) {
  return (
    <section
      className={embedded ? 'wizard-panel wizard-panel--embedded' : 'wizard-panel page-section--full'}
      aria-label={title || 'Form'}
    >
      {title ? <h1 style={{ margin: '0 0 8px', fontSize: 22 }}>{title}</h1> : null}
      {description ? <p className="field__help" style={{ marginTop: 0 }}>{description}</p> : null}

      {steps?.length ? (
        <WizardStepsBar
          steps={steps}
          stepIndex={stepIndex}
          onSelect={onStepSelect}
          canSelect={canSelectStep}
        />
      ) : null}

      {error ? (
        <div className="notice" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', marginBottom: 16 }}>
          <p>{error}</p>
        </div>
      ) : null}

      {children}

      <div className="btn-row" style={{ marginTop: 18 }}>
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
    </section>
  );
}
