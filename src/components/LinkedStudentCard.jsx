import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon.jsx';
import { getAccessBadgeClass } from '../utils/badges.js';

function demoAction(msg) {
  window.alert(msg);
}

export function LinkedStudentCard({ student, variant = 'dependent' }) {
  const isViewer = variant === 'adult';

  return (
    <article className="linked-student-card">
      <div className="linked-student-card__head">
        <div
          className={`linked-student-card__avatar linked-student-card__avatar--${student.avatarColor || 'blue'}`}
          aria-hidden="true"
        >
          {student.fullName.charAt(0)}
        </div>
        <div>
          <h4 className="linked-student-card__name">{student.fullName}</h4>
          <p className="linked-student-card__school">{student.school}</p>
        </div>
        <span className={getAccessBadgeClass(student.accessType)}>{student.accessType}</span>
      </div>

      <dl className="linked-student-card__meta">
        {!isViewer ? (
          <>
            <div>
              <dt>Delegated access</dt>
              <dd>{student.accessType === 'Delegated Access' ? 'Enabled' : 'Disabled'}</dd>
            </div>
            <div>
              <dt>Student access</dt>
              <dd>{student.accessType === 'Delegated Access' ? 'Active' : 'Parent-managed'}</dd>
            </div>
          </>
        ) : (
          <div>
            <dt>Viewer access</dt>
            <dd>Read-only household link</dd>
          </div>
        )}
        <div>
          <dt>Relationship</dt>
          <dd>{student.relationship || (isViewer ? 'Linked adult' : 'Mother')}</dd>
        </div>
      </dl>

      {!isViewer ? (
        <div className="linked-student-card__actions">
          <button
            type="button"
            className="btn btn--secondary btn--compact"
            onClick={() => demoAction('Reset student password — demo not connected.')}
          >
            Reset password
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--compact"
            onClick={() => demoAction('Student access would be disabled — demo.')}
          >
            Disable access
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--compact"
            onClick={() => demoAction('Update student phone — demo.')}
          >
            Update phone
          </button>
          <Link
            className="btn btn--primary btn--compact"
            to="/student/dashboard"
            aria-label={`View ${student.fullName}'s student dashboard`}
          >
            <Icon name="arrowRight" size={16} />
            View dashboard
          </Link>
        </div>
      ) : (
        <p className="linked-student-card__note">Viewer-only — no control actions available.</p>
      )}
    </article>
  );
}
