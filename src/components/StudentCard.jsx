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
    >
      <div className="student-card__top">
        <div className={`student-card__avatar ${avatarMod}`} aria-hidden="true">
          {student.fullName.charAt(0)}
        </div>
        <div className="student-card__identity">
          <h3 className="student-card__name" id={`student-${student.id}-name`}>
            {student.fullName}
          </h3>
          <p className="student-card__school">{student.school}</p>
        </div>
      </div>

      <div className="student-card__stats">
        <div className="student-card__stat">
          <span className="student-card__stat-label">Application</span>
          <span className={getApplicationBadgeClass(student.applicationStatus)}>
            {student.applicationStatus}
          </span>
        </div>
        <div className="student-card__stat">
          <span className="student-card__stat-label">Allocated</span>
          <span className="student-card__amount">{student.amountAllocated}</span>
        </div>
      </div>

      <Link
        className="btn btn--primary"
        to="/student/dashboard"
        aria-label={`View ${student.fullName}'s student dashboard`}
      >
        View Profile
        <Icon name="arrowRight" size={16} />
      </Link>
    </article>
  );
}
