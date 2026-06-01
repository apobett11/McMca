import React from 'react';

const STEP_META = {
  completed: { className: 'step-track__node--done', icon: '✓' },
  current: { className: 'step-track__node--current', icon: '●' },
  upcoming: { className: 'step-track__node--pending', icon: '○' },
  failed: { className: 'step-track__node--failed', icon: '✗' }
};

export function Timeline({ stages = [] }) {
  return (
    <div className="step-track" aria-label="Where you are in the process">
      <p className="step-track__heading">Where you are in the process</p>
      <ol className="step-track__list">
        {stages.map((stage, idx) => {
          const meta = STEP_META[stage.state] || STEP_META.upcoming;
          const connectorDone =
            stage.state === 'completed' ||
            (idx > 0 && stages[idx - 1]?.state === 'completed');

          return (
            <li
              key={`${stage.label}-${idx}`}
              className={`step-track__step ${connectorDone ? 'step-track__step--line-done' : ''}`}
            >
              <span
                className={`step-track__node ${meta.className}`}
                aria-hidden="true"
              >
                {meta.icon}
              </span>
              <span className="step-track__label">{stage.label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
