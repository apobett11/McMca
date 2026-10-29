import React from 'react';

export function TableSubpage({
  title,
  subtitle,
  category = 'Help Desk',
  onClose,
  children,
  badgeText,
  badgeTone = 'review',
  toolbar,
  action
}) {
  return (
    <div
      className="table-subpage hd-card"
      style={{
        background: '#070d18',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(221, 187, 106, 0.1)',
        borderRadius: 16,
        padding: 0,
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Top Header: Title, Category & Strictly Pinned Top-Right Close Button */}
      <div
        className="table-subpage__header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', color: '#94a3b8' }}>
              <span>{category}</span>
              <span>/</span>
              <span style={{ color: 'var(--gold-champagne, #ddbb6a)', fontWeight: 600 }}>{title}</span>
            </div>
            {badgeText && (
              <span className={`stitch-status-badge stitch-status-badge--${badgeTone}`} style={{ fontSize: '0.72rem' }}>
                {badgeText}
              </span>
            )}
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: '1.2rem',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.35 }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Top-Right Action Controls & Close Button */}
        <div
          className="table-subpage__top-actions"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginLeft: 'auto',
            flexShrink: 0
          }}
        >
          {action}
          <button
            type="button"
            onClick={onClose}
            className="hd-close-icon-btn"
            aria-label="Close table view and return to overview"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Inner Card Section for Toolbar and Table Content */}
      <div
        className="table-subpage__body"
        style={{
          margin: '14px 16px',
          background: '#0b1422',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          overflow: 'hidden'
        }}
      >
        {/* Consolidated Inline Toolbar at the Top of the Table */}
        {toolbar && (
          <div
            className="table-subpage__toolbar"
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.015)'
            }}
          >
            {toolbar}
          </div>
        )}

        {/* Table Content: flush with container */}
        <div className="table-subpage__content" style={{ padding: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
