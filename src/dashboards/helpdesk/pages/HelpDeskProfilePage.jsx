import React, { useState, useEffect } from 'react';
import { HelpDeskLayout } from '../components/HelpDeskLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { RefreshButton } from '../../../components/RefreshButton.jsx';
import {
  PREDETERMINED_LOCATIONS,
  getHelpDeskProfile,
  saveHelpDeskProfile,
  INITIAL_HELPDESK_PROFILE
} from '../utils/helpDeskData.js';

export function HelpDeskProfilePage() {
  const [profile, setProfile] = useState(() => getHelpDeskProfile());
  const [formData, setFormData] = useState({ ...profile });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setFormData({ ...profile });
  }, [profile]);

  function reloadData() {
    setRefreshing(true);
    const p = getHelpDeskProfile();
    setProfile(p);
    setFormData({ ...p });
    setTimeout(() => setRefreshing(false), 200);
  }

  function handleLocationToggle(loc) {
    const current = formData.assignedLocations || [];
    const next = current.includes(loc)
      ? current.filter((l) => l !== loc)
      : [...current, loc];
    setFormData({ ...formData, assignedLocations: next });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', text: '' });

    try {
      const updated = saveHelpDeskProfile(formData);
      setProfile(updated);
      setFeedback({
        type: 'success',
        text: 'Help Desk profile settings and operational preferences updated successfully.'
      });
      setTimeout(() => setFeedback({ type: '', text: '' }), 4000);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to update profile settings.'
      });
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    const reset = { ...INITIAL_HELPDESK_PROFILE };
    saveHelpDeskProfile(reset);
    setProfile(reset);
    setFormData(reset);
    setFeedback({
      type: 'success',
      text: 'Profile reset to default operational credentials.'
    });
    setTimeout(() => setFeedback({ type: '', text: '' }), 3000);
  }

  const officerName = profile?.fullName || 'Clara Chelangat';
  const initials = officerName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <HelpDeskLayout pageTitle="Officer Profile &amp; Settings" layout="dashboard" officerName={officerName}>
      <div className="stitch-dashboard">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button
            type="button"
            onClick={reloadData}
            disabled={refreshing}
            className="hd-icon-btn hd-icon-btn--gold"
            title="Refresh Profile"
            aria-label="Refresh Profile"
          >
            <Icon name="refresh" size={17} />
          </button>
        </div>

        {/* Profile Identity Card */}
        <div
          className="hd-card"
          style={{
            background: 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(11,20,34,0.9) 100%)',
            borderRadius: '1.5rem',
            padding: '28px 32px 24px',
            marginBottom: 24,
            border: '1px solid rgba(212,175,55,0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #DDBB6A, #E6D3A3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0B1120',
                fontSize: 24,
                fontWeight: 700,
                flexShrink: 0
              }}
            >
              {initials}
            </div>
            <div>
              <h2 className="officer-identity-name" style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#fff' }}>
                {officerName}
              </h2>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: '#94a3b8' }}>
                {profile.roleTitle} &bull; {profile.department} &bull; ID: <strong style={{ color: '#fff' }}>{profile.officerId}</strong>
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="badge badge--success">Active Duty</span>
                <span className="badge badge--neutral">{profile.shiftUnit}</span>
                <span className="badge badge--info">{profile.assignedLocations?.length || 4} Locations Assigned</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Screen Feedback Toast */}
        {feedback.text && (
          <div className="hd-toast notice" role="alert" style={{ background: feedback.type === 'error' ? 'rgba(239,68,68,0.95)' : undefined }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name={feedback.type === 'error' ? 'alert' : 'check'} size={18} />
              <span>{feedback.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback({ type: '', text: '' })}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '1.1rem',
                padding: '0 4px',
                lineHeight: 1
              }}
              aria-label="Dismiss feedback"
            >
              ×
            </button>
          </div>
        )}

        {/* Profile Settings Form Card */}
        <section className="dash-single-card" style={{ background: '#0b1322', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div className="dash-single-card__head" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div>
              <h2 className="stitch-section-title" style={{ margin: 0, color: '#fff' }}>
                Help Desk Account &amp; Operational Settings
              </h2>
              <p className="field__help" style={{ margin: '4px 0 0', color: '#94a3b8' }}>
                Update your staff details, official contact channels, and duty location jurisdiction.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              {/* Full Name */}
              <div className="field">
                <label htmlFor="prof-name">Officer Full Name</label>
                <input
                  id="prof-name"
                  type="text"
                  value={formData.fullName || ''}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
              </div>

              {/* Officer ID */}
              <div className="field">
                <label htmlFor="prof-id">Staff / Officer ID</label>
                <input
                  id="prof-id"
                  type="text"
                  value={formData.officerId || ''}
                  onChange={(e) => setFormData({ ...formData, officerId: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
              </div>

              {/* Email */}
              <div className="field">
                <label htmlFor="prof-email">Official Work Email</label>
                <input
                  id="prof-email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
              </div>

              {/* Phone */}
              <div className="field">
                <label htmlFor="prof-phone">Contact Phone Number</label>
                <input
                  id="prof-phone"
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
              </div>

              {/* Role Title */}
              <div className="field">
                <label htmlFor="prof-role">Role Title</label>
                <input
                  id="prof-role"
                  type="text"
                  value={formData.roleTitle || ''}
                  onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
              </div>

              {/* Shift Unit */}
              <div className="field">
                <label htmlFor="prof-shift">Shift Unit</label>
                <select
                  id="prof-shift"
                  value={formData.shiftUnit || ''}
                  onChange={(e) => setFormData({ ...formData, shiftUnit: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                >
                  <option value="Day Shift (08:00 - 17:00)">Day Shift (08:00 - 17:00)</option>
                  <option value="Evening Shift (14:00 - 22:00)">Evening Shift (14:00 - 22:00)</option>
                  <option value="Weekend Assessment Duty">Weekend Assessment Duty</option>
                </select>
              </div>
            </div>

            {/* Pre-determined Locations Assigned */}
            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 20 }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                Assigned Operational Locations (Pre-determined)
              </label>
              <p className="field__help" style={{ margin: '0 0 12px' }}>
                Select the locations under your monitoring and pre-appeal assessment responsibility:
              </p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {PREDETERMINED_LOCATIONS.map((loc) => {
                  const isChecked = (formData.assignedLocations || []).includes(loc);
                  return (
                    <label
                      key={loc}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 16px',
                        borderRadius: 8,
                        background: isChecked ? 'rgba(212,175,55,0.1)' : 'var(--surface)',
                        border: isChecked ? '1px solid var(--gold-champagne, #ddbb6a)' : '1px solid var(--border)',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: 'var(--text)'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleLocationToggle(loc)}
                        style={{ accentColor: '#15803d', width: 16, height: 16 }}
                      />
                      <span>{loc}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Notification and Alert Preferences */}
            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 20 }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                Notification &amp; Escalation Preferences
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text)' }}>
                  <input
                    type="checkbox"
                    checked={!!formData.emailAlertsFailed}
                    onChange={(e) => setFormData({ ...formData, emailAlertsFailed: e.target.checked })}
                    style={{ accentColor: '#15803d', width: 16, height: 16 }}
                  />
                  <span>Receive email alerts immediately when Chief dashboard rejects an application (pre-appeal alert)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text)' }}>
                  <input
                    type="checkbox"
                    checked={!!formData.smsEscalations}
                    onChange={(e) => setFormData({ ...formData, smsEscalations: e.target.checked })}
                    style={{ accentColor: '#15803d', width: 16, height: 16 }}
                  />
                  <span>Receive SMS notifications when urgent inquiries arrive from MCA Office Secretariat</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text)' }}>
                  <input
                    type="checkbox"
                    checked={!!formData.autoDigest}
                    onChange={(e) => setFormData({ ...formData, autoDigest: e.target.checked })}
                    style={{ accentColor: '#15803d', width: 16, height: 16 }}
                  />
                  <span>Send daily end-of-day digest of hanging steps and resolved appeals</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <button
                type="button"
                onClick={handleReset}
                className="btn btn--secondary"
              >
                Reset to Defaults
              </button>

              <button
                type="submit"
                disabled={saving}
                className="btn btn--primary"
              >
                <Icon name="check" size={18} />
                {saving ? 'Saving...' : 'Save Profile Settings'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </HelpDeskLayout>
  );
}
