import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../Icon.jsx';

export function QuickTile({ to, icon, title, description, variant = 'glass' }) {
  return (
    <Link className={`quick-tile quick-tile--${variant}`} to={to}>
      <div className="quick-tile__head">
        <span className="quick-tile__icon" aria-hidden="true">
          <Icon name={icon} size={28} />
        </span>
        <Icon name="arrowRight" size={20} className="quick-tile__arrow" />
      </div>
      <h3 className="quick-tile__title">{title}</h3>
      {description ? <p className="quick-tile__desc">{description}</p> : null}
    </Link>
  );
}
