import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { StudentLayout } from '../components/StudentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { useAuth } from '../../../context/AuthContext';
import { useSecureData } from '../../../lib/useSecureData';
import { fetchRecentActivity } from '../../../lib/queries';
import { getTimeGreeting } from '../../../utils/greeting.js';
import { getStatusConfig } from '../../../utils/statusConfig.js';
import { applicationSteps } from '../../../domain/requirements.js';
import { useStudentCase } from '../context/StudentCaseContext.jsx';

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

export function StudentDashboardPage() {
  const { user } = useAuth();
  const greeting = getTimeGreeting();
  const { data: studentCase, error: caseError, loading: caseLoading, refresh } = useStudentCase();
  const { data: activity } = useSecureData(fetchRecentActivity);

  const profile = studentCase?.profile;
  const application = studentCase?.application;
  const evaluation = studentCase?.evaluation;
  const loading = caseLoading;
  const error = caseError;

  const readiness = useMemo(() => {
    const pct = evaluation?.readiness ?? 0;
    let desc = 'Profile, parent, and documents are in place';
    if (!evaluation?.profile?.active) desc = 'Scan the student ID and add one parent';
    else if (evaluation?.applicationNeeds?.length) desc = 'The checklist still has documents to upload';
    else if (evaluation?.canApply) desc = 'Ready to apply';
    return { pct, desc };
  }, [evaluation]);
  const studentName = [profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean).join(' ') || user?.user_metadata?.full_name || 'Student';
  const institutionName = profile?.school_name || '';
  const statusConfig = application ? getStatusConfig(application.application_status || 'Draft') : null;
  const previewAlerts = (studentCase?.notifications || []).slice(0, 3);
  const previewActivity = (activity || []).slice(0, 3);
  const timelineStages = applicationSteps(evaluation, application);
  const nextAction = evaluation?.next;

  if (loading) return <StudentLayout pageTitle="Dashboard" layout="dashboard" notificationBadge={false}><SkeletonLoader /></StudentLayout>;
  if (error) return <StudentLayout pageTitle="Dashboard" layout="dashboard"><ErrorState message={error.message} onRetry={refresh} /></StudentLayout>;

  return (
    <StudentLayout
      pageTitle="Dashboard"
      layout="dashboard"
      notificationBadge={previewAlerts.some((item) => !item.is_read)}
      studentName={studentName}
    >
      <div className="stitch-dashboard">
        <section style={{
          background: 'linear-gradient(135deg, rgba(212,175,55,0.10) 0%, rgba(230,211,163,0.18) 50%, rgba(212,175,55,0.06) 100%)',
          borderRadius: '1.5rem',
          padding: 'clamp(20px, 4vw, 32px)',
          marginBottom: 24,
          border: '1px solid rgba(212,175,55,0.15)',
          boxShadow: '0px 12px 36px rgba(201,162,39,0.10)'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'clamp(12px, 2vw, 20px)',
            flexWrap: 'wrap', marginBottom: 20
          }}>
            <div style={{
              width: 'clamp(48px, 8vw, 72px)', height: 'clamp(48px, 8vw, 72px)',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #DDBB6A, #E6D3A3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#5C4A1E', fontWeight: 700,
              fontSize: 'clamp(18px, 3vw, 28px)', flexShrink: 0
            }}>
              {studentName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <h1 style={{
                margin: 0, fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.03em',
                fontSize: 'clamp(20px, 4vw, 44px)',
                color: 'var(--text, #141b2b)'
              }}>
                {greeting}, {studentName}
              </h1>
              {institutionName && (
                <p style={{
                  margin: '4px 0 0',
                  fontSize: 'clamp(13px, 1.5vw, 16px)',
                  color: 'var(--text-2, #434654)'
                }}>
                  {institutionName}
                </p>
              )}
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 'clamp(12px, 2vw, 16px)',
            flexWrap: 'wrap', padding: 'clamp(12px, 2vw, 16px)',
            background: 'rgba(255,255,255,0.5)',
            borderRadius: '1rem',
            backdropFilter: 'blur(4px)'
          }}>
            <div style={{
              width: 'clamp(40px, 6vw, 48px)', height: 'clamp(40px, 6vw, 48px)',
              borderRadius: '50%',
              border: '4px solid #DDBB6A',
              borderTopColor: 'rgba(221,187,106,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <span style={{ fontWeight: 700, color: '#7A6530', fontSize: 'clamp(12px, 1.5vw, 14px)' }}>
                {readiness.pct}%
              </span>
            </div>
            <div>
              <p style={{
                margin: 0,
                fontSize: 'clamp(11px, 1.2vw, 12px)', fontWeight: 600,
                letterSpacing: '0.05em', color: '#7A6530'
              }}>
                Overall Readiness
              </p>
              <p style={{
                margin: '4px 0 0',
                fontSize: 'clamp(12px, 1.5vw, 14px)',
                color: 'var(--text-2, #434654)'
              }}>
                {readiness.desc}
              </p>
            </div>
          </div>
        </section>

        <section className="stitch-primary-card ambient-shadow">
          <div className="stitch-primary-card__glow" />
          <div className="stitch-primary-card__content">
            <div>
              <span className="stitch-primary-card__badge">
                {statusConfig ? statusConfig.label : evaluation?.profile?.active ? 'Ready' : 'Inactive'}
              </span>
              <h2 className="stitch-primary-card__title">
                {statusConfig ? statusConfig.hint : evaluation?.blockReason || 'No application yet'}
              </h2>
            </div>
            {nextAction?.route && (
              <Link className="stitch-primary-card__btn" to={nextAction.route}>
                {nextAction.title}
              </Link>
            )}
          </div>
          <div className="stitch-primary-card__stepper">
            <div className="stitch-stepper">
              {timelineStages.map((stage, idx) => (
                <div key={stage.label} className={`stitch-step ${stage.state === 'completed' ? 'stitch-step--done' : stage.state === 'current' ? 'stitch-step--active' : 'stitch-step--pending'}`}>
                  <div className="stitch-step__node">
                    {stage.state === 'completed' ? <Icon name="check" size={18} /> : <span>{idx + 1}</span>}
                  </div>
                  <span className="stitch-step__label">{stage.label}</span>
                </div>
              ))}
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

        {previewAlerts.length ? (
          <section className="dash-activity">
            <h3 className="stitch-section-title">Alerts</h3>
            <ul className="feed-list">
              {previewAlerts.map((item) => (
                <li key={item.id} className={`feed-item ${!item.is_read ? 'feed-item--unread' : ''}`}>
                  <div className="feed-item__icon" aria-hidden="true">
                    <Icon name="bell" size={18} />
                  </div>
                  <div>
                    <p className="feed-item__title">{item.title}</p>
                    <p className="feed-item__body">{item.message}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

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
