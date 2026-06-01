import { PageShell } from '../components/PageShell.js';

export function ProfilePage() {
  const currentHash = window.location.hash || '#/profile';

  const main = document.createRange().createContextualFragment(`
    <section>
      <h2 style="margin:0 0 10px;">Profile & Security</h2>
      <p class="p">This area prepares secure access (OTP and protected uploads) in the full system.</p>

      <div class="section card" style="padding:14px;">
        <h2 style="font-size:20px; margin:0 0 10px;">Your details (example)</h2>
        <p class="p"><b>Name:</b> Brian (example)</p>
        <p class="p" style="margin-top:8px;"><b>Institution:</b> St. Mary Primary School (example)</p>
        <p class="p" style="margin-top:8px;"><b>Student ID:</b> Hidden for safety</p>
      </div>

      <div class="section card" style="padding:14px; margin-top:14px;">
        <h2 style="font-size:20px; margin:0 0 10px;">Security actions (demo)</h2>
        <div style="display:grid; gap:10px;">
          <button class="btn" type="button" onclick="alert('Demo: OTP verification flow not connected.')">
            <span aria-hidden="true">🔐</span> Verify phone with OTP
          </button>
          <button class="btn" type="button" onclick="alert('Demo: change password flow not connected.')">
            <span aria-hidden="true">🛡️</span> Change password
          </button>
          <button class="btn" type="button" onclick="alert('Demo: log out flow not connected.')">
            <span aria-hidden="true">🚪</span> Log out
          </button>
        </div>

        <p class="p" style="margin-top:10px;">Never share OTP codes with anyone.</p>
      </div>
    </section>
  `);

  return PageShell({ currentHash, pageTitle: 'Profile', mainEl: main });
}

