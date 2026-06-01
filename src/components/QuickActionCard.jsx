import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon.jsx';

export function QuickActionCard({
  to,
  icon,
  title,
  status,
  badge,
  glow = 'none',
  onClick
}) {
  const glowClass =
    glow === 'alert'
      ? 'quick-action-card--glow-alert'
      : glow === 'active'
        ? 'quick-action-card--glow-active'
        : glow === 'urgent'
          ? 'quick-action-card--glow-alert'
          : '';

  const inner = (
    <>
      {badge != null && badge > 0 ? (
        <span className="quick-action-card__badge" aria-label={`${badge} notifications`}>
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
      <span className="quick-action-card__icon" aria-hidden="true">
        <Icon name={icon} size={26} />
      </span>
      <span className="quick-action-card__title">{title}</span>
      {status ? <span className="quick-action-card__status">{status}</span> : null}
    </>
  );

  if (to) {
    return (
      <Link className={`quick-action-card ${glowClass}`} to={to} aria-label={title}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" className={`quick-action-card ${glowClass}`} onClick={onClick} aria-label={title}>
      {inner}
    </button>
  );
}
