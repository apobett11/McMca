import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HelpDeskLayout } from '../components/HelpDeskLayout.jsx';
import { TableSubpage } from '../components/TableSubpage.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { RefreshButton } from '../../../components/RefreshButton.jsx';
import {
  PREDETERMINED_LOCATIONS,
  getHelpDeskApplications,
  syncHelpDeskApplicationsFromDB,
  proceedApplicationToMca,
  contactApplicantRecord
} from '../utils/helpDeskData.js';

export function HelpDeskApplicationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const subpageParam = searchParams.get('table'); // null | 'assessment'

  const [activeSubpage, setActiveSubpage] = useState(subpageParam || null);
  const [applications, setApplications] = useState(() => getHelpDeskApplications());
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const feedbackTimerRef = useRef(null);

  function triggerFeedback(msg, duration = 4000) {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    setFeedback(msg);
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback('');
    }, duration);
  }

  // Modals
  const [proceedModalApp, setProceedModalApp] = useState(null);
  const [proceedNotes, setProceedNotes] = useState('');
  const [contactModalApp, setContactModalApp] = useState(null);
  const [contactRecipient, setContactRecipient] = useState('Parent');
  const [contactText, setContactText] = useState('');

  // Filters for Assessment Subpage Table
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all'); // all | Rejected | Approved | Under Review | Proceeded to MCA Direct
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('submittedDate');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    if (subpageParam) {
      setActiveSubpage(subpageParam);
    }
  }, [subpageParam]);

  function openSubpage(name) {
    setActiveSubpage(name);
    setSearchParams({ table: name });
  }

  function closeSubpage() {
    setActiveSubpage(null);
    setSearchParams({});
  }

  async function reloadData() {
    setRefreshing(true);
    await syncHelpDeskApplicationsFromDB();
    setApplications(getHelpDeskApplications());
    setRefreshing(false);
    triggerFeedback('Applications re-synchronized with live database registry.');
  }

  useEffect(() => {
    function onAppsUpdate(e) {
      if (e.detail) setApplications(e.detail);
    }
    window.addEventListener('mcmca_helpdesk_apps_updated', onAppsUpdate);
    return () => window.removeEventListener('mcmca_helpdesk_apps_updated', onAppsUpdate);
  }, []);

  // Top level calculations
  const totalApps = applications.length;
  const passedApps = applications.filter((a) => a.applicationStatus === 'Approved').length;
  const failedApps = applications.filter((a) => a.applicationStatus === 'Rejected').length;
  const underReviewApps = applications.filter((a) => a.applicationStatus === 'Under Review').length;
  const mcaDirectApps = applications.filter((a) => a.applicationStatus === 'Proceeded to MCA Direct').length;
  const passRate = totalApps > 0 ? Math.round((passedApps / totalApps) * 100) : 0;
  const failRate = totalApps > 0 ? Math.round((failedApps / totalApps) * 100) : 0;
  const ratio = failedApps > 0 ? (passedApps / failedApps).toFixed(2) : (passedApps > 0 ? `${passedApps}:0` : '0:0');

  // Distribution by location
  const locationBreakdown = useMemo(() => {
    return PREDETERMINED_LOCATIONS.map((loc) => {
      const locApps = applications.filter((a) => a.location?.toLowerCase() === loc.toLowerCase());
      const total = locApps.length;
      const passed = locApps.filter((a) => a.applicationStatus === 'Approved').length;
      const failed = locApps.filter((a) => a.applicationStatus === 'Rejected').length;
      const review = locApps.filter((a) => a.applicationStatus === 'Under Review').length;
      const mca = locApps.filter((a) => a.applicationStatus === 'Proceeded to MCA Direct').length;
      const pRate = total > 0 ? Math.round((passed / total) * 100) : 0;
      const fRate = total > 0 ? Math.round((failed / total) * 100) : 0;
      return {
        location: loc,
        total,
        passed,
        failed,
        underReview: review,
        mcaDirect: mca,
        passRate: pRate,
        failRate: fRate
      };
    });
  }, [applications]);

  // Proceed Application Handler
  function handleExecuteProceed(e) {
    e.preventDefault();
    if (!proceedModalApp) return;
    const res = proceedApplicationToMca(proceedModalApp.id, proceedNotes);
    if (res.success) {
      setApplications(getHelpDeskApplications());
      setProceedModalApp(null);
      setProceedNotes('');
      triggerFeedback(`Application ${proceedModalApp.serial} (${proceedModalApp.fullName}) has been proceeded directly to the MCA desk.`, 5000);
    }
  }

  // Contact Applicant Handler
  function handleExecuteContact(e) {
    e.preventDefault();
    if (!contactModalApp) return;
    const contactNumber = contactRecipient === 'Parent' ? contactModalApp.parentPhone : contactModalApp.nationalId;
    contactApplicantRecord(contactModalApp.id, {
      recipientType: contactRecipient,
      contactNumber,
      messageText: contactText
    });
    setContactModalApp(null);
    setContactText('');
    triggerFeedback(`Communication logged and dispatched to ${contactModalApp.fullName}'s ${contactRecipient.toLowerCase()}.`, 5000);
  }

  // Filter & Sort for Assessment Subpage Table
  const filteredApps = useMemo(() => {
    return applications
      .filter((app) => {
        if (selectedLocation !== 'all' && app.location?.toLowerCase() !== selectedLocation.toLowerCase()) {
          return false;
        }
        if (selectedStatus !== 'all' && app.applicationStatus !== selectedStatus) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = app.fullName?.toLowerCase().includes(q);
          const matchSerial = app.serial?.toLowerCase().includes(q);
          const matchSchool = app.school?.toLowerCase().includes(q);
          const matchId = app.nationalId?.toLowerCase().includes(q);
          if (!matchName && !matchSerial && !matchSchool && !matchId) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (sortField === 'submittedDate') {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
        } else if (sortField === 'amountRequested') {
          valA = parseInt(String(valA).replace(/\D/g, '') || '0', 10);
          valB = parseInt(String(valB).replace(/\D/g, '') || '0', 10);
        } else if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = (valB || '').toLowerCase();
        }
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [applications, selectedLocation, selectedStatus, searchQuery, sortField, sortOrder]);

  return (
    <HelpDeskLayout pageTitle="Applications Assessment" layout="dashboard">
      <div className="stitch-dashboard">
        {/* Floating Success / Status Toast with Cancel Button */}
        {feedback && (
          <div className="hd-toast notice" role="status">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="check" size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
              <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{feedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback('')}
              className="hd-toast__close"
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* SUBPAGE: REJECTED APPLICATIONS ASSESSMENT QUEUE TABLE */}
        {/* ========================================================= */}
        {activeSubpage === 'assessment' && (
          <TableSubpage
            title="Rejected Applications Assessment Queue"
            category="Applications"
            onClose={closeSubpage}
            badgeText={`${filteredApps.length} Applications`}
            badgeTone={selectedStatus === 'Rejected' ? 'declined' : 'review'}
            toolbar={
              <div className="hd-table-toolbar">
                {/* Search input with icon */}
                <div className="hd-table-toolbar__search-group">
                  <span className="hd-table-search-icon" aria-hidden="true">
                    <Icon name="search" size={16} />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search applicant name, serial, ID, school..."
                    className="hd-table-search-input"
                  />
                </div>

                {/* Consolidated Grouped Dropdowns: Inline at top of table */}
                <div className="hd-table-toolbar__filters">
                  {/* Status Dropdown Group */}
                  <div className="hd-filter-dropdown-group">
                    <label htmlFor="app-status-sel" className="hd-filter-label">Status:</label>
                    <select
                      id="app-status-sel"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="hd-select-control"
                    >
                      <option value="all">All Statuses ({totalApps})</option>
                      <option value="Rejected">Failed / Flagged ({failedApps})</option>
                      <option value="Approved">Passed / Successful ({passedApps})</option>
                      <option value="Under Review">Under Review ({underReviewApps})</option>
                      <option value="Proceeded to MCA Direct">Proceeded to MCA ({mcaDirectApps})</option>
                    </select>
                  </div>

                  {/* Location Dropdown Group */}
                  <div className="hd-filter-dropdown-group">
                    <label htmlFor="app-loc-sel" className="hd-filter-label">Location:</label>
                    <select
                      id="app-loc-sel"
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="hd-select-control"
                    >
                      <option value="all">All Locations</option>
                      {PREDETERMINED_LOCATIONS.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sort Dropdown Group with Inline Direction Toggle */}
                  <div className="hd-filter-dropdown-group">
                    <label htmlFor="app-sort-sel" className="hd-filter-label">Sort:</label>
                    <select
                      id="app-sort-sel"
                      value={sortField}
                      onChange={(e) => setSortField(e.target.value)}
                      className="hd-select-control"
                    >
                      <option value="submittedDate">Date Submitted</option>
                      <option value="fullName">Applicant Name</option>
                      <option value="amountRequested">Amount Requested</option>
                      <option value="location">Location</option>
                      <option value="applicationStatus">Status</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                      className="hd-sort-direction-btn"
                      title={sortOrder === 'asc' ? 'Ascending (Click for Descending)' : 'Descending (Click for Ascending)'}
                      aria-label="Toggle sort order"
                    >
                      {sortOrder === 'asc' ? '▲ Asc' : '▼ Desc'}
                    </button>
                  </div>
                </div>
              </div>
            }
          >
            <div className="data-table-wrap">
              <table className="data-table" aria-label="Applications assessment table">
                <colgroup>
                  <col style={{ width: '22%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '10%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">Serial &amp; Applicant</th>
                    <th scope="col">School &amp; Level</th>
                    <th scope="col">Location</th>
                    <th scope="col">App Status</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Failure Flag / Notes</th>
                    <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: 32, color: 'var(--text-2)' }}>
                        No applications match the active filters.
                      </td>
                    </tr>
                  ) : (
                    filteredApps.map((row) => {
                      const isRejected = row.applicationStatus === 'Rejected';
                      const isApproved = row.applicationStatus === 'Approved';
                      const isMcaDirect = row.applicationStatus === 'Proceeded to MCA Direct';

                      return (
                        <tr key={row.id} className={isRejected ? 'data-table__row--attention' : ''}>
                          <td>
                            <div className="hd-cell-primary" title={row.fullName}>
                              {row.fullName}
                            </div>
                            <div className="hd-cell-sub">
                              <code className="hd-code">{row.serial}</code>
                              <span className="hd-code-sub">ID: {row.nationalId}</span>
                            </div>
                          </td>
                          <td>
                            <div className="hd-cell-primary" title={row.school}>
                              {row.school}
                            </div>
                            <div className="hd-cell-sub">
                              <span>{row.educationLevel}</span>
                              <span>&bull;</span>
                              <span>{row.grade}</span>
                            </div>
                          </td>
                          <td>
                            <span className="badge badge--neutral">{row.location}</span>
                            <div className="hd-cell-sub" title={row.subLocation}>
                              {row.subLocation}
                            </div>
                          </td>
                          <td>
                            <span
                              className={`stitch-status-badge ${
                                isApproved
                                  ? 'stitch-status-badge--admitted'
                                  : isRejected
                                    ? 'stitch-status-badge--declined'
                                    : isMcaDirect
                                      ? 'stitch-status-badge--admitted'
                                      : 'stitch-status-badge--review'
                              }`}
                            >
                              {row.applicationStatus}
                            </span>
                          </td>
                          <td>
                            <strong style={{ fontSize: '0.84rem', color: '#f8fafc', fontFamily: 'var(--font-mono, monospace)' }}>
                              {row.amountRequested}
                            </strong>
                          </td>
                          <td>
                            {row.chiefReasonForFail ? (
                              <div title={row.chiefReasonForFail}>
                                <span className="hd-reason-tag">
                                  <Icon name="alert" size={12} />
                                  {row.chiefReasonForFail.length > 26
                                    ? `${row.chiefReasonForFail.slice(0, 24)}…`
                                    : row.chiefReasonForFail}
                                </span>
                                {row.mcaOverrideReason && (
                                  <div className="hd-cell-sub" style={{ color: '#60A5FA' }} title={row.mcaOverrideReason}>
                                    MCA: {row.mcaOverrideReason}
                                  </div>
                                )}
                              </div>
                            ) : row.mcaOverrideReason ? (
                              <div className="hd-cell-sub" style={{ color: '#60A5FA' }} title={row.mcaOverrideReason}>
                                MCA: {row.mcaOverrideReason}
                              </div>
                            ) : (
                              <span style={{ color: '#64748b', fontSize: '0.78rem' }}>&mdash; Clean</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                              {/* If failed, can proceed to MCA direct */}
                              {isRejected && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProceedModalApp(row);
                                    setProceedNotes(`Assessed by Help Desk. Supporting documents confirmed for ${row.fullName}. Proceeded to MCA Direct.`);
                                  }}
                                  className="btn btn--primary"
                                  style={{ padding: '3px 8px', fontSize: '0.74rem', whiteSpace: 'nowrap' }}
                                  title="Proceed to MCA Direct"
                                >
                                  MCA Direct
                                </button>
                              )}

                              {/* Contact Student/Parent button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setContactModalApp(row);
                                  setContactRecipient('Parent');
                                  setContactPhone(row.phone || '0712345678');
                                  setContactText(
                                    isRejected
                                      ? `Dear ${row.parentName || row.fullName}, regards ${row.fullName}'s bursary application (${row.serial}): The application was flagged due to "${row.chiefReasonForFail}". Please contact Help Desk or provide clarification before the appeal cutoff.`
                                      : `Dear ${row.parentName || row.fullName}, update regarding ${row.fullName}'s application (${row.serial}): It is currently ${row.applicationStatus}.`
                                  );
                                }}
                                className="btn btn--secondary"
                                style={{ padding: '3px 8px', fontSize: '0.74rem', whiteSpace: 'nowrap' }}
                                title="Contact Applicant / Parent"
                              >
                                Contact
                              </button>

                              {isMcaDirect && (
                                <span className="badge badge--success" style={{ fontSize: '0.72rem', textAlign: 'center' }}>
                                  MCA Direct
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </TableSubpage>
        )}

        {/* ========================================================= */}
        {/* DEFAULT OVERVIEW VIEW (When NO subpage is loaded) */}
        {/* ========================================================= */}
        {!activeSubpage && (
          <section className="dash-single-card hd-card" style={{ padding: 0 }}>
            {/* Header with Title and Sleek Icon Refresh */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div>
                <h2 className="stitch-section-title" style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>
                  Applications Assessment &amp; Location Distribution
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={reloadData}
                  disabled={refreshing}
                  className="btn btn--secondary"
                  aria-label="Refresh telemetry data"
                  title="Refresh data"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Icon name="refresh" size={18} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                </button>
              </div>
            </div>

            {/* Group 1: Grouped Alike Applications Telemetry Tiles (No ranges) */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div
                  className="hd-metric-tile hd-card--interactive"
                  onClick={() => {
                    setSelectedStatus('all');
                    openSubpage('assessment');
                  }}
                  style={{ cursor: 'pointer', padding: 14 }}
                  title="Click to view all monitored applications"
                >
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Total Applications</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>{totalApps}</div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Ratio: {ratio} : 1</span>
                </div>

                <div
                  className="hd-metric-tile hd-card--interactive"
                  onClick={() => {
                    setSelectedStatus('Approved');
                    openSubpage('assessment');
                  }}
                  style={{ cursor: 'pointer', padding: 14 }}
                  title="Click to view passed / approved applications"
                >
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Passed / Approved</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981', marginTop: 4 }}>{passedApps}</div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{passRate}% approval rate</span>
                </div>

                <div
                  className="hd-metric-tile hd-card--interactive"
                  onClick={() => {
                    setSelectedStatus('Rejected');
                    openSubpage('assessment');
                  }}
                  style={{ cursor: 'pointer', padding: 14 }}
                  title="Click to view failed / pre-appeal queue"
                >
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Failed / Rejected</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: failedApps > 0 ? '#ef4444' : '#10b981', marginTop: 4 }}>
                    {failedApps}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{failRate}% pre-appeal queue</span>
                </div>

                <div
                  className="hd-metric-tile hd-card--interactive"
                  onClick={() => {
                    setSelectedStatus('Proceeded to MCA Direct');
                    openSubpage('assessment');
                  }}
                  style={{ cursor: 'pointer', padding: 14 }}
                  title="Click to view applications proceeded to MCA"
                >
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Proceeded to MCA</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--gold-champagne, #ddbb6a)', marginTop: 4 }}>
                    {mcaDirectApps}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{underReviewApps} in review</span>
                </div>
              </div>
            </div>

            {/* Group 2: Action Queue Launcher Banner (Clickable card) */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div
                className="hd-card hd-card--interactive"
                onClick={() => openSubpage('assessment')}
                style={{
                  padding: '18px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>
                      Rejected Applications Queue
                    </h3>
                    <span className="stitch-status-badge stitch-status-badge--declined">
                      {failedApps} Failed Waiting
                    </span>
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
                    Inspect Chief rejection reasons &bull; Proceed directly to MCA Desk &bull; Contact Student / Parent
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openSubpage('assessment'); }}
                  className="btn btn--primary"
                  style={{ padding: '9px 18px', fontSize: '0.88rem' }}
                >
                  <Icon name="applications" size={18} />
                  Open Assessment Queue
                </button>
              </div>
            </div>

            {/* Group 3: Location Distribution Matrix */}
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#fff' }}>
                    Location Distribution
                  </h3>
                  <div style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                    Breakdown across Tendeno, Sorget, Parklands, and Westlands
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openSubpage('assessment')}
                  className="btn btn--secondary"
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                >
                  Filter Queue by Location
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                {locationBreakdown.map((loc) => (
                  <div
                    key={loc.location}
                    className="hd-card hd-card--interactive"
                    onClick={() => {
                      setSelectedLocation(loc.location);
                      openSubpage('assessment');
                    }}
                    style={{
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '0.98rem', color: '#fff' }}>{loc.location}</strong>
                      <span className="badge badge--neutral">{loc.total} Apps</span>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                        <span style={{ color: '#22C55E' }}>Passed: {loc.passed} ({loc.passRate}%)</span>
                        <span style={{ color: '#F87171' }}>Failed: {loc.failed} ({loc.failRate}%)</span>
                      </div>
                      <div style={{ width: '100%', height: 6, borderRadius: 999, background: 'rgba(239, 68, 68, 0.25)', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${loc.passRate}%`,
                            background: '#22C55E',
                            borderRadius: 999
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#94a3b8' }}>
                      <span>In review: {loc.underReview}</span>
                      <span>To MCA: {loc.mcaDirect}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLocation(loc.location);
                        openSubpage('assessment');
                      }}
                      className="btn btn--secondary"
                      style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', padding: '6px' }}
                    >
                      View {loc.location} Queue
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* PROCEED TO MCA DIRECT MODAL (No cancel button) */}
        {/* ========================================================= */}
        {proceedModalApp && (
          <div className="modal-root" role="presentation">
            <button type="button" className="modal-root__backdrop" onClick={() => setProceedModalApp(null)} aria-label="Close proceed modal" />
            <div className="modal-panel hd-card" role="dialog" aria-modal="true" style={{ maxWidth: 520, background: '#070d18', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <header className="modal-panel__header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <h2 className="modal-panel__title" style={{ color: '#fff', fontSize: '1.1rem' }}>Proceed Application to MCA Direct</h2>
                <button type="button" className="modal-panel__close" onClick={() => setProceedModalApp(null)}>×</button>
              </header>
              <form onSubmit={handleExecuteProceed} className="modal-panel__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="notice" style={{ background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.25)', color: '#fff' }}>
                  <strong>Chief Dashboard Reason for Rejection:</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: '#F87171' }}>
                    {proceedModalApp.chiefReasonForFail || 'Verification failure flagged by area chief.'}
                  </p>
                </div>

                <div style={{ fontSize: '0.86rem', color: '#94a3b8' }}>
                  Applicant: <strong style={{ color: '#fff' }}>{proceedModalApp.fullName}</strong> ({proceedModalApp.serial})<br />
                  Location: <strong style={{ color: '#fff' }}>{proceedModalApp.location} &bull; {proceedModalApp.subLocation}</strong><br />
                  Amount: <strong style={{ color: 'var(--gold-champagne, #ddbb6a)' }}>{proceedModalApp.amountRequested}</strong>
                </div>

                <div className="field">
                  <label htmlFor="proceed-notes" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8' }}>
                    Override Justification (Direct to MCA Desk)
                  </label>
                  <textarea
                    id="proceed-notes"
                    rows={3}
                    value={proceedNotes}
                    onChange={(e) => setProceedNotes(e.target.value)}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, background: '#0b1422', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontFamily: 'inherit' }}
                  />
                </div>

                {/* Footer has NO cancel button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                  <button type="submit" className="btn btn--primary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
                    <Icon name="check" size={16} />
                    Confirm &amp; Send to MCA Direct
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* CONTACT STUDENT / PARENT MODAL (No cancel button) */}
        {/* ========================================================= */}
        {contactModalApp && (
          <div className="modal-root" role="presentation">
            <button type="button" className="modal-root__backdrop" onClick={() => setContactModalApp(null)} aria-label="Close contact modal" />
            <div className="modal-panel hd-card" role="dialog" aria-modal="true" style={{ maxWidth: 520, background: '#070d18', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <header className="modal-panel__header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <h2 className="modal-panel__title" style={{ color: '#fff', fontSize: '1.1rem' }}>Contact Applicant / Parent</h2>
                <button type="button" className="modal-panel__close" onClick={() => setContactModalApp(null)}>×</button>
              </header>
              <form onSubmit={handleExecuteContact} className="modal-panel__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ fontSize: '0.86rem', color: '#94a3b8' }}>
                  Applicant: <strong style={{ color: '#fff' }}>{contactModalApp.fullName}</strong> &bull; Serial: {contactModalApp.serial}<br />
                  Status: <strong style={{ color: '#F87171' }}>{contactModalApp.applicationStatus}</strong>
                </div>

                <div className="field">
                  <label htmlFor="contact-recipient" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8' }}>Recipient</label>
                  <select
                    id="contact-recipient"
                    value={contactRecipient}
                    onChange={(e) => setContactRecipient(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, background: '#0b1422', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff' }}
                  >
                    <option value="Parent">Parent: {contactModalApp.parentName} ({contactModalApp.parentPhone})</option>
                    <option value="Student">Student: {contactModalApp.fullName} (ID: {contactModalApp.nationalId})</option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="contact-text" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8' }}>Message (SMS &amp; Portal Notification)</label>
                  <textarea
                    id="contact-text"
                    rows={3}
                    value={contactText}
                    onChange={(e) => setContactText(e.target.value)}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, background: '#0b1422', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontFamily: 'inherit' }}
                  />
                </div>

                {/* Footer has NO cancel button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                  <button type="submit" className="btn btn--primary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
                    <Icon name="support" size={16} />
                    Send Notification
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </HelpDeskLayout>
  );
}
