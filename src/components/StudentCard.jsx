import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon.jsx';
import {
  getAccessBadgeClass,
  getApplicationBadgeClass,
  getDocumentBadgeClass,
  getProfileBadgeClass
} from '../utils/badges.js';

export function StudentCard({ student }) {
  const accent = student.requiresAttention ? 'student-card--attention' : '';
  const avatarMod = `student-card__avatar--${student.avatarColor || 'blue'}`;

  return (
    <article
      className={`card student-card ${accent}`.trim()}
      aria-labelledby={`student-${student.id}-name`}
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}
    >
      <div className="student-card__top" style={{display: 'flex', gap: '16px', alignItems: 'flex-start'}}>
        <div className={`student-card__avatar ${avatarMod}`} aria-hidden="true" style={{
            width: '48px', height: '48px', borderRadius: '12px', display: 'grid', placeItems: 'center', fontWeight: '700', fontSize: '1.25rem'
        }}>
          {student.fullName.charAt(0)}
        </div>
        <div className="student-card__identity" style={{flex: 1}}>
          <h3 className="student-card__name" id={`student-${student.id}-name`} style={{margin: '0 0 4px', fontSize: '1.125rem'}}>
            {student.fullName}
          </h3>
          <p className="student-card__school" style={{margin: 0, fontSize: '0.875rem', color: 'var(--text-2)'}}>{student.school}</p>
        </div>
      </div>

      <div className="student-card__stats" style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '16px', background: 'var(--surface-container-low)', borderRadius: '16px'
      }}>
        <div className="student-card__stat" style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
          <span className="student-card__stat-label" style={{fontSize: '0.75rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Application</span>
          <span className={getApplicationBadgeClass(student.applicationStatus)} style={{fontSize: '0.875rem', fontWeight: '600'}}>
            {student.applicationStatus}
          </span>
        </div>
        <div className="student-card__stat" style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
          <span className="student-card__stat-label" style={{fontSize: '0.75rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Allocated</span>
          <span className="student-card__amount" style={{fontSize: '0.875rem', fontWeight: '600'}}>{student.amountAllocated}</span>
        </div>
      </div>

      <Link
        className="btn btn--primary"
        to="/student/dashboard"
        aria-label={`View ${student.fullName}'s student dashboard`}
        style={{marginTop: 'auto', borderRadius: '999px'}}
      >
        View Profile
        <Icon name="arrowRight" size={16} />
      </Link>
    </article>
  );
}
