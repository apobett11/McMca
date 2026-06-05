import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../../components/PageShell.jsx';
import { Icon } from '../../components/Icon.jsx';
import { useAuth } from '../../context/AuthContext';
import { useSecureData } from '../../lib/useSecureData';
import { fetchStudentNotifications } from '../../lib/queries';
import { STUDENT_SHELL } from '../studentShell.js';

const TYPE_ICONS = {
  warning: 'info',
  success: 'approved',
  info: 'bell',
  error: 'rejected'
};

export function StudentNotificationsPage() {
  const { data: notifications, loading, refresh } = useSecureData(fetchStudentNotifications);
  const notifs = notifications || [];

  return (
    <PageShell pageTitle="Notifications" notificationBadge showBottomNav={false} layout="dashboard" {...STUDENT_SHELL}>
      <Link className="back-link" to="/student/dashboard">
        <Icon name="chevronLeft" size={18} />
        Back to dashboard
      </Link>

      <div className="stitch-docs-header">
        <h1 className="stitch-docs-header__title">Notifications</h1>
        <p className="stitch-docs-header__sub">Full history of alerts about your application, documents, and deadlines.</p>
      </div>

      {loading ? (
        <div className="skeleton-wrap">
          <div className="skeleton skeleton--line" />
          <div className="skeleton skeleton--line" />
          <div className="skeleton skeleton--line-short" />
        </div>
      ) : notifs.length > 0 ? (
        <ul className="feed-list page-section--full">
          {notifs.map((item, idx) => (
            <li
              key={item.id || idx}
              className={`feed-item feed-item--lively ${item.unread ? 'feed-item--unread' : ''} ${item.variant === 'warning' || item.type === 'warning' ? 'feed-item--urgent' : ''}`}
            >
              <div className="feed-item__icon" aria-hidden="true">
                <Icon name={TYPE_ICONS[item.variant || item.type] || 'bell'} size={18} />
              </div>
              <div>
                <p className="feed-item__title">{item.title || item.subject}</p>
                <p className="feed-item__body">{item.body || item.message}</p>
                {item.time || item.created_at ? (
                  <span className="feed-item__time">{item.time || new Date(item.created_at).toLocaleDateString()}</span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="notice page-section--full">
          <strong>No notifications</strong>
          <p>You have no notifications at this time.</p>
        </div>
      )}
    </PageShell>
  );
}