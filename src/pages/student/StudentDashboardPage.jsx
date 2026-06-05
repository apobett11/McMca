import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../../components/PageShell.jsx';
import { Icon } from '../../components/Icon.jsx';
import { useAuth } from '../../context/AuthContext';
import { useSecureData } from '../../lib/useSecureData';
import {
  fetchStudentProfile,
  fetchStudentApplication,
  fetchStudentNotifications,
  fetchRecentActivity
} from '../../lib/queries';
import { STUDENT_SHELL } from '../studentShell.js';
import { getTimeGreeting } from '../../utils/greeting.js';
import { getStatusConfig } from '../../utils/statusConfig.js';

function SkeletonLoader() {
  return (
    <div className="stitch-dashboard" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="skeleton-wrap">
        <div className="skeleton skeleton--hero" style={{ marginBottom: 24 }} />
        <div className="skeleton skeleton--line" />
        <div className="skeleton skeleton--line-short" />
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="stitch-dashboard">
      <div className="notice page-section--full" role="alert">
        <strong>Unable to load dashboard</strong>
        <p>{message || 'Something went wrong. Please try again.'}</p>
        {onRetry && (
          <button className="btn btn--primary" onClick={onRetry} style={{ marginTop: 12, width: 'auto', borderRadius: 999 }}>
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

function computeReadiness(profile, application) {
  if (!profile) return { pct: 0, label: 'Not started', desc: 'Begin your profile to get started' };
  let score = 0;
  const checks = [];
  if (profile.full_name) { score += 15; checks.push('name'); }
  if (profile.phone) { score += 15; checks.push('phone'); }
  if (profile.email) { score += 10; checks.push('email'); }
  if (profile.institution) { score += 15; checks.push('institution'); }
  if (profile.address) { score += 10; checks.push('address'); }
  if (application) { score += 20; checks.push('application'); }
  if (application?.status === 'submitted' || application?.status === 'Under Review' || application?.status === 'Approved' || application?.status === 'Funds Sent') { score += 15; checks.push('submitted'); }
  const pct = Math.min(100, score);
  let desc = 'Profile completion optimal';
  if (pct < 40) desc = 'Several items need your attention';
  else if (pct < 70) desc = 'Getting there, keep going';
  else if (pct < 90) desc = 'Almost ready';
  return { pct, label: `${pct}%`, desc };
}

export function StudentDashboardPage() {
  const { user } = useAuth();
  const greeting = getTimeGreeting();
  const { data: profile, error: profileErr, loading: profileLoading, refresh: refreshProfile } = useSecureData(fetchStudentProfile);
  const { data: application, error: appErr, loading: appLoading, refresh: refreshApp } = useSecureData(fetchStudentApplication);
  const { data: notifications, loading: notifLoading } = useSecureData(fetchStudentNotifications);
  const { data: activity, loading: actLoading } = useSecureData(fetchRecentActivity);

  const loading = profileLoading || appLoading;
  const error = profileErr || appErr;

  const readiness = useMemo(() => computeReadiness(profile, application), [profile, application]);
  const studentName = profile?.full_name || profile?.firstName || user?.user_metadata?.full_name || 'Student';
  const institutionName = profile?.institution || profile?.institutionName || '';
  const cycle = application?.cycle || profile?.cycle || '2025/2026 Bursary Cycle';
  const statusConfig = application ? getStatusConfig(application.status) : null;
  const previewAlerts = (notifications || []).slice(0, 3);
  const previewActivity = (activity || []).slice(0, 3);
  const hasUnread = previewAlerts.some((n) => n.unread);

  if (loading) return <PageShell pageTitle="Dashboard" layout="dashboard" notificationBadge={false} {...STUDENT_SHELL}><SkeletonLoader /></PageShell>;
  if (error) return <PageShell pageTitle="Dashboard" layout="dashboard" {...STUDENT_SHELL}><ErrorState message={error.message} onRetry={() => { refreshProfile(); refreshApp(); }} /></PageShell>;

  const nextAction = application?.next_action || (application ? null : { required: true, title: 'Start your application', route: '/student/new-application' });
  const timelineStages = application?.timeline_stages || application?.timelineStages || [];

  return (
    <PageShell
      pageTitle="Dashboard"
      layout="dashboard"
      notificationBadge={hasUnread}
      {...STUDENT_SHELL}
    >
      <div className="stitch-dashboard">
        <section className="dash-greeting-section">
          <div className="dash-greeting">
            <h1 className="dash-greeting__title">{greeting}, {studentName}</h1>
            <p className="dash-greeting__meta">{institutionName} &bull; {cycle}</p>
          </div>
          <div className="dash-readiness ambient-shadow">
            <div className="dash-readiness__ring">
              <span className="dash-readiness__pct">{readiness.pct}%</span>
            </div>
            <div>
              <p className="dash-readiness__label">Overall Readiness</p>
              <p className="dash-readiness__desc">{readiness.desc}</p>
            </div>
          </div>
        </section>

        <section className="stitch-primary-card ambient-shadow">
          <div className="stitch-primary-card__glow" />
          <div className="stitch-primary-card__content">
            <div>
              <span className="stitch-primary-card__badge">Active Process</span>
              <h2 className="stitch-primary-card__title">
                {application?.program_name || application?.programName || (application ? 'Application In Progress' : 'No Active Application')}
              </h2>
            </div>
            {nextAction?.route && (
              <Link className="stitch-primary-card__btn" to={nextAction.route}>
                {nextAction.title || 'Resume Task'}
              </Link>
            )}
          </div>
          <div className="stitch-primary-card__stepper">
            <div className="stitch-stepper">
              {timelineStages.length > 0 ? (
                timelineStages.map((stage, idx) => (
                  <div key={idx} className={`stitch-step ${stage.state === 'completed' ? 'stitch-step--done' : stage.state === 'current' ? 'stitch-step--active' : 'stitch-step--pending'}`}>
                    <div className="stitch-step__node">
                      {stage.state === 'completed' ? <Icon name="check" size={18} /> : <span>{idx + 1}</span>}
                    </div>
                    <span className="stitch-step__label">{stage.label}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="stitch-step stitch-step--done">
                    <div className="stitch-step__node"><Icon name="check" size={18} /></div>
                    <span className="stitch-step__label">Personal Info</span>
                  </div>
                  <div className="stitch-step stitch-step--active">
                    <div className="stitch-step__node">02</div>
                    <span className="stitch-step__label">Documents</span>
                  </div>
                  <div className="stitch-step stitch-step--pending">
                    <div className="stitch-step__node">03</div>
                    <span className="stitch-step__label">Reference</span>
                  </div>
                  <div className="stitch-step stitch-step--pending">
                    <div className="stitch-step__node">04</div>
                    <span className="stitch-step__label">Review</span>
                  </div>
                  <div className="stitch-step stitch-step--pending">
                    <div className="stitch-step__node"><Icon name="check" size={18} /></div>
                    <span className="stitch-step__label">Submit</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="dash-suite">
          <div className="dash-suite__head">
            <h3 className="stitch-section-title">Management Suite</h3>
          </div>
          <div className="dash-suite__grid">
            <Link to="/student/applications" className="dash-suite__card luxury-gradient-card">
              <div className="dash-suite__icon dash-suite__icon--primary"><Icon name="applications" size={24} /></div>
              <p className="dash-suite__card-title">Applications</p>
              <p className="dash-suite__card-desc">Track your submissions</p>
            </Link>
            <Link to="/student/documents" className="dash-suite__card luxury-gradient-card">
              <div className="dash-suite__icon dash-suite__icon--secondary"><Icon name="documents" size={24} /></div>
              <p className="dash-suite__card-title">Documents</p>
              <p className="dash-suite__card-desc">Cloud vault</p>
            </Link>
            <Link to="/student/messages" className="dash-suite__card luxury-gradient-card">
              <div className="dash-suite__icon dash-suite__icon--tertiary"><Icon name="support" size={24} /></div>
              <p className="dash-suite__card-title">Messages</p>
              <p className="dash-suite__card-desc">Secure inbox</p>
            </Link>
            <Link to="/student/notifications" className="dash-suite__card luxury-gradient-card">
              <div className="dash-suite__icon dash-suite__icon--error"><Icon name="bell" size={24} /></div>
              <p className="dash-suite__card-title">Notifications</p>
              <p className="dash-suite__card-desc">View alerts</p>
            </Link>
          </div>
        </section>

        <section className="dash-activity">
          <h3 className="stitch-section-title">Recent Activity</h3>
          <div className="dash-activity__card ambient-shadow stitch-card">
            <div className="dash-activity__head">
              <Icon name="clock" size={20} />
              <span>Timeline</span>
            </div>
            <div className="dash-activity__list">
              {previewActivity.length > 0 ? previewActivity.map((item, idx) => (
                <div key={idx} className="dash-activity__item">
                  <div className="dash-activity__item-icon"><Icon name={item.icon || 'info'} size={20} /></div>
                  <div className="dash-activity__item-body">
                    <p className="dash-activity__item-title">{item.title || item.action}</p>
                    <p className="stitch-body-text">{item.body || item.description}</p>
                  </div>
                  {item.time || item.created_at ? <span className="stitch-label stitch-label--muted">{item.time || new Date(item.created_at).toLocaleDateString()}</span> : null}
                </div>
              )) : (
                <div className="dash-activity__item">
                  <div className="dash-activity__item-icon"><Icon name="clock" size={20} /></div>
                  <div className="dash-activity__item-body">
                    <p className="dash-activity__item-title">No recent activity</p>
                    <p className="stitch-body-text">Your activity will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}