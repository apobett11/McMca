import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from '../../../components/Icon.jsx';

const CHIEF_ITEMS = [
  { label: 'Home', path: '/chief/dashboard', icon: 'home' },
  { label: 'Applications', path: '/chief/applications', icon: 'applications' },
  { label: 'Appeals', path: '/chief/appeals', icon: 'documents' },
  { label: 'Profile', path: '/chief/profile', icon: 'profile' }
];

export function ChiefSlideMenu({ open, onClose }) {
  const navigate = useNavigate();

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

  function handleLogout() {
    onClose();
    window.alert('You would be signed out safely — demo not connected yet.');
    navigate('/chief/dashboard');
  }

  return (
    <>
      <div
        className={`slide-menu__backdrop ${open ? 'slide-menu__backdrop--open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`slide-menu slide-menu--chief ${open ? 'slide-menu--open' : ''}`}
        aria-hidden={!open}
        aria-label="Chief menu"
      >
        <div className="slide-menu__header">
          <span className="slide-menu__title">Chief menu</span>
          <button type="button" className="slide-menu__close" onClick={onClose} aria-label="Close menu">
            ×
          </button>
        </div>
        <nav className="slide-menu__nav">
          {CHIEF_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/chief/dashboard'}
              className={({ isActive }) =>
                `slide-menu__link ${isActive ? 'slide-menu__link--active' : ''}`
              }
              onClick={onClose}
            >
              <Icon name={item.icon} size={22} />
              {item.label}
            </NavLink>
          ))}
          <button type="button" className="slide-menu__link slide-menu__link--logout" onClick={handleLogout}>
            <Icon name="logout" size={22} />
            Logout
          </button>
        </nav>
      </aside>
    </>
  );
}
