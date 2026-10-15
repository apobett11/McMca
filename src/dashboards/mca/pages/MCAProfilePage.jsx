import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MCALayout } from '../components/MCALayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { getMCAProfile, saveMCAProfile } from '../utils/mcaData.js';

export function MCAProfilePage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [profile, setProfile] = useState(() => getMCAProfile());
  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({ ...profile });

  useEffect(() => {
    function refresh() {
      const p = getMCAProfile();
      setProfile(p);
      setFormData({ ...p });
    }
    window.addEventListener('mcmca_mca_profile_updated', refresh);
    return () => {
      window.removeEventListener('mcmca_mca_profile_updated', refresh);
    };
  }, []);

  function handleSave(e) {
    e.preventDefault();
    saveMCAProfile(formData);
    setProfile({ ...formData });
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  }

  async function handleLogout() {
    try {
      if (signOut) await signOut();
    } catch {
      // fallback
    }
    navigate('/login');
  }

  return (
    <MCALayout pageTitle="Hon. MCA Profile & Ward Office">
      {/* HEADER SECTION */}
      <section className="mca-section" style={{ marginBottom: 24 }}>
        <div className="mca-section__header">
          <div>
            <h1 className="mca-section__title" style={{ fontSize: '1.6rem' }}>
              <Icon name="profile" size={24} />
              MCA Executive Profile
            </h1>
            <p className="mca-section__desc">
              Representation credentials, ward office location, and constituent administration settings.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {!isEditing ? (
              <button
                type="button"
                className="mca-btn mca-btn--schedule"
                onClick={() => setIsEditing(true)}
              >
                <Icon name="review" size={16} />
                Edit Ward Info
              </button>
            ) : (
              <button
                type="button"
                className="mca-btn mca-btn--cancel"
                onClick={() => {
                  setFormData({ ...profile });
                  setIsEditing(false);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {savedSuccess && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#34d399', padding: '10px 16px', borderRadius: 10, fontSize: '0.88rem', fontWeight: 600, marginBottom: 16 }}>
            ✓ Ward Profile details updated and saved successfully!
          </div>
        )}
      </section>

      {/* PROFILE DETAILS GRID */}
      <section className="mca-section">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {/* Card 1: Official Representation */}
          <div className="mca-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #1d4ed8, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, color: '#fff', border: '2px solid rgba(255,255,255,0.2)' }}>
                {profile.fullName.split(' ').map(n=>n[0]).slice(0, 2).join('')}
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                  {profile.fullName}
                </h2>
                <div style={{ fontSize: '0.82rem', color: '#60a5fa', fontWeight: 600, marginTop: 2 }}>
                  {profile.title}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>
                  {profile.ward} • {profile.county}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--mca-border)', paddingTop: 16 }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Electoral Constituency</span>
                <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#fff' }}>{profile.constituency}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Mandate / Legislative Term</span>
                <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#34d399' }}>{profile.term}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Constituent Focus & Bio</span>
                <p style={{ fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.5, margin: '4px 0 0' }}>
                  {profile.bio}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Ward Office & Public Access */}
          <div className="mca-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 16px', color: '#fff' }}>
              Ward Office & Administration
            </h3>

            {isEditing ? (
              <form onSubmit={handleSave}>
                <div className="mca-form-group">
                  <label className="mca-form-label">Full Name</label>
                  <input
                    type="text"
                    className="mca-input"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="mca-form-group">
                  <label className="mca-form-label">Official Phone</label>
                  <input
                    type="text"
                    className="mca-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="mca-form-group">
                  <label className="mca-form-label">Official Email</label>
                  <input
                    type="email"
                    className="mca-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="mca-form-group">
                  <label className="mca-form-label">Physical Office Location</label>
                  <input
                    type="text"
                    className="mca-input"
                    value={formData.officeLocation}
                    onChange={(e) => setFormData({ ...formData, officeLocation: e.target.value })}
                  />
                </div>

                <div className="mca-form-group">
                  <label className="mca-form-label">Liaison Officer / Assistant</label>
                  <input
                    type="text"
                    className="mca-input"
                    value={formData.liaisonOfficer}
                    onChange={(e) => setFormData({ ...formData, liaisonOfficer: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                  <button
                    type="button"
                    className="mca-btn mca-btn--cancel"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="mca-btn mca-btn--done"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Official Phone</span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#fff' }}>{profile.phone}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Official Email</span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#60a5fa' }}>{profile.email}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Civic Office Address</span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#fff' }}>{profile.officeLocation}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Ward Liaison Officer</span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#fff' }}>{profile.liaisonOfficer}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Public Reception Hours</span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#fbbf24' }}>{profile.workingHours}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ACCOUNT & SYSTEM CONTROL */}
      <section className="mca-section" aria-label="Account Settings">
        <div className="mca-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#fff' }}>
              Session & Security Control
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '4px 0 0' }}>
              Securely sign out of this MCA portal or switch to public or help desk view.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="mca-btn mca-btn--cancel"
              onClick={() => navigate('/helpdesk/dashboard')}
            >
              Open Help Desk
            </button>
            <button
              type="button"
              className="mca-btn"
              onClick={handleLogout}
              style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}
            >
              <Icon name="logout" size={16} />
              Sign Out / Login
            </button>
          </div>
        </div>
      </section>
    </MCALayout>
  );
}
