import React, { useState } from 'react';
import { HelpDeskHeader } from './HelpDeskHeader.jsx';
import { HelpDeskFooter } from './HelpDeskFooter.jsx';
import { HelpDeskDesktopSidebar } from './HelpDeskDesktopSidebar.jsx';
import { HelpDeskBottomNav } from './HelpDeskBottomNav.jsx';
import { HelpDeskSlideMenu } from './HelpDeskSlideMenu.jsx';
import { NotificationModal } from '../../../components/NotificationModal.jsx';
import './helpdesk.css';

export function HelpDeskLayout({
  pageTitle,
  officerName = 'Clara Chelangat',
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
    <div className="portal portal--chief portal--helpdesk">
      <HelpDeskHeader
        pageTitle={pageTitle}
        officerName={officerName}
        showNotifications={showNotifications}
        showProfile={showProfile}
        notificationBadge={notificationBadge}
        onMenuOpen={() => setMenuOpen(true)}
        onNotificationsOpen={() => setNotificationsOpen(true)}
      />
      <div className="chief-portal-body helpdesk-portal-body">
        <HelpDeskDesktopSidebar officerName={officerName} />
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
      <HelpDeskBottomNav />
      {showFooter ? <HelpDeskFooter /> : null}
      <HelpDeskSlideMenu
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
