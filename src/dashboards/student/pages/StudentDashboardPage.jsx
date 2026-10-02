import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { StudentLayout } from '../components/StudentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { useAuth } from '../../../context/AuthContext';
import { useSecureData } from '../../../lib/useSecureData';
import {
  fetchStudentProfile,
  fetchStudentApplication,
  fetchStudentNotifications,
  fetchRecentActivity
} from '../../../lib/queries';
import { getTimeGreeting } from '../../../utils/greeting.js';
import { getStatusConfig } from '../../../utils/statusConfig.js';
import { ContinueRegistrationPrompt } from '../../../components/account/ContinueRegistrationPrompt.jsx';

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

const PROGRESS_STEPS = ['Started', 'Documents', 'Review', 'Decision'];

function progressIndex(status) {
  const value = String(status || 'draft').toLowerCase();
  if (['approved', 'funds sent', 'disbursed', 'chief_approved'].includes(value)) return 3;
  if (['under review', 'submitted'].includes(value)) return 2;
  if (value === 'rejected') return 3;
  return 1;
}

function computeReadiness(profile, application) {
  if (!profile) return { pct: 0, label: 'Not started', desc: 'Begin your profile to get started' };
  let score = 0;
  const checks = [];
  if (profile.first_name) { score += 15; checks.push('name'); }
  if (profile.phone_number) { score += 15; checks.push('phone'); }
  if (profile.email) { score += 10; checks.push('email'); }
  if (profile.school_name) { score += 15; checks.push('institution'); }
  if (application) { score += 20; checks.push('application'); }
  if (application?.application_status === 'submitted' || application?.application_status === 'Under Review' || application?.application_status === 'Approved' || application?.application_status === 'Funds Sent') { score += 15; checks.push('submitted'); }
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
  const studentName = [profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean).join(' ') || user?.user_metadata?.full_name || 'Student';
  const institutionName = profile?.school_name || '';
  const statusConfig = application ? getStatusConfig(application.application_status || 'Draft') : null;
  const previewAlerts = (notifications || []).slice(0, 3);
  const previewActivity = (activity || []).slice(0, 3);
  const hasUnread = previewAlerts.some((n) => !n.is_read);

  if (loading) return (
    <StudentLayout pageTitle="Dashboard" layout="dashboard" notificationBadge={false}>
      <ContinueRegistrationPrompt formsPath="/student/applications" />
      <SkeletonLoader />
    </StudentLayout>
  );
  if (error) return (
    <StudentLayout pageTitle="Dashboard" layout="dashboard">
      <ContinueRegistrationPrompt formsPath="/student/applications" />
      <ErrorState message={error.message} onRetry={() => { refreshProfile(); refreshApp(); }} />
    </StudentLayout>
  );

  const activeIndex = application ? progressIndex(application.application_status) : -1;

  return (
    <StudentLayout
      pageTitle="Dashboard"
      layout="dashboard"
      notificationBadge={hasUnread}
      studentName={studentName}
    >
      <ContinueRegistrationPrompt formsPath="/student/applications" />
      <div className="stitch-dashboard">
        <section className="student-hero">
          <div className="student-hero__identity">
            <div className="student-hero__avatar" aria-hidden="true">
              {studentName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div className="student-hero__copy">
              <h1 className="student-hero__title">{greeting}, {studentName}</h1>
              {institutionName ? <p className="student-hero__meta">{institutionName}</p> : null}
            </div>
          </div>
          <div className="student-hero__readiness">
            <div className="student-hero__ring" aria-hidden="true">
              <span>{readiness.pct}%</span>
            </div>
            <div>
              <p className="student-hero__readiness-label">Overall readiness</p>
              <p className="student-hero__readiness-desc">{readiness.desc}</p>
            </div>
          </div>
        </section>

        <section className="stitch-primary-card ambient-shadow">
          <div className="stitch-primary-card__glow" />
          <div className="stitch-primary-card__content">
            <div>
              <span className="stitch-primary-card__badge">
                {application ? 'Active process' : 'Next step'}
              </span>
              <h2 className="stitch-primary-card__title">
                {application ? (statusConfig?.label || 'Application in progress') : 'No active application'}
              </h2>
              <p className="stitch-primary-card__hint">
                {application
                  ? (statusConfig?.hint || 'Your bursary application is on file.')
                  : 'Start an application when your profile and documents are ready.'}
              </p>
            </div>
            <Link
              className="stitch-primary-card__btn"
              to={application ? '/student/applications' : '/student/new-application'}
            >
              <Icon name={application ? 'applications' : 'plus'} size={16} />
              {application ? 'View application' : 'Start application'}
            </Link>
          </div>
          {application ? (
            <div className="stitch-primary-card__stepper">
              <div className="stitch-stepper">
                {PROGRESS_STEPS.map((label, idx) => {
                  const state = idx < activeIndex ? 'completed' : idx === activeIndex ? 'current' : 'pending';
                  return (
                    <div
                      key={label}
                      className={`stitch-step ${state === 'completed' ? 'stitch-step--done' : state === 'current' ? 'stitch-step--active' : 'stitch-step--pending'}`}
                    >
                      <div className="stitch-step__node">
                        {state === 'completed' ? <Icon name="check" size={16} /> : <span>{idx + 1}</span>}
                      </div>
                      <span className="stitch-step__label">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
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
              <p className="dash-suite__card-title">Contact</p>
              <p className="dash-suite__card-desc">WhatsApp & email support</p>
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
                  <div className="dash-activity__item-icon"><Icon name="info" size={20} /></div>
                  <div className="dash-activity__item-body">
                    <p className="dash-activity__item-title">{item.activity_description || item.activity_type}</p>
                    <p className="stitch-body-text">{item.activity_description}</p>
                  </div>
                  {item.created_at ? <span className="stitch-label stitch-label--muted">{new Date(item.created_at).toLocaleDateString()}</span> : null}
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
    </StudentLayout>
  );
}
