import React, { useState } from 'react';
import { ChiefHeader } from './ChiefHeader.jsx';
import { ChiefFooter } from './ChiefFooter.jsx';
import { ChiefBottomNav } from './ChiefBottomNav.jsx';
import { ChiefSlideMenu } from './ChiefSlideMenu.jsx';
import { NotificationModal } from '../../../components/NotificationModal.jsx';

export function ChiefLayout({
  pageTitle,
  chiefName,
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
    <div className={`portal portal--chief ${showBottomNav ? '' : 'portal--no-nav'}`}>
      <ChiefHeader
        pageTitle={pageTitle}
        chiefName={chiefName}
        showNotifications={showNotifications}
        showProfile={showProfile}
        notificationBadge={notificationBadge}
        onMenuOpen={() => setMenuOpen(true)}
        onNotificationsOpen={() => setNotificationsOpen(true)}
      />
      <main className={mainClass} role="main" style={{flex: '1', width: '100%', maxWidth: layout === 'dashboard' ? '1280px' : '720px', margin: '0 auto', padding: '0 24px'}}>
        <div className="main__content" style={{padding: '32px 0 64px'}}>{children}</div>
      </main>
      {showFooter ? <ChiefFooter /> : null}
      {showBottomNav ? (
        <ChiefBottomNav />
      ) : null}
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
