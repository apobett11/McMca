import { DashboardPage } from './pages/DashboardPage.js';
import { ApplicationsPage } from './pages/ApplicationsPage.js';
import { DocumentsPage } from './pages/DocumentsPage.js';
import { SupportPage } from './pages/SupportPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { NotificationsPage } from './pages/NotificationsPage.js';
import { AppealsPage } from './pages/AppealsPage.js';
import { WizardPage } from './pages/WizardPage.js';

// Note: Documents flow is handled by DocumentsPage (Document Upload Center).
// DocumentPage.js is kept as a legacy stub and is not part of routing.

export function initRouter(onRouteChange) {
  function getRoute() {
    // Hash router: #/dashboard, #/applications, #/documents ...
    const hash = window.location.hash || '#/dashboard';
    const path = hash.replace(/^#/, '');
    return path;
  }

  function handle() {
    onRouteChange(getRoute());
  }

  window.addEventListener('hashchange', handle);
  handle();
}

export function renderRoute(route, rootEl) {
  // One purpose per route. Each page renders its own main content.
  const normalize = route.replace(/\/$/, '');
  const routes = {
    '#/dashboard': DashboardPage,
    '#/applications': ApplicationsPage,
    '#/documents': DocumentsPage,
    '#/support': SupportPage,
    '#/profile': ProfilePage,
    '#/notifications': NotificationsPage,
    '#/appeals': AppealsPage,
    '#/new-application': WizardPage,
  };

  const Page = routes[normalize] || DashboardPage;
  const pageEl = Page();

  rootEl.innerHTML = '';
  rootEl.appendChild(pageEl);
}

