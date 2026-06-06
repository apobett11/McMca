import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StudentLayout } from '../components/StudentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { useAuth } from '../../../context/AuthContext';
import { useSecureData } from '../../../lib/useSecureData';
import { fetchStudentProfile, fetchLinkedParent, updateStudentProfile } from '../../../lib/queries';
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

export function StudentProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: profile, loading, refresh } = useSecureData(fetchStudentProfile);
  const { data: parentLink } = useSecureData(fetchLinkedParent);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });

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
      await updateStudentProfile(user.id, form);
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
  const parentData = parentLink?.parent_profiles || null;

  return (
    <StudentLayout pageTitle="Profile" layout="dashboard">
      <div className="stitch-profile-header">
        <div className="stitch-profile-header__card">
          <div className="stitch-profile-header__glow" />
          <div className="stitch-profile-header__avatar-wrap">
            <div className="stitch-profile-header__avatar" style={{
              background: 'linear-gradient(135deg, #003594, #712ae2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 48
            }}>
              {initials}
            </div>
            <button
              className="stitch-profile-header__edit-btn"
              onClick={() => setEditing(!editing)}
              aria-label="Edit profile"
            >
              <Icon name="profile" size={18} />
            </button>
          </div>
          <div className="stitch-profile-header__info">
            <h1 className="stitch-profile-header__name">{studentName}</h1>
            <p className="stitch-profile-header__role">
              <Icon name="profile" size={18} />
              Student · {institution}
            </p>
            <div className="stitch-profile-header__badges">
              <span className="stitch-profile-header__badge">
                <Icon name="approved" size={14} />
                ID: {studentId}
              </span>
              <span className="stitch-profile-header__badge">
                <Icon name="calendar" size={14} />
                Bursary Cycle
              </span>
            </div>
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
                  <label className="stitch-profile-form__label">Email</label>
                  <input className="stitch-profile-form__input stitch-profile-form__input--readonly" value={email} readOnly />
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
                <div className="detail-grid__row detail-grid__row--verified">
                  <dt>Full name</dt>
                  <dd>{studentName}</dd>
                </div>
                <div className="detail-grid__row">
                  <dt>Institution</dt>
                  <dd>{institution}</dd>
                </div>
                <div className="detail-grid__row">
                  <dt>Student ID</dt>
                  <dd>•••• {studentId.slice(-4)}</dd>
                </div>
                <div className="detail-grid__row detail-grid__row--verified">
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

          {parentData && (
            <section className="stitch-profile-section">
              <div className="stitch-profile-section__head">
                <h2 className="stitch-profile-section__title">
                  <Icon name="profile" size={22} />
                  Linked Parent / Guardian
                </h2>
              </div>
              <dl className="detail-grid">
                <div className="detail-grid__row">
                  <dt>Parent name</dt>
                  <dd>{parentData.first_name || parentData.full_name || '—'}</dd>
                </div>
                <div className="detail-grid__row">
                  <dt>Phone</dt>
                  <dd>{parentData.phone_number || parentData.phone || '—'}</dd>
                </div>
                <div className="detail-grid__row">
                  <dt>Email</dt>
                  <dd>{parentData.email || '—'}</dd>
                </div>
              </dl>
            </section>
          )}
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
              Keep your profile up to date to ensure smooth application processing.
            </p>
            <button className="stitch-profile-promo__btn" onClick={() => setEditing(true)}>
              Update Profile
            </button>
          </section>
        </div>
      </div>
    </StudentLayout>
  );
}