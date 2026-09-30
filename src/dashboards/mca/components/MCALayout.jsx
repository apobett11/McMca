import React, { useState } from 'react';
import { MCAHeader } from './MCAHeader.jsx';
import { MCAFooter } from './MCAFooter.jsx';
import { MCABottomNav } from './MCABottomNav.jsx';
import { MCASlideMenu } from './MCASlideMenu.jsx';
import '../mca.css';

export function MCALayout({
  pageTitle,
  mcaName,
  children,
  showBottomNav = true,
  showFooter = true,
  showProfile = true,
  layout = 'default'
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const mainClass =
    layout === 'dashboard'
      ? 'main main--dashboard'
      : layout === 'list'
        ? 'main main--list'
        : 'main';

  return (
    <div className={`portal portal--mca ${showBottomNav ? '' : 'portal--no-nav'}`}>
      <MCAHeader
        pageTitle={pageTitle}
        mcaName={mcaName}
        showNotifications={false}
        showProfile={showProfile}
        onMenuOpen={() => setMenuOpen(true)}
      />
      <main className={mainClass} role="main" style={{flex: '1', width: '100%', maxWidth: layout === 'default' ? '720px' : '1280px', margin: '0 auto', padding: '0 24px'}}>
        <div className="main__content" style={{padding: '32px 0 64px'}}>{children}</div>
      </main>
      {showFooter ? <MCAFooter /> : null}
      {showBottomNav ? <MCABottomNav /> : null}
      <MCASlideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
