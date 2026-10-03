import React from 'react';
import { HOME_FIELDS } from '../../lib/household.js';
import { VerifiedField } from './VerifiedField.jsx';

export function HomeFields({ values, onChange, errors = {}, idPrefix = 'home-' }) {
  const id = (name) => `${idPrefix}${name}`;
  return (
    <>
      {HOME_FIELDS.map((field) => (
        <VerifiedField
          key={field.key}
          id={id(field.key)}
          name={field.key}
          label={field.label}
          value={values[field.key]}
          error={errors[field.key]}
          onChange={(v) => onChange(field.key, v)}
        />
      ))}
    </>
  );
}
