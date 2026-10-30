import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from '../../../components/Icon.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';

const MCA_ITEMS = [
  { label: 'Home', path: '/mca/dashboard', icon: 'home' },
  { label: 'Applications', path: '/mca/applications', icon: 'applications' },
  { label: 'Documents', path: '/mca/documents', icon: 'documents' },
  { label: 'Disbursements', path: '/mca/disbursements', icon: 'cheque' },
  { label: 'Messages', path: '/mca/messages', icon: 'support' },
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
        className={`slide-menu slide-menu--chief ${open ? 'slide-menu--open' : ''}`}
        aria-hidden={!open}
        aria-label="MCA navigation menu"
      >
        <div className="slide-menu__header">
          <div className="slide-menu__branding">
            <span className="brand__mark brand__mark--chief">MCA</span>
            <span className="brand__text">Tendeno/Sorget Legislative</span>
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
