import React from 'react';
import { INCOME_OPTIONS, PARENT_STATUS_OPTIONS } from '../../lib/household.js';
import { VerifiedField } from './VerifiedField.jsx';

function NumberField({ id, label, value, onChange, required = true, error }) {
  return (
    <VerifiedField
      id={id}
      name={id}
      label={label}
      type="number"
      required={required}
      value={value}
      error={error}
      onChange={onChange}
    />
  );
}

export function FamilyFields({ values, onChange, errors = {}, idPrefix = 'fam-' }) {
  const id = (name) => `${idPrefix}${name}`;
  return (
    <>
      <NumberField id={id('childrenInFamily')} label="Children in the family" value={values.childrenInFamily} error={errors.childrenInFamily} onChange={(v) => onChange('childrenInFamily', v)} />
      <NumberField id={id('childrenInSchool')} label="Children currently in school" value={values.childrenInSchool} onChange={(v) => onChange('childrenInSchool', v)} required={false} />
      <NumberField id={id('childrenPrimary')} label="In primary school" value={values.childrenPrimary} onChange={(v) => onChange('childrenPrimary', v)} required={false} />
      <NumberField id={id('childrenSecondary')} label="In secondary school" value={values.childrenSecondary} onChange={(v) => onChange('childrenSecondary', v)} required={false} />
      <NumberField id={id('childrenTertiary')} label="In college, TVET or university" value={values.childrenTertiary} onChange={(v) => onChange('childrenTertiary', v)} required={false} />
      <div className={`field ${errors.parentStatus ? 'field--invalid' : ''}`}>
        <label htmlFor={id('parentStatus')}>Parents in the household</label>
        <select
          id={id('parentStatus')}
          value={values.parentStatus || ''}
          onChange={(e) => onChange('parentStatus', e.target.value)}
          required
          aria-invalid={Boolean(errors.parentStatus)}
          className={errors.parentStatus ? 'is-invalid' : ''}
        >
          <option value="">Select</option>
          {PARENT_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        {errors.parentStatus ? <p className="field__error-msg">{errors.parentStatus}</p> : null}
      </div>
      <VerifiedField id={id('fatherOccupation')} name="fatherOccupation" label="Father's occupation" required={false} value={values.fatherOccupation} onChange={(v) => onChange('fatherOccupation', v)} />
      <VerifiedField id={id('motherOccupation')} name="motherOccupation" label="Mother's occupation" required={false} value={values.motherOccupation} onChange={(v) => onChange('motherOccupation', v)} />
      <div className={`field ${errors.monthlyIncome ? 'field--invalid' : ''}`}>
        <label htmlFor={id('monthlyIncome')}>Approximate monthly household income</label>
        <select
          id={id('monthlyIncome')}
          value={values.monthlyIncome || ''}
          onChange={(e) => onChange('monthlyIncome', e.target.value)}
          required
          aria-invalid={Boolean(errors.monthlyIncome)}
          className={errors.monthlyIncome ? 'is-invalid' : ''}
        >
          <option value="">Select</option>
          {INCOME_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        {errors.monthlyIncome ? <p className="field__error-msg">{errors.monthlyIncome}</p> : null}
      </div>
      <div className={`field ${errors.disability ? 'field--invalid' : ''}`}>
        <label htmlFor={id('disability')}>A family member has a disability</label>
        <select
          id={id('disability')}
          value={values.disability || ''}
          onChange={(e) => onChange('disability', e.target.value)}
          required
          aria-invalid={Boolean(errors.disability)}
          className={errors.disability ? 'is-invalid' : ''}
        >
          <option value="">Select</option>
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
        {errors.disability ? <p className="field__error-msg">{errors.disability}</p> : null}
      </div>
      {values.disability === 'yes' ? (
        <VerifiedField id={id('disabilityNote')} name="disabilityNote" label="Who, and what support they need" value={values.disabilityNote} error={errors.disabilityNote} onChange={(v) => onChange('disabilityNote', v)} />
      ) : null}
      <div className={`field ${errors.otherBursary ? 'field--invalid' : ''}`}>
        <label htmlFor={id('otherBursary')}>Already receiving another bursary or scholarship</label>
        <select
          id={id('otherBursary')}
          value={values.otherBursary || ''}
          onChange={(e) => onChange('otherBursary', e.target.value)}
          required
          aria-invalid={Boolean(errors.otherBursary)}
          className={errors.otherBursary ? 'is-invalid' : ''}
        >
          <option value="">Select</option>
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </select>
        {errors.otherBursary ? <p className="field__error-msg">{errors.otherBursary}</p> : null}
      </div>
    </>
  );
}
