import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../../components/Icon.jsx';
import { useTheme } from '../../../context/ThemeContext.jsx';

export function StudentHeader({
  pageTitle,
  wardName = 'Westlands Ward',
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

        <Link className="brand" to="/student/dashboard" aria-label={`${wardName} Student portal home`}>
          <div className="brand__mark brand__mark--student" aria-hidden="true">
            {wardName.charAt(0)}
          </div>
          <span className="brand__word">
            MCA <span className="brand__portal">Student portal</span>
            {studentName ? (
              <span className="brand__student-name">{studentName}</span>
            ) : null}
          </span>
        </Link>

        <h1 className="site-header__page-title">{pageTitle}</h1>

        <div className="header-actions">
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
            <Link className="header-avatar header-avatar--student" to="/student/profile" aria-label="Open profile">
              <span aria-hidden="true">{studentName ? studentName.split(' ').map(n=>n[0]).join('') : 'ST'}</span>
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
