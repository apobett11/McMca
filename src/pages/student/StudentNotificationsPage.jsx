import React from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../../components/PageShell.jsx';
import { PageIntro } from '../../components/student/PageIntro.jsx';
import { Icon } from '../../components/Icon.jsx';
import { STUDENT_SHELL } from '../studentShell.js';
import { STUDENT_NOTIFICATIONS } from '../../data/studentMock.js';

const TYPE_ICONS = {
  warning: 'info',
  success: 'approved',
  info: 'bell'
};

export function StudentNotificationsPage() {
  return (
    <PageShell pageTitle="Notifications" notificationBadge showBottomNav={false} {...STUDENT_SHELL}>
      <Link className="back-link" to="/student/dashboard">
        <Icon name="chevronLeft" size={18} />
        Back to dashboard
      </Link>

      <PageIntro lead="Full history of alerts about your application, documents, and deadlines." />

      <ul className="feed-list page-section--full">
        {STUDENT_NOTIFICATIONS.map((item) => (
          <li
            key={item.title}
            className={`feed-item feed-item--lively ${item.unread ? 'feed-item--unread' : ''} ${item.variant === 'warning' ? 'feed-item--urgent' : ''}`}
          >
            <div className="feed-item__icon" aria-hidden="true">
              <Icon name={TYPE_ICONS[item.variant] || 'bell'} size={18} />
            </div>
            <div>
              <p className="feed-item__title">{item.title}</p>
              <p className="feed-item__body">{item.body}</p>
              {item.time ? <span className="feed-item__time">{item.time}</span> : null}
            </div>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
