import React from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../../components/PageShell.jsx';
import { PageIntro } from '../../components/student/PageIntro.jsx';
import { QuickTile } from '../../components/student/QuickTile.jsx';
import { StatusPill } from '../../components/StatusPill.jsx';
import { Timeline } from '../../components/Timeline.jsx';
import { Icon } from '../../components/Icon.jsx';
import { STUDENT_SHELL } from '../studentShell.js';
import { getTimeGreeting } from '../../utils/greeting.js';
import {
  STUDENT,
  STUDENT_APPLICATION,
  STUDENT_NOTIFICATIONS,
  STUDENT_ACTIVITY
} from '../../data/studentMock.js';
import { getStatusConfig } from '../../utils/statusConfig.js';

export function StudentDashboardPage() {
  const greeting = getTimeGreeting();
  const statusConfig = getStatusConfig(STUDENT_APPLICATION.status);
  const bandTone =
    statusConfig.tone === 'success'
      ? 'success'
      : statusConfig.tone === 'rejected'
        ? 'rejected'
        : statusConfig.tone === 'info'
          ? 'info'
          : 'pending';

  const previewAlerts = STUDENT_NOTIFICATIONS.slice(0, 3);
  const previewActivity = STUDENT_ACTIVITY.slice(0, 3);

  return (
    <PageShell
      pageTitle="Dashboard"
      layout="dashboard"
      notificationBadge={previewAlerts.some((n) => n.unread)}
      {...STUDENT_SHELL}
    >
      <PageIntro
        greeting={`${greeting}, ${STUDENT.firstName}`}
        meta={STUDENT.institutionName}
        cycle={STUDENT.cycle}
      />

      <section className="status-hero page-section--full" aria-label="Your current application">
        <div className={`status-hero__band status-hero__band--${bandTone}`}>
          <p className="status-hero__label">Your current application</p>
          <StatusPill status={STUDENT_APPLICATION.status} large />
        </div>
        <div className="status-hero__body">
          <div className="status-hero__deadline">
            <Icon name="calendar" size={20} />
            <span>
              {STUDENT_APPLICATION.deadlineLabel}: <strong>{STUDENT_APPLICATION.deadline}</strong>
            </span>
          </div>

          {STUDENT_APPLICATION.nextAction.required ? (
            <div className="action-panel">
              <p className="action-panel__title">{STUDENT_APPLICATION.nextAction.title}</p>
              <p className="action-panel__text">{STUDENT_APPLICATION.nextAction.message}</p>
              <Link className="btn btn--primary" to={STUDENT_APPLICATION.nextAction.route}>
                <Icon name="upload" size={20} />
                {STUDENT_APPLICATION.nextAction.cta}
              </Link>
            </div>
          ) : null}

          <Timeline stages={STUDENT_APPLICATION.timelineStages} />
        </div>
      </section>

      <div className="quick-grid page-section--full" aria-label="Quick actions">
        <QuickTile
          to="/student/applications"
          icon="applications"
          title="Applications"
          description="View your application history and status"
          variant="vibrant"
        />
        <QuickTile
          to="/student/documents"
          icon="upload"
          title="Upload documents"
          description="Submit required files securely"
          variant="vibrant"
        />
        <QuickTile
          to="/student/support"
          icon="support"
          title="Support"
          description="Get help from ward offices"
        />
        <QuickTile
          to="/student/appeals"
          icon="appeal"
          title="Appeals"
          description="Request a review of a decision"
        />
      </div>

      <div className="page-section--full">
        <Link className="btn btn--secondary btn--compact" to="/student/new-application">
          <Icon name="plus" size={18} />
          Start new application
        </Link>
      </div>

      <section className="student-feed-section page-section--col-left" aria-label="Recent alerts">
        <div className="student-feed-section__head">
          <h2 className="student-feed-section__title">
            <Icon name="bell" size={22} />
            Recent alerts
          </h2>
          <Link className="btn btn--ghost btn--compact" to="/student/notifications">
            View all notifications
          </Link>
        </div>
        <ul className="feed-list">
          {previewAlerts.map((item) => (
            <li
              key={item.title}
              className={`feed-item feed-item--lively ${item.unread ? 'feed-item--unread' : ''}`}
            >
              <div className="feed-item__icon" aria-hidden="true">
                <Icon name={item.variant === 'success' ? 'approved' : 'info'} size={18} />
              </div>
              <div>
                <p className="feed-item__title">{item.title}</p>
                <p className="feed-item__body">{item.body}</p>
                {item.time ? <span className="feed-item__time">{item.time}</span> : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="student-feed-section page-section--col-right" aria-label="Recent activity">
        <div className="student-feed-section__head">
          <h2 className="student-feed-section__title">
            <Icon name="clock" size={22} />
            Recent activity
          </h2>
        </div>
        <ul className="feed-list">
          {previewActivity.map((item) => (
            <li key={item.title} className="feed-item feed-item--lively">
              <div className="feed-item__icon" aria-hidden="true">
                <Icon name={item.icon} size={18} />
              </div>
              <div>
                <p className="feed-item__title">{item.title}</p>
                <p className="feed-item__body">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
