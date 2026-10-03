import React from 'react';
import { Link } from 'react-router-dom';
import { StudentLayout } from '../components/StudentLayout.jsx';
import { RefreshButton } from '../../../components/RefreshButton.jsx';
import { useAuth } from '../../../context/AuthContext';
import { useCachedQuery } from '../../../lib/useCachedQuery';
import { loadStudentRecord, studentRecordKey } from '../../../lib/portalData';
import { applicationSerial, cycleTitle, formatMoney } from '../../../lib/household.js';
import { EDUCATION_LEVEL_LABEL } from '../../../lib/accountAllocation/constants.js';
import { getStatusConfig } from '../../../utils/statusConfig.js';
import { activeBursaryWindow } from '../../../lib/accountQueries';

function statusClass(status) {
  const map = {
    submitted: 'stitch-status-badge--review',
    under_review: 'stitch-status-badge--review',
    chief_approved: 'stitch-status-badge--admitted',
    approved: 'stitch-status-badge--admitted',
    funds_sent: 'stitch-status-badge--admitted',
    disbursed: 'stitch-status-badge--admitted',
    rejected: 'stitch-status-badge--declined',
    appealed: 'stitch-status-badge--review',
    draft: 'stitch-status-badge--withdrawn'
  };
  return map[String(status || '').toLowerCase()] || 'stitch-status-badge--withdrawn';
}

function levelLabel(value) {
  if (!value) return '—';
  return EDUCATION_LEVEL_LABEL[value] || value;
}

export function StudentApplicationsPage() {
  const { user } = useAuth();
  const { data, loading, refreshing, error, refresh } = useCachedQuery(
    user?.id ? studentRecordKey(user.id) : null,
    () => loadStudentRecord(user.id),
    { enabled: Boolean(user?.id) }
  );
  const sessionApps = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('mcmca_session_applications') || '[]');
    } catch {
      return [];
    }
  })();
  const dbRows = data?.applications || [];
  const mergedRows = [...sessionApps, ...dbRows];
  const rows = Array.from(new Map(mergedRows.map((item) => [item.id, item])).values());
  const windows = data?.windows || [];
  const showSkeleton = loading && !data;

  const cycleGate = activeBursaryWindow(windows);
  const activeCycle = cycleGate.window;
  const cycleName = activeCycle ? cycleTitle({ application_window_id: activeCycle.id }, windows) : '';
  const alreadyApplied = Boolean(
    activeCycle && rows.some((row) => row.application_window_id === activeCycle.id)
  );

  return (
    <StudentLayout pageTitle="Applications" layout="dashboard">
      <div className="stitch-apps-header">
        <h1 className="stitch-apps-header__title">Applications</h1>
        <p className="stitch-apps-header__sub">
          Every bursary application on your account, including cycle, serial number, status, and amounts.
        </p>
      </div>

      <section className="stitch-apps-history">
        <div className="dash-suite__head">
          <div>
            <h2 className="stitch-section-title">History</h2>
            {activeCycle && (
              <p className="field__help" style={{ margin: '4px 0 0' }}>
                Cycle: {cycleName} — {alreadyApplied ? 'Application on file (one per cycle)' : 'Open for application'}
              </p>
            )}
          </div>
          <RefreshButton onClick={refresh} busy={refreshing} />
        </div>
        {error ? (
          <div className="notice" role="alert">
            <strong>Could not load</strong>
            <p>{error}</p>
          </div>
        ) : null}

        {showSkeleton ? (
          <div className="skeleton-wrap">
            <div className="skeleton skeleton--hero" />
          </div>
        ) : rows.length === 0 ? (
          <div className="notice">
            <strong>No applications yet</strong>
            <p>You have made no application. Complete the form registration, then apply for the cycle.</p>
            <Link className="btn btn--primary" to="/student/documents" style={{ borderRadius: 999, width: 'auto', marginTop: 12 }}>
              Open forms
            </Link>
          </div>
        ) : (
          <div className="stitch-apps-table">
            <table>
              <thead>
                <tr>
                  <th>Cycle</th>
                  <th>Serial number</th>
                  <th>Institution</th>
                  <th>Level</th>
                  <th>Status</th>
                  <th>Allocated</th>
                  <th>Requested</th>
                  <th>Fee balance</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((app) => {
                  const status = getStatusConfig(app.application_status);
                  return (
                    <tr key={app.id}>
                      <td data-label="Cycle">{cycleTitle(app, windows, app.created_at)}</td>
                      <td data-label="Serial number" style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{applicationSerial(app)}</td>
                      <td data-label="Institution" style={{ fontWeight: 600 }}>{app.institution_name || '—'}</td>
                      <td data-label="Level">{levelLabel(app.institution_level)}</td>
                      <td data-label="Status">
                        <span className={`stitch-status-badge ${statusClass(app.application_status)}`}>
                          {status.label}
                        </span>
                      </td>
                      <td data-label="Allocated">{formatMoney(app.allocated_amount)}</td>
                      <td data-label="Requested">{formatMoney(app.requested_amount)}</td>
                      <td data-label="Fee balance">{formatMoney(app.fee_balance)}</td>
                      <td data-label="Submitted">
                        {app.submitted_at || app.created_at
                          ? new Date(app.submitted_at || app.created_at).toLocaleDateString()
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </StudentLayout>
  );
}
