import { PageShell } from '../components/PageShell.js';

export function WizardPage() {
  const currentHash = window.location.hash || '#/new-application';

  // One primary purpose: guide a single application creation workflow.
  const main = document.createRange().createContextualFragment(`
    <section>
      <h2 style="margin:0 0 10px;">New Application Wizard</h2>
      <p class="p">Follow the steps. You can review everything before you submit.</p>

      <div class="section card" style="padding:14px;">
        <h2 style="font-size:20px; margin:0 0 10px;">Step 1 of 3: Student details</h2>

        <div class="field">
          <label for="firstName">Student first name</label>
          <input id="firstName" type="text" placeholder="e.g., Brian" />
        </div>

        <div class="field">
          <label for="institution">Institution name</label>
          <input id="institution" type="text" placeholder="e.g., St. Mary Primary School" />
        </div>

        <div class="field">
          <label for="cycle">Bursary cycle</label>
          <select id="cycle">
            <option>2025/2026 Bursary Cycle</option>
            <option>2024/2025 Bursary Cycle</option>
          </select>
        </div>

        <div class="field">
          <button class="btn btnPrimary" type="button" onclick="alert('Demo: step navigation not connected.')">
            <span aria-hidden="true">➡️</span> Continue
          </button>
        </div>

        <p class="p" style="margin-top:10px;">Tip: If you lose connection, you can continue later (offline support comes later).</p>
      </div>
    </section>
  `);

  return PageShell({ currentHash, pageTitle: 'New Application', mainEl: main });
}

