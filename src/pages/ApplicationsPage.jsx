import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { APPLICATIONS_AGGREGATE, PARENT, LINKED_STUDENTS } from '../data/parentMock.js';

const SIDEBAR_LINKS = [
  { label: 'Home', path: '/dashboard', icon: 'home', active: false },
  { label: 'Applications', path: '/applications', icon: 'description', active: true },
  { label: 'Messages', path: '/student/messages', icon: 'chat_bubble', active: false },
  { label: 'Profile', path: '/profile', icon: 'person', active: false }
];

const BOTTOM_LINKS = [
  { label: 'Support', path: '/support', icon: 'help_outline' },
  { label: 'Settings', path: '/profile', icon: 'settings' }
];

const FOOTER_LINKS = [
  { label: 'Support Center', path: '/support' },
  { label: 'Privacy Policy', path: '#' },
  { label: 'Terms of Service', path: '#' },
  { label: 'Accessibility', path: '#' }
];

function getStatusChip(status) {
  const map = {
    'Allocated': 'stitch-app-table__status--allocated',
    'Approved': 'stitch-app-table__status--allocated',
    'Under Review': 'stitch-app-table__status--reviewing',
    'Disbursed': 'stitch-app-table__status--completed',
    'Reviewing': 'stitch-app-table__status--reviewing'
  };
  const cls = map[status] || 'stitch-app-table__status--reviewing';
  return <span className={`stitch-app-table__status ${cls}`}>{status}</span>;
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('');
}

function getAvatarClass(name) {
  const first = name.split(' ')[0];
  return first === 'Brian' || first === 'Mateo'
    ? 'stitch-app-table__avatar--primary'
    : 'stitch-app-table__avatar--secondary';
}

export function ApplicationsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Any Status');

  const filtered = useMemo(() => {
    return APPLICATIONS_AGGREGATE.filter((app) => {
      const matchSearch =
        !search ||
        app.fullName.toLowerCase().includes(search.toLowerCase()) ||
        app.school.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === 'Any Status' || app.applicationStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

  const activeApps = filtered.filter(
    (a) => a.applicationStatus === 'Under Review' || a.applicationStatus === 'Approved'
  );
  const completedApps = filtered.filter(
    (a) => a.applicationStatus === 'Disbursed' || a.applicationStatus === 'Allocated'
  );

  const totalAllocated = useMemo(() => {
    return APPLICATIONS_AGGREGATE.reduce((sum, a) => {
      const amt = parseFloat(String(a.amountAllocated || '0').replace(/[^0-9.]/g, ''));
      return sum + amt;
    }, 0);
  }, []);

  return (
    <div className="stitch-parent stitch-apps-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Manrope, system-ui, sans-serif' }}>
      {/* TopNavBar */}
      <header className="stitch-parent-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/dashboard" style={{ textDecoration: 'none' }}>
            <span className="stitch-parent-header__brand">ScholarShip</span>
          </Link>
        </div>
        <div className="stitch-parent-header__actions">
          <button className="stitch-parent-header__icon-btn" aria-label="Notifications">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="stitch-parent-header__icon-btn" aria-label="Toggle theme">
            <span className="material-symbols-outlined">dark_mode</span>
          </button>
          <div className="stitch-parent-header__profile">
            <div className="stitch-parent-header__profile-text">
              <p className="stitch-parent-header__profile-name" style={{ fontSize: '10px', opacity: 0.7 }}>PARENT PORTAL</p>
              <p className="stitch-parent-header__profile-name">{PARENT.fullName}</p>
            </div>
            <div
              className="stitch-parent-header__avatar"
              style={{
                background: 'linear-gradient(135deg, #765a14, #b8964b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: '16px'
              }}
            >
              {getInitials(PARENT.fullName)}
            </div>
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* SideNavBar */}
        <aside className="stitch-parent-sidebar" style={{ background: '#eaf5fa' }}>
          <div className="stitch-parent-sidebar__heading">
            <h3 className="stitch-parent-sidebar__title">Parent Portal</h3>
            <p className="stitch-parent-sidebar__subtitle">Education Management</p>
          </div>
          <nav className="stitch-parent-sidebar__nav">
            {SIDEBAR_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`stitch-parent-sidebar__link ${link.active ? 'stitch-parent-sidebar__link--active' : ''}`}
              >
                <span className="material-symbols-outlined" style={link.active ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {link.icon}
                </span>
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>
          <div className="stitch-parent-sidebar__bottom">
            <nav className="stitch-parent-sidebar__nav">
              {BOTTOM_LINKS.map((link) => (
                <Link key={link.path} to={link.path} className="stitch-parent-sidebar__link">
                  <span className="material-symbols-outlined">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="stitch-parent-main" style={{ background: '#f1fbff' }}>
          {/* Page Header */}
          <div className="stitch-apps-page__header">
            <div>
              <h1 className="stitch-apps-page__title">Detailed Monitoring</h1>
              <p className="stitch-apps-page__subtitle">
                Track and manage scholarship applications across all active and historical bursary windows for your registered dependents.
              </p>
            </div>
            <button
              className="stitch-apps-page__new-btn"
              onClick={() => navigate('/new-application')}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
              New Application
            </button>
          </div>

          {/* Filters */}
          <div className="stitch-filter-card stitch-glass-card-v2 stitch-gold-highlight">
            <div className="stitch-filter-card__inner">
              <div className="stitch-filter-card__field">
                <label className="stitch-filter-card__label">Search Students</label>
                <div className="stitch-filter-card__input-wrap">
                  <span className="material-symbols-outlined stitch-filter-card__search-icon">search</span>
                  <input
                    className="stitch-filter-card__input"
                    type="text"
                    placeholder="Filter by name or ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="stitch-filter-card__field" style={{ minWidth: '200px', flex: '0 1 auto' }}>
                <label className="stitch-filter-card__label">Application Status</label>
                <select
                  className="stitch-filter-card__select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option>Any Status</option>
                  <option>Under Review</option>
                  <option>Approved</option>
                  <option>Disbursed</option>
                </select>
              </div>
              <button className="stitch-filter-card__adv-btn">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>filter_list</span>
                Advanced
              </button>
            </div>
          </div>

          {/* Application Table */}
          <div className="stitch-window-section">
            <div className="stitch-window-section__head">
              <span className="stitch-window-section__badge">Active Applications</span>
              <div className="stitch-window-section__line"></div>
            </div>
            <div className="stitch-window-section__table-wrap stitch-surface-card stitch-gold-highlight">
              <div className="stitch-custom-scrollbar" style={{ overflowX: 'auto' }}>
                <table className="stitch-app-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>School</th>
                      <th>Level</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Last Update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeApps.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: '#4d4638' }}>
                          No active applications found.
                        </td>
                      </tr>
                    ) : (
                      activeApps.map((app) => (
                        <tr key={app.id}>
                          <td>
                            <div className="stitch-app-table__student">
                              <div className={`stitch-app-table__avatar ${getAvatarClass(app.fullName)}`}>
                                {getInitials(app.fullName)}
                              </div>
                              <span className="stitch-app-table__student-name">{app.fullName}</span>
                            </div>
                          </td>
                          <td>{app.school}</td>
                          <td style={{ fontFamily: 'Hanken Grotesk', fontSize: '12px', color: '#4d4638' }}>
                            {app.grade}
                          </td>
                          <td style={{ fontWeight: 700 }}>{app.amountAllocated || app.amountRequested}</td>
                          <td>{getStatusChip(app.applicationStatus)}</td>
                          <td style={{ fontSize: '14px', color: '#4d4638' }}>{app.lastUpdated}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {completedApps.length > 0 && (
            <div className="stitch-window-section">
              <div className="stitch-window-section__head">
                <span className="stitch-window-section__badge">Completed Applications</span>
                <div className="stitch-window-section__line"></div>
              </div>
              <div className="stitch-window-section__table-wrap stitch-surface-card stitch-gold-highlight">
                <div className="stitch-custom-scrollbar" style={{ overflowX: 'auto' }}>
                  <table className="stitch-app-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>School</th>
                        <th>Level</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Last Update</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedApps.map((app) => (
                        <tr key={app.id}>
                          <td>
                            <div className="stitch-app-table__student">
                              <div className={`stitch-app-table__avatar ${getAvatarClass(app.fullName)}`}>
                                {getInitials(app.fullName)}
                              </div>
                              <span className="stitch-app-table__student-name">{app.fullName}</span>
                            </div>
                          </td>
                          <td>{app.school}</td>
                          <td style={{ fontFamily: 'Hanken Grotesk', fontSize: '12px', color: '#4d4638' }}>
                            {app.grade}
                          </td>
                          <td style={{ fontWeight: 700 }}>{app.amountAllocated || app.amountRequested}</td>
                          <td>{getStatusChip(app.applicationStatus)}</td>
                          <td style={{ fontSize: '14px', color: '#4d4638' }}>{app.lastUpdated}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats / Insights */}
          <div className="stitch-insights-grid">
            <div className="stitch-insight-card">
              <div className="stitch-insight-card__bg-icon">
                <span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>account_balance_wallet</span>
              </div>
              <p className="stitch-insight-card__label">TOTAL ALLOCATED</p>
              <p className="stitch-insight-card__value">KES {totalAllocated.toLocaleString()}</p>
              <div className="stitch-insight-card__trend stitch-insight-card__trend--up">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>trending_up</span>
                <span style={{ fontWeight: 600 }}>12% from previous year</span>
              </div>
            </div>
            <div className="stitch-insight-card">
              <div className="stitch-insight-card__bg-icon">
                <span className="material-symbols-outlined" style={{ fontSize: 'inherit' }}>pending_actions</span>
              </div>
              <p className="stitch-insight-card__label">PENDING REVIEWS</p>
              <p className="stitch-insight-card__value">{activeApps.length} Application{activeApps.length !== 1 ? 's' : ''}</p>
              <div className="stitch-insight-card__trend stitch-insight-card__trend--neutral">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>schedule</span>
                <span>Est. completion: 3 days</span>
              </div>
            </div>
            <div className="stitch-insight-card stitch-insight-card--highlight">
              <div className="stitch-insight-card__badge-corner">
                <span className="material-symbols-outlined">verified</span>
              </div>
              <p className="stitch-insight-card__label" style={{ fontWeight: 700 }}>VERIFICATION TIPS</p>
              <ul className="stitch-insight-card__tip-list">
                <li className="stitch-insight-card__tip-item">
                  <span className="material-symbols-outlined stitch-insight-card__tip-icon" style={{ fontSize: '20px' }}>info</span>
                  <span>Ensure school seals are visible on all uploaded transcripts.</span>
                </li>
                <li className="stitch-insight-card__tip-item">
                  <span className="material-symbols-outlined stitch-insight-card__tip-icon" style={{ fontSize: '20px' }}>info</span>
                  <span>New window for 2025 Scholarships opens in December.</span>
                </li>
              </ul>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="stitch-parent-footer" style={{ background: '#e4f0f4' }}>
        <div>
          <span className="stitch-parent-footer__brand">ScholarShip</span>
          <p className="stitch-parent-footer__copy">
            &copy; 2026 ScholarShip Education Management. All rights reserved.
          </p>
        </div>
        <div className="stitch-parent-footer__links">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.label} to={link.path} className="stitch-parent-footer__link">
              {link.label}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
