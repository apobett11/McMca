import React from 'react';
import { educationLevelOptions } from '../../lib/accountAllocation';
import { VerifiedField } from './VerifiedField.jsx';

export function InstitutionFields({ values, onChange, errors = {}, idPrefix = 'sch-' }) {
  const id = (name) => `${idPrefix}${name}`;
  return (
    <>
      <VerifiedField
        id={id('schoolName')}
        name="schoolName"
        label="School or institution"
        value={values.schoolName}
        error={errors.schoolName}
        onChange={(v) => onChange('schoolName', v)}
      />
      <div className={`field ${errors.schoolLevel ? 'field--invalid' : ''}`}>
        <label htmlFor={id('schoolLevel')}>School level</label>
        <select
          id={id('schoolLevel')}
          value={values.schoolLevel || ''}
          onChange={(e) => onChange('schoolLevel', e.target.value)}
          required
          aria-invalid={Boolean(errors.schoolLevel)}
          className={errors.schoolLevel ? 'is-invalid' : ''}
        >
          <option value="">Select</option>
          {educationLevelOptions().map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        {errors.schoolLevel ? <p className="field__error-msg">{errors.schoolLevel}</p> : null}
      </div>
      <VerifiedField
        id={id('admissionNumber')}
        name="admissionNumber"
        label="Admission number"
        value={values.admissionNumber}
        error={errors.admissionNumber}
        onChange={(v) => onChange('admissionNumber', v)}
      />
      <VerifiedField
        id={id('bankName')}
        name="bankName"
        label="Bank name"
        value={values.bankName}
        error={errors.bankName}
        onChange={(v) => onChange('bankName', v)}
      />
      <VerifiedField
        id={id('bankBranch')}
        name="bankBranch"
        label="Bank branch"
        value={values.bankBranch}
        error={errors.bankBranch}
        onChange={(v) => onChange('bankBranch', v)}
      />
      <VerifiedField
        id={id('accountNumber')}
        name="accountNumber"
        label="Account number"
        value={values.accountNumber}
        error={errors.accountNumber}
        onChange={(v) => onChange('accountNumber', v)}
      />
    </>
  );
}
