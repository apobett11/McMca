import React, { useState } from 'react';
import { StudentHeader } from './StudentHeader.jsx';
import { StudentFooter } from './StudentFooter.jsx';
import { StudentBottomNav } from './StudentBottomNav.jsx';
import { StudentSlideMenu } from './StudentSlideMenu.jsx';
import { NotificationModal } from '../../../components/NotificationModal.jsx';
import { useStudentCase } from '../context/StudentCaseContext.jsx';

function notificationVariant(title = '') {
  const value = title.toLowerCase();
  if (value.includes('not approved') || value.includes('missing') || value.includes('clarification')) return 'warning';
  if (value.includes('approved') || value.includes('verified')) return 'success';
  return 'info';
}

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
  const { data } = useStudentCase();
  const notifications = data?.notifications || [];
  const unread = notifications.some((item) => !item.is_read);
  const modalItems = notifications.map((item) => ({
    title: item.title,
    body: item.message,
    unread: !item.is_read,
    variant: notificationVariant(item.title)
  }));

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
        notificationBadge={notificationBadge || unread}
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
        items={notificationItems.length ? notificationItems : modalItems}
      />
    </div>
  );
}
