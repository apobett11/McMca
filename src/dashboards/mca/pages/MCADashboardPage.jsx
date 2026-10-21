import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MCALayout } from '../components/MCALayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { RefreshButton } from '../../../components/RefreshButton.jsx';
import {
  getMCAApplications,
  getMCAMessages,
  getMCAProfile,
  getMCACycleSettings,
  syncMCAApplicationsFromDB,
  WARD_VILLAGES
} from '../utils/mcaData.js';

export function MCADashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(() => getMCAProfile());
  const [applications, setApplications] = useState(() => getMCAApplications());
  const [messages, setMessages] = useState(() => getMCAMessages());
  const [cycleSettings, setCycleSettings] = useState(() => getMCACycleSettings());
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await syncMCAApplicationsFromDB();
    setProfile(getMCAProfile());
    setApplications(getMCAApplications());
    setMessages(getMCAMessages());
    setCycleSettings(getMCACycleSettings());
    setRefreshing(false);
  }

  useEffect(() => {
    function refreshData() {
      setProfile(getMCAProfile());
      setApplications(getMCAApplications());
      setMessages(getMCAMessages());
      setCycleSettings(getMCACycleSettings());
    }

    syncMCAApplicationsFromDB().catch(() => {});

    window.addEventListener('mcmca_mca_apps_updated', refreshData);
    window.addEventListener('mcmca_mca_messages_updated', refreshData);
    window.addEventListener('mcmca_mca_profile_updated', refreshData);
    window.addEventListener('mcmca_mca_cycle_settings_updated', refreshData);

    return () => {
      window.removeEventListener('mcmca_mca_apps_updated', refreshData);
      window.removeEventListener('mcmca_mca_messages_updated', refreshData);
      window.removeEventListener('mcmca_mca_profile_updated', refreshData);
      window.removeEventListener('mcmca_mca_cycle_settings_updated', refreshData);
    };
  }, []);

  // Quick stats calculation
  const totalBursaryAllocated = applications.reduce((sum, a) => sum + (Number(a.bursaryAmount) || 0), 0);
  const approvedCount = applications.filter(a => a.status === 'Allocated' || a.status === 'Approved' || a.status === 'Disbursed' || a.status === 'Paid to account').length;
  const failedCount = applications.filter(a => a.status === 'Failed').length;
  const pendingMessagesCount = messages.filter(m => m.status === 'Pending MCA Action').length;
  const approvalRate = applications.length > 0 ? Math.round((approvedCount / applications.length) * 100) : 0;

  return (
    <MCALayout pageTitle="MCA Executive Dashboard" mcaName={profile.fullName}>
      {/* HERO SECTION */}
      <section className="mca-hero" aria-label="MCA Ward Executive Overview">
        <div className="mca-hero__header">
          <div>
            <div className="mca-hero__meta" style={{ marginBottom: 8 }}>
              <span className="mca-hero__badge">
                <Icon name="shield" size={14} /> Official Ward Executive
              </span>
              <Link
                to="/mca/applications"
                className="mca-hero__cycle-pill"
                style={{ textDecoration: 'none', cursor: 'pointer', transition: 'transform 0.15s ease' }}
                title="Click to open Applications & Distribution Cards"
              >
                <Icon name="calendar" size={14} /> {cycleSettings.cycle || '2026/2027'} Active Cycle →
              </Link>
            </div>
            <h1 className="mca-hero__title">
              {profile.fullName || 'Hon. Hillary Kiprotich Bett'}
            </h1>
            <p className="mca-hero__subtitle">
              Tendeno / Sorget Ward Executive Command • Transparent education bursary allocation & intake monitoring.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <Link
              to="/mca/applications"
              className="mca-btn mca-btn--done"
              style={{ padding: '10px 18px', fontWeight: 700, textDecoration: 'none' }}
            >
              <Icon name="applications" size={18} />
              Bursary Applications Queue
            </Link>
            <Link
              to="/mca/messages"
              className="mca-btn mca-btn--schedule"
              style={{ padding: '10px 18px', fontWeight: 700, textDecoration: 'none' }}
            >
              <Icon name="support" size={18} />
              Help Desk Petitions ({pendingMessagesCount})
            </Link>
            <RefreshButton busy={refreshing} onClick={handleRefresh} />
          </div>
        </div>
      </section>

      {/* ANALYTICS QUICK CARDS */}
      <section className="mca-section" aria-label="Analytics Quick Cards">
        <div className="mca-section__header">
          <div>
            <h2 className="mca-section__title">
              <Icon name="funds" size={20} />
              Bursary Executive Metrics
            </h2>
            <p className="mca-section__desc">Key performance and financial indicators for Tendeno / Sorget Ward</p>
          </div>
        </div>

        <div className="mca-metrics-grid">
          {/* Card 1: Bursaries Disbursed / Allocated */}
          <div
            className="mca-metric-card mca-card--clickable"
            onClick={() => navigate('/mca/applications')}
            title="Click to view Applications Analytics"
          >
            <div className="mca-metric-card__top">
              <div className="mca-metric-card__icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                <Icon name="funds" size={18} />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 600 }}>Active Cycle</span>
            </div>
            <div>
              <div className="mca-metric-card__value">KES {totalBursaryAllocated.toLocaleString()}</div>
              <div className="mca-metric-card__label">Bursary Disbursed / Allocated</div>
            </div>
            <div className="mca-metric-card__trend" style={{ color: '#34d399' }}>
              <Icon name="check" size={14} /> {applications.length} students enrolled
            </div>
          </div>

          {/* Card 2: Total Applicants & Intake */}
          <div
            className="mca-metric-card mca-card--clickable"
            onClick={() => navigate('/mca/applications')}
            title="Click to view Applications Roster"
          >
            <div className="mca-metric-card__top">
              <div className="mca-metric-card__icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                <Icon name="user" size={18} />
              </div>
              <span className="mca-badge mca-badge--done">{approvedCount} Approved</span>
            </div>
            <div>
              <div className="mca-metric-card__value">{applications.length}</div>
              <div className="mca-metric-card__label">Total Applications Received</div>
            </div>
            <div className="mca-metric-card__trend" style={{ color: '#34d399' }}>
              {approvalRate}% overall approval rate
            </div>
          </div>

          {/* Card 3: Cycle State & Administration */}
          <div
            className="mca-metric-card mca-card--clickable"
            onClick={() => navigate('/mca/applications')}
            title="Click to manage Cycle Window & Controls"
          >
            <div className="mca-metric-card__top">
              <div className="mca-metric-card__icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                <Icon name="calendar" size={18} />
              </div>
              <span className="mca-badge mca-badge--scheduled">{cycleSettings.state || 'Allocated'}</span>
            </div>
            <div>
              <div className="mca-metric-card__value">{cycleSettings.cycle || '2026/2027'}</div>
              <div className="mca-metric-card__label">Active Intake Cycle</div>
            </div>
            <div className="mca-metric-card__trend" style={{ color: '#818cf8' }}>
              Across all {WARD_VILLAGES.length} Ward Villages
            </div>
          </div>

          {/* Card 4: Help Desk Forwarded Petitions */}
          <div
            className="mca-metric-card mca-card--clickable"
            onClick={() => navigate('/mca/messages')}
            title="Click to view Help Desk Messages"
          >
            <div className="mca-metric-card__top">
              <div className="mca-metric-card__icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' }}>
                <Icon name="bell" size={18} />
              </div>
              <span className="mca-badge" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
                {pendingMessagesCount} Actionable
              </span>
            </div>
            <div>
              <div className="mca-metric-card__value">{messages.length}</div>
              <div className="mca-metric-card__label">Help Desk Escalations</div>
            </div>
            <div className="mca-metric-card__trend" style={{ color: '#94a3b8' }}>
              Forwarded applicant inquiries
            </div>
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="mca-section" aria-label="Executive Quick Actions">
        <div className="mca-section__header">
          <div>
            <h2 className="mca-section__title">
              <Icon name="arrowRight" size={18} />
              Quick Actions
            </h2>
            <p className="mca-section__desc">Direct access to daily bursary allocation and oversight workflows</p>
          </div>
        </div>

        <div className="mca-quick-actions">
          <Link to="/mca/applications" className="mca-action-btn mca-action-btn--primary">
            <Icon name="applications" size={20} />
            <span>Applications Analytics</span>
          </Link>

          <Link to="/mca/applications" className="mca-action-btn">
            <Icon name="calendar" size={20} />
            <span>Cycle Window &amp; Intake Controls</span>
          </Link>

          <Link to="/mca/messages" className="mca-action-btn">
            <Icon name="support" size={20} />
            <span>Help Desk Messages ({pendingMessagesCount})</span>
          </Link>

          <button
            type="button"
            className="mca-action-btn"
            onClick={() => {
              const headers = ['Serial', 'Name', 'School', 'Level', 'Location', 'Polling Station', 'Bursary Amount', 'Status'];
              const rows = applications.map(a => [a.serial, a.fullName, a.school, a.educationLevel, a.location, a.pollingStation, a.bursaryAmount, a.status]);
              const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
              const link = document.createElement('a');
              link.setAttribute('href', encodeURI(csvContent));
              link.setAttribute('download', `mcmca_bursary_export_${(cycleSettings.cycle || '2026_2027').replace('/', '_')}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            <Icon name="upload" size={20} />
            <span>Export CSV Bursary Report</span>
          </button>
        </div>
      </section>

      {/* RECENT BURSARY APPLICATIONS RECEIVED & VETTED */}
      <section className="mca-section" aria-label="Recent Bursary Applications">
        <div className="mca-section__header">
          <div>
            <h2 className="mca-section__title">
              <Icon name="applications" size={20} />
              Recent Applications Received &amp; Vetted
            </h2>
            <p className="mca-section__desc">
              Latest applicant records across Tendeno / Sorget Ward undergoing verification and allocation.
            </p>
          </div>
          <Link to="/mca/applications" className="mca-btn mca-btn--schedule" style={{ textDecoration: 'none' }}>
            Open Full Applications Roster ({applications.length}) →
          </Link>
        </div>

        <div className="mca-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15,23,42,0.8)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '12px 16px', color: '#94a3b8', fontWeight: 700 }}>Serial / Student</th>
                  <th style={{ padding: '12px 16px', color: '#94a3b8', fontWeight: 700 }}>Institution / School</th>
                  <th style={{ padding: '12px 16px', color: '#94a3b8', fontWeight: 700 }}>Level</th>
                  <th style={{ padding: '12px 16px', color: '#94a3b8', fontWeight: 700 }}>Location / Village</th>
                  <th style={{ padding: '12px 16px', color: '#94a3b8', fontWeight: 700 }}>Bursary Allocation</th>
                  <th style={{ padding: '12px 16px', color: '#94a3b8', fontWeight: 700 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.slice(0, 8).map((app) => (
                  <tr key={app.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#f8fafc' }}>{app.fullName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#60a5fa' }}>{app.serial}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#e2e8f0' }}>
                      {app.school}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#94a3b8' }}>
                      {app.educationLevel}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ color: '#cbd5e1' }}>{app.village}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{app.pollingStation}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#34d399' }}>
                      KES {(Number(app.bursaryAmount) || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        className={`mca-badge ${
                          app.status === 'Failed'
                            ? 'mca-badge--cancelled'
                            : app.status === 'Pending'
                            ? 'mca-badge--waiting'
                            : 'mca-badge--done'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '14px 16px', background: 'rgba(15,23,42,0.4)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Showing {Math.min(8, applications.length)} of {applications.length} applications in {cycleSettings.cycle || '2026/2027'}
            </span>
            <Link to="/mca/applications" style={{ color: '#60a5fa', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}>
              View Complete Intake Analytics →
            </Link>
          </div>
        </div>
      </section>
    </MCALayout>
  );
}
