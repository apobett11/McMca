import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from '../../../components/Icon.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { getMCAMessages } from '../utils/mcaData.js';

const MCA_ITEMS = [
  { label: 'Home', path: '/mca/dashboard', icon: 'home', key: 'home' },
  { label: 'Applications', path: '/mca/applications', icon: 'applications', key: 'applications' },
  { label: 'Help Desk Messages', path: '/mca/messages', icon: 'bell', key: 'messages' },
  { label: 'Profile', path: '/mca/profile', icon: 'profile', key: 'profile' }
];

export function MCADesktopSidebar({ mcaName }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  useEffect(() => {
    function refreshCounts() {
      const msgs = getMCAMessages();
      const pending = msgs.filter(m => m.status === 'Pending MCA Action').length;
      setUnreadMsgCount(pending);
    }
    refreshCounts();

    window.addEventListener('mcmca_mca_messages_updated', refreshCounts);
    return () => {
      window.removeEventListener('mcmca_mca_messages_updated', refreshCounts);
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
    <aside className="mca-desktop-sidebar" aria-label="MCA Desktop Sidebar">
      <div className="mca-sidebar-badge">
        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#60a5fa', fontWeight: 700 }}>
          Ward Assembly
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', marginTop: 3 }}>
          {mcaName || 'Hon. Hillary Bett'}
        </div>
        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>
          Tendeno / Sorget Ward
        </div>
      </div>

      <nav className="mca-sidebar-nav">
        {MCA_ITEMS.map((item) => {
          let count = null;
          if (item.key === 'messages' && unreadMsgCount > 0) count = unreadMsgCount;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/mca/dashboard'}
              className={({ isActive }) =>
                `mca-sidebar-link ${isActive ? 'mca-sidebar-link--active' : ''}`
              }
            >
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
              {count !== null && (
                <span className="mca-nav-counter">{count}</span>
              )}
            </NavLink>
          );
        })}

        <div style={{ margin: '14px 0 6px', borderTop: '1px solid var(--mca-border)', paddingTop: 14 }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', fontWeight: 600, padding: '0 12px 8px' }}>
            External Portals
          </div>
          <NavLink
            to="/helpdesk/dashboard"
            className="mca-sidebar-link"
            style={{ color: '#fbbf24' }}
          >
            <Icon name="support" size={20} />
            <span>Help Desk Office</span>
          </NavLink>
          <NavLink
            to="/"
            className="mca-sidebar-link"
            style={{ color: '#94a3b8' }}
          >
            <Icon name="home" size={20} />
            <span>Public Portal</span>
          </NavLink>
        </div>
      </nav>

      <div style={{ paddingTop: 14, borderTop: '1px solid var(--mca-border)', marginTop: 'auto' }}>
        <button
          type="button"
          onClick={handleLogout}
          className="mca-sidebar-link"
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: '#f87171',
            cursor: 'pointer'
          }}
        >
          <Icon name="logout" size={20} />
          <span>Sign Out / Switch</span>
        </button>
      </div>
    </aside>
  );
}
