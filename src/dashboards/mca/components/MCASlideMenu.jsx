import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from '../../../components/Icon.jsx';

const MCA_ITEMS = [
  { label: 'Home', path: '/mca/dashboard', icon: 'home' },
  { label: 'Applications', path: '/mca/applications', icon: 'applications' },
  { label: 'Documents', path: '/mca/documents', icon: 'documents' },
  { label: 'Notifications', path: '/mca/notifications', icon: 'bell' },
  { label: 'Profile', path: '/mca/profile', icon: 'profile' }
];

export function MCASlideMenu({ open, onClose }) {
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
    navigate('/mca/dashboard');
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
          <span className="slide-menu__title">MCA menu</span>
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
          <button type="button" className="slide-menu__link slide-menu__link--logout" onClick={handleLogout}>
            <Icon name="logout" size={22} />
            Logout
          </button>
        </nav>
      </aside>
    </>
  );
}
