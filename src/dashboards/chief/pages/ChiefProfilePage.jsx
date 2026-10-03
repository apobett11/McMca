import React, { useState, useEffect } from 'react';
import { ChiefLayout } from '../components/ChiefLayout.jsx';
import { SectionCard } from '../../../components/SectionCard.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { getChiefProfile, saveChiefProfile, isChiefProfileComplete } from '../utils/chiefData.js';
import { CHIEF } from '../../../data/chiefMock.js';

export function ChiefProfilePage() {
  const [profile, setProfile] = useState(() => getChiefProfile() || CHIEF);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: profile?.fullName || '',
    nationalId: profile?.nationalId || '',
    phone: profile?.phone || '',
    email: profile?.email || '',
    ward: profile?.ward || '',
    location: profile?.location || '',
    subLocation: profile?.subLocation || '',
    officeLocation: profile?.officeLocation || ''
  });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    function onUpdated(e) {
      setProfile(e.detail);
    }
    window.addEventListener('mcmca_chief_profile_updated', onUpdated);
    return () => window.removeEventListener('mcmca_chief_profile_updated', onUpdated);
  }, []);

  function handleSave(e) {
    e.preventDefault();
    const updated = saveChiefProfile(form);
    setProfile(updated);
    setIsEditing(false);
    setMsg('Chief profile and administrative assignment saved successfully.');
    setTimeout(() => setMsg(''), 4000);
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
              onClick={() => setIsEditing(!isEditing)}
              style={{ fontSize: '0.85rem' }}
            >
              <Icon name="review" size={16} />
              {isEditing ? 'Cancel Edit' : 'Edit Information'}
            </button>
          </div>
        </SectionCard>

        {msg && (
          <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', fontSize: '0.88rem' }}>
            ✓ {msg}
          </div>
        )}

        {isEditing ? (
          <SectionCard title="Edit Personal Information & Ward">
            <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div>
                <label className="field__label" style={{ fontSize: '0.82rem' }}>Full Name *</label>
                <input
                  type="text"
                  className="field__input"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="field__label" style={{ fontSize: '0.82rem' }}>National ID Number *</label>
                <input
                  type="text"
                  className="field__input"
                  value={form.nationalId}
                  onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="field__label" style={{ fontSize: '0.82rem' }}>Phone Number *</label>
                <input
                  type="tel"
                  className="field__input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="field__label" style={{ fontSize: '0.82rem' }}>Email</label>
                <input
                  type="email"
                  className="field__input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <label className="field__label" style={{ fontSize: '0.82rem' }}>Assigned Ward *</label>
                <input
                  type="text"
                  className="field__input"
                  value={form.ward}
                  onChange={(e) => setForm({ ...form, ward: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="field__label" style={{ fontSize: '0.82rem' }}>Location *</label>
                <input
                  type="text"
                  className="field__input"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="field__label" style={{ fontSize: '0.82rem' }}>Sub-Location *</label>
                <input
                  type="text"
                  className="field__input"
                  value={form.subLocation}
                  onChange={(e) => setForm({ ...form, subLocation: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="field__label" style={{ fontSize: '0.82rem' }}>Office Address</label>
                <input
                  type="text"
                  className="field__input"
                  value={form.officeLocation}
                  onChange={(e) => setForm({ ...form, officeLocation: e.target.value })}
                />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn btn--secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" style={{ padding: '10px 24px' }}>
                  Save Profile
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
            >
              <Icon name="shield" size={18} />
              Change password
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => window.alert('Two-factor OTP verified.')}
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
