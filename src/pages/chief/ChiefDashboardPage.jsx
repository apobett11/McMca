import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../../components/PageShell.jsx';
import { SectionCard } from '../../components/SectionCard.jsx';
import { Icon } from '../../components/Icon.jsx';
import { CHIEF, CHIEF_NOTIFICATIONS, CHIEF_SUMMARY } from '../../data/chiefMock.js';
import { getNotificationTypeBadgeClass } from '../../utils/badges.js';
import { getTimeGreeting } from '../../utils/greeting.js';
import { CHIEF_SHELL } from './chiefShell.js';

function formatTimestamp(iso) {
  return new Date(iso).toLocaleString('en-KE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getReviewLink(notification) {
  if (notification.targetType === 'application' && notification.targetId) {
    return `/chief/applications/${notification.targetId}`;
  }
  if (notification.targetType === 'appeal' && notification.targetId) {
    return `/chief/appeals/${notification.targetId}`;
  }
  return null;
}

export function ChiefDashboardPage() {
  const greeting = getTimeGreeting();
  const unreadCount = CHIEF_NOTIFICATIONS.filter((n) => n.unread).length;

  const notificationItems = useMemo(
    () =>
      CHIEF_NOTIFICATIONS.slice(0, 5).map((n) => ({
        title: `${n.studentName} — ${n.type}`,
        body: `${n.school} · ${n.educationLevel}`,
        variant: n.unread ? 'warning' : 'default',
        unread: n.unread
      })),
    []
  );

  return (
    <PageShell
      {...CHIEF_SHELL}
      pageTitle="Home"
      layout="dashboard"
      notificationBadge={unreadCount > 0}
      notificationItems={notificationItems}
    >
      <section className="chief-hero page-section--full" aria-label="Chief operational overview">
        <div className="chief-hero__content">
          <p className="chief-hero__greeting">
            {greeting}, {CHIEF.fullName.split(' ')[1]}
          </p>
          <h1 className="chief-hero__title">Review workspace overview</h1>
          <p className="chief-hero__sub">
            {CHIEF.location} / {CHIEF.subLocation} — operational summary and queue navigation. All
            review actions happen inside application and appeal workspaces.
          </p>
        </div>
        <div className="chief-hero__chips" role="list">
          <div className="stat-chip stat-chip--blue" role="listitem">
            <span className="stat-chip__value">{CHIEF_SUMMARY.pendingApplications}</span>
            <span className="stat-chip__label">Pending applications</span>
          </div>
          <div className="stat-chip stat-chip--orange" role="listitem">
            <span className="stat-chip__value">{CHIEF_SUMMARY.pendingAppeals}</span>
            <span className="stat-chip__label">Pending appeals</span>
          </div>
          <div className="stat-chip stat-chip--green" role="listitem">
            <span className="stat-chip__value">{CHIEF_SUMMARY.applicationsReviewedToday}</span>
            <span className="stat-chip__label">Apps reviewed today</span>
          </div>
          <div className="stat-chip stat-chip--teal" role="listitem">
            <span className="stat-chip__value">{CHIEF_SUMMARY.appealsReviewedToday}</span>
            <span className="stat-chip__label">Appeals reviewed today</span>
          </div>
        </div>
      </section>

      {CHIEF_SUMMARY.pendingApplications > 0 ? (
        <div className="alert-banner page-section--full" role="status">
          <Icon name="applications" size={20} />
          <div>
            <strong>{CHIEF_SUMMARY.pendingApplications} applications awaiting review</strong>
            <p>Open the applications queue to verify documents and process submissions.</p>
          </div>
          <Link className="btn btn--secondary btn--compact" to="/chief/applications">
            View queue
          </Link>
        </div>
      ) : null}

      <SectionCard title="Operational notifications" className="page-section--full">
        <p className="section-card__lead section-card__lead--left">
          Latest review-related activity — new submissions, appeals, clarification responses, and
          system notices.
        </p>
        <ul className="feed-list chief-feed-list">
          {CHIEF_NOTIFICATIONS.map((n) => {
            const reviewLink = getReviewLink(n);
            return (
              <li key={n.id} className={`feed-item ${n.unread ? 'feed-item--unread' : ''}`}>
                <div className="feed-item__icon" aria-hidden="true">
                  <Icon name="bell" size={20} />
                </div>
                <div className="chief-feed-item__body">
                  <div className="chief-feed-item__meta">
                    <p className="feed-item__tag">{n.studentName}</p>
                    <span className={getNotificationTypeBadgeClass(n.type)}>{n.type}</span>
                  </div>
                  <p className="feed-item__title">
                    {n.school} · {n.educationLevel}
                  </p>
                  <p className="feed-item__body">{formatTimestamp(n.timestamp)}</p>
                  {reviewLink ? (
                    <Link className="btn btn--table btn--compact chief-feed-item__action" to={reviewLink}>
                      <Icon name="review" size={16} />
                      Open review
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </SectionCard>

      <SectionCard title="Quick navigation" className="page-section--full">
        <p className="section-card__lead section-card__lead--left">
          Navigate to review queues — no operational actions occur on this page.
        </p>
        <div className="btn-row chief-quick-nav">
          <Link className="btn btn--primary" to="/chief/applications">
            <Icon name="applications" size={20} />
            View applications queue
          </Link>
          <Link className="btn btn--secondary" to="/chief/appeals">
            <Icon name="appeal" size={20} />
            View appeals queue
          </Link>
        </div>
      </SectionCard>
    </PageShell>
  );
}
