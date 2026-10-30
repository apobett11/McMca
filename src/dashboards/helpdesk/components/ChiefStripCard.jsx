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

  // Theme-specific accent colors matching Linear / Stripe design precision
  const themeAccents = {
    gold: {
      border: isFocus ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
      glow: isFocus ? '0 10px 30px -4px rgba(217, 119, 6, 0.22), 0 0 0 1px rgba(245, 158, 11, 0.25)' : '0 4px 16px rgba(0, 0, 0, 0.2)',
      bg: isFocus ? 'linear-gradient(145deg, rgba(217, 119, 6, 0.12) 0%, #0d1527 100%)' : 'rgba(13, 21, 39, 0.75)',
      fill: 'dash-strip-card__fill--gold',
      fillGradient: 'linear-gradient(90deg, #d97706, #fbbf24)',
      actionColor: '#fbbf24',
      headColor: '#fbbf24'
    },
    cyan: {
      border: isFocus ? '1px solid rgba(34, 211, 238, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
      glow: isFocus ? '0 10px 30px -4px rgba(6, 182, 212, 0.22), 0 0 0 1px rgba(34, 211, 238, 0.25)' : '0 4px 16px rgba(0, 0, 0, 0.2)',
      bg: isFocus ? 'linear-gradient(145deg, rgba(6, 182, 212, 0.12) 0%, #0d1527 100%)' : 'rgba(13, 21, 39, 0.75)',
      fill: '',
      fillGradient: 'linear-gradient(90deg, #0891b2, #22d3ee)',
      actionColor: '#22d3ee',
      headColor: '#67e8f9'
    },
    violet: {
      border: isFocus ? '1px solid rgba(168, 85, 247, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
      glow: isFocus ? '0 10px 30px -4px rgba(139, 92, 246, 0.22), 0 0 0 1px rgba(168, 85, 247, 0.25)' : '0 4px 16px rgba(0, 0, 0, 0.2)',
      bg: isFocus ? 'linear-gradient(145deg, rgba(139, 92, 246, 0.12) 0%, #0d1527 100%)' : 'rgba(13, 21, 39, 0.75)',
      fill: '',
      fillGradient: 'linear-gradient(90deg, #7c3aed, #c084fc)',
      actionColor: '#c084fc',
      headColor: '#d8b4fe'
    }
  };

  const currentTheme = themeAccents[themeTone] || themeAccents.gold;

  return (
    <div
      className="dash-strip-card"
      onClick={onAction}
      role={onAction ? 'button' : undefined}
      tabIndex={onAction ? 0 : undefined}
      onKeyDown={(e) => {
        if (onAction && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onAction();
        }
      }}
      style={{
        cursor: onAction ? 'pointer' : 'default',
        border: currentTheme.border,
        boxShadow: currentTheme.glow,
        background: currentTheme.bg,
        borderRadius: 14,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: 148,
        transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease, border-color 0.2s ease',
        backdropFilter: 'blur(12px)',
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
      onMouseEnter={(e) => {
        if (onAction) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.22)';
          e.currentTarget.style.boxShadow = '0 14px 32px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 255, 255, 0.04)';
        }
      }}
      onMouseLeave={(e) => {
        if (onAction) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = currentTheme.border.replace('1px solid ', '');
          e.currentTarget.style.boxShadow = currentTheme.glow;
        }
      }}
    >
      <div className="dash-strip-card__head" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span
              className="dash-strip-card__label"
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: isFocus ? currentTheme.headColor : '#94a3b8'
              }}
            >
              {title}
            </span>
            {hasUpdate && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#ef4444',
                  boxShadow: '0 0 8px #ef4444'
                }}
                title="Pending updates"
              />
            )}
          </div>
          <h3
            className="dash-strip-card__val"
            style={{
              margin: 0,
              fontSize: '1.35rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#ffffff',
              fontFeatureSettings: '"tnum" 1',
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            {value}
          </h3>
        </div>
        {statusBadge && (
          <span
            className={`stitch-status-badge ${badgeClass}`}
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.02em',
              padding: '3px 8px',
              borderRadius: 6,
              whiteSpace: 'nowrap'
            }}
          >
            {statusBadge}
          </span>
        )}
      </div>

      {typeof pct === 'number' && (
        <div
          className="dash-strip-card__track"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{
            height: 4,
            width: '100%',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: 999,
            overflow: 'hidden',
            margin: '8px 0 12px'
          }}
        >
          <div
            className="dash-strip-card__fill"
            style={{
              height: '100%',
              width: `${Math.min(100, Math.max(0, pct))}%`,
              background: fillGradient || currentTheme.fillGradient,
              borderRadius: 999,
              transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          />
        </div>
      )}

      <div
        className="dash-strip-card__foot"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          fontSize: '0.76rem',
          color: '#94a3b8',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: 10,
          marginTop: 'auto'
        }}
      >
        <span style={{ truncate: true, flex: 1, minWidth: 0 }}>{footInfo}</span>
        {actionText && (
          <span
            style={{
              color: currentTheme.actionColor,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              whiteSpace: 'nowrap',
              fontSize: '0.75rem'
            }}
          >
            {actionText}
            <span style={{ fontSize: '0.9rem', lineHeight: 1 }}>&rarr;</span>
          </span>
        )}
      </div>
    </div>
  );
}
