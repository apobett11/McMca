import React from 'react';
import { educationLevelOptions } from '../../lib/accountAllocation';
import { VerifiedField } from './VerifiedField.jsx';

export const KNOWN_INSTITUTIONS = [
  { name: 'Egerton University', level: 'tertiary', bankName: 'Kenya Commercial Bank', bankBranch: 'Egerton Branch', accountNumber: '1102345678' },
  { name: 'University of Nairobi', level: 'tertiary', bankName: 'Absa Bank Kenya', bankBranch: 'University Way', accountNumber: '0309876543' },
  { name: 'Kenyatta University', level: 'tertiary', bankName: 'National Bank of Kenya', bankBranch: 'KU Branch', accountNumber: '0102938475' },
  { name: 'Nakuru High School', level: 'secondary', bankName: 'Co-operative Bank', bankBranch: 'Nakuru Town', accountNumber: '0112948576' },
  { name: 'Moi High School Kabarak', level: 'secondary', bankName: 'Equity Bank', bankBranch: 'Nakuru West', accountNumber: '0310293847' },
  { name: 'Kuresoi Secondary School', level: 'secondary', bankName: 'Kenya Commercial Bank', bankBranch: 'Molo Branch', accountNumber: '1128374659' },
  { name: 'St. Mary Primary School', level: 'primary', bankName: 'Equity Bank', bankBranch: 'Nakuru Central', accountNumber: '0540192837' },
  { name: 'Kuresoi Primary School', level: 'primary', bankName: 'Post Bank', bankBranch: 'Molo', accountNumber: '0812938471' }
];

export function InstitutionFields({ values, onChange, errors = {}, idPrefix = 'sch-' }) {
  const id = (name) => `${idPrefix}${name}`;

  function handleSelectInstitution(e) {
    const selected = KNOWN_INSTITUTIONS.find((inst) => inst.name === e.target.value);
    if (selected) {
      onChange('schoolName', selected.name);
      onChange('schoolLevel', selected.level);
      if (selected.bankName) onChange('bankName', selected.bankName);
      if (selected.bankBranch) onChange('bankBranch', selected.bankBranch);
      if (selected.accountNumber && !values.accountNumber) onChange('accountNumber', selected.accountNumber);
    } else {
      onChange('schoolName', e.target.value);
    }
  }

  return (
    <>
      <div className="field">
        <label htmlFor={id('institutionDropdown')}>Select Institution</label>
        <select
          id={id('institutionDropdown')}
          value={KNOWN_INSTITUTIONS.some(i => i.name === values.schoolName) ? values.schoolName : ''}
          onChange={handleSelectInstitution}
        >
          <option value="">Choose an institution or type below</option>
          {KNOWN_INSTITUTIONS.map((inst) => (
            <option key={inst.name} value={inst.name}>{inst.name} ({inst.level})</option>
          ))}
        </select>
        <p className="field__help">Selecting an institution automatically pre-fills school level and bank details.</p>
      </div>

      <VerifiedField
        id={id('schoolName')}
        name="schoolName"
        label="School or institution name"
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
