import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChiefLayout } from '../components/ChiefLayout.jsx';
import { SectionCard } from '../../../components/SectionCard.jsx';
import { ReviewActionModal } from '../../../components/chief/ReviewActionModal.jsx';
import { Icon } from '../../../components/Icon.jsx';
import {
  getApplicationBadgeClass,
  getVerificationBadgeClass
} from '../../../utils/badges.js';
import { decideApplication, fetchChiefApplication, getDocumentSignedUrl, setDocumentVerification } from '../../../lib/queries.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { getStatusConfig } from '../../../utils/statusConfig.js';

function formatDate(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function formatDateTime(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function verificationLabel(row) {
  if (row.verification_status === 'verified' || row.ai_verified) return 'Verified';
  if (row.verification_status === 'rejected') return 'Rejected';
  return 'Pending Review';
}

export function ChiefApplicationReviewPage() {
  const { applicationId } = useParams();
  const { user } = useAuth();
  const [actionModal, setActionModal] = useState(null);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const chiefName = user?.user_metadata?.full_name || 'Chief';

  const load = useCallback(async () => {
    if (!applicationId) {
      setLoadError('Open an application from the queue.');
      setRecord(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setRecord(await fetchChiefApplication(applicationId));
      setLoadError('');
    } catch (err) {
      setRecord(null);
      setLoadError(err.message || 'Could not open this application.');
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    load();
  }, [load]);

  const application = useMemo(() => {
    if (!record?.application) return null;
    const row = record.application;
    const profile = row.student_profiles || {};
    const guardian = record.guardians?.[0];
    return {
      fullName: [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ') || 'Student',
      dateOfBirth: null,
      school: profile.school_name || row.institution_name || '—',
      educationLevel: profile.student_type || '—',
      grade: '—',
      admissionNumber: profile.admission_number || '—',
      parentName: guardian?.full_name || '—',
      parentPhone: guardian?.phone_number || '—',
      contactEmail: profile.email || '—',
      location: '—',
      subLocation: '—',
      cycle: row.cycle || '—',
      amountRequested: '—',
      previousAllocations: '—',
      applicationStatus: getStatusConfig(row.application_status).label,
      submittedDate: row.submitted_at || row.created_at,
      lastUpdated: row.submitted_at || row.created_at,
      reviewNotes: row.review_note || ''
    };
  }, [record]);

  const documents = useMemo(
    () =>
      (record?.documents || []).map((row) => ({
        id: row.id,
        type: row.document_type,
        verificationStatus: verificationLabel(row),
        uploadDate: row.uploaded_at,
        storagePath: row.storage_path,
        locked: verificationLabel(row) === 'Verified'
      })),
    [record]
  );

  async function openDocument(doc) {
    const url = await getDocumentSignedUrl(doc.storagePath);
    if (url) window.open(url, '_blank', 'noopener');
  }

  async function verifyDocument(documentId) {
    await setDocumentVerification(documentId, 'verified');
    await load();
  }

  async function submitDecision(action, payload) {
    const note = [payload.reason, payload.notes].filter(Boolean).join(' — ');
    await decideApplication(applicationId, action, note);
    await load();
  }

  if (loading) {
    return (
      <ChiefLayout chiefName={chiefName} pageTitle="Application review" showBottomNav={false}>
        <SectionCard title="Application review" titleLevel="h1">
          <p className="section-card__lead section-card__lead--left">Loading this application.</p>
        </SectionCard>
      </ChiefLayout>
    );
  }

  if (!application) {
    return (
      <ChiefLayout chiefName={chiefName} pageTitle="Application not found" showBottomNav={false}>
        <SectionCard title="Application not found" titleLevel="h1">
          <p className="section-card__lead section-card__lead--left">
            {loadError || 'This application is not in your review queue or may have been reassigned.'}
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
      chiefName={chiefName}
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
                      <button type="button" className="btn btn--table" onClick={() => openDocument(doc)}>
                        <Icon name="documents" size={16} />
                        View
                      </button>
                      {doc.locked ? (
                        <span className="mini-checklist__mark mini-checklist__mark--ok" aria-label="Verified">
                          <Icon name="approved" size={14} />
                        </span>
                      ) : (
                        <button type="button" className="btn btn--table" onClick={() => verifyDocument(doc.id)}>
                          <Icon name="check" size={16} />
                          Verify
                        </button>
                      )}
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
        onSubmit={(payload) => submitDecision('approve', payload)}
      />
      <ReviewActionModal
        open={actionModal === 'reject'}
        onClose={() => setActionModal(null)}
        action="reject"
        title="Reject application"
        onSubmit={(payload) => submitDecision('reject', payload)}
      />
      <ReviewActionModal
        open={actionModal === 'clarify'}
        onClose={() => setActionModal(null)}
        action="clarify"
        title="Request clarification"
        onSubmit={(payload) => submitDecision('clarify', payload)}
      />
    </ChiefLayout>
  );
}
