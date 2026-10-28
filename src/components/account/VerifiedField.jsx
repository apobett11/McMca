import React, { useState } from 'react';
import { validateField } from '../../lib/accountAllocation';

export function VerifiedField({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
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
  const hasPropError = error !== undefined;
  const show = touched || hasPropError || String(value || '').length > 0;
  const invalid = hasPropError ? Boolean(error) : (show && !result.ok);
  const errorMessage = hasPropError ? error : (!result.ok ? result.message : '');

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
          onBlur={(e) => {
            setTouched(true);
            onBlur?.(e);
          }}
          style={type === 'date' ? { colorScheme: 'dark' } : undefined}
        />
      )}
      {invalid && errorMessage ? <p className="field__error-msg">{errorMessage}</p> : null}
      {!invalid && help ? <p className="field__help">{help}</p> : null}
    </div>
  );
}
