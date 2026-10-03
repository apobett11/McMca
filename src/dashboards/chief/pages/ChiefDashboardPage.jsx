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
  getChiefMessages,
  getChiefAppeals,
  CHIEF_ADMIN_AREAS,
  getLocationKey
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

  // Applications, appeals & messages state
  const [applications, setApplications] = useState(() => getChiefApplications());
  const [messages, setMessages] = useState(() => getChiefMessages());
  const [appeals, setAppeals] = useState(() => getChiefAppeals());

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
    function onAppealsUpdated(e) {
      setAppeals(e.detail);
    }
    window.addEventListener('mcmca_chief_profile_updated', onProfileUpdated);
    window.addEventListener('mcmca_chief_apps_updated', onAppsUpdated);
    window.addEventListener('mcmca_chief_messages_updated', onMsgsUpdated);
    window.addEventListener('mcmca_chief_appeals_updated', onAppealsUpdated);

    return () => {
      window.removeEventListener('mcmca_chief_profile_updated', onProfileUpdated);
      window.removeEventListener('mcmca_chief_apps_updated', onAppsUpdated);
      window.removeEventListener('mcmca_chief_messages_updated', onMsgsUpdated);
      window.removeEventListener('mcmca_chief_appeals_updated', onAppealsUpdated);
    };
  }, []);

  const profileComplete = isChiefProfileComplete(profile);

  // Administrative hierarchy cascading options
  const wardOptions = useMemo(() => Object.keys(CHIEF_ADMIN_AREAS), []);

  const activeLocationKey = useMemo(() => {
    return getLocationKey(profileForm.ward, profileForm.location);
  }, [profileForm.ward, profileForm.location]);

  const availableLocations = useMemo(() => {
    if (!profileForm.ward || !CHIEF_ADMIN_AREAS[profileForm.ward]) return [];
    return Object.keys(CHIEF_ADMIN_AREAS[profileForm.ward].locations || {});
  }, [profileForm.ward]);

  const availableSubLocations = useMemo(() => {
    if (!profileForm.ward || !activeLocationKey) return [];
    const locObj = CHIEF_ADMIN_AREAS[profileForm.ward]?.locations?.[activeLocationKey];
    return locObj?.subLocations || [];
  }, [profileForm.ward, activeLocationKey]);

  const availableVillages = useMemo(() => {
    if (!profileForm.ward || !activeLocationKey) return [];
    const locObj = CHIEF_ADMIN_AREAS[profileForm.ward]?.locations?.[activeLocationKey];
    return locObj?.villages || [];
  }, [profileForm.ward, activeLocationKey]);

  function handleWardChange(e) {
    const nextWard = e.target.value;
    const nextLocs = nextWard && CHIEF_ADMIN_AREAS[nextWard] ? Object.keys(CHIEF_ADMIN_AREAS[nextWard].locations || {}) : [];
    const nextLoc = nextLocs[0] || '';
    const locObj = nextWard && nextLoc ? CHIEF_ADMIN_AREAS[nextWard]?.locations?.[nextLoc] : null;
    const subs = locObj?.subLocations || [];
    const vils = locObj?.villages || [];

    setProfileForm((prev) => ({
      ...prev,
      ward: nextWard,
      location: nextLoc,
      subLocation: subs[0] || '',
      officeLocation: vils[0] || ''
    }));
  }

  function handleLocationChange(e) {
    const nextLoc = e.target.value;
    const locObj = profileForm.ward && nextLoc ? CHIEF_ADMIN_AREAS[profileForm.ward]?.locations?.[nextLoc] : null;
    const subs = locObj?.subLocations || [];
    const vils = locObj?.villages || [];

    setProfileForm((prev) => ({
      ...prev,
      location: nextLoc,
      subLocation: subs[0] || '',
      officeLocation: vils[0] || ''
    }));
  }

  function handleSubLocationChange(e) {
    setProfileForm((prev) => ({
      ...prev,
      subLocation: e.target.value
    }));
  }

  function handleVillageChange(e) {
    setProfileForm((prev) => ({
      ...prev,
      officeLocation: e.target.value
    }));
  }

  function handleSaveProfile(e) {
    e.preventDefault();
    if (
      !profileForm.fullName.trim() ||
      !profileForm.nationalId.trim() ||
      !profileForm.phone.trim() ||
      !profileForm.ward.trim() ||
      !profileForm.location.trim() ||
      !profileForm.subLocation.trim()
    ) {
      alert('Please fill in your Full Name, National ID, Phone, Ward, Location, and Sub-Location.');
      return;
    }
    const saved = saveChiefProfile(profileForm);
    setProfile(saved);
    setIsEditingProfile(false);
    setProfileSuccessMsg('Administrative profile saved! Your ward applications and analytics are now active.');
    setTimeout(() => setProfileSuccessMsg(''), 5000);
  }

  function handleQuickDemoFill() {
    const demo = {
      fullName: 'Chief Peter Waweru',
      nationalId: '12345678',
      phone: '0722 100 099',
      email: 'chief.waweru@mcmca.gov.ke',
      ward: 'Parklands Ward',
      location: 'Parklands',
      subLocation: 'Highridge',
      officeLocation: 'Highridge Village'
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

  // Appeals (live state from appeals store)
  const totalAppeals = appeals.length;
  const approvedAppeals = appeals.filter((a) => a.appealStatus === 'Approved').length;
  const rejectedAppeals = appeals.filter((a) => a.appealStatus === 'Rejected').length;
  const pendingAppeals = appeals.filter((a) => a.appealStatus === 'Submitted' || a.appealStatus === 'Under Review' || a.appealStatus === 'Clarification Requested').length;
  const resolvedAppeals = approvedAppeals + rejectedAppeals;
  const appealResolvedPct = totalAppeals > 0 ? Math.round((resolvedAppeals / totalAppeals) * 100) : 0;

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

  // Global indicator for any unreviewed or pending updates
  const hasUpdates = pendingReplyCount > 0 || underReviewApps > 0 || suspiciousApps > 0 || pendingAppeals > 0;

  return (
    <ChiefLayout
      chiefName={profile?.fullName || 'Chief'}
      pageTitle="Home"
      layout="dashboard"
      notificationBadge={hasUpdates}
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
          <section className="dash-single-card" style={{ padding: '24px 28px', background: 'var(--surface-elevated)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 className="stitch-section-title" style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon name="profile" size={22} />
                  {profileComplete ? 'Personal Information' : 'Chief Personal Registration'}
                </h2>
                <p style={{ margin: '4px 0 0', color: 'var(--text-2, #94a3b8)', fontSize: '0.85rem' }}>
                  {profileComplete
                    ? 'Review and manage your personal credentials and assigned administrative jurisdiction.'
                    : 'You need to complete registration of personal details to access the applications.'}
                </p>
              </div>
              {!profileComplete && (
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={handleQuickDemoFill}
                  style={{ fontSize: '0.78rem', borderRadius: 999, padding: '6px 14px' }}
                >
                  Fill Sample Details
                </button>
              )}
            </div>

            <form onSubmit={handleSaveProfile} className="stitch-profile-form">
              <div className="stitch-profile-form__field">
                <label className="stitch-profile-form__label">Full Name (Follows ID) *</label>
                <input
                  type="text"
                  className="stitch-profile-form__input"
                  placeholder="Enter full legal name"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="stitch-profile-form__field">
                <label className="stitch-profile-form__label">National ID Number *</label>
                <input
                  type="text"
                  className="stitch-profile-form__input"
                  placeholder="e.g. 12345678"
                  value={profileForm.nationalId}
                  onChange={(e) => setProfileForm({ ...profileForm, nationalId: e.target.value })}
                  required
                />
              </div>

              <div className="stitch-profile-form__field">
                <label className="stitch-profile-form__label">Phone Number *</label>
                <input
                  type="tel"
                  className="stitch-profile-form__input"
                  placeholder="e.g. 0722 000 000"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  required
                />
              </div>

              <div className="stitch-profile-form__field">
                <label className="stitch-profile-form__label">Official Email Address</label>
                <input
                  type="email"
                  className="stitch-profile-form__input"
                  placeholder="e.g. chief.waweru@mcmca.gov.ke"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                />
              </div>

              <div className="stitch-profile-form__field">
                <label className="stitch-profile-form__label">Assigned Ward *</label>
                <select
                  className="stitch-profile-form__input"
                  value={profileForm.ward}
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
                <label className="stitch-profile-form__label">Assigned Location *</label>
                <select
                  className="stitch-profile-form__input"
                  value={profileForm.location}
                  onChange={handleLocationChange}
                  required
                  disabled={!profileForm.ward}
                >
                  <option value="">{profileForm.ward ? 'Select Location...' : 'Select Ward first'}</option>
                  {availableLocations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div className="stitch-profile-form__field">
                <label className="stitch-profile-form__label">Sub-Location *</label>
                <select
                  className="stitch-profile-form__input"
                  value={profileForm.subLocation}
                  onChange={handleSubLocationChange}
                  required
                  disabled={!profileForm.location}
                >
                  <option value="">{profileForm.location ? 'Select Sub-Location...' : 'Select Location first'}</option>
                  {availableSubLocations.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className="stitch-profile-form__field">
                <label className="stitch-profile-form__label">Village / Office Center</label>
                <select
                  className="stitch-profile-form__input"
                  value={profileForm.officeLocation}
                  onChange={handleVillageChange}
                  disabled={!profileForm.location}
                >
                  <option value="">{profileForm.location ? 'Select Village / Center...' : 'Select Location first'}</option>
                  {availableVillages.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="stitch-profile-form__field stitch-profile-form__field--full student-form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                {isEditingProfile && (
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => setIsEditingProfile(false)}
                    style={{ borderRadius: 999, width: 'auto', padding: '10px 24px' }}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="btn btn--primary"
                  style={{ borderRadius: 999, width: 'auto', padding: '10px 28px' }}
                >
                  <Icon name="check" size={18} />
                  {profileComplete ? 'Save Changes' : 'Complete Registration'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* If NOT complete: show clean direct notice */}
        {!profileComplete ? (
          <div
            className="dash-single-card"
            style={{
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              background: 'rgba(217, 119, 6, 0.08)',
              border: '1px solid rgba(217, 119, 6, 0.25)',
              borderRadius: '0.85rem'
            }}
          >
            <Icon name="info" size={22} style={{ color: '#d97706', flexShrink: 0 }} />
            <span style={{ fontSize: '0.92rem', color: 'var(--text)' }}>
              You need to complete registration of personal details to access the applications.
            </span>
          </div>
        ) : (
          /* REQUIREMENT 3: General into THIN RANGES, then structured ANALYTICS below */
          <>
            {/* THIN RANGES (like student dashboard) */}
            <div className="dash-analytics-strips" style={{ margin: 0 }}>
              {/* Applications Strip Card */}
              <div className="dash-strip-card">
                <div className="dash-strip-card__head">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="dash-strip-card__label">Ward Applications</span>
                      {(underReviewApps > 0 || suspiciousApps > 0) && (
                        <span className="card-update-dot" title="Pending applications" />
                      )}
                    </div>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="dash-strip-card__label">Ward Appeals</span>
                      {pendingAppeals > 0 && (
                        <span className="card-update-dot" title="Pending appeals" />
                      )}
                    </div>
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
                  <span>{resolvedAppeals} Resolved · {pendingAppeals} In Queue</span>
                  <span>{appealResolvedPct}% Resolved</span>
                </div>
              </div>

              {/* Suspicious Cases Strip Card */}
              <div className="dash-strip-card">
                <div className="dash-strip-card__head">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="dash-strip-card__label" style={{ color: suspiciousApps > 0 ? '#ef4444' : undefined }}>
                        Suspicious Applications
                      </span>
                      {suspiciousApps > 0 && (
                        <span className="card-update-dot" title="Action required" />
                      )}
                    </div>
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

                  <div style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Pending Inquiries</span>
                      {pendingReplyCount > 0 && <span className="card-update-dot" title="Unanswered inquiries" />}
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: pendingReplyCount > 0 ? '#f59e0b' : '#10b981', marginTop: 4 }}>
                      {pendingReplyCount}
                    </div>
                    <Link to="/chief/messages" style={{ fontSize: '0.72rem', color: '#d97706', textDecoration: 'none' }}>
                      To be replied &gt;
                    </Link>
                  </div>

                  <div style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Suspicious Rate</span>
                      {suspiciousApps > 0 && <span className="card-update-dot" title="Flagged cases" />}
                    </div>
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

              {/* Section 3: Quick Action Workflows (Applications -> Appeals -> Messages -> Profile) */}
              <section className="dash-single-card" style={{ padding: 24, background: 'var(--surface-elevated)' }}>
                <h3 className="stitch-section-title" style={{ margin: '0 0 16px', fontSize: '1.1rem' }}>
                  Verification Workflows
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                  {/* 1. Applications */}
                  <Link
                    to="/chief/applications"
                    className="btn btn--secondary"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      padding: '16px 10px',
                      textAlign: 'center',
                      borderRadius: 12,
                      position: 'relative'
                    }}
                  >
                    {(underReviewApps > 0 || suspiciousApps > 0) && (
                      <span className="btn-update-dot-badge" title="Pending applications" />
                    )}
                    <Icon name="applications" size={24} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Applications</span>
                  </Link>

                  {/* 2. Appeals */}
                  <Link
                    to="/chief/appeals"
                    className="btn btn--secondary"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                      padding: '16px 10px',
                      textAlign: 'center',
                      borderRadius: 12,
                      position: 'relative'
                    }}
                  >
                    {pendingAppeals > 0 && (
                      <span className="btn-update-dot-badge" title="Pending appeals" />
                    )}
                    <Icon name="documents" size={24} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Appeals</span>
                  </Link>

                  {/* 3. Messages (next to profile) */}
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
                      position: 'relative',
                      borderColor: pendingReplyCount > 0 ? '#f59e0b' : undefined
                    }}
                  >
                    {pendingReplyCount > 0 && (
                      <span className="btn-update-dot-badge" title="Unanswered messages" />
                    )}
                    <Icon name="bell" size={24} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                      Messages {pendingReplyCount > 0 && `(${pendingReplyCount})`}
                    </span>
                  </Link>

                  {/* 4. Area Profile */}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 className="stitch-section-title" style={{ margin: 0, fontSize: '1.1rem' }}>
                      Urgent Inconsistency Notices
                    </h3>
                    {suspiciousApps > 0 && <span className="card-update-dot" title="Attention required" />}
                  </div>
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
