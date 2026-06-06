import React, { useState } from 'react';
import { MCAHeader } from './MCAHeader.jsx';
import { MCAFooter } from './MCAFooter.jsx';
import { MCABottomNav } from './MCABottomNav.jsx';
import { MCASlideMenu } from './MCASlideMenu.jsx';
import { NotificationModal } from '../../../components/NotificationModal.jsx';

export function MCALayout({
  pageTitle,
  mcaName,
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
    <div className={`portal portal--mca ${showBottomNav ? '' : 'portal--no-nav'}`}>
      <MCAHeader
        pageTitle={pageTitle}
        mcaName={mcaName}
        showNotifications={showNotifications}
        showProfile={showProfile}
        notificationBadge={notificationBadge}
        onMenuOpen={() => setMenuOpen(true)}
        onNotificationsOpen={() => setNotificationsOpen(true)}
      />
      <main className={mainClass} role="main" style={{flex: '1', width: '100%', maxWidth: layout === 'dashboard' ? '1280px' : '720px', margin: '0 auto', padding: '0 24px'}}>
        <div className="main__content" style={{padding: '32px 0 64px'}}>{children}</div>
      </main>
      {showFooter ? <MCAFooter /> : null}
      {showBottomNav ? (
        <MCABottomNav />
      ) : null}
      <MCASlideMenu
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
