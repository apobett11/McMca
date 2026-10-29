import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from '../../../components/Icon.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { getHelpDeskMessages, getHelpDeskApplications } from '../utils/helpDeskData.js';

const HELPDESK_NAV_ITEMS = [
  { label: 'Home', path: '/helpdesk/dashboard', icon: 'home', key: 'home' },
  { label: 'Documents', path: '/helpdesk/documents', icon: 'documents', key: 'documents' },
  { label: 'Applications', path: '/helpdesk/applications', icon: 'applications', key: 'applications' },
  { label: 'Messages', path: '/helpdesk/messages', icon: 'support', key: 'messages' },
  { label: 'Profile', path: '/helpdesk/profile', icon: 'profile', key: 'profile' }
];

const EXTERNAL_PORTALS = [
  { label: 'MCA Portal', path: '/mca/dashboard', icon: 'review', color: '#60a5fa' },
  { label: 'Chief Portal', path: '/chief/dashboard', icon: 'shield', color: '#38bdf8' },
  { label: 'Public Portal', path: '/', icon: 'home', color: '#94a3b8' }
];

export function HelpDeskDesktopSidebar({ officerName }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [counts, setCounts] = useState({ messages: 0, applications: 0 });

  useEffect(() => {
    function refreshCounts() {
      try {
        const msgs = getHelpDeskMessages();
        const pendingMsgs = Array.isArray(msgs)
          ? msgs.filter((m) => m.status !== 'replied').length
          : 0;

        const apps = getHelpDeskApplications();
        const pendingApps = Array.isArray(apps)
          ? apps.filter((a) => a.applicationStatus === 'Under Review').length
          : 0;

        setCounts({ messages: pendingMsgs, applications: pendingApps });
      } catch (err) {
        console.error('Error refreshing help desk counts:', err);
      }
    }

    refreshCounts();
    window.addEventListener('mcmca_helpdesk_messages_updated', refreshCounts);
    window.addEventListener('mcmca_helpdesk_apps_updated', refreshCounts);

    return () => {
      window.removeEventListener('mcmca_helpdesk_messages_updated', refreshCounts);
      window.removeEventListener('mcmca_helpdesk_apps_updated', refreshCounts);
    };
  }, []);

  async function handleLogout() {
    try {
      if (signOut) await signOut();
    } catch {
      // fallback
    }
    navigate('/login');
  }

  return (
    <aside className="app-desktop-sidebar helpdesk-desktop-sidebar" aria-label="Help Desk navigation">
      <div
        className="sidebar-header"
        style={{
          padding: '0 12px 18px',
          borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
          marginBottom: 12
        }}
      >
        <div
          className="sidebar-subtitle"
          style={{
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#4ade80',
            fontWeight: 700
          }}
        >
          Help Desk Office
        </div>
        <div
          className="sidebar-title"
          style={{
            fontSize: '0.98rem',
            fontWeight: 800,
            color: 'var(--text, #f8fafc)',
            marginTop: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {officerName || 'Clara Chelangat'}
        </div>
        <div
          className="sidebar-meta"
          style={{
            fontSize: '0.78rem',
            color: '#94a3b8',
            marginTop: 2
          }}
        >
          Support &amp; Verification Desk
        </div>
      </div>

      <nav
        className="sidebar-nav"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          flex: 1
        }}
      >
        {HELPDESK_NAV_ITEMS.map((item) => {
          let count = null;
          if (item.key === 'messages' && counts.messages > 0) count = counts.messages;
          if (item.key === 'applications' && counts.applications > 0) count = counts.applications;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/helpdesk/dashboard'}
              title={item.label}
              className={({ isActive }) =>
                `sidebar-link helpdesk-desktop-sidebar__link ${
                  isActive ? 'sidebar-link--active helpdesk-desktop-sidebar__link--active' : ''
                }`
              }
            >
              <Icon name={item.icon} size={20} />
              <span className="sidebar-link-label">{item.label}</span>
              {count !== null && (
                <span className="helpdesk-nav-counter" title={`${count} pending`}>
                  {count}
                </span>
              )}
            </NavLink>
          );
        })}

        <div
          className="sidebar-section-divider"
          style={{
            margin: '14px 0 6px',
            borderTop: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))',
            paddingTop: 14
          }}
        >
          <div
            className="sidebar-section-title"
            style={{
              fontSize: '0.72rem',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#64748b',
              fontWeight: 600,
              padding: '0 12px 8px'
            }}
          >
            Cross-Desk Portals
          </div>
          {EXTERNAL_PORTALS.map((portal) => (
            <NavLink
              key={portal.path}
              to={portal.path}
              title={portal.label}
              className="sidebar-link helpdesk-desktop-sidebar__link"
              style={{ color: portal.color }}
            >
              <Icon name={portal.icon} size={20} />
              <span className="sidebar-link-label">{portal.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <div
        className="sidebar-footer"
        style={{
          paddingTop: 12,
          borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
          marginTop: 'auto'
        }}
      >
        <button
          type="button"
          onClick={handleLogout}
          title="Sign Out"
          className="sidebar-link sidebar-link--logout helpdesk-desktop-sidebar__link helpdesk-desktop-sidebar__link--logout"
        >
          <Icon name="logout" size={20} />
          <span className="sidebar-link-label">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
