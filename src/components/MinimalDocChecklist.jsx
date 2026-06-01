import React from 'react';

/**
 * Compact document checklist: name on the left, ✓ or ✗ on the right.
 * status: 'ok' | 'missing' | 'error'
 */
export function MinimalDocChecklist({ items = [] }) {
  return (
    <ul className="mini-checklist" aria-label="Document checklist">
      {items.map((item) => {
        const isOk = item.status === 'ok';
        const isError = item.status === 'error';
        const markClass = isOk
          ? 'mini-checklist__mark--ok'
          : isError
            ? 'mini-checklist__mark--error'
            : 'mini-checklist__mark--missing';

        return (
          <li key={item.label} className="mini-checklist__item">
            <span className="mini-checklist__label">{item.label}</span>
            <span
              className={`mini-checklist__mark ${markClass}`}
              aria-label={
                isOk ? 'Uploaded' : isError ? 'Problem with upload' : 'Not uploaded'
              }
            >
              {isOk ? '✓' : '✗'}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
