import React, { useState } from 'react';
import { ChiefHeader } from './ChiefHeader.jsx';
import { ChiefFooter } from './ChiefFooter.jsx';
import { ChiefDesktopSidebar } from './ChiefDesktopSidebar.jsx';
import { ChiefSlideMenu } from './ChiefSlideMenu.jsx';
import { NotificationModal } from '../../../components/NotificationModal.jsx';

export function ChiefLayout({
  pageTitle,
  chiefName,
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
    <div className="portal portal--chief portal--no-nav">
      <ChiefHeader
        pageTitle={pageTitle}
        chiefName={chiefName}
        showNotifications={showNotifications}
        showProfile={showProfile}
        notificationBadge={notificationBadge}
        onMenuOpen={() => setMenuOpen(true)}
        onNotificationsOpen={() => setNotificationsOpen(true)}
      />
      <div className="chief-portal-body">
        <ChiefDesktopSidebar chiefName={chiefName} />
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
          <div className="main__content" style={{ padding: '24px 0 64px' }}>
            {children}
          </div>
        </main>
      </div>
      {showFooter ? <ChiefFooter /> : null}
      <ChiefSlideMenu
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
