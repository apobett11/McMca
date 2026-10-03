import React from 'react';

export function WizardStepsBar({ steps, stepIndex, onSelect, canSelect, completedKeys = [] }) {
  const current = steps[stepIndex];
  const completed = new Set(completedKeys);
  return (
    <div className="wizard-steps-bar">
      <p className="wizard-steps-bar__now">
        {current?.title || 'Continue'}
      </p>
      <ol className="wizard-steps-bar__list">
        {steps.map((step, idx) => {
          const isDone = completed.has(step.key);
          const isCurrent = idx === stepIndex;
          const state = isCurrent ? 'current' : isDone ? 'done' : 'todo';
          const selectable = Boolean(onSelect) && (canSelect ? canSelect(idx) : true);
          const mark = isDone ? '✓' : idx + 1;
          return (
            <li
              key={step.key}
              className={`wizard-steps-bar__item wizard-steps-bar__item--${state} ${isDone ? 'wizard-steps-bar__item--is-done' : ''}`}
            >
              {selectable ? (
                <button
                  type="button"
                  className="wizard-steps-bar__jump"
                  onClick={() => onSelect(idx)}
                  title={`Go to ${step.title}`}
                >
                  <span className={`wizard-steps-bar__n ${isDone ? 'wizard-steps-bar__n--done' : ''}`}>{mark}</span>
                  <span className="wizard-steps-bar__label">{step.title}</span>
                </button>
              ) : (
                <>
                  <span className={`wizard-steps-bar__n ${isDone ? 'wizard-steps-bar__n--done' : ''}`}>{mark}</span>
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
