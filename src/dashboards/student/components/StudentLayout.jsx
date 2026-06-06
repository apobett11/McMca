import React, { useState } from 'react';
import { StudentHeader } from './StudentHeader.jsx';
import { StudentFooter } from './StudentFooter.jsx';
import { StudentBottomNav } from './StudentBottomNav.jsx';
import { StudentSlideMenu } from './StudentSlideMenu.jsx';
import { NotificationModal } from '../../../components/NotificationModal.jsx';

export function StudentLayout({
  pageTitle,
  studentName,
  children,
  showBottomNav = true,
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
    <div className={`portal portal--student ${showBottomNav ? '' : 'portal--no-nav'}`}>
      <StudentHeader
        pageTitle={pageTitle}
        studentName={studentName}
        showNotifications={showNotifications}
        showProfile={showProfile}
        notificationBadge={notificationBadge}
        onMenuOpen={() => setMenuOpen(true)}
        onNotificationsOpen={() => setNotificationsOpen(true)}
      />
      <main className={mainClass} role="main" style={{flex: '1', width: '100%', maxWidth: layout === 'dashboard' ? '1280px' : '720px', margin: '0 auto', padding: '0 24px'}}>
        <div className="main__content" style={{padding: '32px 0 64px'}}>{children}</div>
      </main>
      {showFooter ? <StudentFooter /> : null}
      {showBottomNav ? (
        <StudentBottomNav />
      ) : null}
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
