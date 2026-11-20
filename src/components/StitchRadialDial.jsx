import React from 'react';

/**
 * Google Stitch Aetheric Concentric Radial Dial
 * Replaces bulky rectangular stat cards with high-precision,
 * compact circular gauges featuring glassmorphic reflection and SVG glow.
 */
export function StitchRadialDial({
  percentage = 0,
  secondaryPercentage = null,
  size = 78,
  strokeWidth = 6.5,
  color = '#00F0FF',
  secondaryColor = 'rgba(255, 255, 255, 0.2)',
  glowColor = null,
  label = '',
  sublabel = '',
  valueText = null,
  onClick = null,
  interactive = false,
  className = ''
}) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedPct = Math.min(100, Math.max(0, Number(percentage) || 0));
  const strokeDashoffset = circumference - (normalizedPct / 100) * circumference;

  // Secondary concentric inner ring (if provided)
  const innerRadius = radius - strokeWidth - 3;
  const innerCircumference = 2 * Math.PI * innerRadius;
  const secondaryNormalized = secondaryPercentage !== null ? Math.min(100, Math.max(0, Number(secondaryPercentage) || 0)) : null;
  const secondaryDashoffset = secondaryNormalized !== null ? innerCircumference - (secondaryNormalized / 100) * innerCircumference : null;

  const actualGlow = glowColor || color;
  const displayText = valueText !== null ? valueText : `${Math.round(normalizedPct)}%`;

  const containerStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 14,
    cursor: onClick || interactive ? 'pointer' : 'default',
    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
  };

  return (
    <div
      className={`stitch-radial-dial-wrap ${className}`}
      style={containerStyle}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(e); } : undefined}
    >
      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          flexShrink: 0,
          filter: `drop-shadow(0 0 10px ${actualGlow}33)`
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}
        >
          {/* Base Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
          />

          {/* Secondary Concentric Track (if present) */}
          {secondaryNormalized !== null && (
            <>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={innerRadius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.04)"
                strokeWidth={strokeWidth - 2}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={innerRadius}
                fill="none"
                stroke={secondaryColor}
                strokeWidth={strokeWidth - 2}
                strokeDasharray={innerCircumference}
                strokeDashoffset={secondaryDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
              />
            </>
          )}

          {/* Active Radial Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              filter: `drop-shadow(0 0 6px ${actualGlow}88)`
            }}
          />
        </svg>

        {/* Center Readout */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '"Sora", sans-serif',
            fontWeight: 800,
            fontSize: size < 70 ? '0.85rem' : '1.05rem',
            color: '#F8FAFC',
            letterSpacing: '-0.02em',
            pointerEvents: 'none'
          }}
        >
          <span>{displayText}</span>
        </div>
      </div>

      {/* Accompanying Label and Micro-copy */}
      {(label || sublabel) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          {label && (
            <div
              style={{
                fontFamily: '"Sora", sans-serif',
                fontWeight: 700,
                fontSize: '0.88rem',
                color: '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>{label}</span>
              {(onClick || interactive) && (
                <span style={{ fontSize: '0.72rem', color, opacity: 0.9 }}>↗</span>
              )}
            </div>
          )}
          {sublabel && (
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', lineHeight: 1.35 }}>
              {sublabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
