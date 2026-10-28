import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from '../../../components/Icon.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';

const PARENT_NAV_ITEMS = [
  { label: 'Home', path: '/parent/dashboard', icon: 'home' },
  { label: 'Applications', path: '/parent/applications', icon: 'applications' },
  { label: 'Documents', path: '/parent/documents', icon: 'documents' },
  { label: 'Contact', path: '/parent/messages', icon: 'support' },
  { label: 'Profile', path: '/parent/profile', icon: 'profile' }
];

export function ParentDesktopSidebar({ parentName }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  async function handleLogout() {
    try {
      if (signOut) await signOut();
    } catch {
      // fallback
    }
    navigate('/login');
  }

  return (
    <aside className="app-desktop-sidebar parent-desktop-sidebar" aria-label="Parent navigation">
      <div className="sidebar-header" style={{ padding: '0 12px 18px', borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.08))', marginBottom: 12 }}>
        <div className="sidebar-subtitle" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', fontWeight: 600 }}>
          Parent Portal
        </div>
        <div className="sidebar-title" style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text, #f8fafc)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {parentName || 'Parent'}
        </div>
      </div>

      <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {PARENT_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/parent/dashboard'}
            title={item.label}
            className={({ isActive }) =>
              `sidebar-link parent-desktop-sidebar__link ${isActive ? 'sidebar-link--active parent-desktop-sidebar__link--active' : ''}`
            }
          >
            <Icon name={item.icon} size={20} />
            <span className="sidebar-link-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer" style={{ paddingTop: 12, borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.08))', marginTop: 'auto' }}>
        <button
          type="button"
          onClick={handleLogout}
          title="Sign Out"
          className="sidebar-link sidebar-link--logout parent-desktop-sidebar__link--logout"
        >
          <Icon name="logout" size={20} />
          <span className="sidebar-link-label">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
