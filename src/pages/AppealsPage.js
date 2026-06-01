import { PageShell } from '../components/PageShell.js';

export function AppealsPage() {
  const currentHash = window.location.hash || '#/appeals';

  const main = document.createRange().createContextualFragment(`
    <section>
      <h2 style="margin:0 0 10px;">Appeals</h2>
      <p class="p">If your application was rejected, you can request a review. This page stays clear and step-by-step.</p>

      <div class="section card" style="padding:14px;">
        <h2 style="font-size:20px; margin:0 0 10px;">Appeal form (demo)</h2>

        <div class="field">
          <label for="reason">Why are you appealing?</label>
          <textarea id="reason" placeholder="Write your explanation in simple words."></textarea>
        </div>

        <div class="field">
          <label for="evidence">Attach evidence (optional)</label>
          <input id="evidence" type="file" accept="image/*,application/pdf" />
        </div>

        <div class="field">
          <button class="btn btnPrimary" type="button" onclick="alert('Demo: appeal submission not connected yet.')">
            <span aria-hidden="true">✉️</span> Submit appeal
          </button>
        </div>

        <p class="p" style="margin-top:10px;">In the real system, you will see confirmation and next steps immediately.</p>
      </div>
    </section>
  `);

  return PageShell({ currentHash, pageTitle: 'Appeals', mainEl: main });
}

