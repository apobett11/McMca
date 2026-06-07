import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../../components/Icon.jsx';
import { useTheme } from '../../../context/ThemeContext.jsx';

export function StudentHeader({
  pageTitle,
  studentName,
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
        <div className="header-actions header-actions--left">
          <button
            type="button"
            className="header-icon-btn header-icon-btn--theme"
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
            <Link className="header-avatar" to="/student/profile" aria-label="Open profile">
              <span aria-hidden="true">{studentName ? studentName.split(' ').map(n=>n[0]).join('') : 'ST'}</span>
            </Link>
          ) : null}
        </div>

        <h1 className="site-header__page-title">{pageTitle}</h1>

        <div className="header-actions header-actions--right">
          <div className="header-branding">
            <span className="header-branding__logo" aria-hidden="true">NG</span>
            <span className="header-branding__text">Tendeno/Sorget Bursary Portal</span>
          </div>
          <button
            type="button"
            className="header-icon-btn"
            onClick={onMenuOpen}
            aria-label="Open navigation menu"
          >
            <span className="header-icon-btn__bars" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
