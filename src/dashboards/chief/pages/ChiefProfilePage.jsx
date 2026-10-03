import React, { useState, useEffect, useMemo } from 'react';
import { ChiefLayout } from '../components/ChiefLayout.jsx';
import { SectionCard } from '../../../components/SectionCard.jsx';
import { Icon } from '../../../components/Icon.jsx';
import {
  getChiefProfile,
  saveChiefProfile,
  isChiefProfileComplete,
  CHIEF_ADMIN_AREAS,
  getLocationKey
} from '../utils/chiefData.js';
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

  // Administrative hierarchy cascading options
  const wardOptions = useMemo(() => Object.keys(CHIEF_ADMIN_AREAS), []);

  const activeLocationKey = useMemo(() => {
    return getLocationKey(form.ward, form.location);
  }, [form.ward, form.location]);

  const availableLocations = useMemo(() => {
    if (!form.ward || !CHIEF_ADMIN_AREAS[form.ward]) return [];
    return Object.keys(CHIEF_ADMIN_AREAS[form.ward].locations || {});
  }, [form.ward]);

  const availableSubLocations = useMemo(() => {
    if (!form.ward || !activeLocationKey) return [];
    const locObj = CHIEF_ADMIN_AREAS[form.ward]?.locations?.[activeLocationKey];
    return locObj?.subLocations || [];
  }, [form.ward, activeLocationKey]);

  const availableVillages = useMemo(() => {
    if (!form.ward || !activeLocationKey) return [];
    const locObj = CHIEF_ADMIN_AREAS[form.ward]?.locations?.[activeLocationKey];
    return locObj?.villages || [];
  }, [form.ward, activeLocationKey]);

  function handleWardChange(e) {
    const nextWard = e.target.value;
    const nextLocs = nextWard && CHIEF_ADMIN_AREAS[nextWard] ? Object.keys(CHIEF_ADMIN_AREAS[nextWard].locations || {}) : [];
    const nextLoc = nextLocs[0] || '';
    const locObj = nextWard && nextLoc ? CHIEF_ADMIN_AREAS[nextWard]?.locations?.[nextLoc] : null;
    const subs = locObj?.subLocations || [];
    const vils = locObj?.villages || [];

    setForm((prev) => ({
      ...prev,
      ward: nextWard,
      location: nextLoc,
      subLocation: subs[0] || '',
      officeLocation: vils[0] || ''
    }));
  }

  function handleLocationChange(e) {
    const nextLoc = e.target.value;
    const locObj = form.ward && nextLoc ? CHIEF_ADMIN_AREAS[form.ward]?.locations?.[nextLoc] : null;
    const subs = locObj?.subLocations || [];
    const vils = locObj?.villages || [];

    setForm((prev) => ({
      ...prev,
      location: nextLoc,
      subLocation: subs[0] || '',
      officeLocation: vils[0] || ''
    }));
  }

  function handleSubLocationChange(e) {
    setForm((prev) => ({
      ...prev,
      subLocation: e.target.value
    }));
  }

  function handleVillageChange(e) {
    setForm((prev) => ({
      ...prev,
      officeLocation: e.target.value
    }));
  }

  function handleSave(e) {
    e.preventDefault();
    if (
      !form.fullName.trim() ||
      !form.nationalId.trim() ||
      !form.phone.trim() ||
      !form.ward.trim() ||
      !form.location.trim() ||
      !form.subLocation.trim()
    ) {
      alert('Please fill in your Full Name, National ID, Phone, Ward, Location, and Sub-Location.');
      return;
    }
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
            <form onSubmit={handleSave} className="stitch-profile-form">
              <div className="stitch-profile-form__field">
                <label className="stitch-profile-form__label">Full Name (Follows ID) *</label>
                <input
                  type="text"
                  className="stitch-profile-form__input"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="stitch-profile-form__field">
                <label className="stitch-profile-form__label">National ID Number *</label>
                <input
                  type="text"
                  className="stitch-profile-form__input"
                  value={form.nationalId}
                  onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
                  required
                />
              </div>

              <div className="stitch-profile-form__field">
                <label className="stitch-profile-form__label">Phone Number *</label>
                <input
                  type="tel"
                  className="stitch-profile-form__input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>

              <div className="stitch-profile-form__field">
                <label className="stitch-profile-form__label">Official Email Address</label>
                <input
                  type="email"
                  className="stitch-profile-form__input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="stitch-profile-form__field">
                <label className="stitch-profile-form__label">Assigned Ward *</label>
                <select
                  className="stitch-profile-form__input"
                  value={form.ward}
                  onChange={handleWardChange}
                  required
                >
                  <option value="">Select Ward...</option>
                  {wardOptions.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              <div className="stitch-profile-form__field">
                <label className="stitch-profile-form__label">Location *</label>
                <select
                  className="stitch-profile-form__input"
                  value={form.location}
                  onChange={handleLocationChange}
                  required
                  disabled={!form.ward}
                >
                  <option value="">{form.ward ? 'Select Location...' : 'Select Ward first'}</option>
                  {availableLocations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div className="stitch-profile-form__field">
                <label className="stitch-profile-form__label">Sub-Location *</label>
                <select
                  className="stitch-profile-form__input"
                  value={form.subLocation}
                  onChange={handleSubLocationChange}
                  required
                  disabled={!form.location}
                >
                  <option value="">{form.location ? 'Select Sub-Location...' : 'Select Location first'}</option>
                  {availableSubLocations.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className="stitch-profile-form__field">
                <label className="stitch-profile-form__label">Village / Office Center</label>
                <select
                  className="stitch-profile-form__input"
                  value={form.officeLocation}
                  onChange={handleVillageChange}
                  disabled={!form.location}
                >
                  <option value="">{form.location ? 'Select Village / Center...' : 'Select Location first'}</option>
                  {availableVillages.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="stitch-profile-form__field stitch-profile-form__field--full student-form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setIsEditing(false)}
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
