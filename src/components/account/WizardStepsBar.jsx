import React from 'react';

export function WizardStepsBar({ steps, stepIndex, onSelect, canSelect }) {
  const current = steps[stepIndex];
  return (
    <div className="wizard-steps-bar">
      <p className="wizard-steps-bar__now">
        Now: {current?.title || 'Continue'}
      </p>
      <ol className="wizard-steps-bar__list">
        {steps.map((step, idx) => {
          const state = idx < stepIndex ? 'done' : idx === stepIndex ? 'current' : 'todo';
          const selectable = Boolean(onSelect) && (canSelect ? canSelect(idx) : true);
          const mark = idx < stepIndex ? '✓' : idx + 1;
          return (
            <li key={step.key} className={`wizard-steps-bar__item wizard-steps-bar__item--${state}`}>
              {selectable ? (
                <button type="button" className="wizard-steps-bar__jump" onClick={() => onSelect(idx)}>
                  <span className="wizard-steps-bar__n">{mark}</span>
                  <span className="wizard-steps-bar__label">{step.title}</span>
                </button>
              ) : (
                <>
                  <span className="wizard-steps-bar__n">{mark}</span>
                  <span className="wizard-steps-bar__label">{step.title}</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
