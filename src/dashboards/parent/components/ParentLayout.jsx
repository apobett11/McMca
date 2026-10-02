import React, { useState } from 'react';
import { ParentHeader } from './ParentHeader.jsx';
import { ParentFooter } from './ParentFooter.jsx';
import { ParentSlideMenu } from './ParentSlideMenu.jsx';
import { NotificationModal } from '../../../components/NotificationModal.jsx';

export function ParentLayout({
  pageTitle,
  parentName,
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
    <div className="portal portal--parent portal--no-nav">
      <ParentHeader
        pageTitle={pageTitle}
        parentName={parentName}
        showNotifications={showNotifications}
        showProfile={showProfile}
        notificationBadge={notificationBadge}
        onMenuOpen={() => setMenuOpen(true)}
        onNotificationsOpen={() => setNotificationsOpen(true)}
      />
      <main className={mainClass} role="main">
        <div className="main__content">{children}</div>
      </main>
      {showFooter ? <ParentFooter /> : null}
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
