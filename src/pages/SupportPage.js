import { PageShell } from '../components/PageShell.js';

export function SupportPage() {
  const currentHash = window.location.hash || '#/support';

  const main = document.createRange().createContextualFragment(`
    <section>
      <h2 style="margin:0 0 10px;">Support Center</h2>
      <p class="p">Get help without confusion. Choose a topic below.</p>

      <div class="section" style="display:grid; gap:10px;">
        <a class="btn" href="#/support" onclick="alert('Demo: contact chief helpdesk flow not connected.')">
          <span aria-hidden="true">🏛️</span> Help from the Chief office
        </a>
        <a class="btn" href="#/support" onclick="alert('Demo: contact MCA helpdesk flow not connected.')">
          <span aria-hidden="true">🏛️</span> Help from MCA office
        </a>
        <a class="btn" href="#/support" onclick="alert('Demo: troubleshoot document upload flow not connected.')">
          <span aria-hidden="true">📄</span> Document upload problems
        </a>
        <a class="btn" href="#/support" onclick="alert('Demo: deadline guidance flow not connected.')">
          <span aria-hidden="true">⏰</span> Deadline and status questions
        </a>
      </div>

      <div class="section card" style="padding:14px; margin-top:14px;">
        <h2 style="font-size:20px; margin:0 0 10px;">Safety note</h2>
        <p class="p">Do not share passwords, OTP codes, or sensitive identification details in chat or messages.</p>
      </div>
    </section>
  `);

  return PageShell({ currentHash, pageTitle: 'Support', mainEl: main });
}

