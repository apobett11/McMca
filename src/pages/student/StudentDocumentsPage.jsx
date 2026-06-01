import React, { useState } from 'react';
import { PageShell } from '../../components/PageShell.jsx';
import { PageIntro } from '../../components/student/PageIntro.jsx';
import { Icon } from '../../components/Icon.jsx';
import { STUDENT_SHELL } from '../studentShell.js';
import { STUDENT_DOC_CHECKLIST } from '../../data/studentMock.js';

export function StudentDocumentsPage() {
  const [docType, setDocType] = useState('fee-structure');

  return (
    <PageShell pageTitle="Documents" notificationBadge {...STUDENT_SHELL}>
      <PageIntro lead="Upload and track documents for your active application." />

      <details className="collapsible-panel page-section--full" open>
        <summary className="collapsible-panel__summary">
          <Icon name="documents" size={20} />
          What you need
        </summary>
        <ul className="doc-checklist">
          {STUDENT_DOC_CHECKLIST.map((item) => (
            <li key={item.label} className="doc-checklist__item">
              <span
                className={`doc-checklist__status doc-checklist__status--${item.status === 'ok' ? 'ok' : 'missing'}`}
              >
                {item.status === 'ok' ? 'Received' : 'Missing'}
              </span>
              <div>
                <p className="doc-checklist__title">{item.label}</p>
                <p className="doc-checklist__desc">{item.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </details>

      <section className="upload-panel page-section--full" aria-label="Upload a document">
        <h2 className="upload-panel__title">Upload a document</h2>
        <p className="field__help upload-panel__lead">
          Choose the document type, then select a file from your phone or computer. Files are sent
          securely to the ward office.
        </p>
        <div className="field">
          <label htmlFor="docType">Document type</label>
          <select
            id="docType"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
          >
            <option value="fee-structure">Fee structure</option>
            <option value="student-id">Student ID or birth certificate</option>
            <option value="admission">Admission / enrollment proof</option>
            <option value="consent">Guardian consent form</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="docFile">File</label>
          <input id="docFile" type="file" accept="image/*,application/pdf" />
          <p className="field__help">
            Photos or PDFs only. Do not upload passwords, OTP codes, or unrelated files.
          </p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() =>
            window.alert(
              'Your file would upload securely. This demo stops here — connect storage API for production.'
            )
          }
        >
          <Icon name="upload" size={20} />
          Upload document
        </button>
      </section>
    </PageShell>
  );
}
