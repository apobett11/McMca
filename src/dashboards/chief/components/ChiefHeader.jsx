import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../../components/Icon.jsx';
import { useTheme } from '../../../context/ThemeContext.jsx';

export function ChiefHeader({
  pageTitle,
  chiefName,
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

        <h1 className="site-header__page-title">{pageTitle}</h1>

        <div className="header-actions header-actions--right">
          <div className="header-branding">
            <img
              src="/images/ng-cdf-logo.png"
              alt="NG-CDF"
              className="header-branding__logo"
            />
            <span className="header-branding__text">Tendeno/Sorget Bursary Portal</span>
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
            <Link className="header-avatar" to="/chief/profile" aria-label="Open profile">
              <span aria-hidden="true">{chiefName ? chiefName.split(' ').map(n=>n[0]).join('') : 'CH'}</span>
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
