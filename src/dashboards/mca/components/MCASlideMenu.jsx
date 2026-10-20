import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from '../../../components/Icon.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';

const MCA_ITEMS = [
  { label: 'Home', path: '/mca/dashboard', icon: 'home' },
  { label: 'Applications', path: '/mca/applications', icon: 'applications' },
  { label: 'Help Desk Messages', path: '/mca/messages', icon: 'bell' },
  { label: 'Profile', path: '/mca/profile', icon: 'profile' }
];

export function MCASlideMenu({ open, onClose }) {
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
      if (signOut) await signOut();
    } catch {
      // fallback
    }
    navigate('/login');
  }

  return (
    <>
      <div
        className={`slide-menu__backdrop ${open ? 'slide-menu__backdrop--open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`slide-menu slide-menu--mca ${open ? 'slide-menu--open' : ''}`}
        aria-hidden={!open}
        aria-label="MCA menu"
      >
        <div className="slide-menu__header">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="slide-menu__title" style={{ fontWeight: 700 }}>MCA Portal</span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tendeno / Sorget Ward</span>
          </div>
          <button type="button" className="slide-menu__close" onClick={onClose} aria-label="Close menu">
            ×
          </button>
        </div>
        <nav className="slide-menu__nav">
          {MCA_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/mca/dashboard'}
              className={({ isActive }) =>
                `slide-menu__link ${isActive ? 'slide-menu__link--active' : ''}`
              }
              onClick={onClose}
            >
              <Icon name={item.icon} size={22} />
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/helpdesk/dashboard"
            className="slide-menu__link"
            onClick={onClose}
            style={{ color: '#fbbf24', borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.08))', marginTop: 8 }}
          >
            <Icon name="support" size={22} />
            Help Desk Portal
          </NavLink>
          <button type="button" className="slide-menu__link slide-menu__link--logout" onClick={handleLogout}>
            <Icon name="logout" size={22} />
            Sign Out / Login
          </button>
        </nav>
      </aside>
    </>
  );
}
