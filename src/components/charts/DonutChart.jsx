import React from 'react';

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Share of a whole. Segments use the `mca-series-N` color classes; the legend carries the numbers. */
export function DonutChart({ segments = [], centerValue, centerLabel, format = String, label, onSelect }) {
  const total = segments.reduce((sum, segment) => sum + (Number(segment.value) || 0), 0);
  if (!total) return <p className="empty-state">No data for this view.</p>;

  let offset = 0;
  return (
    <div className="mca-donut">
      <svg viewBox="0 0 100 100" className="mca-donut__chart" role="img" aria-label={label}>
        <circle cx="50" cy="50" r={RADIUS} className="mca-donut__base" />
        {segments.map((segment, index) => {
          const length = ((Number(segment.value) || 0) / total) * CIRCUMFERENCE;
          const circle = (
            <circle
              key={segment.label}
              cx="50"
              cy="50"
              r={RADIUS}
              className={`mca-donut__segment mca-series-${index % 6}`}
              strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
              strokeDashoffset={-offset}
            />
          );
          offset += length;
          return circle;
        })}
        <text x="50" y="48" className="mca-donut__value">
          {centerValue}
        </text>
        <text x="50" y="62" className="mca-donut__label">
          {centerLabel}
        </text>
      </svg>
      <ul className="mca-legend">
        {segments.map((segment, index) => {
          const body = (
            <>
              <span className={`mca-legend__swatch mca-series-${index % 6}`} aria-hidden="true" />
              <span className="mca-legend__label">{segment.label}</span>
              <span className="mca-legend__value">
                {format(segment.value)} · {Math.round(((Number(segment.value) || 0) / total) * 100)}%
              </span>
            </>
          );
          return (
            <li key={segment.label} className="mca-legend__item">
              {onSelect ? (
                <button type="button" className="mca-legend__button" onClick={() => onSelect(segment)}>
                  {body}
                </button>
              ) : (
                body
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
