import React from 'react';
import { VerifiedField } from './VerifiedField.jsx';

export function ParentInfoFields({ values, onChange, idPrefix = 'par-' }) {
  const id = (name) => `${idPrefix}${name}`;
  return (
    <>
      <VerifiedField id={id('parentFirstName')} name="firstName" label="Parent first name" value={values.parentFirstName} onChange={(v) => onChange('parentFirstName', v)} />
      <VerifiedField id={id('parentMiddleName')} name="middleName" label="Parent middle name" required={false} value={values.parentMiddleName} onChange={(v) => onChange('parentMiddleName', v)} />
      <VerifiedField id={id('parentLastName')} name="lastName" label="Parent last name" value={values.parentLastName} onChange={(v) => onChange('parentLastName', v)} />
      <div className="field">
        <label htmlFor={id('parentRelationship')}>Relationship</label>
        <select
          id={id('parentRelationship')}
          value={values.parentRelationship || ''}
          onChange={(e) => onChange('parentRelationship', e.target.value)}
          required
        >
          <option value="">Select</option>
          <option value="father">Father</option>
          <option value="mother">Mother</option>
          <option value="guardian">Guardian</option>
        </select>
      </div>
      <VerifiedField id={id('parentPhone')} name="phone" label="Parent phone" type="tel" value={values.parentPhone} onChange={(v) => onChange('parentPhone', v)} placeholder="07XX XXX XXX" />
      <VerifiedField id={id('parentNationalId')} name="nationalId" label="Parent national ID" value={values.parentNationalId} onChange={(v) => onChange('parentNationalId', v)} />
    </>
  );
}
