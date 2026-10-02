import React from 'react';
import { educationLevelOptions } from '../../lib/accountAllocation';
import { VerifiedField } from './VerifiedField.jsx';

export function InstitutionFields({ values, onChange, idPrefix = 'sch-' }) {
  const id = (name) => `${idPrefix}${name}`;
  return (
    <>
      <VerifiedField
        id={id('schoolName')}
        name="schoolName"
        label="School or institution"
        value={values.schoolName}
        onChange={(v) => onChange('schoolName', v)}
      />
      <div className="field">
        <label htmlFor={id('schoolLevel')}>School level</label>
        <select
          id={id('schoolLevel')}
          value={values.schoolLevel || ''}
          onChange={(e) => onChange('schoolLevel', e.target.value)}
          required
        >
          <option value="">Select</option>
          {educationLevelOptions().map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
      <VerifiedField
        id={id('admissionNumber')}
        name="admissionNumber"
        label="Admission number"
        value={values.admissionNumber}
        onChange={(v) => onChange('admissionNumber', v)}
      />
      <VerifiedField
        id={id('bankName')}
        name="bankName"
        label="Bank name"
        value={values.bankName}
        onChange={(v) => onChange('bankName', v)}
      />
      <VerifiedField
        id={id('bankBranch')}
        name="bankBranch"
        label="Bank branch"
        value={values.bankBranch}
        onChange={(v) => onChange('bankBranch', v)}
      />
      <VerifiedField
        id={id('accountNumber')}
        name="accountNumber"
        label="Account number"
        value={values.accountNumber}
        onChange={(v) => onChange('accountNumber', v)}
      />
    </>
  );
}
