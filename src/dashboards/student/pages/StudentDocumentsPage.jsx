import React, { useState, useRef, useCallback } from 'react';
import { StudentLayout } from '../components/StudentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { useAuth } from '../../../context/AuthContext';
import { useSecureData } from '../../../lib/useSecureData';
import { fetchStudentDocuments, uploadStudentDocument } from '../../../lib/queries';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024;

const DOC_TYPE_OPTIONS = [
  { value: 'fee-structure', label: 'Fee structure' },
  { value: 'student-id', label: 'Student ID or birth certificate' },
  { value: 'admission', label: 'Admission / enrollment proof' },
  { value: 'consent', label: 'Guardian consent form' }
];

function UploadModal({ open, onClose, onUpload }) {
  const [docType, setDocType] = useState(DOC_TYPE_OPTIONS[0].value);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  if (!open) return null;

  function validate(file) {
    if (!file) return 'Please select a file';
    if (!ALLOWED_TYPES.includes(file.type)) return 'Only images and PDFs are allowed';
    if (file.size > MAX_SIZE) return 'File must be under 10MB';
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validate(file);
    if (err) { setError(err); return; }
    setUploading(true);
    setError('');
    try {
      await onUpload(docType, file);
      onClose();
    } catch (ex) {
      setError(ex.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="modal-root" role="presentation">
      <button type="button" className="modal-root__backdrop" onClick={onClose} aria-label="Close" />
      <div className="modal-panel" role="dialog" aria-modal="true">
        <header className="modal-panel__header">
          <h2 className="modal-panel__title">Upload Document</h2>
          <button type="button" className="modal-panel__close" onClick={onClose}>×</button>
        </header>
        <div className="modal-panel__body">
          {error && (
            <div className="notice" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', marginBottom: 16 }}>
              <strong>Error</strong>
              <p>{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="docType">Document type</label>
              <select id="docType" value={docType} onChange={(e) => setDocType(e.target.value)} required>
                {DOC_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="docFile">File</label>
              <input
                id="docFile"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files[0])}
                ref={fileRef}
                required
              />
              <p className="field__help">Photos or PDFs only. Max 10MB.</p>
            </div>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={uploading}
              style={{ borderRadius: 999, width: 'auto', padding: '10px 24px' }}
            >
              <Icon name="upload" size={20} />
              {uploading ? 'Uploading...' : 'Upload document'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function StudentDocumentsPage() {
  const { userId } = useAuth();
  const [uploadOpen, setUploadOpen] = useState(false);
  const { data: documents, loading: docsLoading, refresh: refreshDocs } = useSecureData(fetchStudentDocuments);

  const loading = docsLoading;
  const docList = documents || [];

  const uploadedTypes = new Set(docList.map(d => d.document_type));
  const checkItems = DOC_TYPE_OPTIONS.map(opt => ({
    name: opt.label,
    uploaded: uploadedTypes.has(opt.value),
    verified: docList.some(d => d.document_type === opt.value && d.ai_verified === true)
  }));

  const verifiedCount = checkItems.filter(c => c.verified).length;
  const totalCount = Math.max(checkItems.length, 1);
  const progressPct = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;

  const handleUpload = useCallback(async (docType, file) => {
    if (!userId) throw new Error('Not authenticated');
    await uploadStudentDocument(userId, null, docType, file);
    refreshDocs();
  }, [userId, refreshDocs]);

  return (
    <StudentLayout pageTitle="Documents" layout="dashboard">
      <div className="stitch-docs-header">
        <div className="stitch-docs-header__top">
          <div>
            <h1 className="stitch-docs-header__title">Document Center</h1>
            <h1 className="stitch-docs-header__title-mobile">Documents</h1>
            <p className="stitch-docs-header__sub">
              Upload and track documents for your active application. All files are stored securely.
            </p>
          </div>
          <button
            className="stitch-docs-header__upload-btn"
            onClick={() => setUploadOpen(true)}
          >
            <Icon name="upload" size={18} />
            Upload New
          </button>
        </div>
      </div>

      {loading ? (
        <div className="skeleton-wrap">
          <div className="skeleton skeleton--hero" />
        </div>
      ) : (
        <>
          <section className="stitch-docs-verify">
            <div className="stitch-docs-verify__glow" />
            <div className="stitch-docs-verify__inner">
              <div>
                <h2 className="stitch-docs-verify__title">Verification Progress</h2>
                <p className="stitch-docs-verify__desc">
                  {verifiedCount} of {totalCount} documents verified
                </p>
                <div className="stitch-docs-verify__bar">
                  <div className="stitch-docs-verify__bar-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="stitch-docs-verify__labels">
                  <span>Started</span>
                  <span>Awaiting Review</span>
                  <span>Verified</span>
                </div>
              </div>
              <div className="stitch-docs-verify__level">
                <div className="stitch-docs-verify__level-icon">
                  <Icon name="approved" size={28} />
                </div>
                <p className="stitch-docs-verify__level-value">
                  Level {progressPct >= 100 ? '3' : progressPct >= 50 ? '2' : '1'}
                </p>
                <p className="stitch-docs-verify__level-label">Verification Level</p>
              </div>
            </div>
          </section>

          {checkItems.length > 0 && (
            <section className="stitch-docs-checklist">
              <div className="stitch-docs-checklist__title-wrap">
                <div className="stitch-docs-checklist__bar" />
                <h2 className="stitch-docs-checklist__title">Document Checklist</h2>
              </div>
              <div className="stitch-docs-checklist__grid">
                {checkItems.map((item, idx) => (
                  <div key={idx} className="stitch-docs-checklist__item">
                    <Icon name={item.uploaded ? 'approved' : 'info'} size={20} />
                    <div>
                      <p className="stitch-docs-checklist__item-name">{item.name}</p>
                      <p className={`stitch-docs-checklist__item-status ${item.uploaded ? 'stitch-docs-checklist__item-status--verified' : 'stitch-docs-checklist__item-status--action'}`}>
                        {item.uploaded ? 'Received' : 'Action Required'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="stitch-docs-history">
            <div className="stitch-docs-history__head">
              <div className="stitch-docs-history__title-wrap">
                <div className="stitch-docs-history__bar" />
                <h2 className="stitch-docs-history__title">Upload History</h2>
              </div>
            </div>
            {docList.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {docList.map((doc, idx) => (
                  <div key={doc.id || idx} style={{
                    background: 'white', padding: 20, borderRadius: 12,
                    border: '1px solid rgba(195, 198, 214, 0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: doc.mime_type === 'application/pdf' ? '#FFF9EB' : '#EFF6FF',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: doc.mime_type === 'application/pdf' ? '#755b00' : '#003594'
                      }}>
                        <Icon name="documents" size={20} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, margin: 0, fontSize: 14 }}>{doc.original_filename || doc.document_type}</p>
                        <p style={{ fontSize: 12, color: '#434654', margin: '4px 0 0' }}>
                          {doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(1)} MB` : ''}
                          {doc.uploaded_at && ` · ${new Date(doc.uploaded_at).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {doc.ai_verified ? <span className="doc-checklist__status doc-checklist__status--ok">Verified</span> : <span className="stitch-docs-checklist__item-status stitch-docs-checklist__item-status--pending">Pending</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="notice" style={{ background: 'white' }}>
                <strong>No documents uploaded yet</strong>
                <p>Upload your first document using the button above.</p>
              </div>
            )}
          </section>
        </>
      )}

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onUpload={handleUpload} />
    </StudentLayout>
  );
}