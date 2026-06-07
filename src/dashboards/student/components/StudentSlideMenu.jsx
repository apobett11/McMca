import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from '../../../components/Icon.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';

const STUDENT_ITEMS = [
  { label: 'Home', path: '/student/dashboard', icon: 'home' },
  { label: 'Applications', path: '/student/applications', icon: 'applications' },
  { label: 'Documents', path: '/student/documents', icon: 'documents' },
  { label: 'Contact', path: '/student/messages', icon: 'support' },
  { label: 'Notifications', path: '/student/notifications', icon: 'bell' },
  { label: 'Support', path: '/student/support', icon: 'shield' },
  { label: 'Profile', path: '/student/profile', icon: 'profile' }
];

export function StudentSlideMenu({ open, onClose }) {
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
        aria-label="Student menu"
      >
        <div className="slide-menu__header">
          <span className="slide-menu__title">Student menu</span>
          <button type="button" className="slide-menu__close" onClick={onClose} aria-label="Close menu">
            ×
          </button>
        </div>
        <nav className="slide-menu__nav">
          {STUDENT_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/student/dashboard'}
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
