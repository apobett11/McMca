import { PageShell } from '../components/PageShell.js';
import { StatusPill } from '../components/StatusPill.js';
import { Timeline } from '../components/Timeline.js';
import { NotificationList } from '../components/NotificationList.js';

export function DashboardPage() {
  const currentHash = window.location.hash || '#/dashboard';

  const student = {
    firstName: 'Brian',
    institutionName: 'St. Mary Primary School',
    cycle: '2025/2026 Bursary Cycle',
  };

  const activeStatus = 'Under Review';

  const nextAction = {
    required: true,
    title: 'Upload your fee structure',
    message: 'Before June 14, upload your fee structure so your application can be checked by the committee.',
    cta: 'Go to Document Uploads',
    route: '/documents',
  };

  const timelineStages = [
    { label: 'Draft', state: 'completed' },
    { label: 'Submitted', state: 'completed' },
    { label: 'Documents Verified', state: 'completed' },
    { label: 'Under Review', state: 'current' },
    { label: 'MCA Review', state: 'upcoming' },
    { label: 'Funds Processing', state: 'upcoming' },
  ];

  const notifications = [
    {
      title: 'Missing document reminder',
      body: 'Your fee structure is not yet confirmed. Please upload it before the deadline.',
      variant: 'warning',
      unread: true,
      icon: '⏳',
    },
    {
      title: 'Application update',
      body: 'Your documents were received successfully.',
      variant: 'success',
      unread: false,
      icon: '✅',
    },
    {
      title: 'Deadline notice',
      body: 'June 14 is the last day for document uploads for your current review stage.',
      variant: 'warning',
      unread: false,
      icon: '📅',
    },
  ];

  const recentActivity = [
    { title: 'Document uploaded successfully', body: 'Fee structure uploaded on 10 Jan 2026.', variant: 'success', icon: '📄' },
    { title: 'Chief reviewed your application', body: 'Step moved to Under Review.', variant: 'info', icon: '🧑🏾‍⚖️' },
    { title: 'Funds sent on schedule', body: 'Funds sending will happen after MCA Review.', variant: 'info', icon: '💸' },
  ];

  const main = document.createRange().createContextualFragment(`
    <section aria-label="Dashboard greeting" class="section">
      <p class="p" style="font-size:18px; font-weight:900; color:#0f172a; margin-bottom:8px;">
        Good Evening, ${student.firstName} 👋
      </p>
      <p class="p">${student.institutionName} • ${student.cycle}</p>
    </section>

    <section class="section card" aria-label="Active application status">
      <div style="padding:14px 14px 10px;">
        <h2 style="margin:0 0 10px; font-size:20px;">Your current status</h2>
        <div style="display:grid; gap:12px;">
          ${(() => {
            const tmp = document.createElement('div');
            tmp.appendChild(StatusPill({ status: activeStatus }));
            return tmp.innerHTML;
          })()}


          <div>
            <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
              <div style="font-weight:900; font-size:14px; color:#0f172a;">Next required action</div>
              <div style="color:var(--muted); font-size:14px; font-weight:800;">${nextAction.required ? 'Action needed' : 'No action needed'}</div>
            </div>
            <p class="p" style="margin-top:8px;">${nextAction.message}</p>
          </div>
        </div>

        <div class="timeline" style="margin-top:12px;">
          ${Timeline({ stages: timelineStages }).outerHTML ? '' : ''}
          ${(() => {
            const tmp = document.createElement('div');
            tmp.appendChild(Timeline({ stages: timelineStages }));
            return tmp.innerHTML;
          })()}
        </div>

        ${nextAction.required ? `
          <div style="margin-top:14px;">
            <a class="btn btnPrimary" href="#${nextAction.route}" aria-label="${nextAction.cta}">
              <span aria-hidden="true">📤</span>
              ${nextAction.cta}
            </a>
          </div>
        ` : ''}
      </div>
    </section>

    <section class="section" aria-label="Quick actions">
      <h2>Quick actions</h2>
      <div style="display:grid; gap:10px;">
        <a class="btn" href="#/applications">
          <span aria-hidden="true">📝</span> Applications
        </a>
        <a class="btn" href="#/documents">
          <span aria-hidden="true">📄</span> Upload Documents
        </a>
        <a class="btn" href="#/support">
          <span aria-hidden="true">🛟</span> Support
        </a>
        <a class="btn" href="#/appeals">
          <span aria-hidden="true">⚖️</span> Appeals
        </a>
      </div>
    </section>

    <section class="section" aria-label="Notifications preview">
      <h2>Notifications</h2>
      ${NotificationList({ items: notifications }).outerHTML ? '' : ''}
      ${(() => {
        const tmp = document.createElement('div');
        tmp.appendChild(NotificationList({ items: notifications }));
        return tmp.innerHTML;
      })()}
      <div style="margin-top:12px;">
        <a class="btn btnSubtle" href="#/notifications" aria-label="View all notifications">
          <span aria-hidden="true">🧾</span> View all notifications
        </a>
      </div>
    </section>

    <section class="section" aria-label="Recent activity">
      <h2>Recent activity</h2>
      <div class="list">
        ${recentActivity.map((a) => {
          const iconBg = a.variant === 'success' ? 'var(--green)' : 'var(--blue)';
          return `
            <div class="item" role="listitem">
              <div class="itemTop">
                <div class="itemIcon" style="background:${iconBg}" aria-hidden="true">${a.icon}</div>
                <div>
                  <p class="itemTitle">${a.title}</p>
                  <p class="itemDesc">${a.body}</p>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </section>
  `);

  const pageTitle = 'Student Dashboard';
  return PageShell({ currentHash, pageTitle, mainEl: main });
}

