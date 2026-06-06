import React, { useState } from 'react';
import { ParentHeader } from './ParentHeader.jsx';
import { ParentFooter } from './ParentFooter.jsx';
import { ParentBottomNav } from './ParentBottomNav.jsx';
import { ParentSlideMenu } from './ParentSlideMenu.jsx';
import { NotificationModal } from '../../../components/NotificationModal.jsx';

export function ParentLayout({
  pageTitle,
  parentName,
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
    <div className={`portal portal--parent ${showBottomNav ? '' : 'portal--no-nav'}`}>
      <ParentHeader
        pageTitle={pageTitle}
        parentName={parentName}
        showNotifications={showNotifications}
        showProfile={showProfile}
        notificationBadge={notificationBadge}
        onMenuOpen={() => setMenuOpen(true)}
        onNotificationsOpen={() => setNotificationsOpen(true)}
      />
      <main className={mainClass} role="main" style={{flex: '1', width: '100%', maxWidth: layout === 'dashboard' ? '1280px' : '720px', margin: '0 auto', padding: '0 24px'}}>
        <div className="main__content" style={{padding: '32px 0 64px'}}>{children}</div>
      </main>
      {showFooter ? <ParentFooter /> : null}
      {showBottomNav ? (
        <ParentBottomNav />
      ) : null}
      <ParentSlideMenu
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
