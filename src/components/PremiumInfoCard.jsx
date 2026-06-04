import React from 'react';

export function PremiumInfoCard({ greeting, reassurance, statValue, statLabel }) {
  return (
    <div className="premium-gold-card">
      <div className="premium-gold-card__left">
        <p className="premium-gold-card__greeting">{greeting}</p>
        <p className="premium-gold-card__message">{reassurance}</p>
      </div>
      <div className="premium-gold-card__right">
        <div className="premium-gold-card__stat-value">{statValue}</div>
        <span className="premium-gold-card__stat-label">{statLabel}</span>
      </div>
    </div>
  );
}
