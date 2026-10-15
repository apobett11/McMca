import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Icon } from '../../../components/Icon.jsx';
import { useTheme } from '../../../context/ThemeContext.jsx';

export function MCAHeader({
  pageTitle,
  mcaName,
  showNotifications = true,
  showProfile = true,
  notificationBadge = false,
  onMenuOpen,
  onNotificationsOpen
}) {
  const { cycleTheme, themeLabel } = useTheme();

  return (
    <header className="site-header" role="banner">
      <div className="site-header__inner">
        <button
          type="button"
          className="header-icon-btn header-icon-btn--hamburger"
          onClick={onMenuOpen}
          aria-label="Open navigation menu"
        >
          <span className="header-icon-btn__bars" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 className="site-header__page-title" style={{ margin: 0 }}>{pageTitle}</h1>
          <nav className="mca-header-desktop-nav" aria-label="MCA header navigation">
            <NavLink to="/mca/dashboard" end>Home</NavLink>
            <NavLink to="/mca/applications">Applications</NavLink>
            <NavLink to="/mca/issues">Issues</NavLink>
            <NavLink to="/mca/messages">Messages</NavLink>
            <NavLink to="/mca/profile">Profile</NavLink>
          </nav>
        </div>

        <div className="header-actions header-actions--right">
          <div className="header-branding">
            <img
              src="/images/ng-cdf-logo.png"
              alt="NG-CDF"
              className="header-branding__logo"
            />
            <span className="header-branding__text">Tendeno/Sorget MCA Office</span>
          </div>

          <button
            type="button"
            className="header-icon-btn"
            onClick={cycleTheme}
            aria-label={`Theme: ${themeLabel}. Click to change.`}
            title={`Theme: ${themeLabel}`}
          >
            <Icon name="review" size={20} />
          </button>

          {showNotifications ? (
            <button
              type="button"
              className={`header-icon-btn ${notificationBadge ? 'header-icon-btn--pulse' : ''}`}
              onClick={onNotificationsOpen}
              aria-label={notificationBadge ? 'Notifications, unread' : 'Notifications'}
            >
              <Icon name="bell" size={20} />
            </button>
          ) : null}

          {showProfile ? (
            <Link className="header-avatar" to="/mca/profile" aria-label="Open profile">
              <span aria-hidden="true">{mcaName ? mcaName.split(' ').map(n=>n[0]).slice(0, 2).join('') : 'HB'}</span>
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
