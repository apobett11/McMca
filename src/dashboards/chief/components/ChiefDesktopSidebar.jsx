import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from '../../../components/Icon.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { getChiefUpdateCounts } from '../utils/chiefData.js';

const CHIEF_ITEMS = [
  { label: 'Home', path: '/chief/dashboard', icon: 'home', key: 'home' },
  { label: 'Applications', path: '/chief/applications', icon: 'applications', key: 'applications' },
  { label: 'Appeals', path: '/chief/appeals', icon: 'documents', key: 'appeals' },
  { label: 'Messages', path: '/chief/messages', icon: 'bell', key: 'messages' },
  { label: 'Profile', path: '/chief/profile', icon: 'profile', key: 'profile' }
];

export function ChiefDesktopSidebar({ chiefName }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [counts, setCounts] = useState(() => getChiefUpdateCounts());

  useEffect(() => {
    function refreshCounts() {
      setCounts(getChiefUpdateCounts());
    }
    window.addEventListener('mcmca_chief_apps_updated', refreshCounts);
    window.addEventListener('mcmca_chief_appeals_updated', refreshCounts);
    window.addEventListener('mcmca_chief_messages_updated', refreshCounts);
    return () => {
      window.removeEventListener('mcmca_chief_apps_updated', refreshCounts);
      window.removeEventListener('mcmca_chief_appeals_updated', refreshCounts);
      window.removeEventListener('mcmca_chief_messages_updated', refreshCounts);
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
    <aside className="chief-desktop-sidebar" aria-label="Chief navigation">
      <div style={{ padding: '0 12px 18px', borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))', marginBottom: 12 }}>
        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', fontWeight: 600 }}>
          Chief Workspace
        </div>
        <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>
          {chiefName || 'Ward Chief'}
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {CHIEF_ITEMS.map((item) => {
          const hasUpdate =
            (item.key === 'applications' && counts.applications > 0) ||
            (item.key === 'appeals' && counts.appeals > 0) ||
            (item.key === 'messages' && counts.messages > 0);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/chief/dashboard'}
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
              <span style={{ flex: 1 }}>{item.label}</span>
              {hasUpdate && (
                <span className="nav-update-dot" title="Pending update" />
              )}
            </NavLink>
          );
        })}
      </nav>

      <div style={{ paddingTop: 12, borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.08))', marginTop: 'auto' }}>
        <button
          type="button"
          onClick={handleLogout}
          className="chief-desktop-sidebar__link chief-desktop-sidebar__link--logout"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            padding: '10px 14px',
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '0.88rem',
            textAlign: 'left'
          }}
        >
          <Icon name="logout" size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
