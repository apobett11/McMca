import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from '../../../components/Icon.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';

const HELPDESK_ITEMS = [
  { label: 'Home', path: '/helpdesk/dashboard', icon: 'home' },
  { label: 'Applications', path: '/helpdesk/applications', icon: 'applications' },
  { label: 'Documents', path: '/helpdesk/documents', icon: 'documents' },
  { label: 'Messages', path: '/helpdesk/messages', icon: 'support' },
  { label: 'Profile', path: '/helpdesk/profile', icon: 'profile' }
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
      if (signOut) await signOut();
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
          <div className="slide-menu__branding">
            <span className="brand__mark brand__mark--chief">HD</span>
            <span className="brand__text">Help Desk Workspace</span>
          </div>
          <button
            type="button"
            className="slide-menu__close"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            <Icon name="close" size={24} />
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
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}

          <button
            type="button"
            className="slide-menu__link slide-menu__link--logout"
            onClick={handleLogout}
            style={{ marginTop: 24, color: '#ef4444' }}
          >
            <Icon name="logout" size={20} />
            <span>Sign Out</span>
          </button>
        </nav>
      </aside>
    </>
  );
}
