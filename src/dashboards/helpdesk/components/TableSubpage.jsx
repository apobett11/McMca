import React from 'react';
import { Icon } from '../../../components/Icon.jsx';

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
        overflow: 'hidden'
      }}
    >
      {/* Top Header of the Whole Popup Card */}
      <div
        className="table-subpage__header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          padding: '16px 22px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.02)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#94a3b8' }}>
            <span>{category}</span>
            <span>/</span>
            <span style={{ color: 'var(--gold-champagne, #ddbb6a)', fontWeight: 600 }}>{title}</span>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
            {title}
          </h2>
          {badgeText && (
            <span className={`stitch-status-badge stitch-status-badge--${badgeTone}`} style={{ fontSize: '0.74rem' }}>
              {badgeText}
            </span>
          )}
        </div>

        {/* Action (only if need be) & Small Icon Close Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {action}
          <button
            type="button"
            onClick={onClose}
            className="hd-close-icon-btn"
            aria-label="Close sub-page table and return to overview"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Inner Card within Popup: Table heads and sorts below it */}
      <div
        style={{
          margin: '18px 20px',
          background: '#0b1422',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          overflow: 'hidden'
        }}
      >
        {/* Toolbar / Sorts Bar */}
        {toolbar && (
          <div
            className="table-subpage__toolbar"
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(255, 255, 255, 0.02)'
            }}
          >
            {toolbar}
          </div>
        )}

        {/* Table Content */}
        <div className="table-subpage__content" style={{ padding: 16 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
