import React from 'react';

/**
 * PremiumInfoCard for displaying featured info with a luxury design.
 */
export function PremiumInfoCard({ greeting, reassurance, statValue, statLabel }) {
  return (
    <div className="premium-info-card">
      <div className="premium-info-card__content">
        <div className="premium-info-card__left">
          <h3 className="premium-info-card__greeting">{greeting}</h3>
          <p className="premium-info-card__reassurance">{reassurance}</p>
        </div>
        <div className="premium-info-card__right">
          <div className="premium-info-card__stat-value">{statValue}</div>
          <div className="premium-info-card__stat-label">{statLabel}</div>
        </div>
      </div>
      <div className="premium-info-card__accent" />
    </div>
  );
}
