import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from '../../../components/Icon.jsx';
import { getHelpDeskMessages, getHelpDeskApplications } from '../utils/helpDeskData.js';

const HELPDESK_TABS = [
  { label: 'Home', path: '/helpdesk/dashboard', icon: 'home', key: 'home' },
  { label: 'Apps', path: '/helpdesk/applications', icon: 'applications', key: 'applications' },
  { label: 'Docs', path: '/helpdesk/documents', icon: 'documents', key: 'documents' },
  { label: 'Messages', path: '/helpdesk/messages', icon: 'support', key: 'messages' },
  { label: 'Profile', path: '/helpdesk/profile', icon: 'profile', key: 'profile' }
];

export function HelpDeskBottomNav() {
  const [counts, setCounts] = useState({ messages: 0, applications: 0 });

  useEffect(() => {
    function refresh() {
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
        console.error('Error updating HelpDesk bottom nav counts:', err);
      }
    }

    refresh();
    window.addEventListener('mcmca_helpdesk_messages_updated', refresh);
    window.addEventListener('mcmca_helpdesk_apps_updated', refresh);
    return () => {
      window.removeEventListener('mcmca_helpdesk_messages_updated', refresh);
      window.removeEventListener('mcmca_helpdesk_apps_updated', refresh);
    };
  }, []);

  return (
    <nav
      className="helpdesk-bottom-nav"
      aria-label="Help Desk Mobile Navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 62,
        background: 'rgba(7, 12, 22, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 40,
        padding: '0 6px',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.4)'
      }}
    >
      {HELPDESK_TABS.map((tab) => {
        const count =
          tab.key === 'messages'
            ? counts.messages
            : tab.key === 'applications'
            ? counts.applications
            : 0;

        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === '/helpdesk/dashboard'}
            className={({ isActive }) =>
              `helpdesk-bottom-nav__link ${isActive ? 'helpdesk-bottom-nav__link--active' : ''}`
            }
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              flex: 1,
              height: '100%',
              minHeight: 44,
              textDecoration: 'none',
              fontSize: '0.7rem',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#22d3ee' : '#94a3b8',
              position: 'relative',
              transition: 'color 0.15s ease'
            })}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={tab.icon} size={20} />
              {count > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -3,
                    right: -7,
                    minWidth: 14,
                    height: 14,
                    borderRadius: 999,
                    background: tab.key === 'messages' ? '#ef4444' : '#f59e0b',
                    color: '#030712',
                    fontSize: '0.6rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 2px'
                  }}
                >
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </div>
            <span>{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
