import React from 'react';

export function WizardStepsBar({ steps, stepIndex }) {
  const current = steps[stepIndex];
  return (
    <div className="wizard-steps-bar">
      <p className="wizard-steps-bar__now">
        Now: {current?.title || 'Continue'}
      </p>
      <ol className="wizard-steps-bar__list">
        {steps.map((step, idx) => {
          const state = idx < stepIndex ? 'done' : idx === stepIndex ? 'current' : 'todo';
          return (
            <li key={step.key} className={`wizard-steps-bar__item wizard-steps-bar__item--${state}`}>
              <span className="wizard-steps-bar__n">{idx < stepIndex ? '✓' : idx + 1}</span>
              <span className="wizard-steps-bar__label">{step.title}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
