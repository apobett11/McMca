import React from 'react';

export function AccountConfirmModal({
  isOpen,
  schoolName,
  bankName,
  accountNumber,
  bankBranch,
  onChangeInformation,
  onProceed
}) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-root modal-root--center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-account-title"
      style={{ zIndex: 10000 }}
    >
      <button
        type="button"
        className="modal-root__backdrop"
        onClick={onChangeInformation}
        aria-label="Close"
      />
      <div
        className="modal-panel"
        style={{
          maxWidth: 480,
          padding: '24px',
          borderRadius: 16,
          background: 'var(--card-bg, #1e293b)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          zIndex: 10001
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 20
            }}
          >
            ✓
          </div>
          <div>
            <h3
              id="confirm-account-title"
              style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc', fontWeight: 700 }}
            >
              Confirm Account Details
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Please review the school and bank disbursement details
            </p>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            borderRadius: 12,
            padding: '16px',
            marginBottom: 20
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <span
              style={{
                fontSize: '0.76rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#94a3b8',
                display: 'block',
                marginBottom: 2
              }}
            >
              School / Institution Name
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
              {schoolName || '—'}
            </span>
          </div>

          <div style={{ marginBottom: 12 }}>
            <span
              style={{
                fontSize: '0.76rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#94a3b8',
                display: 'block',
                marginBottom: 2
              }}
            >
              Bank Name
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
              {bankName || '—'}
            </span>
          </div>

          <div>
            <span
              style={{
                fontSize: '0.76rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#94a3b8',
                display: 'block',
                marginBottom: 2
              }}
            >
              Account Number
            </span>
            <span
              style={{
                fontSize: '1.08rem',
                fontWeight: 700,
                color: '#38bdf8',
                letterSpacing: '0.04em'
              }}
            >
              {accountNumber || '—'}
            </span>
          </div>

          {bankBranch ? (
            <div
              style={{
                marginTop: 12,
                paddingTop: 10,
                borderTop: '1px solid rgba(148, 163, 184, 0.12)'
              }}
            >
              <span
                style={{
                  fontSize: '0.76rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#94a3b8',
                  display: 'block',
                  marginBottom: 2
                }}
              >
                Bank Branch
              </span>
              <span style={{ fontSize: '0.92rem', color: '#cbd5e1' }}>{bankBranch}</span>
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onChangeInformation}
            style={{ borderRadius: 999, padding: '10px 18px', width: 'auto' }}
          >
            Change information
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={onProceed}
            style={{ borderRadius: 999, padding: '10px 22px', width: 'auto' }}
          >
            Okay, proceed
          </button>
        </div>
      </div>
    </div>
  );
}
