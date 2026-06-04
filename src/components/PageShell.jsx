import React, { useState } from 'react';
import { Header } from './Header.jsx';
import { Footer } from './Footer.jsx';
import { BottomNav } from './BottomNav.jsx';
import { SlideMenu } from './SlideMenu.jsx';
import { NotificationModal } from './NotificationModal.jsx';

const DEFAULT_NOTIFICATIONS = [
  {
    title: 'Brian — missing fee structure',
    body: 'Fee structure required before 14 June. Open Brian’s profile to upload.',
    variant: 'warning',
    unread: true
  },
  {
    title: 'Faith — application approved',
    body: '2025/2026 application approved. View details in Faith’s dashboard.',
    variant: 'success',
    unread: false
  },
  {
    title: 'Deadline reminder',
    body: 'Household document deadline: 14 June 2026.',
    variant: 'warning',
    unread: false
  }
];

export function PageShell({
  pageTitle,
  wardName = 'Westlands Ward',
  portalLabel = 'Parent portal',
  portalVariant = 'parent',
  homePath = '/dashboard',
  profilePath = '/profile',
  userInitials = 'MK',
  studentName,
  children,
  showBottomNav = true,
  showFooter = true,
  showNotifications = true,
  showProfile = true,
  notificationBadge = false,
  notificationItems = DEFAULT_NOTIFICATIONS,
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

  const portalClass =
    portalVariant === 'chief'
      ? 'portal portal--chief'
      : portalVariant === 'student'
        ? 'portal portal--student'
        : 'portal portal--parent';

  return (
    <div className={`${portalClass} ${showBottomNav ? '' : 'portal--no-nav'}`}>
      <Header
        pageTitle={pageTitle}
        wardName={wardName}
        portalLabel={portalLabel}
        portalVariant={portalVariant}
        homePath={homePath}
        profilePath={profilePath}
        userInitials={userInitials}
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
      {showFooter ? <Footer /> : null}
      {showBottomNav ? (
        <BottomNav variant={portalVariant} homePath={homePath} profilePath={profilePath} />
      ) : null}
      <SlideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        variant={portalVariant}
        homePath={homePath}
        profilePath={profilePath}
      />
      <NotificationModal
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        items={notificationItems}
      />
    </div>
  );
}
