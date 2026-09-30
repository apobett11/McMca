import React from 'react';

const WIDTH = 320;
const HEIGHT = 140;
const PAD_BOTTOM = 18;
const PAD_TOP = 8;

/** Paired weekly bars: two series per week, drawn to one shared scale. */
export function TrendChart({ points = [], series, formatLabel = String, label }) {
  if (!points.length) return <p className="empty-state">No activity yet.</p>;

  const max = Math.max(1, ...points.flatMap((point) => series.map((item) => Number(point[item.key]) || 0)));
  const slot = WIDTH / points.length;
  const barWidth = Math.max(3, (slot - 6) / series.length);
  const plotHeight = HEIGHT - PAD_BOTTOM - PAD_TOP;
  const labelEvery = Math.ceil(points.length / 6);

  return (
    <figure className="mca-trend">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="mca-trend__chart" role="img" aria-label={label}>
        <line x1="0" x2={WIDTH} y1={HEIGHT - PAD_BOTTOM} y2={HEIGHT - PAD_BOTTOM} className="mca-trend__axis" />
        {points.map((point, pointIndex) => (
          <g key={point.week}>
            {series.map((item, seriesIndex) => {
              const valueHeight = ((Number(point[item.key]) || 0) / max) * plotHeight;
              return (
                <rect
                  key={item.key}
                  x={pointIndex * slot + 3 + seriesIndex * barWidth}
                  y={HEIGHT - PAD_BOTTOM - valueHeight}
                  width={barWidth - 1}
                  height={valueHeight}
                  rx="1.5"
                  className={`mca-trend__bar mca-series-${seriesIndex}`}
                >
                  <title>{`${formatLabel(point.week)} · ${item.label}: ${point[item.key]}`}</title>
                </rect>
              );
            })}
            {pointIndex % labelEvery === 0 ? (
              <text x={pointIndex * slot + slot / 2} y={HEIGHT - 4} className="mca-trend__tick">
                {formatLabel(point.week)}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
      <figcaption className="mca-legend mca-legend--inline">
        {series.map((item, index) => (
          <span key={item.key} className="mca-legend__item">
            <span className={`mca-legend__swatch mca-series-${index}`} aria-hidden="true" />
            <span className="mca-legend__label">{item.label}</span>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
