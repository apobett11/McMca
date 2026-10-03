import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChiefLayout } from '../components/ChiefLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { getTimeGreeting } from '../../../utils/greeting.js';
import {
  getChiefProfile,
  saveChiefProfile,
  isChiefProfileComplete,
  getChiefApplications,
  getChiefMessages
} from '../utils/chiefData.js';
import { CHIEF_SUMMARY } from '../../../data/chiefMock.js';

export function ChiefDashboardPage() {
  const greeting = getTimeGreeting();

  // Profile state
  const [profile, setProfile] = useState(() => getChiefProfile());
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: profile?.fullName || '',
    nationalId: profile?.nationalId || '',
    phone: profile?.phone || '',
    email: profile?.email || '',
    ward: profile?.ward || '',
    location: profile?.location || '',
    subLocation: profile?.subLocation || '',
    officeLocation: profile?.officeLocation || ''
  });
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Applications & messages state
  const [applications, setApplications] = useState(() => getChiefApplications());
  const [messages, setMessages] = useState(() => getChiefMessages());

  useEffect(() => {
    function onProfileUpdated(e) {
      setProfile(e.detail);
    }
    function onAppsUpdated(e) {
      setApplications(e.detail);
    }
    function onMsgsUpdated(e) {
      setMessages(e.detail);
    }
    window.addEventListener('mcmca_chief_profile_updated', onProfileUpdated);
    window.addEventListener('mcmca_chief_apps_updated', onAppsUpdated);
    window.addEventListener('mcmca_chief_messages_updated', onMsgsUpdated);

    return () => {
      window.removeEventListener('mcmca_chief_profile_updated', onProfileUpdated);
      window.removeEventListener('mcmca_chief_apps_updated', onAppsUpdated);
      window.removeEventListener('mcmca_chief_messages_updated', onMsgsUpdated);
    };
  }, []);

  const profileComplete = isChiefProfileComplete(profile);

  function handleSaveProfile(e) {
    e.preventDefault();
    if (!profileForm.fullName.trim() || !profileForm.nationalId.trim() || !profileForm.ward.trim()) {
      alert('Please fill in your Full Name, National ID, and Ward.');
      return;
    }
    const saved = saveChiefProfile(profileForm);
    setProfile(saved);
    setIsEditingProfile(false);
    setProfileSuccessMsg('Administrative profile saved! Your ward analytics are now active.');
    setTimeout(() => setProfileSuccessMsg(''), 5000);
  }

  function handleQuickDemoFill() {
    const demo = {
      fullName: 'Chief Peter Waweru',
      nationalId: '12345678',
      phone: '0722 100 099',
      email: 'chief.waweru@mcmca.gov.ke',
      ward: 'Tendeno/Sorget Ward',
      location: 'Parklands',
      subLocation: 'Highridge',
      officeLocation: 'Ward Central Office'
    };
    setProfileForm(demo);
  }

  // Calculate analytics
  const totalApps = applications.length;
  const approvedApps = applications.filter((a) => a.applicationStatus === 'Approved').length;
  const rejectedApps = applications.filter((a) => a.applicationStatus === 'Rejected').length;
  const underReviewApps = applications.filter((a) => a.applicationStatus === 'Under Review' || a.applicationStatus === 'Submitted').length;
  const suspiciousApps = applications.filter((a) => a.isSuspicious).length;

  const appProcessedPct = totalApps > 0 ? Math.round(((approvedApps + rejectedApps) / totalApps) * 100) : 0;
  const approvalRatePct = totalApps > 0 ? Math.round((approvedApps / totalApps) * 100) : 0;

  // Appeals (from mock/summary)
  const totalAppeals = 42;
  const resolvedAppeals = 28;
  const pendingAppeals = 14;
  const appealResolvedPct = Math.round((resolvedAppeals / totalAppeals) * 100);

  // Village / Sub-location breakdown
  const villageCounts = useMemo(() => {
    const counts = {};
    applications.forEach((a) => {
      const v = a.village || a.subLocation || 'Other';
      counts[v] = (counts[v] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      pct: totalApps > 0 ? Math.round((count / totalApps) * 100) : 0
    }));
  }, [applications, totalApps]);

  // Messages pending reply
  const pendingReplyCount = messages.filter((m) => m.status === 'to_be_replied' || m.status === 'unread').length;

  return (
    <ChiefLayout
      chiefName={profile?.fullName || 'Chief'}
      pageTitle="Home"
      layout="dashboard"
      notificationBadge={pendingReplyCount > 0}
    >
      <div className="chief-dashboard-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Hero Banner */}
        <section className="dash-single-card" style={{ padding: '24px 28px', background: 'var(--surface-elevated)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)'
                }}
              >
                {profile?.fullName ? profile.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'CH'}
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.45rem', color: 'var(--text)' }}>
                  {greeting}, {profile?.fullName || 'Chief'}.
                </h1>
                <p style={{ margin: '4px 0 0', color: 'var(--text-2, #94a3b8)', fontSize: '0.9rem' }}>
                  {profileComplete
                    ? `${profile.ward} · Location: ${profile.location} · Sub-Location: ${profile.subLocation}`
                    : 'Personal credentials and administrative jurisdiction setup required.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {profileComplete ? (
                <>
                  <span className="badge badge--success" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                    ● Ward Active
                  </span>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    style={{ fontSize: '0.82rem', padding: '6px 12px' }}
                  >
                    {isEditingProfile ? 'Close Edit' : 'Edit Profile'}
                  </button>
                </>
              ) : (
                <span className="badge badge--error" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                  Setup Required
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Profile Success Message */}
        {profileSuccessMsg && (
          <div style={{ padding: '14px 18px', borderRadius: 8, background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#4ade80', fontSize: '0.9rem' }}>
            ✓ {profileSuccessMsg}
          </div>
        )}

        {/* REQUIREMENT 1: If personal info is NOT complete (or chief clicks edit), render personal information setup */}
        {(!profileComplete || isEditingProfile) && (
          <section className="dash-single-card" style={{ padding: '24px 28px', border: '1px solid #d97706', background: 'var(--surface-elevated)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 className="stitch-section-title" style={{ margin: 0, fontSize: '1.25rem' }}>
                  {profileComplete ? 'Update Personal Information' : 'Chief Personal Information & Ward Assignment'}
                </h2>
                <p style={{ margin: '6px 0 0', color: 'var(--text-2, #94a3b8)', fontSize: '0.88rem' }}>
                  Please fill in your personal credentials, national ID, and assigned administrative jurisdiction. Ward analytics will remain locked until this is completed.
                </p>
              </div>
              {!profileComplete && (
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={handleQuickDemoFill}
                  style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                >
                  Fill Sample Credentials
                </button>
              )}
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div>
                <label className="field__label" style={{ fontSize: '0.82rem' }}>Chief Full Name *</label>
                <input
                  type="text"
                  className="field__input"
                  placeholder="e.g. Chief Peter Waweru"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="field__label" style={{ fontSize: '0.82rem' }}>National ID Number *</label>
                <input
                  type="text"
                  className="field__input"
                  placeholder="e.g. 12345678"
                  value={profileForm.nationalId}
                  onChange={(e) => setProfileForm({ ...profileForm, nationalId: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="field__label" style={{ fontSize: '0.82rem' }}>Phone Number *</label>
                <input
                  type="tel"
                  className="field__input"
                  placeholder="e.g. 0722 100 099"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="field__label" style={{ fontSize: '0.82rem' }}>Official Email</label>
                <input
                  type="email"
                  className="field__input"
                  placeholder="e.g. chief@example.com"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                />
              </div>

              <div>
                <label className="field__label" style={{ fontSize: '0.82rem' }}>Assigned Ward *</label>
                <input
                  type="text"
                  className="field__input"
                  placeholder="e.g. Tendeno/Sorget Ward"
                  value={profileForm.ward}
                  onChange={(e) => setProfileForm({ ...profileForm, ward: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="field__label" style={{ fontSize: '0.82rem' }}>Location *</label>
                <input
                  type="text"
                  className="field__input"
                  placeholder="e.g. Parklands or Tendeno"
                  value={profileForm.location}
                  onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="field__label" style={{ fontSize: '0.82rem' }}>Sub-Location *</label>
                <input
                  type="text"
                  className="field__input"
                  placeholder="e.g. Highridge or Sorget"
                  value={profileForm.subLocation}
                  onChange={(e) => setProfileForm({ ...profileForm, subLocation: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="field__label" style={{ fontSize: '0.82rem' }}>Office Address / Village</label>
                <input
                  type="text"
                  className="field__input"
                  placeholder="e.g. Central Chief Camp"
                  value={profileForm.officeLocation}
                  onChange={(e) => setProfileForm({ ...profileForm, officeLocation: e.target.value })}
                />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                {isEditingProfile && (
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => setIsEditingProfile(false)}
                  >
                    Cancel
                  </button>
                )}
                <button type="submit" className="btn btn--primary" style={{ padding: '10px 24px' }}>
                  <Icon name="check" size={18} />
                  Save & Activate Dashboard
                </button>
              </div>
            </form>
          </section>
        )}

        {/* If NOT complete: show locked state placeholder for analytics */}
        {!profileComplete ? (
          <section className="dash-single-card" style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8', background: 'rgba(0,0,0,0.1)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(217, 119, 6, 0.1)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Icon name="shield" size={32} />
            </div>
            <h3 style={{ margin: '0 0 8px', color: 'var(--text)', fontSize: '1.25rem' }}>
              Ward Analytics Locked
            </h3>
            <p style={{ margin: '0 auto', maxWidth: 460, lineHeight: 1.6, fontSize: '0.92rem' }}>
              Please complete your chief credentials and administrative area in the form above. Once saved, your ward application analytics, verification metrics, and village distributions will unlock automatically.
            </p>
          </section>
        ) : (
          /* REQUIREMENT 3: General into THIN RANGES, then structured ANALYTICS below */
          <>
            {/* THIN RANGES (like student dashboard) */}
            <div className="dash-analytics-strips" style={{ margin: 0 }}>
              {/* Applications Strip Card */}
              <div className="dash-strip-card">
                <div className="dash-strip-card__head">
                  <div>
                    <span className="dash-strip-card__label">Ward Applications</span>
                    <h3 className="dash-strip-card__val">
                      {totalApps} Total Applications
                    </h3>
                  </div>
                  <span className={`stitch-status-badge ${underReviewApps > 0 ? 'stitch-status-badge--review' : 'stitch-status-badge--admitted'}`}>
                    {underReviewApps > 0 ? `${underReviewApps} In Review` : 'All Reviewed'}
                  </span>
                </div>
                <div className="dash-strip-card__track" role="progressbar" aria-valuenow={appProcessedPct} aria-valuemin="0" aria-valuemax="100">
                  <div
                    className="dash-strip-card__fill dash-strip-card__fill--gold"
                    style={{ width: `${appProcessedPct}%` }}
                  />
                </div>
                <div className="dash-strip-card__foot">
                  <span>{approvedApps} Approved · {rejectedApps} Rejected</span>
                  <span>{appProcessedPct}% Processed</span>
                </div>
              </div>

              {/* Appeals Strip Card */}
              <div className="dash-strip-card">
                <div className="dash-strip-card__head">
                  <div>
                    <span className="dash-strip-card__label">Ward Appeals</span>
                    <h3 className="dash-strip-card__val">
                      {totalAppeals} Appeals
                    </h3>
                  </div>
                  <span className={`stitch-status-badge ${pendingAppeals > 0 ? 'stitch-status-badge--review' : 'stitch-status-badge--admitted'}`}>
                    {pendingAppeals} Pending
                  </span>
                </div>
                <div className="dash-strip-card__track" role="progressbar" aria-valuenow={appealResolvedPct} aria-valuemin="0" aria-valuemax="100">
                  <div
                    className="dash-strip-card__fill dash-strip-card__fill--green"
                    style={{ width: `${appealResolvedPct}%` }}
                  />
                </div>
                <div className="dash-strip-card__foot">
                  <span>{resolvedAppeals} Resolved · 3 Urgent</span>
                  <span>{appealResolvedPct}% Resolved</span>
                </div>
              </div>

              {/* Suspicious Cases Strip Card */}
              <div className="dash-strip-card">
                <div className="dash-strip-card__head">
                  <div>
                    <span className="dash-strip-card__label" style={{ color: suspiciousApps > 0 ? '#ef4444' : undefined }}>
                      Suspicious Applications
                    </span>
                    <h3 className="dash-strip-card__val">
                      {suspiciousApps} Flagged Cases
                    </h3>
                  </div>
                  <span className={`stitch-status-badge ${suspiciousApps > 0 ? 'stitch-status-badge--declined' : 'stitch-status-badge--admitted'}`}>
                    {suspiciousApps > 0 ? 'ID Mismatch' : 'Clean'}
                  </span>
                </div>
                <div className="dash-strip-card__track" role="progressbar" aria-valuenow={totalApps > 0 ? Math.round((suspiciousApps / totalApps) * 100) : 0}>
                  <div
                    className="dash-strip-card__fill"
                    style={{
                      width: `${totalApps > 0 ? Math.round((suspiciousApps / totalApps) * 100) : 0}%`,
                      background: 'linear-gradient(90deg, #f59e0b, #ef4444)'
                    }}
                  />
                </div>
                <div className="dash-strip-card__foot">
                  <span>Individual review required</span>
                  <Link to="/chief/applications" style={{ color: '#d97706', fontWeight: 600, textDecoration: 'none' }}>
                    View &gt;
                  </Link>
                </div>
              </div>
            </div>

            {/* BELOW THAT: THE ANALYTICS CAREFULLY CRAFTED INTO SECTIONS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>

              {/* Section 1: Key Performance Metrics */}
              <section className="dash-single-card" style={{ padding: 24, background: 'var(--surface-elevated)' }}>
                <h3 className="stitch-section-title" style={{ margin: '0 0 16px', fontSize: '1.1rem' }}>
                  Processing Telemetry
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Approval Rate</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981', marginTop: 4 }}>{approvalRatePct}%</div>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{approvedApps} approved of {totalApps}</span>
                  </div>

                  <div style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Pending Inquiries</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: pendingReplyCount > 0 ? '#f59e0b' : '#10b981', marginTop: 4 }}>
                      {pendingReplyCount}
                    </div>
                    <Link to="/chief/messages" style={{ fontSize: '0.72rem', color: '#d97706', textDecoration: 'none' }}>
                      To be replied &gt;
                    </Link>
                  </div>

                  <div style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Suspicious Rate</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: suspiciousApps > 0 ? '#ef4444' : '#10b981', marginTop: 4 }}>
                      {totalApps > 0 ? Math.round((suspiciousApps / totalApps) * 100) : 0}%
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>ID location mismatch</span>
                  </div>

                  <div style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Avg Turnaround</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>1.6 Days</div>
                    <span style={{ fontSize: '0.72rem', color: '#10b981' }}>Within target</span>
                  </div>
                </div>
              </section>

              {/* Section 2: Village & Sub-Location Distribution */}
              <section className="dash-single-card" style={{ padding: 24, background: 'var(--surface-elevated)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 className="stitch-section-title" style={{ margin: 0, fontSize: '1.1rem' }}>
                    Village Distribution
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{villageCounts.length} Localities</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {villageCounts.map((v) => (
                    <div key={v.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                        <span style={{ fontWeight: 500, color: 'var(--text)' }}>{v.name}</span>
                        <span style={{ color: '#94a3b8' }}>{v.count} apps ({v.pct}%)</span>
                      </div>
                      <div style={{ width: '100%', height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                        <div style={{ width: `${v.pct}%`, height: '100%', borderRadius: 4, background: '#d97706' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Section 3: Quick Action Workflows */}
              <section className="dash-single-card" style={{ padding: 24, background: 'var(--surface-elevated)' }}>
                <h3 className="stitch-section-title" style={{ margin: '0 0 16px', fontSize: '1.1rem' }}>
                  Verification Workflows
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                  <Link
                    to="/chief/applications"
                    className="btn btn--secondary"
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 10px', textAlign: 'center', borderRadius: 12 }}
                  >
                    <Icon name="applications" size={24} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Applications</span>
                  </Link>

                  <Link
                    to="/chief/messages"
                    className="btn btn--secondary"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      padding: '16px 10px',
                      textAlign: 'center',
                      borderRadius: 12,
                      borderColor: pendingReplyCount > 0 ? '#f59e0b' : undefined
                    }}
                  >
                    <Icon name="bell" size={24} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      Messages {pendingReplyCount > 0 && `(${pendingReplyCount})`}
                    </span>
                  </Link>

                  <Link
                    to="/chief/appeals"
                    className="btn btn--secondary"
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 10px', textAlign: 'center', borderRadius: 12 }}
                  >
                    <Icon name="documents" size={24} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Appeals</span>
                  </Link>

                  <Link
                    to="/chief/profile"
                    className="btn btn--secondary"
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 10px', textAlign: 'center', borderRadius: 12 }}
                  >
                    <Icon name="profile" size={24} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Area Profile</span>
                  </Link>
                </div>
              </section>

              {/* Section 4: Urgent Alerts & Inconsistencies */}
              <section className="dash-single-card" style={{ padding: 24, background: 'var(--surface-elevated)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 className="stitch-section-title" style={{ margin: 0, fontSize: '1.1rem' }}>
                    Urgent Inconsistency Notices
                  </h3>
                  <Link to="/chief/applications" style={{ fontSize: '0.8rem', color: '#d97706', textDecoration: 'none' }}>
                    View all &gt;
                  </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {applications.filter((a) => a.isSuspicious).slice(0, 3).map((app) => (
                    <div
                      key={app.id}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 8,
                        background: 'rgba(239, 68, 68, 0.08)',
                        borderLeft: '3px solid #ef4444',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--text)' }}>{app.fullName}</strong>
                        <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#ef4444' }}>
                          ID location &apos;{app.idLocation}&apos; ≠ &apos;{app.location}&apos;
                        </p>
                      </div>
                      <Link
                        to="/chief/applications"
                        className="btn btn--table"
                        style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                      >
                        Inspect
                      </Link>
                    </div>
                  ))}
                  {suspiciousApps === 0 && (
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>No suspicious cases detected.</p>
                  )}
                </div>
              </section>

            </div>
          </>
        )}

      </div>
    </ChiefLayout>
  );
}
