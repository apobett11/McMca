import React from 'react';
import { VerifiedField } from './VerifiedField.jsx';

export function ParentInfoFields({ values, onChange, onBlurField, errors = {}, idPrefix = 'par-', parentStatus }) {
  const id = (name) => `${idPrefix}${name}`;
  const effectiveStatus = parentStatus || values.parentStatus || '';
  const isOrphan = effectiveStatus === 'orphan' || effectiveStatus === 'both_deceased';
  const roleTitle = isOrphan ? 'Guardian' : 'Parent';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Lateral Names with overarching responsive flow */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 10
      }}>
        <VerifiedField
          id={id('parentFirstName')}
          name="firstName"
          label={`${roleTitle} first name`}
          value={values.parentFirstName}
          error={errors.parentFirstName}
          onChange={(v) => onChange('parentFirstName', v)}
          onBlur={(e) => onBlurField?.('parentFirstName', e?.target ? e.target.value : values.parentFirstName)}
        />
        <VerifiedField
          id={id('parentMiddleName')}
          name="middleName"
          label={`${roleTitle} middle name`}
          required={false}
          value={values.parentMiddleName}
          error={errors.parentMiddleName}
          onChange={(v) => onChange('parentMiddleName', v)}
          onBlur={(e) => onBlurField?.('parentMiddleName', e?.target ? e.target.value : values.parentMiddleName)}
        />
        <VerifiedField
          id={id('parentLastName')}
          name="lastName"
          label={`${roleTitle} last name`}
          value={values.parentLastName}
          error={errors.parentLastName}
          onChange={(v) => onChange('parentLastName', v)}
          onBlur={(e) => onBlurField?.('parentLastName', e?.target ? e.target.value : values.parentLastName)}
        />
      </div>

      {/* Relationship and Phone side-by-side */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12
      }}>
        <div className={`field ${errors.parentRelationship ? 'field--invalid' : ''}`} style={{ margin: 0 }}>
          <label htmlFor={id('parentRelationship')}>Relationship</label>
          <select
            id={id('parentRelationship')}
            value={values.parentRelationship || (isOrphan ? 'guardian' : '')}
            onChange={(e) => onChange('parentRelationship', e.target.value)}
            onBlur={(e) => onBlurField?.('parentRelationship', e.target.value)}
            required
            aria-invalid={Boolean(errors.parentRelationship)}
            className={errors.parentRelationship ? 'is-invalid' : ''}
          >
            <option value="">Select relationship</option>
            {!isOrphan && <option value="father">Father</option>}
            {!isOrphan && <option value="mother">Mother</option>}
            <option value="guardian">Guardian</option>
          </select>
          {errors.parentRelationship ? <p className="field__error-msg">{errors.parentRelationship}</p> : null}
        </div>

        <VerifiedField
          id={id('parentPhone')}
          name="phone"
          label={`${roleTitle} phone`}
          type="tel"
          value={values.parentPhone}
          error={errors.parentPhone}
          onChange={(v) => onChange('parentPhone', v)}
          onBlur={(e) => onBlurField?.('parentPhone', e?.target ? e.target.value : values.parentPhone)}
          placeholder="07XX XXX XXX"
        />
      </div>

      {/* National ID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12
      }}>
        <VerifiedField
          id={id('parentNationalId')}
          name="nationalId"
          label={`${roleTitle} national ID`}
          value={values.parentNationalId}
          error={errors.parentNationalId}
          onChange={(v) => onChange('parentNationalId', v)}
          onBlur={(e) => onBlurField?.('parentNationalId', e?.target ? e.target.value : values.parentNationalId)}
          placeholder="e.g. 12345678"
        />
      </div>
    </div>
  );
}
