import React, { useState } from 'react';
import { ParentHeader } from './ParentHeader.jsx';
import { ParentFooter } from './ParentFooter.jsx';
import { ParentDesktopSidebar } from './ParentDesktopSidebar.jsx';
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
      <div className="parent-portal-body">
        <ParentDesktopSidebar parentName={parentName} />
        <main
          className={mainClass}
          role="main"
          style={{
            flex: '1',
            minWidth: 0,
            width: '100%',
            maxWidth: layout === 'dashboard' ? '1280px' : '820px',
            margin: '0 auto',
            padding: '0 24px'
          }}
        >
          <div className="main__content">{children}</div>
        </main>
      </div>
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
