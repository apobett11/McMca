import { PageShell } from '../components/PageShell.js';

export function DocumentsPage() {
  const currentHash = window.location.hash || '#/documents';

  const main = document.createRange().createContextualFragment(`
    <section>
      <h2 style="margin:0 0 10px;">Document Upload Center</h2>
      <p class="p">Upload required documents. If something is missing, we will tell you what to add.</p>

      <div class="section card" style="padding:14px;">
        <h2 style="font-size:20px; margin:0 0 10px;">What you need (example)</h2>
        <div class="list">
          <div class="item">
            <p class="itemTitle">Fee structure</p>
            <p class="itemDesc">Upload a clear photo or PDF showing your school fees.</p>
          </div>
          <div class="item">
            <p class="itemTitle">ID / Student details</p>
            <p class="itemDesc">Upload a document that proves the student’s details.</p>
          </div>
          <div class="item">
            <p class="itemTitle">Admission or enrollment proof</p>
            <p class="itemDesc">Upload proof you are enrolled in your institution.</p>
          </div>
        </div>
      </div>

      <div class="section card" style="padding:14px; margin-top:14px;" aria-label="Upload form">
        <h2 style="font-size:20px; margin:0 0 10px;">Upload a document</h2>
        <div class="field">
          <label for="docType">Document type</label>
          <select id="docType" aria-describedby="docHelp">
            <option value="fee">Fee structure</option>
            <option value="id">ID / Student details</option>
            <option value="enrollment">Admission / enrollment proof</option>
            <option value="other">Other</option>
          </select>
          <p id="docHelp" class="p" style="margin-top:8px;">For security, your files are uploaded securely in the real system.</p>
        </div>

        <div class="field">
          <label for="fileInput">Choose file</label>
          <input id="fileInput" type="file" accept="image/*,application/pdf" />
        </div>

        <div class="field">
          <button class="btn btnPrimary" type="button" aria-label="Upload document (demo)" onclick="alert('MVP demo: upload is not connected to a backend yet.')">
            <span aria-hidden="true">⬆️</span> Upload
          </button>
        </div>

        <p class="p" style="margin-top:10px;">You will see your upload result and next steps here after integration.</p>
      </div>
    </section>
  `);

  return PageShell({ currentHash, pageTitle: 'Documents', mainEl: main });
}

