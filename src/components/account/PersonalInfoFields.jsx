import React from 'react';
import { VerifiedField } from './VerifiedField.jsx';

export function PersonalInfoFields({ values, onChange, includeAuth = false, idPrefix = '' }) {
  const id = (name) => `${idPrefix}${name}`;

  return (
    <>
      <VerifiedField
        id={id('firstName')}
        name="firstName"
        label="First name"
        value={values.firstName}
        onChange={(v) => onChange('firstName', v)}
        autoComplete="given-name"
      />
      <VerifiedField
        id={id('middleName')}
        name="middleName"
        label="Middle name"
        required={false}
        value={values.middleName}
        onChange={(v) => onChange('middleName', v)}
        autoComplete="additional-name"
      />
      <VerifiedField
        id={id('lastName')}
        name="lastName"
        label="Last name"
        value={values.lastName}
        onChange={(v) => onChange('lastName', v)}
        autoComplete="family-name"
      />
      <div className="field">
        <label htmlFor={id('gender')}>Gender</label>
        <select
          id={id('gender')}
          value={values.gender || ''}
          onChange={(e) => onChange('gender', e.target.value)}
          required
        >
          <option value="">Select</option>
          <option value="Female">Female</option>
          <option value="Male">Male</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <VerifiedField
        id={id('dateOfBirth')}
        name="dateOfBirth"
        label="Date of birth"
        type="date"
        value={values.dateOfBirth}
        onChange={(v) => onChange('dateOfBirth', v)}
      />
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
            id={id('phone')}
            name="phone"
            label="Phone number"
            type="tel"
            value={values.phone}
            onChange={(v) => onChange('phone', v)}
            placeholder="07XX XXX XXX"
            autoComplete="tel"
          />
          <VerifiedField
            id={id('nationalId')}
            name="nationalId"
            label="National ID number"
            value={values.nationalId}
            onChange={(v) => onChange('nationalId', v)}
            help="This must match the number printed on your identification card."
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
