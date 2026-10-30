import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from '../../../components/Icon.jsx';
import { getMCAMessages, getMCAApplications } from '../utils/mcaData.js';
import { loadPayables } from '../../../workspaces/mca/store.ts';

const MCA_TABS = [
  { label: 'Home', path: '/mca/dashboard', icon: 'home', key: 'home' },
  { label: 'Apps', path: '/mca/applications', icon: 'applications', key: 'applications' },
  { label: 'Docs', path: '/mca/documents', icon: 'documents', key: 'documents' },
  { label: 'Payables', path: '/mca/disbursements', icon: 'cheque', key: 'disbursements' },
  { label: 'Messages', path: '/mca/messages', icon: 'support', key: 'messages' },
  { label: 'Profile', path: '/mca/profile', icon: 'profile', key: 'profile' }
];

export function MCABottomNav() {
  const [counts, setCounts] = useState({ messages: 0, applications: 0, disbursements: 0 });

  useEffect(() => {
    function refresh() {
      try {
        const msgs = getMCAMessages();
        const pendingMsgs = Array.isArray(msgs)
          ? msgs.filter((m) => m.status === 'Pending MCA Action' || m.status === 'unread').length
          : 0;

        const apps = getMCAApplications();
        const pendingApps = Array.isArray(apps)
          ? apps.filter((a) => a.status === 'Under Review' || a.status === 'Submitted').length
          : 0;

        let drafts = 0;
        try {
          drafts = loadPayables().filter((p) => p.status === 'Draft').length;
        } catch {}

        setCounts({ messages: pendingMsgs, applications: pendingApps, disbursements: drafts });
      } catch (err) {
        console.error('Error updating MCA bottom nav counts:', err);
      }
    }

    refresh();
    window.addEventListener('mcmca_mca_messages_updated', refresh);
    window.addEventListener('mcmca_mca_apps_updated', refresh);
    return () => {
      window.removeEventListener('mcmca_mca_messages_updated', refresh);
      window.removeEventListener('mcmca_mca_apps_updated', refresh);
    };
  }, []);

  return (
    <nav
      className="mca-bottom-nav"
      aria-label="MCA Mobile Navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 62,
        background: 'rgba(7, 13, 30, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 40,
        padding: '0 4px',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.4)'
      }}
    >
      {MCA_TABS.map((tab) => {
        const count =
          tab.key === 'messages'
            ? counts.messages
            : tab.key === 'applications'
            ? counts.applications
            : tab.key === 'disbursements'
            ? counts.disbursements
            : 0;

        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === '/mca/dashboard'}
            className={({ isActive }) =>
              `mca-bottom-nav__link ${isActive ? 'mca-bottom-nav__link--active' : ''}`
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
              fontSize: '0.68rem',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#34d399' : '#94a3b8',
              position: 'relative',
              transition: 'color 0.15s ease'
            })}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={tab.icon} size={19} />
              {count > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -3,
                    right: -6,
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
