import React from 'react';

export function RefreshButton({ onClick, busy, children = 'Refresh' }) {
  return (
    <button
      type="button"
      className="btn btn--secondary btn--compact"
      onClick={() => {
        const result = onClick?.();
        if (result && typeof result.then === 'function') result.catch(() => {});
      }}
      disabled={busy}
    >
      {busy ? 'Refreshing…' : children}
    </button>
  );
}
