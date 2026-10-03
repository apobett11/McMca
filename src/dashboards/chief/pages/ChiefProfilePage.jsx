import React, { useState, useEffect } from 'react';
import { ChiefLayout } from '../components/ChiefLayout.jsx';
import { SectionCard } from '../../../components/SectionCard.jsx';
import { Icon } from '../../../components/Icon.jsx';
import {
  getChiefProfile,
  saveChiefProfile,
  isChiefProfileComplete
} from '../utils/chiefData.js';
import { CHIEF } from '../../../data/chiefMock.js';

export function ChiefProfilePage() {
  const [profile, setProfile] = useState(() => getChiefProfile() || CHIEF);
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(profile?.phone || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    function onUpdated(e) {
      setProfile(e.detail);
      setPhone(e.detail?.phone || '');
      setEmail(e.detail?.email || '');
    }
    window.addEventListener('mcmca_chief_profile_updated', onUpdated);
    return () => window.removeEventListener('mcmca_chief_profile_updated', onUpdated);
  }, []);

  function handleSave(e) {
    e.preventDefault();
    if (!phone.trim() || !email.trim()) {
      alert('Please provide a valid phone number and email address.');
      return;
    }
    // Only phone and email can be modified; all other administrative credentials remain strictly immutable
    const updated = saveChiefProfile({
      ...profile,
      phone: phone.trim(),
      email: email.trim()
    });
    setProfile(updated);
    setIsEditing(false);
    setMsg('Contact information updated successfully.');
    setTimeout(() => setMsg(''), 4000);
  }

  function handleCancelEdit() {
    setPhone(profile?.phone || '');
    setEmail(profile?.email || '');
    setIsEditing(false);
  }

  const complete = isChiefProfileComplete(profile);

  return (
    <ChiefLayout chiefName={profile?.fullName || 'Chief'} pageTitle="Profile" layout="dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <SectionCard title="Chief Administrative Profile" titleLevel="h1">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p className="section-card__lead section-card__lead--left" style={{ margin: 0 }}>
              Your verified account credentials, national ID, assigned ward, and administrative jurisdiction.
            </p>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => {
                if (isEditing) handleCancelEdit();
                else setIsEditing(true);
              }}
              style={{ fontSize: '0.85rem', borderRadius: 999 }}
            >
              <Icon name="review" size={16} />
              {isEditing ? 'Cancel Edit' : 'Edit Contact Details'}
            </button>
          </div>
        </SectionCard>

        {msg && (
          <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', fontSize: '0.88rem' }}>
            ✓ {msg}
          </div>
        )}

        {isEditing ? (
          <SectionCard title="Edit Contact Details">
            <div style={{
              margin: '0 0 18px',
              padding: '12px 16px',
              borderRadius: 8,
              background: 'rgba(217, 119, 6, 0.08)',
              border: '1px solid rgba(217, 119, 6, 0.25)',
              fontSize: '0.85rem',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <Icon name="shield" size={18} />
              <span>
                Administrative jurisdiction, National ID, and legal names are locked by the system. You can update your official phone number and email address below.
              </span>
            </div>

            <form onSubmit={handleSave} className="stitch-profile-form">
              {/* EDITABLE FIELD 1: Phone */}
              <div className="stitch-profile-form__field">
                <label className="stitch-profile-form__label">Official Phone Number *</label>
                <input
                  type="tel"
                  className="stitch-profile-form__input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0722 000 000"
                  required
                />
              </div>

              {/* EDITABLE FIELD 2: Email */}
              <div className="stitch-profile-form__field">
                <label className="stitch-profile-form__label">Official Email Address *</label>
                <input
                  type="email"
                  className="stitch-profile-form__input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. chief.waweru@mcmca.gov.ke"
                  required
                />
              </div>

              {/* LOCKED FIELD: Full Name */}
              <div className="stitch-profile-form__field">
                <label className="stitch-profile-form__label">Full Legal Name (Locked)</label>
                <input
                  type="text"
                  className="stitch-profile-form__input stitch-profile-form__input--readonly"
                  value={profile?.fullName || ''}
                  readOnly
                  disabled
                />
              </div>

              {/* LOCKED FIELD: National ID */}
              <div className="stitch-profile-form__field">
                <label className="stitch-profile-form__label">National ID Number (Locked)</label>
                <input
                  type="text"
                  className="stitch-profile-form__input stitch-profile-form__input--readonly"
                  value={profile?.nationalId || ''}
                  readOnly
                  disabled
                />
              </div>

              {/* LOCKED FIELD: Assigned Ward */}
              <div className="stitch-profile-form__field">
                <label className="stitch-profile-form__label">Assigned Ward (Locked)</label>
                <input
                  type="text"
                  className="stitch-profile-form__input stitch-profile-form__input--readonly"
                  value={profile?.ward || ''}
                  readOnly
                  disabled
                />
              </div>

              {/* LOCKED FIELD: Location */}
              <div className="stitch-profile-form__field">
                <label className="stitch-profile-form__label">Location (Locked)</label>
                <input
                  type="text"
                  className="stitch-profile-form__input stitch-profile-form__input--readonly"
                  value={profile?.location || ''}
                  readOnly
                  disabled
                />
              </div>

              {/* LOCKED FIELD: Sub-Location */}
              <div className="stitch-profile-form__field">
                <label className="stitch-profile-form__label">Sub-Location (Locked)</label>
                <input
                  type="text"
                  className="stitch-profile-form__input stitch-profile-form__input--readonly"
                  value={profile?.subLocation || ''}
                  readOnly
                  disabled
                />
              </div>

              {/* LOCKED FIELD: Office Center / Village */}
              <div className="stitch-profile-form__field">
                <label className="stitch-profile-form__label">Office Address / Village (Locked)</label>
                <input
                  type="text"
                  className="stitch-profile-form__input stitch-profile-form__input--readonly"
                  value={profile?.officeLocation || ''}
                  readOnly
                  disabled
                />
              </div>

              <div className="stitch-profile-form__field stitch-profile-form__field--full student-form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={handleCancelEdit}
                  style={{ borderRadius: 999, width: 'auto', padding: '10px 24px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  style={{ borderRadius: 999, width: 'auto', padding: '10px 28px' }}
                >
                  <Icon name="check" size={18} />
                  Save Changes
                </button>
              </div>
            </form>
          </SectionCard>
        ) : (
          <>
            <SectionCard title="Personal Information">
              <dl className="detail-grid">
                <div className="detail-grid__row detail-grid__row--verified">
                  <dt>Full name</dt>
                  <dd>{profile?.fullName || 'Not set'}</dd>
                </div>
                <div className="detail-grid__row detail-grid__row--verified">
                  <dt>National ID</dt>
                  <dd>{profile?.nationalId || 'Not set'}</dd>
                </div>
                <div className="detail-grid__row detail-grid__row--verified">
                  <dt>Phone number</dt>
                  <dd>{profile?.phone || 'Not set'}</dd>
                </div>
                <div className="detail-grid__row">
                  <dt>Email</dt>
                  <dd>{profile?.email || 'Not set'}</dd>
                </div>
                <div className="detail-grid__row detail-grid__row--verified">
                  <dt>Verification status</dt>
                  <dd>
                    <span className={`badge ${complete ? 'badge--success' : 'badge--error'}`}>
                      {complete ? 'Verified Chief' : 'Setup Incomplete'}
                    </span>
                  </dd>
                </div>
              </dl>
            </SectionCard>

            <SectionCard title="Assigned Administrative Jurisdiction">
              <dl className="detail-grid">
                <div className="detail-grid__row">
                  <dt>Ward</dt>
                  <dd>{profile?.ward || 'Not set'}</dd>
                </div>
                <div className="detail-grid__row">
                  <dt>Location</dt>
                  <dd>{profile?.location || 'Not set'}</dd>
                </div>
                <div className="detail-grid__row">
                  <dt>Sub-location</dt>
                  <dd>{profile?.subLocation || 'Not set'}</dd>
                </div>
                {profile?.officeLocation && (
                  <div className="detail-grid__row">
                    <dt>Office address</dt>
                    <dd>{profile.officeLocation}</dd>
                  </div>
                )}
              </dl>
            </SectionCard>
          </>
        )}

        <SectionCard title="Account Security">
          <div className="btn-row">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => window.alert('Password change dialog.')}
              style={{ borderRadius: 999 }}
            >
              <Icon name="shield" size={18} />
              Change password
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => window.alert('Two-factor OTP verified.')}
              style={{ borderRadius: 999 }}
            >
              <Icon name="shield" size={18} />
              OTP settings
            </button>
          </div>
        </SectionCard>
      </div>
    </ChiefLayout>
  );
}
