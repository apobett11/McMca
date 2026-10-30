import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from '../../../components/Icon.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { getMCAMessages, getMCAApplications } from '../utils/mcaData.js';
import { loadPayables, loadAwardRows, getAppealDecisions } from '../../../workspaces/mca/store.ts';

const MCA_NAV_ITEMS = [
  { label: 'Home', path: '/mca/dashboard', icon: 'home', key: 'home' },
  { label: 'Applications', path: '/mca/applications', icon: 'applications', key: 'applications' },
  { label: 'Documents', path: '/mca/documents', icon: 'documents', key: 'documents' },
  { label: 'Disbursements', path: '/mca/disbursements', icon: 'cheque', key: 'disbursements' },
  { label: 'Appeals', path: '/mca/appeals', icon: 'shield', key: 'appeals' },
  { label: 'Messages', path: '/mca/messages', icon: 'support', key: 'messages' },
  { label: 'Profile', path: '/mca/profile', icon: 'profile', key: 'profile' }
];

export function MCADesktopSidebar({ mcaName = 'Hon. Hillary Kiprotich Bett' }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [counts, setCounts] = useState({ messages: 0, applications: 0, disbursements: 0, appeals: 0 });

  useEffect(() => {
    function refreshCounts() {
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
        let pendingAppeals = 0;
        try {
          drafts = loadPayables().filter((p) => p.status === 'Draft').length;
          const rows = loadAwardRows();
          const decided = getAppealDecisions();
          pendingAppeals = rows.filter((r) => r.state === 'chief_rejected' && !decided[r.id]).length;
        } catch {}

        setCounts({
          messages: pendingMsgs,
          applications: pendingApps,
          disbursements: drafts,
          appeals: pendingAppeals
        });
      } catch (err) {
        console.error('Error refreshing MCA sidebar counts:', err);
      }
    }

    refreshCounts();
    window.addEventListener('mcmca_mca_messages_updated', refreshCounts);
    window.addEventListener('mcmca_mca_apps_updated', refreshCounts);

    return () => {
      window.removeEventListener('mcmca_mca_messages_updated', refreshCounts);
      window.removeEventListener('mcmca_mca_apps_updated', refreshCounts);
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
    <aside className="app-desktop-sidebar chief-desktop-sidebar mca-desktop-sidebar" aria-label="MCA navigation">
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
            color: '#60a5fa',
            fontWeight: 700
          }}
        >
          MCA Executive Suite
        </div>
        <div
          className="sidebar-title"
          style={{
            fontSize: '0.98rem',
            fontWeight: 700,
            color: 'var(--text, #ffffff)',
            marginTop: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {mcaName}
        </div>
        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-3, #94a3b8)',
            marginTop: 2
          }}
        >
          Tendeno / Sorget Ward
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
        {MCA_NAV_ITEMS.map((item) => {
          let count = null;
          if (item.key === 'messages' && counts.messages > 0) count = counts.messages;
          if (item.key === 'applications' && counts.applications > 0) count = counts.applications;
          if (item.key === 'disbursements' && counts.disbursements > 0) count = counts.disbursements;
          if (item.key === 'appeals' && counts.appeals > 0) count = counts.appeals;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/mca/dashboard'}
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
              {count !== null && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 10,
                    background: item.key === 'messages' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: item.key === 'messages' ? '#ef4444' : '#f59e0b',
                    border: `1px solid ${item.key === 'messages' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`
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
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
