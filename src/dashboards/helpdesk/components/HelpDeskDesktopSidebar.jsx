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
    <aside
      className="app-desktop-sidebar chief-desktop-sidebar helpdesk-desktop-sidebar"
      aria-label="Help Desk navigation"
      style={{
        background: '#070c16',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '20px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: 260
      }}
    >
      <div
        className="sidebar-header"
        style={{
          padding: '0 8px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.35)',
              color: '#22d3ee',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Icon name="support" size={17} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div
              className="sidebar-subtitle"
              style={{
                fontSize: '0.68rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#22d3ee',
                fontWeight: 700
              }}
            >
              Operations Hub
            </div>
            <div
              className="sidebar-title"
              style={{
                fontSize: '0.92rem',
                fontWeight: 700,
                color: '#ffffff',
                marginTop: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {officerName}
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: '0.72rem',
            color: '#94a3b8',
            padding: '4px 8px',
            borderRadius: 6,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span>Tendeno / Sorget Desk</span>
          <span style={{ color: '#22d3ee', fontWeight: 600 }}>On Duty</span>
        </div>
      </div>

      <div style={{ padding: '0 8px 4px', fontSize: '0.66rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
        Navigation
      </div>

      <nav
        className="sidebar-nav"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
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
                `chief-desktop-sidebar__link ${isActive ? 'chief-desktop-sidebar__link--active' : ''}`
              }
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: '9px 12px',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: '0.84rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#22d3ee' : '#cbd5e1',
                background: isActive ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
                border: isActive ? '1px solid rgba(6, 182, 212, 0.28)' : '1px solid transparent',
                position: 'relative',
                transition: 'all 0.15s ease'
              })}
            >
              <Icon name={item.icon} size={18} />
              <span className="sidebar-link-label" style={{ flex: 1 }}>{item.label}</span>
              {count !== null && (
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 999,
                    background: item.key === 'messages' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: item.key === 'messages' ? '#ef4444' : '#f59e0b',
                    border: `1px solid ${item.key === 'messages' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                    fontFamily: 'monospace'
                  }}
                >
                  {count}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div
        className="sidebar-footer"
        style={{
          paddingTop: 12,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
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
            gap: 11,
            padding: '9px 12px',
            borderRadius: 8,
            width: '100%',
            background: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.18)',
            color: '#f87171',
            cursor: 'pointer',
            fontSize: '0.84rem',
            fontWeight: 500,
            transition: 'all 0.15s ease'
          }}
        >
          <Icon name="logout" size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
