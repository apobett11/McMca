import React, { useState } from 'react';
import { validateField } from '../../lib/accountAllocation';

export function VerifiedField({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  required = true,
  help,
  placeholder,
  autoComplete,
  disabled,
  children
}) {
  const [touched, setTouched] = useState(false);
  const result = validateField(name, value, { required, label });
  const show = touched || String(value || '').length > 0;
  const invalid = show && !result.ok;

  return (
    <div className="field">
      <label htmlFor={id || name}>{label}</label>
      {children || (
        <input
          id={id || name}
          name={name}
          type={type}
          value={value || ''}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          required={required}
          aria-invalid={invalid}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
        />
      )}
      {invalid ? <p className="field__help">{result.message}</p> : null}
      {!invalid && help ? <p className="field__help">{help}</p> : null}
    </div>
  );
}
