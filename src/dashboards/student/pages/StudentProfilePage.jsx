import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentLayout } from '../components/StudentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { useAuth } from '../../../context/AuthContext';
import { useSecureData } from '../../../lib/useSecureData';
import { fetchStudentProfile } from '../../../lib/queries';
import { supabase } from '../../../lib/supabase';

function ProfileSkeleton() {
  return (
    <div className="skeleton-wrap" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="skeleton skeleton--hero" style={{ height: 200 }} />
      <div className="skeleton skeleton--line" />
      <div className="skeleton skeleton--line" />
      <div className="skeleton skeleton--line-short" />
    </div>
  );
}

function VerifyBadge({ verified, onClick }) {
  return verified ? (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
      textTransform: 'uppercase', color: '#15803d'
    }}>
      <Icon name="approved" size={14} /> Verified
    </span>
  ) : (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
      textTransform: 'uppercase', color: '#EF4444',
      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
      fontFamily: 'inherit'
    }}>
      Verify
    </button>
  );
}

function OtpModal({ title, field, currentValue, onClose, onVerified }) {
  const [step, setStep] = useState('send');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSend() {
    setLoading(true);
    setError('');
    try {
      setStep('verify');
    } catch (err) {
      setError(err.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!otp.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { error: updateError } = await supabase
        .from('student_profiles')
        .update({ [field]: true })
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user.id);
      if (updateError) throw updateError;
      onVerified();
      onClose();
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-root" role="presentation">
      <button type="button" className="modal-root__backdrop" onClick={onClose} aria-label="Close" />
      <div className="modal-panel" role="dialog" aria-modal="true">
        <header className="modal-panel__header">
          <h2 className="modal-panel__title">{title}</h2>
          <button type="button" className="modal-panel__close" onClick={onClose}>×</button>
        </header>
        <div className="modal-panel__body">
          {error && (
            <div className="notice" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', marginBottom: 16 }}>
              <strong>Error</strong><p>{error}</p>
            </div>
          )}
          {step === 'send' ? (
            <>
              <p style={{ fontSize: 14, color: 'var(--text-2, #94A3B8)', marginBottom: 20 }}>
                A verification code will be sent to <strong>{currentValue}</strong>.
              </p>
              <button className="btn btn--primary" onClick={handleSend} disabled={loading} style={{ borderRadius: 999, width: '100%', padding: '12px 24px' }}>
                {loading ? 'Sending...' : 'Send Code'}
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize: 14, color: 'var(--text-2, #94A3B8)', marginBottom: 16 }}>
                Enter the verification code sent to <strong>{currentValue}</strong>.
              </p>
              <div className="field" style={{ marginBottom: 16 }}>
                <input
                  type="text" value={otp} placeholder="Enter code"
                  onChange={(e) => setOtp(e.target.value)}
                  style={{ textAlign: 'center', fontSize: 18, letterSpacing: '0.2em' }}
                />
              </div>
              <button className="btn btn--primary" onClick={handleVerify} disabled={loading || !otp.trim()} style={{ borderRadius: 999, width: '100%', padding: '12px 24px' }}>
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function IdUploadModal({ onClose, onVerified }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  async function handleUpload(file) {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data: profile } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();
      const filePath = `id-verifications/${profile.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('id-verifications')
        .upload(filePath, file, { upsert: false });
      if (uploadError) throw uploadError;
      const { error: updateError } = await supabase
        .from('student_profiles')
        .update({ national_id_verified: true })
        .eq('auth_user_id', user.id);
      if (updateError) throw updateError;
      onVerified();
      onClose();
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="modal-root" role="presentation">
      <button type="button" className="modal-root__backdrop" onClick={onClose} aria-label="Close" />
      <div className="modal-panel" role="dialog" aria-modal="true">
        <header className="modal-panel__header">
          <h2 className="modal-panel__title">Verify National ID</h2>
          <button type="button" className="modal-panel__close" onClick={onClose}>×</button>
        </header>
        <div className="modal-panel__body">
          {error && (
            <div className="notice" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', marginBottom: 16 }}>
              <strong>Error</strong><p>{error}</p>
            </div>
          )}
          <p style={{ fontSize: 14, color: 'var(--text-2, #94A3B8)', marginBottom: 20 }}>
            Upload a clear image of your National ID card (front and back) for verification.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label className="btn btn--primary" style={{ borderRadius: 12, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', textAlign: 'center' }}>
              <Icon name="upload" size={20} />
              {uploading ? 'Uploading...' : 'Upload ID Image'}
              <input
                ref={fileRef}
                type="file" accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleUpload(e.target.files[0])}
                disabled={uploading}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StudentProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: profile, loading, refresh } = useSecureData(fetchStudentProfile);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [verifyModal, setVerifyModal] = useState(null);

  useEffect(() => {
    if (profile) {
      setForm({
        phone_number: profile.phone_number || '',
        email: profile.email || ''
      });
    }
  }, [profile]);

  async function handleSave() {
    if (!user?.id) return;
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const allowedFields = ['phone_number', 'email'];
      const safeUpdates = {};
      for (const key of Object.keys(form)) {
        if (allowedFields.includes(key)) safeUpdates[key] = form[key];
      }
      if (Object.keys(safeUpdates).length === 0) throw new Error('No editable fields');
      const { error } = await supabase
        .from('student_profiles')
        .update(safeUpdates)
        .eq('auth_user_id', user.id);
      if (error) throw error;
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
      setEditing(false);
      refresh();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  if (loading) {
    return (
      <StudentLayout pageTitle="Profile" layout="dashboard">
        <ProfileSkeleton />
      </StudentLayout>
    );
  }

  const studentName = [profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean).join(' ') || user?.user_metadata?.full_name || 'Student';
  const initials = studentName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const institution = profile?.school_name || '—';
  const studentId = profile?.admission_number || '—';
  const email = profile?.email || user?.email || '—';
  const phone = profile?.phone_number || '—';
  const nationalId = profile?.national_id || '—';
  const studentType = profile?.student_type || '—';
  const phoneVerified = !!profile?.phone_verified;
  const emailVerified = !!profile?.email_verified;
  const nationalIdVerified = !!profile?.national_id_verified;

  return (
    <StudentLayout pageTitle="Profile" layout="dashboard">
      <div style={{
        background: 'linear-gradient(135deg, rgba(212,175,55,0.10) 0%, rgba(230,211,163,0.18) 50%, rgba(212,175,55,0.06) 100%)',
        borderRadius: '1.5rem',
        padding: '32px 32px 24px',
        marginBottom: 24,
        border: '1px solid rgba(212,175,55,0.15)',
        boxShadow: '0px 8px 24px rgba(212,175,55,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #DDBB6A, #E6D3A3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#5C4A1E', fontWeight: 700, fontSize: 28, flexShrink: 0
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 700, color: 'var(--text, #111827)' }}>{studentName}</h1>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-2, #434654)' }}>
              {studentType !== '—' && `${studentType} · `}{institution}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: 'rgba(212,175,55,0.12)', color: '#7A6530'
              }}>
                <Icon name="calendar" size={12} />
                ID: {studentId}
              </span>
              {nationalId !== '—' && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  background: 'rgba(212,175,55,0.12)', color: '#7A6530'
                }}>
                  <Icon name="profile" size={12} />
                  National ID: {nationalId}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="stitch-profile-verify__grid" style={{ marginTop: 20 }}>
          <div className="stitch-profile-verify__item">
            <div className="stitch-profile-verify__item-left">
              <div className={`stitch-profile-verify__item-icon ${nationalIdVerified ? 'stitch-profile-verify__item-icon--green' : 'stitch-profile-verify__item-icon--blue'}`}>
                <Icon name={nationalIdVerified ? 'approved' : 'profile'} size={20} />
              </div>
              <div>
                <p className="stitch-profile-verify__item-name">National ID</p>
                <p className={`stitch-profile-verify__item-status ${nationalIdVerified ? 'stitch-profile-verify__item-status--verified' : 'stitch-profile-verify__item-status--review'}`}>
                  {nationalIdVerified ? 'Verified' : 'Not verified'}
                </p>
              </div>
            </div>
            <VerifyBadge verified={nationalIdVerified} onClick={() => setVerifyModal('national_id')} />
          </div>

          <div className="stitch-profile-verify__item">
            <div className="stitch-profile-verify__item-left">
              <div className={`stitch-profile-verify__item-icon ${phoneVerified ? 'stitch-profile-verify__item-icon--green' : 'stitch-profile-verify__item-icon--blue'}`}>
                <Icon name={phoneVerified ? 'approved' : 'support'} size={20} />
              </div>
              <div>
                <p className="stitch-profile-verify__item-name">Phone Number</p>
                <p className={`stitch-profile-verify__item-status ${phoneVerified ? 'stitch-profile-verify__item-status--verified' : 'stitch-profile-verify__item-status--review'}`}>
                  {phone ? phone : 'Not set'}
                </p>
              </div>
            </div>
            <VerifyBadge verified={phoneVerified} onClick={() => setVerifyModal('phone')} />
          </div>

          <div className="stitch-profile-verify__item" style={{ gridColumn: '1 / -1' }}>
            <div className="stitch-profile-verify__item-left">
              <div className={`stitch-profile-verify__item-icon ${emailVerified ? 'stitch-profile-verify__item-icon--green' : 'stitch-profile-verify__item-icon--blue'}`}>
                <Icon name={emailVerified ? 'approved' : 'profile'} size={20} />
              </div>
              <div>
                <p className="stitch-profile-verify__item-name">Email</p>
                <p className={`stitch-profile-verify__item-status ${emailVerified ? 'stitch-profile-verify__item-status--verified' : 'stitch-profile-verify__item-status--review'}`}>
                  {email}
                </p>
              </div>
            </div>
            <VerifyBadge verified={emailVerified} onClick={() => setVerifyModal('email')} />
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`notice ${message.type === 'error' ? 'card--error' : 'card--success'}`} style={{ marginBottom: 16, background: message.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', borderColor: message.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)' }}>
          <p style={{ margin: 0 }}>{message.text}</p>
        </div>
      )}

      <div className="stitch-profile-grid">
        <div className="stitch-profile-left">
          <section className="stitch-profile-section">
            <div className="stitch-profile-section__head">
              <h2 className="stitch-profile-section__title">
                <Icon name="profile" size={22} />
                Personal Information
              </h2>
              {!editing && (
                <button className="stitch-profile-section__update-btn" onClick={() => setEditing(true)}>
                  Edit
                </button>
              )}
            </div>
            {editing ? (
              <div className="stitch-profile-form">
                <div className="stitch-profile-form__field">
                  <label className="stitch-profile-form__label">Full Name</label>
                  <input className="stitch-profile-form__input stitch-profile-form__input--readonly" value={studentName} readOnly />
                </div>
                <div className="stitch-profile-form__field">
                  <label className="stitch-profile-form__label">Phone</label>
                  <input
                    className="stitch-profile-form__input"
                    value={form.phone_number}
                    onChange={(e) => setForm(f => ({ ...f, phone_number: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="stitch-profile-form__field">
                  <label className="stitch-profile-form__label">Email</label>
                  <input
                    className="stitch-profile-form__input"
                    value={form.email}
                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="Enter email"
                  />
                </div>
                <div className="stitch-profile-form__field stitch-profile-form__field--full" style={{ display: 'flex', gap: 12, flexDirection: 'row' }}>
                  <button className="btn btn--primary" onClick={handleSave} disabled={saving} style={{ borderRadius: 999, width: 'auto', padding: '10px 24px' }}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button className="btn btn--secondary" onClick={() => { setEditing(false); setMessage({ type: '', text: '' }); }} style={{ borderRadius: 999, width: 'auto', padding: '10px 24px' }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <dl className="detail-grid">
                <div className="detail-grid__row">
                  <dt>Full name</dt>
                  <dd>{studentName}</dd>
                </div>
                <div className="detail-grid__row">
                  <dt>Student Type</dt>
                  <dd>{studentType}</dd>
                </div>
                <div className="detail-grid__row">
                  <dt>Institution</dt>
                  <dd>{institution}</dd>
                </div>
                <div className="detail-grid__row">
                  <dt>Admission No.</dt>
                  <dd>{studentId}</dd>
                </div>
                <div className="detail-grid__row">
                  <dt>National ID</dt>
                  <dd>{nationalId}</dd>
                </div>
                <div className="detail-grid__row">
                  <dt>Phone</dt>
                  <dd>{phone}</dd>
                </div>
                <div className="detail-grid__row">
                  <dt>Email</dt>
                  <dd>{email}</dd>
                </div>
              </dl>
            )}
          </section>
        </div>

        <div className="stitch-profile-right">
          <section className="stitch-profile-section">
            <div className="stitch-profile-section__head">
              <h2 className="stitch-profile-section__title">
                <Icon name="shield" size={22} />
                Account Security
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button className="stitch-profile-security__btn" onClick={() => supabase.auth.updateUser({})}>
                <Icon name="shield" size={18} />
                Change Password
              </button>
              <button className="stitch-profile-security__btn" onClick={handleSignOut} style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#ba1a1a' }}>
                <Icon name="logout" size={18} />
                Sign Out
              </button>
            </div>
            <p className="stitch-profile-security__hint">
              Never share your password or OTP with anyone. Ward staff will not ask for it.
            </p>
          </section>

          <section className="stitch-profile-promo">
            <div className="stitch-profile-promo__glow" />
            <h3 className="stitch-profile-promo__title">Stay Verified</h3>
            <p className="stitch-profile-promo__desc">
              Complete your verification to ensure smooth application processing.
            </p>
            <button className="stitch-profile-promo__btn" onClick={() => setEditing(true)}>
              Update Profile
            </button>
          </section>
        </div>
      </div>

      {verifyModal === 'phone' && (
        <OtpModal title="Verify Phone" field="phone_verified" currentValue={phone} onClose={() => setVerifyModal(null)} onVerified={refresh} />
      )}
      {verifyModal === 'email' && (
        <OtpModal title="Verify Email" field="email_verified" currentValue={email} onClose={() => setVerifyModal(null)} onVerified={refresh} />
      )}
      {verifyModal === 'national_id' && (
        <IdUploadModal onClose={() => setVerifyModal(null)} onVerified={refresh} />
      )}
    </StudentLayout>
  );
}
