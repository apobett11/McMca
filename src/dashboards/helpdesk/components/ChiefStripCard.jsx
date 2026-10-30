import React from 'react';

export function ChiefStripCard({
  title,
  value,
  statusBadge,
  statusTone = 'admitted', // 'admitted' | 'review' | 'declined'
  themeTone = 'gold', // 'gold' | 'cyan' | 'violet'
  isFocus = false,
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

  // Theme-specific accent colors
  const themeAccents = {
    gold: {
      border: isFocus ? '1px solid rgba(217, 119, 6, 0.5)' : '1px solid var(--glass-border)',
      glow: isFocus ? '0 8px 24px rgba(217, 119, 6, 0.18)' : '0 4px 12px rgba(0, 0, 0, 0.15)',
      fill: 'dash-strip-card__fill--gold',
      actionColor: '#d97706',
      headColor: '#f59e0b'
    },
    cyan: {
      border: isFocus ? '1px solid rgba(6, 182, 212, 0.55)' : '1px solid rgba(6, 182, 212, 0.2)',
      glow: isFocus ? '0 8px 24px rgba(6, 182, 212, 0.22)' : '0 4px 12px rgba(0, 0, 0, 0.15)',
      fill: '',
      fillGradient: 'linear-gradient(90deg, #06b6d4, #22d3ee)',
      actionColor: '#06b6d4',
      headColor: '#22d3ee'
    },
    violet: {
      border: isFocus ? '1px solid rgba(139, 92, 246, 0.55)' : '1px solid rgba(139, 92, 246, 0.2)',
      glow: isFocus ? '0 8px 24px rgba(139, 92, 246, 0.22)' : '0 4px 12px rgba(0, 0, 0, 0.15)',
      fill: '',
      fillGradient: 'linear-gradient(90deg, #8b5cf6, #a855f7)',
      actionColor: '#a855f7',
      headColor: '#c084fc'
    }
  };

  const currentTheme = themeAccents[themeTone] || themeAccents.gold;

  return (
    <div
      className="dash-strip-card"
      onClick={onAction}
      style={{
        cursor: onAction ? 'pointer' : 'default',
        border: currentTheme.border,
        boxShadow: currentTheme.glow,
        background: isFocus ? 'var(--surface-elevated, #1a2234)' : undefined,
        transform: isFocus ? 'scale(1.01)' : 'scale(1)',
        transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s ease, border-color 0.2s ease',
        ...style
      }}
      onMouseEnter={(e) => {
        if (onAction) {
          e.currentTarget.style.transform = 'translateY(-3px) scale(1.015)';
          e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.35)';
        }
      }}
      onMouseLeave={(e) => {
        if (onAction) {
          e.currentTarget.style.transform = isFocus ? 'scale(1.01)' : 'scale(1)';
          e.currentTarget.style.boxShadow = currentTheme.glow;
        }
      }}
      onMouseDown={(e) => {
        if (onAction) e.currentTarget.style.transform = 'scale(0.985)';
      }}
      onMouseUp={(e) => {
        if (onAction) e.currentTarget.style.transform = 'translateY(-3px) scale(1.015)';
      }}
    >
      <div className="dash-strip-card__head">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              className="dash-strip-card__label"
              style={{
                color: isFocus ? currentTheme.headColor : undefined,
                fontWeight: isFocus ? 700 : 600,
                letterSpacing: '0.06em'
              }}
            >
              {title}
            </span>
            {hasUpdate && <span className="card-update-dot" title="Pending updates" />}
          </div>
          <h3
            className="dash-strip-card__val"
            style={{
              fontSize: isFocus ? '1.45rem' : '1.25rem',
              color: isFocus ? '#ffffff' : 'var(--text)'
            }}
          >
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
              fillGradient || currentTheme.fillGradient
                ? ''
                : statusTone === 'admitted'
                ? 'dash-strip-card__fill--green'
                : currentTheme.fill
            }`}
            style={{
              width: `${Math.min(100, Math.max(0, pct))}%`,
              ...(fillGradient ? { background: fillGradient } : currentTheme.fillGradient ? { background: currentTheme.fillGradient } : {})
            }}
          />
        </div>
      )}

      <div className="dash-strip-card__foot">
        <span style={{ fontSize: '0.78rem' }}>{footInfo}</span>
        {actionText && (
          <span style={{ color: currentTheme.actionColor, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            {actionText} &gt;
          </span>
        )}
      </div>
    </div>
  );
}
