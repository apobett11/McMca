import React, { useState } from 'react';
import { StudentHeader } from './StudentHeader.jsx';
import { StudentFooter } from './StudentFooter.jsx';
import { StudentSlideMenu } from './StudentSlideMenu.jsx';
import { NotificationModal } from '../../../components/NotificationModal.jsx';

export function StudentLayout({
  pageTitle,
  studentName,
  children,
  showFooter = true,
  showNotifications = true,
  showProfile = true,
  notificationBadge = false,
  notificationItems = [],
  layout = 'default'
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const mainClass =
    layout === 'dashboard'
      ? 'main main--dashboard'
      : layout === 'list'
        ? 'main main--list'
        : 'main';

  return (
    <div className="portal portal--student portal--no-nav">
      <StudentHeader
        pageTitle={pageTitle}
        studentName={studentName}
        showNotifications={showNotifications}
        showProfile={showProfile}
        notificationBadge={notificationBadge}
        onMenuOpen={() => setMenuOpen(true)}
        onNotificationsOpen={() => setNotificationsOpen(true)}
      />
      <main className={mainClass} role="main">
        <div className="main__content">{children}</div>
      </main>
      {showFooter ? <StudentFooter /> : null}
      <StudentSlideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      <NotificationModal
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        items={notificationItems}
      />
    </div>
  );
}
