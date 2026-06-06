import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChiefLayout } from '../components/ChiefLayout.jsx';
import { SectionCard } from '../../components/SectionCard.jsx';
import { ReviewActionModal } from '../../components/chief/ReviewActionModal.jsx';
import { Icon } from '../../components/Icon.jsx';
import {
  getApplicationBadgeClass,
  getDocumentBadgeClass,
  getVerificationBadgeClass
} from '../../utils/badges.js';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function ChiefApplicationReviewPage() {
  const { applicationId } = useParams();
  const [actionModal, setActionModal] = useState(null);

  const application = useMemo(
    () => CHIEF_APPLICATIONS.find((a) => a.id === applicationId),
    [applicationId]
  );

  const documents = APPLICATION_DOCUMENTS[applicationId] ?? [];
  const aiExtraction = APPLICATION_AI_EXTRACTION[applicationId];

  if (!application) {
    return (
      <ChiefLayout chiefName={CHIEF.fullName} pageTitle="Application not found" showBottomNav={false}>
        <SectionCard title="Application not found" titleLevel="h1">
          <p className="section-card__lead section-card__lead--left">
            This application is not in your review queue or may have been reassigned.
          </p>
          <Link className="btn btn--secondary" to="/chief/applications">
            Back to applications queue
          </Link>
        </SectionCard>
      </ChiefLayout>
    );
  }

  return (
    <ChiefLayout
      chiefName={CHIEF.fullName}
      pageTitle="Application review"
      showBottomNav={false}
      notificationBadge={false}
    >
      <SectionCard title="Application review workspace" titleLevel="h1">
        <p className="section-card__lead section-card__lead--left">
          Verify submitted information and documents for <strong>{application.fullName}</strong>.
          All review actions occur on this page.
        </p>
        <Link className="btn btn--ghost btn--compact" to="/chief/applications">
          <Icon name="arrowRight" size={16} />
          Back to queue
        </Link>
      </SectionCard>

      <SectionCard title="Application information">
        <dl className="detail-grid">
          <div className="detail-grid__row">
            <dt>Student full name</dt>
            <dd>{application.fullName}</dd>
          </div>
          <div className="detail-grid__row">
            <dt>Date of birth</dt>
            <dd>{formatDate(application.dateOfBirth)}</dd>
          </div>
          <div className="detail-grid__row">
            <dt>School</dt>
            <dd>{application.school}</dd>
          </div>
          <div className="detail-grid__row">
            <dt>Education level</dt>
            <dd>{application.educationLevel}</dd>
          </div>
          <div className="detail-grid__row">
            <dt>Grade / form / year</dt>
            <dd>{application.grade}</dd>
          </div>
          <div className="detail-grid__row">
            <dt>Admission number</dt>
            <dd>{application.admissionNumber}</dd>
          </div>
          <div className="detail-grid__row">
            <dt>Parent / guardian</dt>
            <dd>{application.parentName}</dd>
          </div>
          <div className="detail-grid__row">
            <dt>Contact</dt>
            <dd>
              {application.parentPhone} · {application.contactEmail}
            </dd>
          </div>
          <div className="detail-grid__row">
            <dt>Location / sub-location</dt>
            <dd>
              {application.location} / {application.subLocation}
            </dd>
          </div>
          <div className="detail-grid__row">
            <dt>Application cycle</dt>
            <dd>{application.cycle}</dd>
          </div>
        </dl>
      </SectionCard>

      <SectionCard title="Application details">
        <dl className="detail-grid">
          <div className="detail-grid__row">
            <dt>Amount requested</dt>
            <dd>{application.amountRequested}</dd>
          </div>
          <div className="detail-grid__row">
            <dt>Previous allocations</dt>
            <dd>{application.previousAllocations}</dd>
          </div>
          <div className="detail-grid__row">
            <dt>Current status</dt>
            <dd>
              <span className={getApplicationBadgeClass(application.applicationStatus)}>
                {application.applicationStatus}
              </span>
            </dd>
          </div>
          <div className="detail-grid__row">
            <dt>Submitted</dt>
            <dd>{formatDateTime(application.submittedDate)}</dd>
          </div>
          <div className="detail-grid__row">
            <dt>Last updated</dt>
            <dd>{formatDateTime(application.lastUpdated)}</dd>
          </div>
        </dl>
      </SectionCard>

      <SectionCard title="Documents">
        {documents.length ? (
          <div className="data-table-wrap">
            <table className="data-table data-table--chief" aria-label="Application documents">
              <thead>
                <tr>
                  <th scope="col">Document type</th>
                  <th scope="col">Verification</th>
                  <th scope="col">Uploaded</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td data-label="Document type">{doc.type}</td>
                    <td data-label="Verification">
                      <span className={getVerificationBadgeClass(doc.verificationStatus)}>
                        {doc.verificationStatus}
                      </span>
                    </td>
                    <td data-label="Uploaded">{formatDateTime(doc.uploadDate)}</td>
                    <td data-label="Action">
                      <button
                        type="button"
                        className="btn btn--table"
                        onClick={() =>
                          window.alert(`View ${doc.type} — document viewer demo not connected.`)
                        }
                      >
                        <Icon name="documents" size={16} />
                        View document
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">No documents uploaded for this application.</p>
        )}
      </SectionCard>

      {aiExtraction ? (
        <SectionCard title="AI extraction">
          <dl className="detail-grid">
            <div className="detail-grid__row">
              <dt>Visibility status</dt>
              <dd>{aiExtraction.visibilityStatus}</dd>
            </div>
            <div className="detail-grid__row">
              <dt>Verification status</dt>
              <dd>
                <span className={getVerificationBadgeClass(aiExtraction.verificationStatus)}>
                  {aiExtraction.verificationStatus}
                </span>
              </dd>
            </div>
          </dl>
          <h3 className="review-subsection__title">OCR extracted data</h3>
          <dl className="detail-grid">
            {Object.entries(aiExtraction.ocrData).map(([key, value]) => (
              <div key={key} className="detail-grid__row">
                <dt>{key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          {aiExtraction.warnings?.length ? (
            <div className="notice notice--warm">
              <strong>AI warning flags</strong>
              <ul className="review-warnings">
                {aiExtraction.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </SectionCard>
      ) : null}

      {application.reviewNotes ? (
        <SectionCard title="Review notes">
          <p className="review-notes">{application.reviewNotes}</p>
        </SectionCard>
      ) : null}

      {application.actionHistory?.length ? (
        <SectionCard title="Action history">
          <ul className="action-history">
            {application.actionHistory.map((entry, i) => (
              <li key={i} className="action-history__item">
                <strong>{entry.action}</strong>
                <span>{formatDateTime(entry.timestamp)}</span>
                {entry.by ? <span> — {entry.by}</span> : null}
                {entry.note ? <p>{entry.note}</p> : null}
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}

      <SectionCard title="Review actions">
        <p className="section-card__lead section-card__lead--left">
          Approve, reject, or request clarification. Actions are recorded with timestamp and sent to
          the student and parent dashboards.
        </p>
        <div className="btn-row review-actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setActionModal('approve')}
          >
            <Icon name="check" size={20} />
            Approve application
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => setActionModal('reject')}
          >
            Reject application
          </button>
          <button
            type="button"
            className="btn btn--accent"
            onClick={() => setActionModal('clarify')}
          >
            <Icon name="bell" size={20} />
            Request clarification
          </button>
        </div>
      </SectionCard>

      <ReviewActionModal
        open={actionModal === 'approve'}
        onClose={() => setActionModal(null)}
        action="approve"
        title="Approve application"
      />
      <ReviewActionModal
        open={actionModal === 'reject'}
        onClose={() => setActionModal(null)}
        action="reject"
        title="Reject application"
      />
      <ReviewActionModal
        open={actionModal === 'clarify'}
        onClose={() => setActionModal(null)}
        action="clarify"
        title="Request clarification"
      />
    </ChiefLayout>
  );
}
