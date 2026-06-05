import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PARENT, LINKED_STUDENTS, NOTIFICATIONS_AGGREGATE } from '../data/parentMock.js';
import { getTimeGreeting } from '../utils/greeting.js';
import { Icon } from '../components/Icon.jsx';

const SIDEBAR_LINKS = [
  { label: 'Home', path: '/dashboard', icon: 'home', active: true },
  { label: 'Applications', path: '/applications', icon: 'applications', active: false },
  { label: 'Messages', path: '/student/messages', icon: 'support', active: false },
  { label: 'Profile', path: '/profile', icon: 'profile', active: false }
];

const BOTTOM_LINKS = [
  { label: 'Support', path: '/support', icon: 'support' },
  { label: 'Settings', path: '/profile', icon: 'shield' }
];

const FOOTER_LINKS = [
  { label: 'Support Center', path: '/support' },
  { label: 'Privacy Policy', path: '#' },
  { label: 'Terms of Service', path: '#' },
  { label: 'Accessibility', path: '#' }
];

const ACTIVITY_ITEMS = NOTIFICATIONS_AGGREGATE.slice(0, 3);

export function DashboardPage() {
  const navigate = useNavigate();
  const greeting = getTimeGreeting();
  const parentName = PARENT.fullName;

  const stats = useMemo(() => {
    const urgent = LINKED_STUDENTS.filter((s) => s.requiresAttention).length;
    const pendingDocs = LINKED_STUDENTS.filter(
      (s) => s.documentStatus === 'Missing Documents' || s.documentStatus === 'Pending Verification'
    ).length;
    return {
      linked: LINKED_STUDENTS.length,
      urgent,
      pendingDocs,
      totalApps: LINKED_STUDENTS.length
    };
  }, []);

  function getDotClass(student) {
    return student.requiresAttention
      ? 'stitch-table__status-dot--error'
      : 'stitch-table__status-dot--primary';
  }

  function getStatusBadge(status) {
    if (status === 'Under Review' || status === 'Processing')
      return (
        <span className="stitch-table__status-badge stitch-table__status-badge--processing">
          Processing
        </span>
      );
    return (
      <span className="stitch-table__status-badge stitch-table__status-badge--action">
        Action Needed
      </span>
    );
  }

  function getActivityDot(item) {
    if (item.urgent) return 'stitch-activity-item__dot--error';
    if (item.type === 'Birth Certificate Verified') return 'stitch-activity-item__dot--primary';
    return 'stitch-activity-item__dot--muted';
  }

  function getActivityTitleClass(item) {
    return item.urgent ? 'stitch-activity-item__title--error' : '';
  }

  function getActivityMutedClass(item) {
    return !item.urgent && item.type !== 'Birth Certificate Verified'
      ? 'stitch-activity-item__muted'
      : '';
  }

  return (
    <div className="stitch-parent stitch-parent-body" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Manrope, system-ui, sans-serif' }}>
      {/* TopNavBar */}
      <header className="stitch-parent-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span className="stitch-parent-header__brand">ScholarShip</span>
        </div>
        <div className="stitch-parent-header__actions">
          <button
            className="stitch-parent-header__icon-btn"
            onClick={() => {}}
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button
            className="stitch-parent-header__icon-btn"
            onClick={() => {}}
            aria-label="Toggle theme"
          >
            <span className="material-symbols-outlined">dark_mode</span>
          </button>
          <div className="stitch-parent-header__profile">
            <div className="stitch-parent-header__profile-text">
              <p className="stitch-parent-header__profile-name">{parentName}</p>
              <p className="stitch-parent-header__profile-role">Primary Guardian</p>
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
              {parentName.split(' ').map((n) => n[0]).join('')}
            </div>
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* SideNavBar */}
        <aside className="stitch-parent-sidebar">
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
                <Link
                  key={link.path}
                  to={link.path}
                  className="stitch-parent-sidebar__link"
                >
                  <span className="material-symbols-outlined">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="stitch-parent-main">
          {/* Luxury Information Card */}
          <section className="stitch-hero-card stitch-gold-gradient">
            <div className="stitch-hero-card__glow">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', fill: 'currentColor' }}>
                <path d="M47.7,-62.4C61.4,-54.6,71.7,-40.4,76.5,-24.8C81.3,-9.1,80.7,8.1,75,23.8C69.3,39.5,58.6,53.8,44.8,63.1C31.1,72.4,14.4,76.7,-1.8,79.2C-18.1,81.7,-34.8,82.4,-48.7,74.2C-62.6,65.9,-73.7,48.7,-78.4,30.8C-83,12.9,-81.1,-5.7,-74.6,-22.3C-68.1,-38.9,-56.9,-53.4,-43.3,-61.2C-29.7,-69.1,-13.7,-70.2,1.3,-72.1C16.3,-73.9,34,-70.2,47.7,-62.4Z" transform="translate(100 100)" />
              </svg>
            </div>
            <div className="stitch-hero-card__content">
              <div>
                <h1 className="stitch-hero-card__greeting">
                  Good Morning, {parentName.split(' ')[0]} {parentName.split(' ').slice(1).join(' ')}
                </h1>
                <p className="stitch-hero-card__text">
                  Your student applications are progressing smoothly. All documents have been verified for your submissions.
                </p>
              </div>
              <div className="stitch-hero-card__stats">
                <div className="stitch-hero-card__stat-box">
                  <p className="stitch-hero-card__stat-value">{stats.linked}</p>
                  <p className="stitch-hero-card__stat-label">Students</p>
                </div>
                <div className="stitch-hero-card__stat-box">
                  <p className="stitch-hero-card__stat-value">{stats.totalApps}</p>
                  <p className="stitch-hero-card__stat-label">Applications</p>
                </div>
              </div>
            </div>
          </section>

          {/* Linked Students Overview Table */}
          <section className="stitch-table-section">
            <div className="stitch-table-section__head">
              <h2 className="stitch-table-section__title">Linked Students Overview</h2>
              <Link to="/applications" className="stitch-table-section__view-all">
                View All Students
              </Link>
            </div>
            <table className="stitch-table">
              <thead>
                <tr>
                  <th style={{ width: '48px', textAlign: 'center' }}></th>
                  <th>Student Name</th>
                  <th>School</th>
                  <th>Education Level</th>
                  <th>Status</th>
                  <th>Documents</th>
                  <th>Access</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {LINKED_STUDENTS.map((student) => (
                  <tr
                    key={student.id}
                    className={student.requiresAttention ? 'stitch-red-glow-row' : ''}
                    style={{ transition: 'background 0.2s' }}
                  >
                    <td style={{ textAlign: 'center' }}>
                      <span className={`stitch-table__status-dot ${getDotClass(student)}`}></span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{student.fullName}</td>
                    <td>{student.school}</td>
                    <td>{student.grade || student.educationLevel}</td>
                    <td>{getStatusBadge(student.applicationStatus)}</td>
                    <td>
                      <span
                        className={`material-symbols-outlined ${student.requiresAttention ? 'stitch-table__icon-warning' : 'stitch-table__icon-check'}`}
                        style={student.requiresAttention ? {} : { fontVariationSettings: "'FILL' 1" }}
                      >
                        {student.requiresAttention ? 'warning' : 'task_alt'}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: '#4d4638' }}>{student.accessType}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className={`stitch-table__action-btn ${student.requiresAttention ? 'stitch-table__action-btn--error' : ''}`}
                        onClick={() => navigate('/applications')}
                        aria-label={`View ${student.fullName}`}
                      >
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Quick Status Cards Grid */}
          <section className="stitch-quick-grid">
            <div className="stitch-quick-card stitch-elevation-1">
              <div className="stitch-quick-card__icon-wrap stitch-quick-card__icon-wrap--primary">
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>description</span>
              </div>
              <h4 className="stitch-quick-card__label">Active Applications</h4>
              <p className="stitch-quick-card__value">{stats.totalApps < 10 ? `0${stats.totalApps}` : stats.totalApps}</p>
            </div>
            <div className="stitch-quick-card stitch-elevation-1">
              <div className="stitch-quick-card__icon-wrap stitch-quick-card__icon-wrap--secondary">
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>pending_actions</span>
              </div>
              <h4 className="stitch-quick-card__label">Pending Docs</h4>
              <p className="stitch-quick-card__value">{stats.pendingDocs < 10 ? `0${stats.pendingDocs}` : stats.pendingDocs}</p>
            </div>
            <div className="stitch-quick-card stitch-elevation-1">
              <div className="stitch-quick-card__icon-wrap stitch-quick-card__icon-wrap--tertiary">
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>history_edu</span>
              </div>
              <h4 className="stitch-quick-card__label">Appeals</h4>
              <p className="stitch-quick-card__value">00</p>
            </div>
            <div className="stitch-quick-card stitch-quick-card--border-error stitch-elevation-1">
              <div className="stitch-quick-card__icon-wrap stitch-quick-card__icon-wrap--error">
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>priority_high</span>
              </div>
              <h4 className="stitch-quick-card__label">Urgent Actions</h4>
              <p className="stitch-quick-card__value stitch-quick-card__value--error">
                {stats.urgent < 10 ? `0${stats.urgent}` : stats.urgent}
              </p>
            </div>
          </section>

          {/* Notifications Preview */}
          <section className="stitch-activity-section">
            <div className="stitch-activity-section__head">
              <h2 className="stitch-activity-section__title">Recent Activity</h2>
              <button className="stitch-activity-section__mark-all">Mark all as read</button>
            </div>
            <div>
              {ACTIVITY_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className={`stitch-activity-item ${getActivityMutedClass(item)}`}
                >
                  <div className={`stitch-activity-item__dot ${getActivityDot(item)}`}></div>
                  <div className="stitch-activity-item__body">
                    <p className={`stitch-activity-item__title ${getActivityTitleClass(item)}`}>
                      {item.title}
                    </p>
                    <p className="stitch-activity-item__text">{item.body}</p>
                    <p className="stitch-activity-item__time">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>

      {/* Footer */}
      <footer className="stitch-parent-footer">
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
