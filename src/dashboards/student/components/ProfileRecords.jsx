import React, { useState } from 'react';
import { Icon } from '../../../components/Icon.jsx';
import { isLockedDocument, isPhone } from '../../../domain/requirements.js';
import { saveGuardian } from '../../../lib/queries.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { UploadSheet } from './UploadSheet.jsx';

const RELATIONSHIPS = ['parent', 'guardian'];

export function ProfileRecords({ evaluation, guardians = [], documents = [], onRefresh }) {
  const { userId } = useAuth();
  const [uploadTarget, setUploadTarget] = useState(null);
  const [guardianId, setGuardianId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ fullName: '', phoneNumber: '', relationship: 'parent' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const studentIdItem = evaluation?.checklist?.find((item) => item.key === 'student-id');
  const parentIdItem = evaluation?.checklist?.find((item) => item.key === 'guardian-id');
  const active = evaluation?.profile?.active;

  if (!studentIdItem || !parentIdItem) {
    return null;
  }

  function startEdit(guardian) {
    setEditingId(guardian?.id || null);
    setForm({
      fullName: guardian?.full_name || '',
      phoneNumber: guardian?.phone_number || '',
      relationship: guardian?.relationship || 'parent'
    });
    setError('');
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!form.fullName.trim() || !isPhone(form.phoneNumber)) {
      setError('Enter the parent name and a reachable phone number.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await saveGuardian(userId, {
        id: editingId,
        fullName: form.fullName,
        phoneNumber: form.phoneNumber,
        relationship: form.relationship
      });
      setEditingId(null);
      setForm({ fullName: '', phoneNumber: '', relationship: 'parent' });
      await onRefresh?.();
    } catch (err) {
      setError(err.message || 'Could not save the parent.');
    } finally {
      setSaving(false);
    }
  }

  function openParentId(id) {
    setGuardianId(id);
    setUploadTarget(parentIdItem);
  }

  return (
    <section className="stitch-profile-section" id="profile-records">
      <div className="stitch-profile-section__head">
        <h2 className="stitch-profile-section__title">
          <Icon name={active ? 'approved' : 'profile'} size={22} />
          Profile records
        </h2>
        <span className={`stitch-status-badge ${active ? 'stitch-status-badge--admitted' : 'stitch-status-badge--withdrawn'}`}>
          {active ? 'Active' : 'Inactive'}
        </span>
      </div>
      <p className="field__help">
        The profile stays inactive until this student ID and one parent, with their ID, are on file.
        Verified files are kept and are not uploaded again.
      </p>

      {error ? (
        <div className="notice" role="alert">
          <strong>Check the parent details</strong>
          <p>{error}</p>
        </div>
      ) : null}

      <ul className="mini-checklist" aria-label="Profile requirements">
        <li className="mini-checklist__item">
          <span className="mini-checklist__label">Student ID</span>
          {studentIdItem?.locked ? (
            <span className="mini-checklist__mark mini-checklist__mark--ok" aria-label="Verified">
              <Icon name="approved" size={14} />
            </span>
          ) : studentIdItem?.satisfied ? (
            <button type="button" className="btn btn--compact btn--secondary" onClick={() => setUploadTarget(studentIdItem)}>
              <Icon name="upload" size={16} />
              Replace scan
            </button>
          ) : (
            <button type="button" className="btn btn--compact btn--primary" onClick={() => setUploadTarget(studentIdItem)}>
              <Icon name="upload" size={16} />
              Scan ID
            </button>
          )}
        </li>
      </ul>

      {guardians.length ? (
        <ul className="feed-list" aria-label="Parents">
          {guardians.map((guardian) => (
            <li key={guardian.id} className="feed-item">
              <div className="feed-item__icon" aria-hidden="true">
                <Icon name="profile" size={18} />
              </div>
              <div>
                <p className="feed-item__title">{guardian.full_name}</p>
                <p className="feed-item__body">
                  {guardian.relationship} · {guardian.phone_number}
                </p>
                <div className="btn-row">
                  <button type="button" className="btn btn--compact btn--secondary" onClick={() => startEdit(guardian)}>
                    Update
                  </button>
                  {isLockedDocument(
                    documents
                      .filter((row) => row.document_type === 'guardian-id' && row.guardian_id === guardian.id)
                      .sort((a, b) => new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0))[0]
                  ) ? (
                    <span className="mini-checklist__mark mini-checklist__mark--ok" aria-label="Parent ID verified">
                      <Icon name="approved" size={14} />
                    </span>
                  ) : (
                    <button type="button" className="btn btn--compact btn--secondary" onClick={() => openParentId(guardian.id)}>
                      <Icon name="upload" size={16} />
                      Parent ID
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="field__help">No parent is on this profile yet.</p>
      )}

      <form className="stitch-profile-form" onSubmit={handleSave}>
        <div className="stitch-profile-form__field">
          <label className="stitch-profile-form__label" htmlFor="parentName">
            Parent name
          </label>
          <input
            id="parentName"
            className="stitch-profile-form__input"
            value={form.fullName}
            onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
            required
          />
        </div>
        <div className="stitch-profile-form__field">
          <label className="stitch-profile-form__label" htmlFor="parentPhone">
            Parent phone
          </label>
          <input
            id="parentPhone"
            className="stitch-profile-form__input"
            value={form.phoneNumber}
            onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))}
            inputMode="tel"
            required
          />
        </div>
        <div className="stitch-profile-form__field">
          <label className="stitch-profile-form__label" htmlFor="parentRelationship">
            Relationship
          </label>
          <select
            id="parentRelationship"
            className="stitch-profile-form__input"
            value={form.relationship}
            onChange={(event) => setForm((current) => ({ ...current, relationship: event.target.value }))}
          >
            {RELATIONSHIPS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div className="stitch-profile-form__field stitch-profile-form__field--full">
          <button type="submit" className="btn btn--primary" disabled={saving} style={{ borderRadius: 999, width: 'auto', padding: '10px 24px' }}>
            <Icon name="plus" size={18} />
            {saving ? 'Saving…' : editingId ? 'Update parent' : 'Save parent'}
          </button>
        </div>
      </form>

      <UploadSheet
        open={Boolean(uploadTarget)}
        requirement={uploadTarget}
        guardianId={uploadTarget?.key === 'guardian-id' ? guardianId : null}
        onClose={() => setUploadTarget(null)}
        onUploaded={onRefresh}
      />
    </section>
  );
}
