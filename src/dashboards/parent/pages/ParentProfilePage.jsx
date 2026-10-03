import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ParentLayout } from '../components/ParentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { useAuth } from '../../../context/AuthContext';
import { joinFullName } from '../../../lib/accountAllocation';
import { fetchParentAccount } from '../../../lib/accountQueries';
import { supabase } from '../../../lib/supabase';

export function ParentProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ phone_number: '', email: '', password: '' });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user?.id) return;
      try {
        const profile = await fetchParentAccount(user.id);
        if (active && profile) {
          setParent(profile);
          setForm({
            phone_number: profile.phone_number || '',
            email: profile.email || user.email || '',
            password: ''
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [user?.id, user?.email]);

  const parentName = parent
    ? joinFullName({ firstName: parent.first_name, middleName: parent.middle_name, lastName: parent.last_name })
    : 'Parent';
  const initials = parentName.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2) || 'PR';

  async function handleSave() {
    if (!user?.id || !parent?.id) return;
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      if (form.password && form.password.trim()) {
        const { error: pwdError } = await supabase.auth.updateUser({ password: form.password });
        if (pwdError) throw pwdError;
      }
      const safeUpdates = {
        phone_number: form.phone_number,
        email: form.email
      };
      const { error } = await supabase
        .from('parent_profiles')
        .update(safeUpdates)
        .eq('id', parent.id);
      if (error) {
        console.warn('DB parent profile update fallback:', error);
      }

      if (parent?.national_id && form.email) {
        try {
          const map = JSON.parse(localStorage.getItem('mcmca_id_map') || '{}');
          map[String(parent.national_id).replace(/\D/g, '')] = form.email.trim();
          localStorage.setItem('mcmca_id_map', JSON.stringify(map));
        } catch {}
      }

      setParent((prev) => ({ ...(prev || {}), ...safeUpdates }));
      setMessage({ type: 'success', text: 'Personal details updated successfully.' });
      setEditing(false);
      setForm((f) => ({ ...f, password: '' }));
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update personal details.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <ParentLayout pageTitle="Profile" parentName={parentName} layout="dashboard">
      {loading ? (
        <div className="skeleton-wrap">
          <div className="skeleton skeleton--hero" />
        </div>
      ) : (
        <>
          <section className="student-hero">
            <div className="student-hero__identity">
              <div className="student-hero__avatar" aria-hidden="true">{initials}</div>
              <div className="student-hero__copy">
                <h1 className="student-hero__title">{parentName}</h1>
                <p className="student-hero__meta">{parent?.email || user?.email || 'Parent account'}</p>
              </div>
            </div>
          </section>

          {message.text && (
            <div
              className={`notice ${message.type === 'error' ? 'card--error' : 'card--success'}`}
              style={{
                marginBottom: 16,
                background: message.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                borderColor: message.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'
              }}
            >
              <p style={{ margin: 0 }}>{message.text}</p>
            </div>
          )}

          <div className="stitch-profile-grid">
            <section className="stitch-profile-section">
              <div className="stitch-profile-section__head">
                <h2 className="stitch-profile-section__title">
                  <Icon name="profile" size={22} />
                  Personal information
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
                    <label className="stitch-profile-form__label">Full Name (Follows ID)</label>
                    <input
                      className="stitch-profile-form__input stitch-profile-form__input--readonly"
                      value={parentName}
                      readOnly
                    />
                    <p className="field__help" style={{ margin: '4px 0 0', fontSize: 12 }}>
                      Full name must strictly follow your National ID and cannot be changed.
                    </p>
                  </div>
                  <div className="stitch-profile-form__field">
                    <label className="stitch-profile-form__label">Phone Number</label>
                    <input
                      type="tel"
                      className="stitch-profile-form__input"
                      value={form.phone_number}
                      onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="stitch-profile-form__field">
                    <label className="stitch-profile-form__label">Email Address</label>
                    <input
                      type="email"
                      className="stitch-profile-form__input"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="Enter email"
                    />
                  </div>
                  <div className="stitch-profile-form__field">
                    <label className="stitch-profile-form__label">New Password</label>
                    <input
                      type="password"
                      className="stitch-profile-form__input"
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      placeholder="Leave blank to keep current password"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="stitch-profile-form__field stitch-profile-form__field--full student-form-actions">
                    <button
                      className="btn btn--primary"
                      onClick={handleSave}
                      disabled={saving}
                      style={{ borderRadius: 999, width: 'auto', padding: '10px 24px' }}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      className="btn btn--secondary"
                      onClick={() => {
                        setEditing(false);
                        setMessage({ type: '', text: '' });
                      }}
                      style={{ borderRadius: 999, width: 'auto', padding: '10px 24px' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <dl className="detail-grid">
                  <div className="detail-grid__row"><dt>Full name</dt><dd>{parentName}</dd></div>
                  <div className="detail-grid__row"><dt>National ID</dt><dd>{parent?.national_id || '—'}</dd></div>
                  <div className="detail-grid__row"><dt>Phone</dt><dd>{parent?.phone_number || '—'}</dd></div>
                  <div className="detail-grid__row"><dt>Email</dt><dd>{parent?.email || user?.email || '—'}</dd></div>
                  <div className="detail-grid__row"><dt>Gender</dt><dd>{parent?.gender || '—'}</dd></div>
                </dl>
              )}
            </section>

            <div className="stitch-profile-right">
              <section className="stitch-profile-section">
                <div className="stitch-profile-section__head">
                  <h2 className="stitch-profile-section__title">
                    <Icon name="shield" size={22} />
                    Account Security
                  </h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button
                    type="button"
                    className="stitch-profile-security__btn"
                    onClick={() => {
                      setEditing(true);
                      window.scrollTo({ top: 300, behavior: 'smooth' });
                    }}
                  >
                    <Icon name="shield" size={18} />
                    Change Password
                  </button>
                  <button
                    type="button"
                    className="stitch-profile-security__btn stitch-profile-security__btn--danger"
                    onClick={handleSignOut}
                  >
                    <Icon name="logout" size={18} />
                    Sign out
                  </button>
                </div>
                <p className="stitch-profile-security__hint">
                  Never share your password or ID credentials with anyone. Ward staff will not ask for your password.
                </p>
              </section>
            </div>
          </div>
        </>
      )}
    </ParentLayout>
  );
}
