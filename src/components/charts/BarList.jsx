import React from 'react';

/** Ranked horizontal bars. Each row shows the label, the value, and the share of the largest row. */
export function BarList({ items = [], format = String, meta, onSelect, emptyText = 'No data for this view.', label }) {
  if (!items.length) return <p className="empty-state">{emptyText}</p>;
  const max = Math.max(...items.map((item) => Number(item.value) || 0), 1);

  return (
    <ol className="mca-bars" aria-label={label}>
      {items.map((item) => {
        const width = `${Math.max(2, Math.round(((Number(item.value) || 0) / max) * 100))}%`;
        const content = (
          <>
            <span className="mca-bars__head">
              <span className="mca-bars__label">{item.label}</span>
              <span className="mca-bars__value">{format(item.value)}</span>
            </span>
            <span className="mca-bars__track" aria-hidden="true">
              <span className="mca-bars__fill" style={{ width }} />
            </span>
            {meta ? <span className="mca-bars__meta">{meta(item)}</span> : null}
          </>
        );
        return (
          <li key={item.label} className="mca-bars__row">
            {onSelect ? (
              <button type="button" className="mca-bars__button" onClick={() => onSelect(item)}>
                {content}
              </button>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ol>
  );
}
