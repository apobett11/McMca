export function Header({ title, showNotifications = true, showProfile = true }) {
  // Sticky, lightweight header; single purpose: orientation.
  return document.createRange().createContextualFragment(`
    <header class="header" role="banner">
      <div class="headerInner">
        <div class="logoWrap" aria-label="Ward Student Portal">
          <div class="logoMark" aria-hidden="true">W</div>
          <div class="pageTitle">
            <b>${title}</b>
            <span>Student Portal • Secure & clear</span>
          </div>
        </div>

        ${showNotifications ? `
          <a class="iconBtn" href="#/notifications" aria-label="Open notifications">
            <span aria-hidden="true">🔔</span>
            <span class="iconText">Notifications</span>
          </a>
        ` : ''}

        ${showProfile ? `
          <a class="iconBtn" href="#/profile" aria-label="Open profile and security">
            <span aria-hidden="true">👤</span>
            <span class="iconText">Profile</span>
          </a>
        ` : ''}
      </div>
    </header>
  `);
}

