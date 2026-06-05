import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from './Icon.jsx';

const PARENT_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: 'home' },
  { label: 'Applications', path: '/applications', icon: 'applications' },
  { label: 'Documents', path: '/documents', icon: 'documents' },
  { label: 'Notifications', path: '/notifications', icon: 'bell' },
  { label: 'Profile', path: '/profile', icon: 'profile' }
];

const CHIEF_ITEMS = [
  { label: 'Home', path: '/chief/dashboard', icon: 'home' },
  { label: 'Applications', path: '/chief/applications', icon: 'applications' },
  { label: 'Appeals', path: '/chief/appeals', icon: 'appeal' },
  { label: 'Profile', path: '/chief/profile', icon: 'profile' }
];

const STUDENT_ITEMS = [
  { label: 'Home', path: '/student/dashboard', icon: 'home' },
  { label: 'Applications', path: '/student/applications', icon: 'applications' },
  { label: 'Documents', path: '/student/documents', icon: 'documents' },
  { label: 'Messages', path: '/student/messages', icon: 'support' },
  { label: 'Notifications', path: '/student/notifications', icon: 'bell' },
  { label: 'Support', path: '/student/support', icon: 'shield' },
  { label: 'Profile', path: '/student/profile', icon: 'profile' }
];

export function SlideMenu({ open, onClose, variant = 'parent', homePath, profilePath }) {
  const navigate = useNavigate();

  const items =
    variant === 'chief'
      ? CHIEF_ITEMS.map((item) => {
          if (item.path.endsWith('/dashboard') && homePath) {
            return { ...item, path: homePath };
          }
          if (item.path.endsWith('/profile') && profilePath) {
            return { ...item, path: profilePath };
          }
          return item;
        })
      : variant === 'student'
        ? STUDENT_ITEMS.map((item) => {
            if (item.path.endsWith('/dashboard') && homePath) {
              return { ...item, path: homePath };
            }
            if (item.path.endsWith('/profile') && profilePath) {
              return { ...item, path: profilePath };
            }
            return item;
          })
        : PARENT_ITEMS;

  const menuClass =
    variant === 'chief'
      ? 'slide-menu slide-menu--chief'
      : variant === 'student'
        ? 'slide-menu slide-menu--student'
        : 'slide-menu slide-menu--parent';
  const title =
    variant === 'chief' ? 'Chief menu' : variant === 'student' ? 'Student menu' : 'Parent menu';
  const homeRoute =
    homePath ||
    (variant === 'chief'
      ? '/chief/dashboard'
      : variant === 'student'
        ? '/student/dashboard'
        : '/dashboard');

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
    navigate(homeRoute);
  }

  return (
    <>
      <div
        className={`slide-menu__backdrop ${open ? 'slide-menu__backdrop--open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`${menuClass} ${open ? 'slide-menu--open' : ''}`}
        aria-hidden={!open}
        aria-label={title}
      >
        <div className="slide-menu__header">
          <span className="slide-menu__title">{title}</span>
          <button type="button" className="slide-menu__close" onClick={onClose} aria-label="Close menu">
            ×
          </button>
        </div>
        <nav className="slide-menu__nav">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === homeRoute}
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
