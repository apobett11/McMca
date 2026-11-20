import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChiefLayout } from '../components/ChiefLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { RefreshButton } from '../../../components/RefreshButton.jsx';
import { StitchRadialDial } from '../../../components/StitchRadialDial.jsx';
import { getTimeGreeting } from '../../../utils/greeting.js';
import {
  getChiefProfile,
  saveChiefProfile,
  isChiefProfileComplete,
  getChiefApplications,
  syncChiefApplicationsFromDB,
  getChiefMessages,
  getChiefAppeals,
  CHIEF_ADMIN_AREAS,
  getLocationKey
} from '../utils/chiefData.js';
import { CHIEF_SUMMARY } from '../../../data/chiefMock.js';

export function ChiefDashboardPage() {
  const navigate = useNavigate();
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
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    const updated = await syncChiefApplicationsFromDB();
    setApplications(updated || getChiefApplications());
    setMessages(getChiefMessages());
    setAppeals(getChiefAppeals());
    setRefreshing(false);
  }

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

    syncChiefApplicationsFromDB().catch(() => {});

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

        {/* 1. Google Stitch Administrative Command Hero */}
        <section className="chief-command-hero">
          <div className="chief-hero__top">
            <div className="chief-identity-cluster">
              <div className="chief-avatar-ring" aria-hidden="true">
                <div className="chief-avatar-inner">
                  {profile?.fullName ? profile.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'CH'}
                </div>
              </div>
              <div className="chief-identity-text">
                <h1>{greeting}, {profile?.fullName || 'Chief'}</h1>
                <div className="chief-identity-meta">
                  <span className="chief-badge-gold">Administrative Chief Officer</span>
                  <span>•</span>
                  <span>
                    {profileComplete
                      ? `${profile.ward} · Location: ${profile.location} · Sub-Location: ${profile.subLocation}`
                      : 'Administrative credentials and jurisdiction setup required'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <RefreshButton busy={refreshing} onClick={handleRefresh} />
              {profileComplete ? (
                <>
                  <button
                    type="button"
                    className="btn btn--outline btn--compact"
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    style={{ borderRadius: 999 }}
                  >
                    {isEditingProfile ? 'Close Jurisdiction Form' : 'Edit Jurisdiction'}
                  </button>
                  <Link to="/chief/applications" className="btn-chief-primary">
                    <Icon name="applications" size={18} />
                    <span>Vetting Queue ({underReviewApps})</span>
                  </Link>
                </>
              ) : (
                <span className="stitch-status-badge stitch-status-badge--declined" style={{ padding: '6px 14px' }}>
                  Setup Required
                </span>
              )}
            </div>
          </div>

          {/* Interactive Executive Vetting Telemetry (Google Stitch Radial Dials) */}
          <div className="stitch-dial-dock" style={{ marginTop: 22 }}>
            <StitchRadialDial
              percentage={appProcessedPct}
              size={84}
              strokeWidth={7}
              color="#3B82F6"
              label="Cycle Processed"
              sublabel={`${approvedApps + rejectedApps} of ${totalApps} Decided`}
              interactive={true}
              onClick={() => navigate('/chief/applications')}
            />

            <StitchRadialDial
              percentage={totalApps > 0 ? Math.round((underReviewApps / totalApps) * 100) : 0}
              size={84}
              strokeWidth={7}
              color="#F59E0B"
              label="In Vetting Review"
              sublabel={`${underReviewApps} Pending Decisions`}
              interactive={true}
              onClick={() => navigate('/chief/applications?filter=under_review')}
            />

            <StitchRadialDial
              percentage={totalApps > 0 ? Math.round((suspiciousApps / totalApps) * 100) : 0}
              size={84}
              strokeWidth={7}
              color={suspiciousApps > 0 ? '#EF4444' : '#10B981'}
              label="Integrity Check"
              sublabel={suspiciousApps > 0 ? `${suspiciousApps} Discrepancies` : 'Zero Discrepancies'}
              interactive={suspiciousApps > 0}
              onClick={() => navigate('/chief/applications?filter=flagged')}
            />

            <StitchRadialDial
              percentage={appealResolvedPct}
              size={84}
              strokeWidth={7}
              color="#10B981"
              label="Ward Appeals"
              sublabel={`${resolvedAppeals} of ${totalAppeals} Resolved`}
              interactive={true}
              onClick={() => navigate('/chief/appeals')}
            />
          </div>
        </section>

        {/* Profile Success Message */}
        {profileSuccessMsg && (
          <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#4ade80', fontSize: '0.9rem' }}>
            ✓ {profileSuccessMsg}
          </div>
        )}

        {/* REQUIREMENT 1: If personal info is NOT complete (or chief clicks edit), render personal information setup */}
        {(!profileComplete || isEditingProfile) && (
          <section className="dash-single-card" style={{ padding: '24px 28px', background: 'var(--chief-surface, #101C38)', border: '1.5px solid var(--chief-border, rgba(255,255,255,0.08))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 className="stitch-section-title" style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 10, color: '#F8FAFC' }}>
                  <Icon name="profile" size={22} />
                  {profileComplete ? 'Personal Information' : 'Chief Personal Registration'}
                </h2>
                <p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: '0.85rem' }}>
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
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              background: 'rgba(233, 195, 73, 0.08)',
              border: '1px solid rgba(233, 195, 73, 0.25)',
              borderRadius: '1rem'
            }}
          >
            <Icon name="info" size={24} style={{ color: '#E9C349', flexShrink: 0 }} />
            <span style={{ fontSize: '0.92rem', color: '#F8FAFC' }}>
              You need to complete registration of personal details and jurisdiction to unlock the full vetting workstation.
            </span>
          </div>
        ) : (
          /* 2. Google Stitch Operational Two-Column Workstation */
          <div className="chief-stage-grid">
            {/* Left Column: Primary Vetting Operations */}
            <div>
              {/* Urgent Inconsistency & Flagged Verification Card */}
              <section className="chief-card">
                <div className="chief-card-head">
                  <div>
                    <h3 className="chief-card-title">
                      <span style={{ color: '#EF4444' }}>●</span>
                      Urgent Verification Notices
                    </h3>
                    <p className="chief-card-desc">
                      Applicants flagged for national ID or geographic boundary discrepancies
                    </p>
                  </div>
                  {suspiciousApps > 0 && (
                    <Link to="/chief/applications" className="btn btn--outline btn--compact" style={{ borderRadius: 999 }}>
                      View all ({suspiciousApps}) →
                    </Link>
                  )}
                </div>

                <div>
                  {applications.filter((a) => a.isSuspicious).slice(0, 4).map((app) => (
                    <div key={app.id} className="chief-inconsistency-item">
                      <div>
                        <div className="chief-inconsistency-name">{app.fullName}</div>
                        <p className="chief-inconsistency-detail">
                          ID Location: &apos;{app.idLocation}&apos; ≠ Stated: &apos;{app.location}&apos;
                        </p>
                      </div>
                      <Link
                        to="/chief/applications"
                        className="btn btn--table"
                        style={{ fontSize: '0.78rem', padding: '6px 12px', whiteSpace: 'nowrap' }}
                      >
                        Inspect Dossier →
                      </Link>
                    </div>
                  ))}
                  {suspiciousApps === 0 && (
                    <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94A3B8', fontSize: '0.9rem' }}>
                      <span style={{ color: '#10B981', fontWeight: 600 }}>✓ Zero flagged discrepancies</span> detected in your ward.
                    </div>
                  )}
                </div>
              </section>

              {/* Locality & Sub-Location Distribution Card */}
              <section className="chief-card">
                <div className="chief-card-head">
                  <div>
                    <h3 className="chief-card-title">Ward Locality Distribution</h3>
                    <p className="chief-card-desc">{villageCounts.length} Localities across your jurisdiction</p>
                  </div>
                </div>

                <div>
                  {villageCounts.map((v) => (
                    <div key={v.name} className="chief-locality-row">
                      <div className="chief-locality-info">
                        <span style={{ fontWeight: 600, color: '#F8FAFC' }}>{v.name}</span>
                        <span style={{ color: '#94A3B8' }}>{v.count} apps ({v.pct}%)</span>
                      </div>
                      <div className="chief-locality-track">
                        <div className="chief-locality-bar" style={{ width: `${v.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Column: Processing Telemetry & Workflow Access */}
            <div>
              {/* Processing Telemetry */}
              <section className="chief-card">
                <div className="chief-card-head">
                  <div>
                    <h3 className="chief-card-title">Processing Telemetry</h3>
                    <p className="chief-card-desc">Vetting turnaround velocity and approval rates</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={{ padding: 14, borderRadius: 12, background: 'var(--chief-surface-soft)', border: '1px solid var(--chief-border)' }}>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Approval Rate</span>
                    <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10B981', marginTop: 4 }}>{approvalRatePct}%</div>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{approvedApps} approved of {totalApps}</span>
                  </div>

                  <div style={{ padding: 14, borderRadius: 12, background: 'var(--chief-surface-soft)', border: '1px solid var(--chief-border)' }}>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Avg Turnaround</span>
                    <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#F8FAFC', marginTop: 4 }}>1.6 Days</div>
                    <span style={{ fontSize: '0.72rem', color: '#10B981' }}>Well within SLA</span>
                  </div>

                  <div style={{ padding: 14, borderRadius: 12, background: 'var(--chief-surface-soft)', border: '1px solid var(--chief-border)' }}>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Discrepancy Rate</span>
                    <div style={{ fontSize: '1.45rem', fontWeight: 800, color: suspiciousApps > 0 ? '#EF4444' : '#10B981', marginTop: 4 }}>
                      {totalApps > 0 ? Math.round((suspiciousApps / totalApps) * 100) : 0}%
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>ID location mismatch</span>
                  </div>

                  <div style={{ padding: 14, borderRadius: 12, background: 'var(--chief-surface-soft)', border: '1px solid var(--chief-border)' }}>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Pending Inquiries</span>
                    <div style={{ fontSize: '1.45rem', fontWeight: 800, color: pendingReplyCount > 0 ? '#F59E0B' : '#10B981', marginTop: 4 }}>
                      {pendingReplyCount}
                    </div>
                    <Link to="/chief/messages" style={{ fontSize: '0.72rem', color: '#E9C349', textDecoration: 'none' }}>
                      To be replied →
                    </Link>
                  </div>
                </div>
              </section>

              {/* Direct Verification Workflows Hub */}
              <section className="chief-card">
                <div className="chief-card-head">
                  <div>
                    <h3 className="chief-card-title">Administrative Workflows</h3>
                    <p className="chief-card-desc">Direct access to vetting registers and appeals</p>
                  </div>
                </div>

                <div className="chief-action-tiles">
                  <Link to="/chief/applications" className="chief-action-tile">
                    {(underReviewApps > 0 || suspiciousApps > 0) && <span className="chief-dot-indicator" />}
                    <div className="chief-action-tile__icon">
                      <Icon name="applications" size={24} />
                    </div>
                    <span className="chief-action-tile__title">Vetting Queue</span>
                    <span className="chief-action-tile__sub">{underReviewApps} awaiting baraza</span>
                  </Link>

                  <Link to="/chief/appeals" className="chief-action-tile">
                    {pendingAppeals > 0 && <span className="chief-dot-indicator" />}
                    <div className="chief-action-tile__icon">
                      <Icon name="documents" size={24} />
                    </div>
                    <span className="chief-action-tile__title">Appeals Desk</span>
                    <span className="chief-action-tile__sub">{pendingAppeals} unresolved</span>
                  </Link>

                  <Link to="/chief/messages" className="chief-action-tile">
                    {pendingReplyCount > 0 && <span className="chief-dot-indicator" />}
                    <div className="chief-action-tile__icon">
                      <Icon name="bell" size={24} />
                    </div>
                    <span className="chief-action-tile__title">Office Inquiries</span>
                    <span className="chief-action-tile__sub">{pendingReplyCount} pending reply</span>
                  </Link>

                  <Link to="/chief/profile" className="chief-action-tile">
                    <div className="chief-action-tile__icon">
                      <Icon name="profile" size={24} />
                    </div>
                    <span className="chief-action-tile__title">Area Profile</span>
                    <span className="chief-action-tile__sub">Ward jurisdiction</span>
                  </Link>
                </div>
              </section>
            </div>
          </div>
        )}

      </div>
    </ChiefLayout>
  );
}
