import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from '../../../components/Icon.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { getHelpDeskMessages, getHelpDeskApplications } from '../utils/helpDeskData.js';

const HELPDESK_NAV_ITEMS = [
  { label: 'Home', path: '/helpdesk/dashboard', icon: 'home', key: 'home' },
  { label: 'Applications', path: '/helpdesk/applications', icon: 'applications', key: 'applications' },
  { label: 'Documents', path: '/helpdesk/documents', icon: 'documents', key: 'documents' },
  { label: 'Messages', path: '/helpdesk/messages', icon: 'support', key: 'messages' },
  { label: 'Profile', path: '/helpdesk/profile', icon: 'profile', key: 'profile' }
];

export function HelpDeskDesktopSidebar({ officerName = 'Clara Chelangat' }) {
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
    <aside className="app-desktop-sidebar chief-desktop-sidebar helpdesk-desktop-sidebar" aria-label="Help Desk navigation">
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
            color: '#94a3b8',
            fontWeight: 600
          }}
        >
          Help Desk Workspace
        </div>
        <div
          className="sidebar-title"
          style={{
            fontSize: '0.98rem',
            fontWeight: 700,
            color: 'var(--text)',
            marginTop: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {officerName}
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
          const hasUpdate =
            (item.key === 'applications' && counts.applications > 0) ||
            (item.key === 'messages' && counts.messages > 0);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/helpdesk/dashboard'}
              title={item.label}
              className={({ isActive }) =>
                `chief-desktop-sidebar__link ${isActive ? 'chief-desktop-sidebar__link--active' : ''}`
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: '0.88rem',
                fontWeight: 500,
                position: 'relative'
              }}
            >
              <Icon name={item.icon} size={20} />
              <span className="sidebar-link-label" style={{ flex: 1 }}>{item.label}</span>
              {hasUpdate && (
                <span className="nav-update-dot" title="Pending update" />
              )}
            </NavLink>
          );
        })}
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
          className="chief-desktop-sidebar__link chief-desktop-sidebar__link--logout"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 14px',
            borderRadius: 8,
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: '#ef4444',
            cursor: 'pointer',
            fontSize: '0.88rem',
            fontWeight: 500
          }}
        >
          <Icon name="logout" size={20} />
          <span className="sidebar-link-label">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
