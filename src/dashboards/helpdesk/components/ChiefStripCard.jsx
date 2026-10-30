import React from 'react';

export function ChiefStripCard({
  title,
  value,
  statusBadge,
  statusTone = 'admitted', // 'admitted' | 'review' | 'declined'
  pct = 100,
  fillGradient,
  footInfo,
  actionText = 'View Breakdown',
  onAction,
  hasUpdate = false,
  style
}) {
  const badgeClass =
    statusTone === 'admitted'
      ? 'stitch-status-badge--admitted'
      : statusTone === 'declined'
      ? 'stitch-status-badge--declined'
      : 'stitch-status-badge--review';

  return (
    <div
      className="dash-strip-card"
      onClick={onAction}
      style={{
        cursor: onAction ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        ...style
      }}
    >
      <div className="dash-strip-card__head">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="dash-strip-card__label">{title}</span>
            {hasUpdate && <span className="card-update-dot" title="Pending updates" />}
          </div>
          <h3 className="dash-strip-card__val">
            {value}
          </h3>
        </div>
        {statusBadge && (
          <span className={`stitch-status-badge ${badgeClass}`}>
            {statusBadge}
          </span>
        )}
      </div>

      {typeof pct === 'number' && (
        <div className="dash-strip-card__track" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
          <div
            className={`dash-strip-card__fill ${
              fillGradient
                ? ''
                : statusTone === 'admitted'
                ? 'dash-strip-card__fill--green'
                : 'dash-strip-card__fill--gold'
            }`}
            style={{
              width: `${Math.min(100, Math.max(0, pct))}%`,
              ...(fillGradient ? { background: fillGradient } : {})
            }}
          />
        </div>
      )}

      <div className="dash-strip-card__foot">
        <span>{footInfo}</span>
        {actionText && (
          <span style={{ color: '#d97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            {actionText} &gt;
          </span>
        )}
      </div>
    </div>
  );
}
