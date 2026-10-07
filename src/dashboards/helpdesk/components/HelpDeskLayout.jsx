import React, { useState } from 'react';
import { HelpDeskHeader } from './HelpDeskHeader.jsx';
import { HelpDeskFooter } from './HelpDeskFooter.jsx';
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
    <div className="portal portal--student portal--no-nav">
      <HelpDeskHeader
        pageTitle={pageTitle}
        officerName={officerName}
        showNotifications={showNotifications}
        showProfile={showProfile}
        notificationBadge={notificationBadge}
        onMenuOpen={() => setMenuOpen(true)}
        onNotificationsOpen={() => setNotificationsOpen(true)}
      />
      <main className={mainClass} role="main">
        <div className="main__content">{children}</div>
      </main>
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
