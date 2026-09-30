import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentLayout } from '../components/StudentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { useStudentCase } from '../context/StudentCaseContext.jsx';
import { UploadSheet } from '../components/UploadSheet.jsx';
import { getDocumentSignedUrl } from '../../../lib/queries.js';

function mark(item) {
  if (item.locked) return { icon: 'approved', text: 'Verified' };
  if (item.satisfied) return { icon: 'check', text: 'Received' };
  if (item.state === 'rejected') return { icon: 'rejected', text: 'Replace' };
  return { icon: 'upload', text: 'Needed' };
}

export function StudentDocumentsPage() {
  const navigate = useNavigate();
  const { data, loading, error, refresh } = useStudentCase();
  const [uploadTarget, setUploadTarget] = useState(null);
  const [openingId, setOpeningId] = useState(null);
  const checklist = data?.evaluation?.checklist || [];
  const profileItems = checklist.filter((item) => item.scope === 'profile');
  const applicationItems = checklist.filter((item) => item.requiredToApply);
  const received = checklist.filter((item) => item.satisfied).length;
  const verified = checklist.filter((item) => item.locked).length;

  async function openFile(item) {
    if (!item.document?.storage_path) return;
    setOpeningId(item.key);
    try {
      const url = await getDocumentSignedUrl(item.document.storage_path);
      if (url) window.open(url, '_blank', 'noopener');
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <StudentLayout pageTitle="Documents" layout="dashboard">
      <div className="stitch-docs-header">
        <div className="stitch-docs-header__top">
          <div>
            <h1 className="stitch-docs-header__title">Document Center</h1>
            <h1 className="stitch-docs-header__title-mobile">Documents</h1>
            <p className="stitch-docs-header__sub">
              ID and parent files stay on the profile. An application opens only when every needed file is here.
              Verified files are not uploaded again.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="skeleton-wrap">
          <div className="skeleton skeleton--hero" />
        </div>
      ) : error ? (
        <div className="notice" role="alert">
          <strong>Documents unavailable</strong>
          <p>{error.message}</p>
        </div>
      ) : (
        <>
          <section className="stitch-docs-verify">
            <div className="stitch-docs-verify__glow" />
            <div className="stitch-docs-verify__inner">
              <div>
                <h2 className="stitch-docs-verify__title">Checklist</h2>
                <p className="stitch-docs-verify__desc">
                  {received} of {checklist.length} received · {verified} verified
                </p>
                <div className="stitch-docs-verify__bar">
                  <div
                    className="stitch-docs-verify__bar-fill"
                    style={{ width: `${checklist.length ? Math.round((received / checklist.length) * 100) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          <DocumentGroup
            title="From the profile"
            items={profileItems}
            openingId={openingId}
            onUpload={(item) => {
              if (item.key === 'guardian-id' && !data?.guardians?.length) {
                navigate('/student/profile');
                return;
              }
              setUploadTarget(item);
            }}
            onOpen={openFile}
          />
          <DocumentGroup
            title="Needed to apply"
            items={applicationItems}
            openingId={openingId}
            onUpload={setUploadTarget}
            onOpen={openFile}
          />
        </>
      )}

      <UploadSheet
        open={Boolean(uploadTarget)}
        requirement={uploadTarget}
        guardianId={uploadTarget?.key === 'guardian-id' ? data?.guardians?.[0]?.id : null}
        onClose={() => setUploadTarget(null)}
        onUploaded={refresh}
      />
    </StudentLayout>
  );
}

function DocumentGroup({ title, items, onUpload, onOpen, openingId }) {
  return (
    <section className="stitch-docs-checklist">
      <div className="stitch-docs-checklist__title-wrap">
        <div className="stitch-docs-checklist__bar" />
        <h2 className="stitch-docs-checklist__title">{title}</h2>
      </div>
      <ul className="mini-checklist">
        {items.map((item) => {
          const status = mark(item);
          return (
            <li key={item.key} className="mini-checklist__item">
              <span className="mini-checklist__label">
                <Icon name={status.icon} size={16} /> {item.label}
                <span className="field__help">{item.locked ? 'Verified. Kept on file.' : item.hint}</span>
              </span>
              <span className="btn-row">
                {item.document?.storage_path ? (
                  <button type="button" className="btn btn--compact btn--secondary" onClick={() => onOpen(item)} disabled={openingId === item.key}>
                    <Icon name="documents" size={16} />
                    {openingId === item.key ? 'Opening…' : 'Open'}
                  </button>
                ) : null}
                {item.locked ? (
                  <span className="mini-checklist__mark mini-checklist__mark--ok" aria-label="Verified">
                    <Icon name="approved" size={14} />
                  </span>
                ) : (
                  <button type="button" className="btn btn--compact btn--primary" onClick={() => onUpload(item)}>
                    <Icon name="upload" size={16} />
                    {status.text}
                  </button>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
