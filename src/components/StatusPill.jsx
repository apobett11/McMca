import React from 'react';
import { getStatusConfig } from '../utils/statusConfig.js';
import { Icon } from './Icon.jsx';

export function StatusPill({ status, large = false }) {
  const config = getStatusConfig(status);

  return (
    <div
      className={`status-pill${large ? ' status-pill--large' : ''}`}
      role="status"
      aria-label={`Application status: ${config.label}. ${config.hint}`}
    >
      <div className={`status-pill__icon status-pill__icon--${config.tone}`} aria-hidden="true">
        <Icon name={config.icon} size={18} />
      </div>
      <div>
        <p className="status-pill__title">{config.label}</p>
        <p className="status-pill__hint">{config.hint}</p>
      </div>
    </div>
  );
}
