import React, { useState } from 'react';
import { HelpDeskHeader } from './HelpDeskHeader.jsx';
import { HelpDeskFooter } from './HelpDeskFooter.jsx';
import { HelpDeskDesktopSidebar } from './HelpDeskDesktopSidebar.jsx';
import { HelpDeskSlideMenu } from './HelpDeskSlideMenu.jsx';
import { NotificationModal } from '../../../components/NotificationModal.jsx';
import './helpdesk.css';

export function HelpDeskLayout({
  pageTitle,
  officerName = 'Help Desk Officer',
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
    <div className="portal portal--student portal--helpdesk portal--no-nav">
      <HelpDeskHeader
        pageTitle={pageTitle}
        officerName={officerName}
        showNotifications={showNotifications}
        showProfile={showProfile}
        notificationBadge={notificationBadge}
        onMenuOpen={() => setMenuOpen(true)}
        onNotificationsOpen={() => setNotificationsOpen(true)}
      />
      <div className="helpdesk-portal-body">
        <HelpDeskDesktopSidebar officerName={officerName} />
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
