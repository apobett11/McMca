import React from 'react';
import { VerifiedField } from './VerifiedField.jsx';

export function ParentInfoFields({ values, onChange, errors = {}, idPrefix = 'par-' }) {
  const id = (name) => `${idPrefix}${name}`;
  return (
    <>
      <VerifiedField id={id('parentFirstName')} name="firstName" label="Parent first name" value={values.parentFirstName} error={errors.parentFirstName} onChange={(v) => onChange('parentFirstName', v)} />
      <VerifiedField id={id('parentMiddleName')} name="middleName" label="Parent middle name" required={false} value={values.parentMiddleName} error={errors.parentMiddleName} onChange={(v) => onChange('parentMiddleName', v)} />
      <VerifiedField id={id('parentLastName')} name="lastName" label="Parent last name" value={values.parentLastName} error={errors.parentLastName} onChange={(v) => onChange('parentLastName', v)} />
      <div className={`field ${errors.parentRelationship ? 'field--invalid' : ''}`}>
        <label htmlFor={id('parentRelationship')}>Relationship</label>
        <select
          id={id('parentRelationship')}
          value={values.parentRelationship || ''}
          onChange={(e) => onChange('parentRelationship', e.target.value)}
          required
          aria-invalid={Boolean(errors.parentRelationship)}
          className={errors.parentRelationship ? 'is-invalid' : ''}
        >
          <option value="">Select</option>
          <option value="father">Father</option>
          <option value="mother">Mother</option>
          <option value="guardian">Guardian</option>
        </select>
        {errors.parentRelationship ? <p className="field__error-msg">{errors.parentRelationship}</p> : null}
      </div>
      <VerifiedField id={id('parentPhone')} name="phone" label="Parent phone" type="tel" value={values.parentPhone} error={errors.parentPhone} onChange={(v) => onChange('parentPhone', v)} placeholder="07XX XXX XXX" />
      <VerifiedField id={id('parentNationalId')} name="nationalId" label="Parent national ID" value={values.parentNationalId} error={errors.parentNationalId} onChange={(v) => onChange('parentNationalId', v)} />
    </>
  );
}
