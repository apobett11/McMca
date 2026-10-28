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
  saveStatus = 'idle',
  extraAction,
  embedded = false,
  onStepSelect,
  canSelectStep,
  completedKeys = [],
  hideBack = false
}) {
  const showBack = !hideBack && stepIndex > 0;

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
          completedKeys={completedKeys}
        />
      ) : null}

      {error ? (
        <div className="notice" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', marginBottom: 16 }}>
          <p>{error}</p>
        </div>
      ) : null}

      <div key={steps?.[stepIndex]?.key || stepIndex} className="wizard-step-pane">
        {children}
      </div>

      {/* Button Row: Back on very left, Complete/Next on far right */}
      <div style={{
        marginTop: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        gap: 16
      }}>
        <div>
          {showBack ? (
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onBack}
              disabled={submitting || saveStatus === 'success'}
              style={{ borderRadius: 999, width: 'auto', padding: '10px 22px' }}
            >
              <Icon name="chevronLeft" size={18} />
              {backLabel}
            </button>
          ) : (
            extraAction || <span />
          )}
        </div>

        <div>
          <button
            type="button"
            className={`btn btn--primary wizard-next-btn ${saveStatus === 'success' ? 'wizard-next-btn--success' : ''}`}
            onClick={onNext}
            disabled={nextDisabled || submitting || saveStatus === 'success'}
            style={{ borderRadius: 999, width: 'auto', padding: '10px 24px' }}
          >
            {saveStatus === 'success' ? (
              <>
                <Icon name="approved" size={18} />
                Completed!
              </>
            ) : submitting ? (
              'Saving…'
            ) : (
              <>
                {nextLabel}
                <Icon name="chevronRight" size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
