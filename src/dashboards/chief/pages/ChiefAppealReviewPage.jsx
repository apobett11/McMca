import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChiefLayout } from '../components/ChiefLayout.jsx';
import { SectionCard } from '../../../components/SectionCard.jsx';
import { ReviewActionModal } from '../../../components/chief/ReviewActionModal.jsx';
import { Icon } from '../../../components/Icon.jsx';
import {
  CHIEF,
  CHIEF_APPEALS,
  APPEAL_DOCUMENTS,
  APPEAL_ORIGINAL_APPLICATIONS
} from '../../../data/chiefMock.js';
import { getAppealBadgeClass, getVerificationBadgeClass } from '../../../utils/badges.js';

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function ChiefAppealReviewPage() {
  const { appealId } = useParams();
  const [actionModal, setActionModal] = useState(null);

  const appeal = useMemo(() => CHIEF_APPEALS.find((a) => a.id === appealId), [appealId]);
  const documents = APPEAL_DOCUMENTS[appealId] ?? [];
  const originalApp = APPEAL_ORIGINAL_APPLICATIONS[appealId];

  if (!appeal) {
    return (
      <ChiefLayout chiefName={CHIEF.fullName} pageTitle="Appeal not found" showBottomNav={false}>
        <SectionCard title="Appeal not found" titleLevel="h1">
          <p className="section-card__lead section-card__lead--left">
            This appeal is not in your review queue or may have been reassigned.
          </p>
          <Link className="btn btn--secondary" to="/chief/appeals">
            Back to appeals queue
          </Link>
        </SectionCard>
      </ChiefLayout>
    );
  }

  return (
    <ChiefLayout
      chiefName={CHIEF.fullName}
      pageTitle="Appeal review"
      showBottomNav={false}
      notificationBadge={false}
    >
      <SectionCard title="Appeal review workspace" titleLevel="h1">
        <p className="section-card__lead section-card__lead--left">
          Review appeal for <strong>{appeal.fullName}</strong> — verify new evidence and resolve the
          case. All appeal actions occur on this page.
        </p>
        <Link className="btn btn--ghost btn--compact" to="/chief/appeals">
          <Icon name="arrowRight" size={16} />
          Back to queue
        </Link>
      </SectionCard>

      <SectionCard title="Appeal information">
        <dl className="detail-grid">
          <div className="detail-grid__row">
            <dt>Student full name</dt>
            <dd>{appeal.fullName}</dd>
          </div>
          <div className="detail-grid__row">
            <dt>School</dt>
            <dd>{appeal.school}</dd>
          </div>
          <div className="detail-grid__row">
            <dt>Education level</dt>
            <dd>{appeal.educationLevel}</dd>
          </div>
          <div className="detail-grid__row">
            <dt>Original application decision</dt>
            <dd>
              <span className="badge badge--rejected">{appeal.originalApplicationStatus}</span>
            </dd>
          </div>
          <div className="detail-grid__row">
            <dt>Appeal status</dt>
            <dd>
              <span className={getAppealBadgeClass(appeal.appealStatus)}>{appeal.appealStatus}</span>
            </dd>
          </div>
          <div className="detail-grid__row">
            <dt>Appeal reason</dt>
            <dd>{appeal.appealReason}</dd>
          </div>
          <div className="detail-grid__row">
            <dt>Appeal submission date</dt>
            <dd>{formatDateTime(appeal.appealSubmissionDate)}</dd>
          </div>
          <div className="detail-grid__row">
            <dt>Last updated</dt>
            <dd>{formatDateTime(appeal.lastUpdated)}</dd>
          </div>
        </dl>
      </SectionCard>

      <SectionCard title="Supporting documents">
        {documents.length ? (
          <div className="data-table-wrap">
            <table className="data-table data-table--chief" aria-label="Appeal supporting documents">
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
          <p className="empty-state">No supporting documents uploaded.</p>
        )}
      </SectionCard>

      <SectionCard title="Original application">
        {originalApp ? (
          <dl className="detail-grid">
            <div className="detail-grid__row">
              <dt>Amount requested</dt>
              <dd>{originalApp.amountRequested}</dd>
            </div>
            <div className="detail-grid__row">
              <dt>Submitted</dt>
              <dd>{formatDateTime(originalApp.submittedDate)}</dd>
            </div>
            <div className="detail-grid__row">
              <dt>Document status</dt>
              <dd>{originalApp.documentStatus}</dd>
            </div>
            <div className="detail-grid__row">
              <dt>Amount allocated</dt>
              <dd>{originalApp.amountAllocated}</dd>
            </div>
            <div className="detail-grid__row">
              <dt>Original rejection reason</dt>
              <dd>{appeal.originalRejectionReason}</dd>
            </div>
            <div className="detail-grid__row">
              <dt>Original review notes</dt>
              <dd>{appeal.originalReviewNotes}</dd>
            </div>
          </dl>
        ) : (
          <p className="empty-state">Original application data unavailable.</p>
        )}
      </SectionCard>

      {appeal.actionHistory?.length ? (
        <SectionCard title="Action history">
          <ul className="action-history">
            {appeal.actionHistory.map((entry, i) => (
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

      <SectionCard title="Appeal actions">
        <p className="section-card__lead section-card__lead--left">
          Approve, reject, or request clarification on this appeal. Actions are recorded and
          notified to the student and parent.
        </p>
        <div className="btn-row review-actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setActionModal('approve')}
          >
            Approve appeal
          </button>
          <button type="button" className="btn btn--danger" onClick={() => setActionModal('reject')}>
            Reject appeal
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
        title="Approve appeal"
      />
      <ReviewActionModal
        open={actionModal === 'reject'}
        onClose={() => setActionModal(null)}
        action="reject"
        title="Reject appeal"
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
