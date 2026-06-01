import { navigateTo } from '../routerNavigate.js';

function Tab({ label, route, icon, active }) {
  return `
    <a class="tab ${active ? 'tabActive' : ''}" href="#${route}" aria-current="page">
      <span class="tabIcon" aria-hidden="true">${icon}</span>
      <span class="tabLabel">${label}</span>
    </a>
  `;
}

export function BottomNav({ current }) {
  const tabs = [
    { label: 'Home', route: '/dashboard', icon: '🏠' },
    { label: 'Applications', route: '/applications', icon: '📝' },
    { label: 'Documents', route: '/documents', icon: '📄' },
    { label: 'Support', route: '/support', icon: '🛟' },
    { label: 'Profile', route: '/profile', icon: '👤' },
  ];

  // current is like '#/dashboard'
  return document.createRange().createContextualFragment(`
    <nav class="bottomNav" aria-label="Student portal navigation">
      <div class="bottomNavInner">
        ${tabs
          .map((t) => {
            const routeHash = `#${t.route}`;
            const active = current === routeHash;
            return Tab({ label: t.label, route: t.route, icon: t.icon, active });
          })
          .join('')}
      </div>
    </nav>
  `);
}

