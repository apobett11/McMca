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
  const [isFocused, setIsFocused] = useState(false);
  const result = validateField(name, value, { required, label });
  const hasPropError = error !== undefined;
  // Inline verification alert MUST wait for input to end (blur); NEVER when input is going on (isFocused)
  const show = !isFocused && (touched || hasPropError);
  const invalid = hasPropError ? Boolean(error) : (show && !result.ok);
  const errorMessage = hasPropError ? error : (!result.ok ? result.message : '');

  return (
    <div className={`field ${invalid ? 'field--invalid' : ''}`} style={{ minWidth: 0 }}>
      <label htmlFor={id || name}>
        {label} {!required && <span style={{ fontSize: 12, fontWeight: 400, color: '#94A3B8' }}>(optional)</span>}
      </label>
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
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false);
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
