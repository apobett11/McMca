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

export function ChiefSlideMenu({ open, onClose }) {
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
                  `slide-menu__link ${isActive ? 'slide-menu__link--active' : ''}`
                }
                onClick={onClose}
                style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}
              >
                <Icon name={item.icon} size={22} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {hasUpdate && (
                  <span className="nav-update-dot" title="Update available" />
                )}
              </NavLink>
            );
          })}
          <button type="button" className="slide-menu__link slide-menu__link--logout" onClick={handleLogout}>
            <Icon name="logout" size={22} />
            Logout
          </button>
        </nav>
      </aside>
    </>
  );
}
