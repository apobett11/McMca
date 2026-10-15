import React, { useState } from 'react';
import { MCAHeader } from './MCAHeader.jsx';
import { MCAFooter } from './MCAFooter.jsx';
import { MCABottomNav } from './MCABottomNav.jsx';
import { MCADesktopSidebar } from './MCADesktopSidebar.jsx';
import { MCASlideMenu } from './MCASlideMenu.jsx';
import { NotificationModal } from '../../../components/NotificationModal.jsx';
import '../styles/mca.css';

export function MCALayout({
  pageTitle,
  mcaName = 'Hon. Hillary Kiprotich Bett',
  children,
  showBottomNav = true,
  showFooter = true,
  showNotifications = true,
  showProfile = true,
  notificationBadge = false,
  notificationItems = []
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <div className="mca-portal-wrapper">
      <MCAHeader
        pageTitle={pageTitle}
        mcaName={mcaName}
        showNotifications={showNotifications}
        showProfile={showProfile}
        notificationBadge={notificationBadge}
        onMenuOpen={() => setMenuOpen(true)}
        onNotificationsOpen={() => setNotificationsOpen(true)}
      />
      <div className="mca-layout-container">
        <MCADesktopSidebar mcaName={mcaName} />
        <main className="mca-main-content" role="main">
          {children}
        </main>
      </div>
      {showFooter && <MCAFooter />}
      {showBottomNav && <MCABottomNav />}
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
