import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VerifiedField } from './VerifiedField.jsx';

export function PersonalInfoFields({
  values,
  onChange,
  errors = {},
  includeAuth = false,
  includeContact = true,
  idPrefix = '',
  isStudent = false
}) {
  const navigate = useNavigate();
  const [showNoIdModal, setShowNoIdModal] = useState(false);
  const id = (name) => `${idPrefix}${name}`;

  return (
    <>
      {/* For Student Register: National ID is the very first input with immediate "I don't have an ID" button */}
      {isStudent && (
        <div className={`field ${errors.nationalId ? 'field--invalid' : ''}`} style={{ marginBottom: 16 }}>
          <label htmlFor={id('nationalId')}>National ID number</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
            <input
              id={id('nationalId')}
              name="nationalId"
              type="text"
              value={values.nationalId || ''}
              onChange={(e) => onChange('nationalId', e.target.value)}
              placeholder="e.g. 40112233"
              required
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() => setShowNoIdModal(true)}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid rgba(239, 68, 68, 0.4)',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#F87171',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              I don't have an ID
            </button>
          </div>
          {errors.nationalId ? <p className="field__error-msg">{errors.nationalId}</p> : null}
        </div>
      )}

      {/* No ID Popup Prompt */}
      {showNoIdModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(11, 17, 32, 0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              background: '#1E293B',
              borderRadius: 20,
              maxWidth: 480,
              width: '100%',
              padding: '28px 24px',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
              color: '#E2E8F0',
              fontFamily: 'inherit'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#F87171',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#FFFFFF' }}>
                National ID Required for Student Application
              </h3>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 12,
              padding: '14px 16px',
              marginBottom: 18,
              border: '1px solid rgba(148, 163, 184, 0.12)',
              fontSize: 13,
              lineHeight: 1.55,
              color: '#CBD5E1'
            }}>
              <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#F87171' }}>
                Why lack of ID will cause application to fail:
              </p>
              <ul style={{ margin: 0, paddingLeft: 18, color: '#94A3B8' }}>
                <li style={{ marginBottom: 4 }}>Independent student bursary applications require an official Kenyan National ID under Public Finance Management (PFM) regulations.</li>
                <li style={{ marginBottom: 4 }}>Without a National ID, independent verification, identity vetting, and statutory bank auditing cannot be performed.</li>
                <li>Learners without a National ID cannot register an independent account and must have their bursary submitted through a parent or guardian.</li>
              </ul>
            </div>

            <div style={{
              background: 'rgba(37, 99, 235, 0.08)',
              borderRadius: 12,
              padding: '14px 16px',
              marginBottom: 22,
              border: '1px solid rgba(59, 130, 246, 0.25)'
            }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#60A5FA', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                What to do
              </h4>
              <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#E2E8F0', lineHeight: 1.6 }}>
                <li style={{ fontWeight: 600, marginBottom: 4 }}>Register online</li>
                <li style={{ fontWeight: 600, marginBottom: 4 }}>Setup parent's documents</li>
                <li style={{ fontWeight: 600, marginBottom: 4 }}>Register children below 18 years</li>
                <li style={{ fontWeight: 600, marginBottom: 4 }}>Upload documents for each child</li>
                <li style={{ fontWeight: 600 }}>Apply for the child</li>
              </ol>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowNoIdModal(false);
                navigate('/');
              }}
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                transition: 'all 0.15s ease'
              }}
            >
              I Agree
            </button>
          </div>
        </div>
      )}

      <VerifiedField
        id={id('firstName')}
        name="firstName"
        label="First name"
        value={values.firstName}
        error={errors.firstName}
        onChange={(v) => onChange('firstName', v)}
        autoComplete="given-name"
      />
      <VerifiedField
        id={id('middleName')}
        name="middleName"
        label="Middle name"
        required={false}
        value={values.middleName}
        error={errors.middleName}
        onChange={(v) => onChange('middleName', v)}
        autoComplete="additional-name"
      />
      <VerifiedField
        id={id('lastName')}
        name="lastName"
        label="Last name"
        value={values.lastName}
        error={errors.lastName}
        onChange={(v) => onChange('lastName', v)}
        autoComplete="family-name"
      />
      <div className={`field ${errors.gender ? 'field--invalid' : ''}`}>
        <label htmlFor={id('gender')}>Gender</label>
        <select
          id={id('gender')}
          value={values.gender || ''}
          onChange={(e) => onChange('gender', e.target.value)}
          required
          aria-invalid={Boolean(errors.gender)}
          className={errors.gender ? 'is-invalid' : ''}
        >
          <option value="">Select</option>
          <option value="Female">Female</option>
          <option value="Male">Male</option>
          <option value="Other">Other</option>
        </select>
        {errors.gender ? <p className="field__error-msg">{errors.gender}</p> : null}
      </div>
      <VerifiedField
        id={id('dateOfBirth')}
        name="dateOfBirth"
        label="Date of birth"
        type="date"
        value={values.dateOfBirth}
        error={errors.dateOfBirth}
        onChange={(v) => onChange('dateOfBirth', v)}
      />
      {includeContact ? (
        <>
          <VerifiedField
            id={id('phone')}
            name="phone"
            label="Phone number"
            type="tel"
            value={values.phone}
            error={errors.phone}
            onChange={(v) => onChange('phone', v)}
            placeholder="07XX XXX XXX"
            autoComplete="tel"
          />
          {!isStudent && (
            <VerifiedField
              id={id('nationalId')}
              name="nationalId"
              label="National ID number"
              value={values.nationalId}
              error={errors.nationalId}
              onChange={(v) => onChange('nationalId', v)}
            />
          )}
        </>
      ) : null}
      {isStudent ? (
        <>
          <div className={`field ${errors.parentStatus ? 'field--invalid' : ''}`} style={{ marginTop: 8 }}>
            <label htmlFor={id('parentStatus')}>Parents' status</label>
            <select
              id={id('parentStatus')}
              value={values.parentStatus || ''}
              onChange={(e) => onChange('parentStatus', e.target.value)}
              required
              aria-invalid={Boolean(errors.parentStatus)}
              className={errors.parentStatus ? 'is-invalid' : ''}
            >
              <option value="">Select parent status</option>
              <option value="both">Both parents present</option>
              <option value="single">Single parent</option>
              <option value="orphan">Orphan</option>
            </select>
            {errors.parentStatus ? <p className="field__error-msg">{errors.parentStatus}</p> : null}
            <p className="field__help">Indicate whether both parents are present, single parent, or orphan.</p>
          </div>

          {values.parentStatus === 'orphan' ? (
            <div style={{ marginTop: 12, marginBottom: 8, padding: 14, borderRadius: 12, border: '1px solid var(--glass-border, rgba(148,163,184,0.2))', background: 'rgba(255,255,255,0.02)' }}>
              <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                Custodian details (who will register as parent)
              </p>
              <VerifiedField
                id={id('custodianFirstName')}
                name="custodianFirstName"
                label="Custodian first name"
                value={values.custodianFirstName}
                error={errors.custodianFirstName}
                onChange={(v) => onChange('custodianFirstName', v)}
              />
              <VerifiedField
                id={id('custodianMiddleName')}
                name="custodianMiddleName"
                label="Custodian middle name"
                required={false}
                value={values.custodianMiddleName}
                error={errors.custodianMiddleName}
                onChange={(v) => onChange('custodianMiddleName', v)}
              />
              <VerifiedField
                id={id('custodianLastName')}
                name="custodianLastName"
                label="Custodian last name"
                value={values.custodianLastName}
                error={errors.custodianLastName}
                onChange={(v) => onChange('custodianLastName', v)}
              />
              <VerifiedField
                id={id('custodianPhone')}
                name="custodianPhone"
                label="Custodian phone number"
                type="tel"
                value={values.custodianPhone}
                error={errors.custodianPhone}
                onChange={(v) => onChange('custodianPhone', v)}
                placeholder="07XX XXX XXX"
              />
              <VerifiedField
                id={id('custodianNationalId')}
                name="custodianNationalId"
                label="Custodian National ID"
                value={values.custodianNationalId}
                error={errors.custodianNationalId}
                onChange={(v) => onChange('custodianNationalId', v)}
              />
            </div>
          ) : null}
        </>
      ) : null}
      {includeAuth ? (
        <>
          <VerifiedField
            id={id('email')}
            name="email"
            label="Email"
            type="email"
            value={values.email}
            onChange={(v) => onChange('email', v)}
            autoComplete="email"
          />
          <VerifiedField
            id={id('password')}
            name="password"
            label="Password"
            type="password"
            value={values.password}
            onChange={(v) => onChange('password', v)}
            autoComplete="new-password"
          />
        </>
      ) : null}
    </>
  );
}
