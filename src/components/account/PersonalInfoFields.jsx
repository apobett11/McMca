import React from 'react';
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
  const id = (name) => `${idPrefix}${name}`;

  return (
    <>
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
          <VerifiedField
            id={id('nationalId')}
            name="nationalId"
            label="National ID number"
            value={values.nationalId}
            error={errors.nationalId}
            onChange={(v) => onChange('nationalId', v)}
          />
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
