import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from '../../../components/Icon.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';

const HELPDESK_ITEMS = [
  { label: 'Home', path: '/helpdesk/dashboard', icon: 'home' },
  { label: 'Documents', path: '/helpdesk/documents', icon: 'documents' },
  { label: 'Applications', path: '/helpdesk/applications', icon: 'applications' },
  { label: 'Messages', path: '/helpdesk/messages', icon: 'support' },
  { label: 'Profile', path: '/helpdesk/profile', icon: 'profile' }
];

const CROSS_DESK_ITEMS = [
  { label: 'MCA Portal', path: '/mca/dashboard', icon: 'review' },
  { label: 'Chief Portal', path: '/chief/dashboard', icon: 'shield' }
];

export function HelpDeskSlideMenu({ open, onClose }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  async function handleLogout() {
    onClose();
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  return (
    <>
      <div
        className={`slide-menu__backdrop ${open ? 'slide-menu__backdrop--open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`slide-menu slide-menu--student ${open ? 'slide-menu--open' : ''}`}
        aria-hidden={!open}
        aria-label="Help desk menu"
      >
        <div className="slide-menu__header">
          <span className="slide-menu__title">Help Desk Menu</span>
          <button type="button" className="slide-menu__close" onClick={onClose} aria-label="Close menu">
            ×
          </button>
        </div>
        <nav className="slide-menu__nav">
          {HELPDESK_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/helpdesk/dashboard'}
              className={({ isActive }) =>
                `slide-menu__link ${isActive ? 'slide-menu__link--active' : ''}`
              }
              onClick={onClose}
            >
              <Icon name={item.icon} size={22} />
              {item.label}
            </NavLink>
          ))}

          <div style={{ margin: '12px 16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }} />
          <div style={{ padding: '0 18px 6px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', fontWeight: 600 }}>
            Cross-Desk Portals
          </div>
          {CROSS_DESK_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className="slide-menu__link"
              onClick={onClose}
            >
              <Icon name={item.icon} size={22} />
              {item.label}
            </NavLink>
          ))}

          <div style={{ margin: '12px 16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }} />
          <button type="button" className="slide-menu__link slide-menu__link--logout" onClick={handleLogout}>
            <Icon name="logout" size={22} />
            Logout
          </button>
        </nav>
      </aside>
    </>
  );
}
