import React from 'react';

const META = {
  completed: { marker: 'done', symbol: '✓', desc: 'Completed' },
  current: { marker: 'current', symbol: '●', desc: 'In progress now' },
  upcoming: { marker: '', symbol: '○', desc: 'Coming next' }
};

export function TimelineDot({ label, state }) {
  const meta = META[state] || META.upcoming;

  return (
    <li className="timeline__item">
      <span
        className={`timeline__marker ${meta.marker ? `timeline__marker--${meta.marker}` : ''}`}
        aria-hidden="true"
      >
        {meta.symbol}
      </span>
      <div>
        <p className="timeline__label">{label}</p>
        <p className="timeline__desc">{meta.desc}</p>
      </div>
    </li>
  );
}
