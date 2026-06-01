import { PageShell } from '../components/PageShell.js';
import { NotificationList } from '../components/NotificationList.js';

export function NotificationsPage() {
  const currentHash = window.location.hash || '#/notifications';

  const items = [
    { title: 'Missing document reminder', body: 'Fee structure is not yet confirmed. Upload before June 14.', variant: 'warning', unread: true, icon: '⏳' },
    { title: 'Application update', body: 'Your documents were received successfully.', variant: 'success', unread: false, icon: '✅' },
    { title: 'Chief review completed', body: 'Your step moved to MCA Review soon.', variant: 'info', unread: false, icon: '🧑🏾‍⚖️' },
  ];

  const main = document.createRange().createContextualFragment(`
    <section>
      <h2 style="margin:0 0 10px;">Notifications</h2>
      <p class="p">Clear updates about your application status, deadlines, and missing requirements.</p>
      <div class="section">${(() => {
        const tmp = document.createElement('div');
        tmp.appendChild(NotificationList({ items }));
        return tmp.innerHTML;
      })()}</div>
    </section>
  `);

  return PageShell({ currentHash, pageTitle: 'Notifications', mainEl: main });
}

