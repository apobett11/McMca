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
      className={`student-card ${accent}`.trim()}
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
          <p className="student-card__meta">
            {student.educationLevel} · {student.grade}
          </p>
        </div>
        <span className={getAccessBadgeClass(student.accessType)}>{student.accessType}</span>
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
        <div className="student-card__stat">
          <span className="student-card__stat-label">Profile</span>
          <span className={getProfileBadgeClass(student.profileStatus)}>{student.profileStatus}</span>
        </div>
        <div className="student-card__stat">
          <span className="student-card__stat-label">Documents</span>
          <span className={getDocumentBadgeClass(student.documentStatus)}>
            {student.documentStatus}
          </span>
        </div>
      </div>

      <div className="student-card__feed">
        <div className="student-card__feed-item student-card__feed-item--notify">
          <Icon name="bell" size={16} label="Latest notification" />
          <span>{student.latestNotification}</span>
        </div>
        <div className="student-card__feed-item">
          <Icon name="clock" size={16} label="Latest activity" />
          <span>{student.latestActivity}</span>
        </div>
      </div>

      <Link
        className="btn btn--primary student-card__cta"
        to="/student/dashboard"
        aria-label={`View ${student.fullName}'s student dashboard`}
      >
        <Icon name="arrowRight" size={18} />
        View profile
      </Link>
    </article>
  );
}
