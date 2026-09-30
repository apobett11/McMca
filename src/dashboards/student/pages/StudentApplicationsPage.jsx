import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { StudentLayout } from '../components/StudentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { getStatusConfig } from '../../../utils/statusConfig.js';
import { trackingCode } from '../../../domain/requirements.js';
import { useStudentCase } from '../context/StudentCaseContext.jsx';

function SkeletonRow() {
  return (
    <div className="skeleton-wrap" style={{ padding: 16 }}>
      <div className="skeleton skeleton--line" />
      <div className="skeleton skeleton--line-short" />
    </div>
  );
}

export function StudentApplicationsPage() {
  const { data, loading, error } = useStudentCase();
  const [openId, setOpenId] = useState(null);

  const historyApps = data?.applications || [];
  const activeApp = data?.application;
  const evaluation = data?.evaluation;

  function getStatusClass(status) {
    const map = {
      submitted: 'stitch-status-badge--review',
      'Under Review': 'stitch-status-badge--review',
      chief_approved: 'stitch-status-badge--admitted',
      approved: 'stitch-status-badge--admitted',
      'Funds Sent': 'stitch-status-badge--admitted',
      disbursed: 'stitch-status-badge--admitted',
      pending: 'stitch-status-badge--review',
      rejected: 'stitch-status-badge--declined',
      draft: 'stitch-status-badge--withdrawn'
    };
    return map[status] || 'stitch-status-badge--withdrawn';
  }

  return (
    <StudentLayout pageTitle="Applications">
      <div className="stitch-apps-header">
        <h1 className="stitch-apps-header__title">My Applications</h1>
        <p className="stitch-apps-header__sub">
          Track your bursary applications and submissions for this ward.
        </p>
      </div>

      {error ? (
        <div className="notice" role="alert">
          <strong>Applications unavailable</strong>
          <p>{error.message}</p>
        </div>
      ) : loading ? (
        <div className="stitch-apps-active">
          <SkeletonRow />
        </div>
      ) : activeApp ? (
        <section className="stitch-apps-active">
          <h2 className="stitch-apps-active__heading">
            <Icon name="applications" size={24} />
            Active Application
          </h2>
          <div className="stitch-apps-active__card">
            <div className="stitch-apps-active__card-bg">
              <Icon name="applications" size={120} />
            </div>
            <div className="stitch-apps-active__card-content">
              <div className="stitch-apps-active__card-left">
                <span className="stitch-apps-active__badge">
                  Bursary Application
                </span>
                <h3 className="stitch-apps-active__card-title">
                  {activeApp.institution_name || 'Bursary Application'}
                </h3>
                <p className="stitch-apps-active__card-id">
                  Tracking: {trackingCode(activeApp)}
                </p>
                {activeApp.timeline_stages || activeApp.timelineStages ? (
                  <div className="stitch-apps-progress">
                    <div className="stitch-apps-progress__bar">
                      <div className="stitch-apps-progress__fill" style={{
                        width: `${((activeApp.timeline_stages || activeApp.timelineStages).filter(s => s.state === 'completed' || s.state === 'current').length / Math.max((activeApp.timeline_stages || activeApp.timelineStages).length, 1)) * 100}%`
                      }} />
                    </div>
                    <div className="stitch-apps-progress__steps">
                      {(activeApp.timeline_stages || activeApp.timelineStages || []).map((stage, idx) => (
                        <div key={idx} className="stitch-apps-progress__step">
                          <div className={`stitch-apps-progress__node ${stage.state === 'completed' ? 'stitch-apps-progress__node--done stitch-apps-progress__node--done-ring' : stage.state === 'current' ? 'stitch-apps-progress__node--done' : 'stitch-apps-progress__node--pending'}`}>
                            {stage.state === 'completed' ? <Icon name="check" size={16} /> : idx + 1}
                          </div>
                          <span className={`stitch-apps-progress__label ${stage.state !== 'pending' ? 'stitch-apps-progress__label--done' : 'stitch-apps-progress__label--pending'}`}>
                            {stage.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="stitch-apps-active__next-step">
                <p className="stitch-apps-active__next-step-label">
                  <Icon name="info" size={16} />
                  STATUS
                </p>
                <p className="stitch-apps-active__next-step-title">
                  {getStatusConfig(activeApp.application_status).label}
                </p>
                <p className="stitch-apps-active__next-step-desc">
                  {getStatusConfig(activeApp.application_status).hint}
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="stitch-apps-history">
        <div className="stitch-apps-history__head">
          <h2 className="stitch-section-title">Application History</h2>
          {evaluation?.canApply ? (
            <Link to="/student/new-application" className="btn btn--primary" style={{ borderRadius: 999, width: 'auto', padding: '10px 24px' }}>
              <Icon name="plus" size={20} />
              Apply
            </Link>
          ) : (
            <Link to={evaluation?.next?.route || '/student/documents'} className="btn btn--secondary" style={{ borderRadius: 999, width: 'auto', padding: '10px 24px' }}>
              <Icon name={evaluation?.next?.icon || 'info'} size={20} />
              {evaluation?.next?.title || 'Checklist'}
            </Link>
          )}
        </div>
        {historyApps.length > 0 ? (
          <div className="stitch-apps-table">
            <table>
              <thead>
                <tr>
                  <th>Program</th>
                  <th>Cycle</th>
                  <th>Tracking ID</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {historyApps.map((app) => {
                  const config = getStatusConfig(app.application_status);
                  return (
                    <tr key={app.id}>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="stitch-apps-support__icon" style={{ width: 40, height: 40 }}>
                            <Icon name="applications" size={20} />
                          </div>
                          <div>
                            <span>{app.institution_name || 'Bursary Application'}</span>
                          </div>
                        </div>
                      </td>
                      <td>{app.cycle || '—'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{trackingCode(app)}</td>
                      <td>
                        <span className={`stitch-status-badge ${getStatusClass(app.application_status)}`}>
                          {config.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button type="button" className="stitch-table-action" onClick={() => setOpenId(openId === app.id ? null : app.id)}>
                          {openId === app.id ? 'Hide' : 'View Details'}
                        </button>
                      </td>
                    </tr>
                );
              })}
              </tbody>
            </table>
            {historyApps.filter((app) => app.id === openId).map((app) => {
              const config = getStatusConfig(app.application_status);
              return (
                <dl key={app.id} className="detail-grid" style={{ marginTop: 12 }}>
                  <div className="detail-grid__row"><dt>Status</dt><dd>{config.label}</dd></div>
                  <div className="detail-grid__row"><dt>What it means</dt><dd>{config.hint}</dd></div>
                  <div className="detail-grid__row"><dt>Cycle</dt><dd>{app.cycle || '—'}</dd></div>
                  <div className="detail-grid__row"><dt>Office</dt><dd>{app.current_office || '—'}</dd></div>
                  <div className="detail-grid__row"><dt>School</dt><dd>{app.institution_name || '—'}</dd></div>
                  <div className="detail-grid__row"><dt>Tracking</dt><dd>{trackingCode(app)}</dd></div>
                </dl>
              );
            })}
          </div>
        ) : (
          <div className="notice">
            <strong>No applications yet</strong>
            <p>Start your first bursary application to begin the process.</p>
          </div>
        )}
      </section>

      <section className="stitch-apps-support">
        <Link to="/student/documents" className="stitch-apps-support__card">
          <div className="stitch-apps-support__icon">
            <Icon name="documents" size={24} />
          </div>
          <div>
            <p className="stitch-apps-support__title">Documents</p>
            <p className="stitch-apps-support__desc">Checklist for this profile. Verified files stay on file.</p>
          </div>
        </Link>
        <Link to="/student/support" className="stitch-apps-support__card">
          <div className="stitch-apps-support__icon">
            <Icon name="support" size={24} />
          </div>
          <div>
            <p className="stitch-apps-support__title">Support</p>
            <p className="stitch-apps-support__desc">Questions about the checklist or the chief review.</p>
          </div>
        </Link>
        <Link to="/student/notifications" className="stitch-apps-support__card">
          <div className="stitch-apps-support__icon">
            <Icon name="bell" size={24} />
          </div>
          <div>
            <p className="stitch-apps-support__title">Notifications</p>
            <p className="stitch-apps-support__desc">Status changes for this student.</p>
          </div>
        </Link>
      </section>
    </StudentLayout>
  );
}