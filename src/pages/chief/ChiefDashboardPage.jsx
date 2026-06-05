import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../../components/PageShell.jsx';
import { Icon } from '../../components/Icon.jsx';
import { CHIEF, CHIEF_NOTIFICATIONS, CHIEF_SUMMARY } from '../../data/chiefMock.js';
import { getTimeGreeting } from '../../utils/greeting.js';
import { CHIEF_SHELL } from './chiefShell.js';

const quickActions = [
  { label: 'Open Apps', icon: 'applications', variant: 'gold', to: '/chief/applications' },
  { label: 'Open Appeals', icon: 'appeal', variant: 'tertiary', to: '/chief/appeals' },
  { label: 'Flagged Cases', icon: 'review', variant: 'error', to: '/chief/applications' },
  { label: 'Messages', icon: 'bell', variant: 'secondary', to: '/chief/applications' },
  { label: 'Notifications', icon: 'bell', variant: 'muted', to: '/chief/applications' }
];

const appStats = [
  { label: 'Total', value: '1,284', icon: 'applications', color: 'gold' },
  { label: 'Approved', value: '942', icon: 'check', color: 'green' },
  { label: 'Rejected', value: '156', icon: 'rejected', color: 'red' },
  { label: 'Flagged', value: '28', icon: 'review', color: 'amber' },
  { label: 'Approval %', value: '73.4%', icon: 'review', color: 'gold' },
  { label: 'Rejection %', value: '12.1%', icon: 'review', color: 'secondary' }
];

const appealStats = [
  { label: 'Submitted', value: '42', icon: 'appeal', color: 'tertiary' },
  { label: 'Pending Reviews', value: '14', icon: 'clock', color: 'amber' },
  { label: 'Resolved', value: '28', icon: 'check', color: 'green' }
];

const notifPreviews = [
  {
    icon: 'bell',
    variant: 'error',
    title: 'Urgent: 3 Flagged cases in South Sector',
    body: 'Aura verification engine detected inconsistent address data.'
  },
  {
    icon: 'info',
    variant: 'tertiary',
    title: 'System Update: Telemetry recalibrated',
    body: 'Real-time processing stats now include Vocational tracks.'
  },
  {
    icon: 'bell',
    variant: 'gold',
    title: 'New application surge from East Central',
    body: '24 new submissions in the last 2 hours.'
  }
];

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
      {/* Premium Information Card */}
      <section className="soft-gold-gradient chief-premium-card premium-glow">
        <div className="chief-premium-card__text">
          <h1 className="chief-premium-card__heading">{greeting}, Chief {CHIEF.fullName.split(' ')[1]}.</h1>
          <p className="chief-premium-card__text">
            Applications within {CHIEF.location} are being processed smoothly according to this morning&apos;s telemetry. All systems operational.
          </p>
        </div>
        <div className="chief-premium-stats">
          <div className="chief-premium-stat">
            <span className="chief-premium-stat__value chief-premium-stat__value--gold">{CHIEF_SUMMARY.pendingApplications}</span>
            <span className="chief-premium-stat__label">Pending</span>
          </div>
          <div className="chief-premium-stat">
            <span className="chief-premium-stat__value chief-premium-stat__value--tertiary">{CHIEF_SUMMARY.pendingAppeals}</span>
            <span className="chief-premium-stat__label">Appeals</span>
          </div>
          <div className="chief-premium-stat">
            <span className="chief-premium-stat__value chief-premium-stat__value--error">3</span>
            <span className="chief-premium-stat__label">Urgent</span>
          </div>
        </div>
      </section>

      {/* Quick Action Cards */}
      <div className="chief-quick-actions">
        {quickActions.map((action) => (
          <Link key={action.label} to={action.to} className="chief-quick-action-btn">
            <div className={`chief-quick-action-btn__icon-wrap chief-quick-action-btn__icon-wrap--${action.variant}`}>
              <Icon name={action.icon} size={20} />
            </div>
            <span className="chief-quick-action-btn__label">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Stats Overview Grid */}
      <div className="chief-dashboard-grid">
        {/* Application Statistics */}
        <div className="chief-stats-section">
          <h2 className="chief-stats-section__title">Applications Statistics</h2>
          <div className="chief-stats-grid">
            {appStats.map((stat) => (
              <div key={stat.label} className="chief-stat-card">
                <div className="chief-stat-card__header">
                  <span className={`chief-stat-card__icon chief-stat-card__icon--${stat.color}`}>
                    <Icon name={stat.icon} size={16} />
                  </span>
                  <span className="chief-stat-card__label">{stat.label}</span>
                </div>
                <p className="chief-stat-card__value">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Appeals Statistics + Notifications Preview */}
        <div className="chief-stats-section">
          <h2 className="chief-stats-section__title">Appeals Statistics</h2>
          <div className="chief-stats-grid">
            {appealStats.map((stat) => (
              <div key={stat.label} className="chief-stat-card">
                <div className="chief-stat-card__header">
                  <span className={`chief-stat-card__icon chief-stat-card__icon--${stat.color}`}>
                    <Icon name={stat.icon} size={16} />
                  </span>
                  <span className="chief-stat-card__label">{stat.label}</span>
                </div>
                <p className="chief-stat-card__value">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Notifications Preview */}
          <div className="chief-notif-preview">
            <div className="chief-notif-preview__header">
              <h3 className="chief-notif-preview__title">
                <Icon name="bell" size={20} />
                Notifications Preview
              </h3>
              <button className="chief-notif-preview__view-all" type="button">View All</button>
            </div>
            <div>
              {notifPreviews.map((item, idx) => (
                <div key={idx} className="chief-notif-item">
                  <div className={`chief-notif-item__icon-box chief-notif-item__icon-box--${item.variant}`}>
                    <Icon name={item.icon} size={18} />
                  </div>
                  <div>
                    <p className="chief-notif-item__title">{item.title}</p>
                    <p className="chief-notif-item__body">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
