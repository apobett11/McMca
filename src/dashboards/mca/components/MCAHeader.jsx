import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../../../components/Icon.jsx';
import { useTheme } from '../../../context/ThemeContext.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';

export function MCAHeader({
  pageTitle,
  mcaName = 'Hon. Hillary Kiprotich Bett',
  showNotifications = true,
  showProfile = true,
  notificationBadge = false,
  onMenuOpen,
  onNotificationsOpen
}) {
  const navigate = useNavigate();
  const { cycleTheme, themeLabel } = useTheme();
  const { signOut } = useAuth();

  const initials = mcaName
    ? mcaName
        .replace(/^(Hon\.|Mr\.|Dr\.|Mrs\.|Ms\.)\s+/i, '')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'HB';

  async function handleLogout() {
    try {
      if (signOut) await signOut();
    } catch {
      // fallback
    }
    navigate('/login');
  }

  return (
    <header
      className="site-header mca-header-elevated"
      role="banner"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 35,
        height: 64,
        background: 'rgba(7, 13, 30, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
      }}
    >
      <div
        className="site-header__inner"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '100%',
          padding: '0 16px',
          maxWidth: '100%',
          margin: '0 auto',
          gap: 16
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <button
            type="button"
            className="header-icon-btn header-icon-btn--hamburger"
            onClick={onMenuOpen}
            aria-label="Open navigation menu"
            style={{
              minWidth: 40,
              minHeight: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#f8fafc',
              cursor: 'pointer'
            }}
          >
            <span className="header-icon-btn__bars" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(52, 211, 153, 0.15)',
                border: '1px solid rgba(52, 211, 153, 0.35)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Icon name="home" size={16} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#34d399'
                  }}
                >
                  MCA Executive
                </span>
                <span style={{ fontSize: '0.68rem', color: '#64748b' }}>&bull;</span>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Tendeno/Sorget</span>
              </div>
              <h1
                className="site-header__page-title"
                style={{
                  margin: 0,
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {pageTitle}
              </h1>
            </div>
          </div>
        </div>

        {/* Center: Search hint / Command bar shortcut */}
        <div
          className="header-omni-hint"
          style={{
            display: 'none',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 999,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#94a3b8',
            fontSize: '0.78rem'
          }}
        >
          <Icon name="search" size={14} />
          <span>Tendeno / Sorget Legislative Matrix</span>
          <span
            style={{
              padding: '1px 6px',
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.08)',
              fontSize: '0.68rem',
              fontFamily: 'monospace',
              color: '#cbd5e1'
            }}
          >
            2026 Active
          </span>
        </div>

        <div className="header-actions header-actions--right" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="header-branding" style={{ display: 'none', alignItems: 'center', gap: 8, marginRight: 4 }}>
            <img
              src="/images/ng-cdf-logo.png"
              alt="NG-CDF"
              className="header-branding__logo"
              style={{ height: 26, width: 'auto' }}
            />
            <span className="header-branding__text" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Ward Seal
            </span>
          </div>

          <button
            type="button"
            className="header-icon-btn"
            onClick={cycleTheme}
            aria-label={`Theme: ${themeLabel}. Click to change.`}
            title={`Theme: ${themeLabel}`}
            style={{
              minWidth: 38,
              minHeight: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <Icon name="review" size={18} />
          </button>

          {showNotifications ? (
            <button
              type="button"
              className={`header-icon-btn ${notificationBadge ? 'header-icon-btn--pulse' : ''}`}
              onClick={onNotificationsOpen}
              aria-label={notificationBadge ? 'Notifications, unread' : 'Notifications'}
              style={{
                minWidth: 38,
                minHeight: 38,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#94a3b8',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <Icon name="bell" size={18} />
              {notificationBadge && (
                <span
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#ef4444',
                    boxShadow: '0 0 8px #ef4444'
                  }}
                />
              )}
            </button>
          ) : null}

          {/* Quick Sign Out Affordance */}
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out of MCA Portal"
            aria-label="Sign out"
            style={{
              minHeight: 38,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 10px',
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#f87171',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Icon name="logout" size={15} />
            <span className="hidden sm:inline" style={{ display: 'none' }}>Logout</span>
          </button>

          {showProfile ? (
            <Link
              className="header-avatar"
              to="/mca/profile"
              aria-label="Open MCA profile"
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #059669, #34d399)',
                color: '#030712',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.85rem',
                textDecoration: 'none',
                boxShadow: '0 2px 10px rgba(52, 211, 153, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <span aria-hidden="true">{initials}</span>
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
