import React, { useState } from 'react';
import { MCAHeader } from './MCAHeader.jsx';
import { MCAFooter } from './MCAFooter.jsx';
import { MCADesktopSidebar } from './MCADesktopSidebar.jsx';
import { MCABottomNav } from './MCABottomNav.jsx';
import { MCASlideMenu } from './MCASlideMenu.jsx';
import { NotificationModal } from '../../../components/NotificationModal.jsx';
import '../styles/mca.css';

export function MCALayout({
  pageTitle,
  mcaName = 'Hon. Hillary Kiprotich Bett',
  children,
  showFooter = true,
  showNotifications = true,
  showProfile = true,
  notificationBadge = false,
  notificationItems = [],
  layout = 'dashboard'
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
    <div className="portal portal--chief portal--mca">
      <MCAHeader
        pageTitle={pageTitle}
        mcaName={mcaName}
        showNotifications={showNotifications}
        showProfile={showProfile}
        notificationBadge={notificationBadge}
        onMenuOpen={() => setMenuOpen(true)}
        onNotificationsOpen={() => setNotificationsOpen(true)}
      />
      <div className="chief-portal-body mca-portal-body">
        <MCADesktopSidebar mcaName={mcaName} />
        <main
          className={mainClass}
          role="main"
          style={{
            flex: '1',
            minWidth: 0,
            width: '100%',
            maxWidth: layout === 'dashboard' ? '1480px' : '960px',
            margin: '0 auto',
            padding: '0 16px'
          }}
        >
          <div className="main__content" style={{ padding: '20px 0 88px' }}>
            {children}
          </div>
        </main>
      </div>
      <MCABottomNav />
      {showFooter ? <MCAFooter /> : null}
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
