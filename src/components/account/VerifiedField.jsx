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
  error,
  children
}) {
  const [touched, setTouched] = useState(false);
  const result = validateField(name, value, { required, label });
  const show = touched || Boolean(error) || String(value || '').length > 0;
  const invalid = Boolean(error) || (show && !result.ok);
  const errorMessage = error || (!result.ok ? result.message : '');

  return (
    <div className={`field ${invalid ? 'field--invalid' : ''}`}>
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
          className={invalid ? 'is-invalid' : ''}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
        />
      )}
      {invalid && errorMessage ? <p className="field__error-msg">{errorMessage}</p> : null}
      {!invalid && help ? <p className="field__help">{help}</p> : null}
    </div>
  );
}
