import { PageShell } from '../components/PageShell.js';
import { StatusPill } from '../components/StatusPill.js';

export function ApplicationsPage() {
  const currentHash = window.location.hash || '#/applications';

  const applications = [
    { year: '2025/2026', status: 'Under Review', idSafe: 'APP-***42' },
    { year: '2024/2025', status: 'Approved', idSafe: 'APP-***08' },
  ];

  const main = document.createRange().createContextualFragment(`
    <section>
      <h2 style="margin:0 0 10px;">Applications</h2>
      <p class="p">See your application history and current status.</p>

      <div class="section list" style="margin-top:12px;">
        ${applications.map((a) => {
          const tmp = document.createElement('div');
          tmp.appendChild(StatusPill({ status: a.status }));
          return `
            <div class="item" role="group" aria-label="Application ${a.year}">
              <p class="itemTitle">${a.year}</p>
              <div style="margin-top:10px;">${tmp.innerHTML}</div>
              <p class="itemDesc" style="margin-top:10px;">Tracking code: ${a.idSafe} (hidden for safety)</p>
              <div style="margin-top:12px;">
                <a class="btn" href="#/applications" aria-label="Open application details">
                  <span aria-hidden="true">🔎</span> View details
                </a>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </section>
  `);

  return PageShell({ currentHash, pageTitle: 'Applications', mainEl: main });
}

