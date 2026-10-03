import React from 'react';
import { VerifiedField } from './VerifiedField.jsx';

export function PersonalInfoFields({
  values,
  onChange,
  errors = {},
  includeAuth = false,
  includeContact = true,
  idPrefix = ''
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
