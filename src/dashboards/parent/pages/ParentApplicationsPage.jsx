import React from 'react';
import { Link } from 'react-router-dom';
import { ParentLayout } from '../components/ParentLayout.jsx';
import { RefreshButton } from '../../../components/RefreshButton.jsx';
import { useAuth } from '../../../context/AuthContext';
import { joinFullName } from '../../../lib/accountAllocation';
import { formatMoney, groupApplicationsByCycle } from '../../../lib/household.js';
import { useCachedQuery } from '../../../lib/useCachedQuery';
import { loadParentApplications } from '../../../lib/portalData';
import { getStatusConfig } from '../../../utils/statusConfig.js';

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
  return map[status] || 'stitch-status-badge--withdrawn';
}

function childName(child) {
  return joinFullName({
    firstName: child.first_name,
    middleName: child.middle_name,
    lastName: child.last_name
  });
}

export function ParentApplicationsPage() {
  const { user } = useAuth();
  const { data, loading, refreshing, error, refresh } = useCachedQuery(
    user?.id ? `${user.id}:parent-applications` : null,
    () => loadParentApplications(user.id),
    { enabled: Boolean(user?.id) }
  );
  const children = data?.children || [];
  const applications = data?.applications || [];
  const windows = data?.windows || [];
  const showSkeleton = loading && !data;
  const groups = groupApplicationsByCycle(children, applications, windows);

  return (
    <ParentLayout pageTitle="Applications" layout="dashboard">
      <div className="stitch-apps-header">
        <h1 className="stitch-apps-header__title">Applications</h1>
        <p className="stitch-apps-header__sub">
          Each bursary round, and the students on that round.
        </p>
      </div>

      <section className="stitch-apps-history">
        <div className="stitch-apps-history__head">
          <h2 className="stitch-section-title">By cycle</h2>
          <RefreshButton onClick={refresh} busy={refreshing} />
        </div>

        {error ? (
          <div className="notice">
            <strong>Could not load</strong>
            <p>{error}</p>
          </div>
        ) : null}

        {showSkeleton ? (
          <div className="skeleton-wrap">
            <div className="skeleton skeleton--hero" />
          </div>
        ) : groups.length === 0 ? (
          <div className="notice">
            <strong>No applications yet</strong>
            <p>Add a child from Documents. Each student appears here under their bursary cycle.</p>
            <Link className="btn btn--primary" to="/parent/documents" style={{ borderRadius: 999, width: 'auto', marginTop: 12 }}>
              Open documents
            </Link>
          </div>
        ) : (
          groups.map((group) => (
            <div className="cycle-block" key={group.cycle}>
              <h3 className="stitch-section-title">{group.cycle}</h3>
              <div className="stitch-apps-table">
                <table>
                  <thead>
                    <tr>
                      <th>Full name</th>
                      <th>School</th>
                      <th>Status</th>
                      <th>Amount allocated</th>
                      <th>Requested</th>
                      <th>Fee balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row) => {
                      const app = row.application;
                      const status = app ? getStatusConfig(app.application_status) : { label: 'Not started' };
                      return (
                        <tr key={app ? app.id : row.child.id}>
                          <td data-label="Full name" style={{ fontWeight: 600 }}>{childName(row.child)}</td>
                          <td data-label="School">{app?.institution_name || row.child.school_name || '—'}</td>
                          <td data-label="Status">
                            <span className={`stitch-status-badge ${app ? statusClass(app.application_status) : 'stitch-status-badge--withdrawn'}`}>
                              {status.label}
                            </span>
                          </td>
                          <td data-label="Amount allocated">{formatMoney(app?.allocated_amount)}</td>
                          <td data-label="Requested">{formatMoney(app?.requested_amount)}</td>
                          <td data-label="Fee balance">{formatMoney(app?.fee_balance)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </section>
    </ParentLayout>
  );
}
