import React, { useState, useEffect, useMemo } from 'react';
import { ChiefLayout } from '../components/ChiefLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import {
  getChiefProfile,
  getChiefApplications,
  updateChiefApplicationDecision
} from '../utils/chiefData.js';

export function ChiefApplicationsPage() {
  const profile = getChiefProfile();
  const chiefName = profile?.fullName || 'Chief';

  const [applications, setApplications] = useState(() => getChiefApplications());
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [suspicionFilter, setSuspicionFilter] = useState('all'); // all | suspicious | clean
  const [statusFilter, setStatusFilter] = useState('all'); // all | Under Review | Approved | Rejected
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('submittedDate');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  // Review modal state
  const [reviewApp, setReviewApp] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionFeedback, setActionFeedback] = useState('');

  useEffect(() => {
    function onAppsUpdated(e) {
      setApplications(e.detail);
    }
    window.addEventListener('mcmca_chief_apps_updated', onAppsUpdated);
    return () => window.removeEventListener('mcmca_chief_apps_updated', onAppsUpdated);
  }, []);

  // Top Analytics calculations
  const totalCount = applications.length;
  const approvedCount = applications.filter((a) => a.applicationStatus === 'Approved').length;
  const rejectedCount = applications.filter((a) => a.applicationStatus === 'Rejected').length;
  const suspiciousCount = applications.filter((a) => a.isSuspicious).length;
  const approvalPercentage = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

  // Village / Sub-location distribution
  const villageDistribution = useMemo(() => {
    const map = {};
    applications.forEach((a) => {
      const v = a.village || a.subLocation || 'Other';
      map[v] = (map[v] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({
      name,
      count,
      pct: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
    }));
  }, [applications, totalCount]);

  // Unique locations for dropdown
  const locationOptions = useMemo(() => {
    const set = new Set();
    applications.forEach((a) => {
      if (a.subLocation) set.add(a.subLocation);
      if (a.village) set.add(a.village);
    });
    return Array.from(set);
  }, [applications]);

  // Filter & Sort table data
  const filteredRows = useMemo(() => {
    return applications
      .filter((app) => {
        // Location dropdown filter
        if (selectedLocation !== 'all') {
          const matchSub = app.subLocation?.toLowerCase() === selectedLocation.toLowerCase();
          const matchVillage = app.village?.toLowerCase() === selectedLocation.toLowerCase();
          if (!matchSub && !matchVillage) return false;
        }

        // Suspicion filter
        if (suspicionFilter === 'suspicious' && !app.isSuspicious) return false;
        if (suspicionFilter === 'clean' && app.isSuspicious) return false;

        // Status filter
        if (statusFilter !== 'all' && app.applicationStatus !== statusFilter) return false;

        // Search text
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = app.fullName?.toLowerCase().includes(q);
          const matchSchool = app.school?.toLowerCase().includes(q);
          const matchSerial = app.serial?.toLowerCase().includes(q);
          const matchId = app.nationalId?.toLowerCase().includes(q);
          if (!matchName && !matchSchool && !matchSerial && !matchId) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField] || '';
        let valB = b[sortField] || '';

        if (sortField === 'submittedDate') {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
        } else {
          valA = String(valA).toLowerCase();
          valB = String(valB).toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [applications, selectedLocation, suspicionFilter, statusFilter, search, sortField, sortOrder]);

  function handleSort(field) {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }

  function handleOpenReview(app) {
    setReviewApp(app);
    setReviewNotes('');
    setActionFeedback('');
  }

  function handleExecuteDecision(decision) {
    if (!reviewApp) return;
    const updated = updateChiefApplicationDecision(reviewApp.id, decision, reviewNotes);
    setApplications(updated);
    setActionFeedback(`Application for ${reviewApp.fullName} has been ${decision === 'approve' ? 'Approved' : 'Rejected'}.`);
    setTimeout(() => {
      setReviewApp(null);
      setActionFeedback('');
    }, 1200);
  }

  return (
    <ChiefLayout chiefName={chiefName} pageTitle="Applications" layout="dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* TOP ANALYTICS: Total, Approval %, Suspicious & Village Distribution */}
        <section className="dash-single-card" style={{ padding: '20px 24px', background: 'var(--surface-elevated)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {/* Total Applications */}
            <div style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                Total Applications
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>
                {totalCount}
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Registered for this cycle</span>
            </div>

            {/* Approval Percentage */}
            <div style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                Approval Percentage
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#10b981', marginTop: 4 }}>
                {approvalPercentage}%
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{approvedCount} approved · {rejectedCount} rejected</span>
            </div>

            {/* Suspicious Cases */}
            <div
              style={{
                padding: 14,
                borderRadius: 10,
                background: suspiciousCount > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255,255,255,0.03)',
                border: suspiciousCount > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--glass-border)',
                cursor: 'pointer'
              }}
              onClick={() => setSuspicionFilter(suspicionFilter === 'suspicious' ? 'all' : 'suspicious')}
              title="Click to filter suspicious applications"
            >
              <span style={{ fontSize: '0.75rem', color: suspiciousCount > 0 ? '#ef4444' : '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                ⚠️ Suspicious Applications
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: suspiciousCount > 0 ? '#ef4444' : '#10b981', marginTop: 4 }}>
                {suspiciousCount}
              </div>
              <span style={{ fontSize: '0.75rem', color: suspiciousCount > 0 ? '#ef4444' : '#94a3b8' }}>
                {suspicionFilter === 'suspicious' ? '✓ Showing suspicious only' : 'ID location mismatch — click to filter'}
              </span>
            </div>

            {/* Village Distribution Summary */}
            <div style={{ padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                Village Distribution
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {villageDistribution.map((v) => (
                  <span
                    key={v.name}
                    onClick={() => setSelectedLocation(selectedLocation === v.name ? 'all' : v.name)}
                    style={{
                      fontSize: '0.75rem',
                      padding: '3px 8px',
                      borderRadius: 6,
                      background: selectedLocation === v.name ? '#d97706' : 'rgba(255,255,255,0.06)',
                      color: selectedLocation === v.name ? '#fff' : 'var(--text)',
                      cursor: 'pointer'
                    }}
                  >
                    {v.name}: {v.count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FILTERS & SEARCH BAR */}
        <section className="dash-single-card" style={{ padding: '16px 20px', background: 'var(--surface-elevated)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
              {/* Location Dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>
                  Location / Village
                </label>
                <select
                  className="field__input"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  style={{ minWidth: 160, padding: '7px 10px', fontSize: '0.85rem' }}
                >
                  <option value="all">All Locations (Ward)</option>
                  {locationOptions.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Suspicion Filter Dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>
                  Verification / Suspicion
                </label>
                <select
                  className="field__input"
                  value={suspicionFilter}
                  onChange={(e) => setSuspicionFilter(e.target.value)}
                  style={{
                    minWidth: 180,
                    padding: '7px 10px',
                    fontSize: '0.85rem',
                    borderColor: suspicionFilter === 'suspicious' ? '#ef4444' : undefined,
                    color: suspicionFilter === 'suspicious' ? '#ef4444' : undefined
                  }}
                >
                  <option value="all">All Applications</option>
                  <option value="suspicious">⚠️ Suspicious (ID Mismatch only)</option>
                  <option value="clean">Verified / Clean Only</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>
                  Decision Status
                </label>
                <select
                  className="field__input"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ minWidth: 140, padding: '7px 10px', fontSize: '0.85rem' }}
                >
                  <option value="all">All Statuses</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div style={{ flex: '1 1 200px', maxWidth: 280 }}>
              <label style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>
                Search Applicant
              </label>
              <input
                type="text"
                className="field__input"
                placeholder="Name, School, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', fontSize: '0.85rem' }}
              />
            </div>
          </div>
        </section>

        {/* NOTICE: Suspicious applications cannot be bulk approved */}
        {suspicionFilter === 'suspicious' && (
          <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="review" size={18} />
            <span>
              <strong>Suspicious Applications Filter Active:</strong> There is no bulk or &apos;Accept All&apos; action. Each flagged application must be reviewed individually by clicking <strong>Review</strong>.
            </span>
          </div>
        )}

        {/* SORTABLE APPLICANTS TABLE */}
        <section className="dash-single-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="stitch-section-title" style={{ margin: 0, fontSize: '1.1rem' }}>
              Applicants Queue ({filteredRows.length})
            </h2>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Click column headers to sort table
            </span>
          </div>

          <div className="data-table-wrap" style={{ overflowX: 'auto' }}>
            <table className="data-table data-table--chief" style={{ width: '100%', margin: 0 }}>
              <thead>
                <tr>
                  <th scope="col" onClick={() => handleSort('fullName')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Student {sortField === 'fullName' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th scope="col" onClick={() => handleSort('school')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    School {sortField === 'school' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th scope="col" onClick={() => handleSort('subLocation')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Ward Residence {sortField === 'subLocation' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th scope="col" onClick={() => handleSort('idLocation')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    ID Location {sortField === 'idLocation' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th scope="col" onClick={() => handleSort('isSuspicious')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Suspicion / Risk {sortField === 'isSuspicious' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th scope="col" onClick={() => handleSort('applicationStatus')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Status {sortField === 'applicationStatus' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th scope="col" onClick={() => handleSort('submittedDate')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    Submitted {sortField === 'submittedDate' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th scope="col" style={{ textAlign: 'right', paddingRight: 20 }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '36px 20px', textAlign: 'center', color: '#94a3b8' }}>
                      No applications match the current location or suspicion filters.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr
                      key={row.id}
                      style={{
                        background: row.isSuspicious ? 'rgba(239, 68, 68, 0.04)' : undefined,
                        borderLeft: row.isSuspicious ? '4px solid #ef4444' : undefined
                      }}
                    >
                      <td data-label="Student">
                        <strong>{row.fullName}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ID: {row.nationalId}</div>
                      </td>
                      <td data-label="School">
                        {row.school}
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{row.educationLevel} · {row.grade}</div>
                      </td>
                      <td data-label="Ward Residence">
                        {row.location} / {row.subLocation}
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{row.village}</div>
                      </td>
                      <td data-label="ID Location">
                        <span style={{
                          fontWeight: row.isSuspicious ? 700 : 400,
                          color: row.isSuspicious ? '#ef4444' : 'var(--text)'
                        }}>
                          {row.idLocation}
                        </span>
                      </td>
                      <td data-label="Suspicion / Risk">
                        {row.isSuspicious ? (
                          <span className="badge badge--error" style={{ fontSize: '0.72rem' }}>
                            ⚠️ Location Mismatch
                          </span>
                        ) : (
                          <span className="badge badge--success" style={{ fontSize: '0.72rem' }}>
                            Verified Clean
                          </span>
                        )}
                      </td>
                      <td data-label="Status">
                        <span
                          className={`stitch-status-badge ${
                            row.applicationStatus === 'Approved'
                              ? 'stitch-status-badge--admitted'
                              : row.applicationStatus === 'Rejected'
                                ? 'stitch-status-badge--declined'
                                : 'stitch-status-badge--review'
                          }`}
                        >
                          {row.applicationStatus}
                        </span>
                      </td>
                      <td data-label="Submitted" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        {new Date(row.submittedDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td data-label="Action" style={{ textAlign: 'right', paddingRight: 20 }}>
                        <button
                          type="button"
                          className="btn btn--table"
                          onClick={() => handleOpenReview(row)}
                          style={{
                            padding: '6px 14px',
                            fontSize: '0.82rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            borderColor: row.isSuspicious ? '#ef4444' : undefined,
                            color: row.isSuspicious ? '#ef4444' : undefined
                          }}
                        >
                          <Icon name="review" size={15} />
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* INDIVIDUAL REVIEW POPUP MODAL (singled-out review, approve or reject) */}
        {reviewApp && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(6px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16
            }}
            onClick={() => setReviewApp(null)}
          >
            <div
              className="dash-single-card"
              style={{
                width: '100%',
                maxWidth: 620,
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: 24,
                background: 'var(--surface-elevated, #1e293b)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                border: reviewApp.isSuspicious ? '1px solid #ef4444' : '1px solid var(--glass-border)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--glass-border)', paddingBottom: 14 }}>
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gold-champagne, #ddbb6a)', fontWeight: 700 }}>
                    Individual Application Review
                  </span>
                  <h2 style={{ margin: '4px 0 0', fontSize: '1.25rem', color: 'var(--text)' }}>
                    {reviewApp.fullName}
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                    Serial: {reviewApp.serial} · School: {reviewApp.school}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setReviewApp(null)}
                  style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                >
                  ✕
                </button>
              </div>

              {/* Suspicion Alert Banner */}
              {reviewApp.isSuspicious ? (
                <div style={{
                  margin: '16px 0',
                  padding: 14,
                  borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  fontSize: '0.88rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 4 }}>
                    <Icon name="review" size={18} />
                    <span>⚠️ Suspicious Application Detected</span>
                  </div>
                  <p style={{ margin: 0, lineHeight: 1.5 }}>
                    {reviewApp.suspicionReason}
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#fca5a5' }}>
                    Uploaded ID reads: <strong>&apos;{reviewApp.idLocation}&apos;</strong>, whereas this Chief oversees <strong>&apos;{reviewApp.location}&apos;</strong>. Must be accepted or rejected singly after scrutiny.
                  </p>
                </div>
              ) : (
                <div style={{
                  margin: '16px 0',
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(34, 197, 94, 0.12)',
                  color: '#4ade80',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <Icon name="check" size={16} />
                  <span>ID and Residence location match ({reviewApp.location} / {reviewApp.subLocation}). No anomalies found.</span>
                </div>
              )}

              {/* Applicant Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '16px 0' }}>
                <div style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Education & Grade</span>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)' }}>
                    {reviewApp.educationLevel} · {reviewApp.grade}
                  </div>
                </div>

                <div style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Amount Requested</span>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#10b981' }}>
                    {reviewApp.amountRequested}
                  </div>
                </div>

                <div style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Declared Residence</span>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)' }}>
                    {reviewApp.location} / {reviewApp.subLocation}
                  </div>
                </div>

                <div style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>ID / Certificate Location</span>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: reviewApp.isSuspicious ? '#ef4444' : 'var(--text)' }}>
                    {reviewApp.idLocation}
                  </div>
                </div>

                <div style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Parent / Guardian</span>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)' }}>
                    {reviewApp.parentName} ({reviewApp.parentPhone})
                  </div>
                </div>

                <div style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Current Status</span>
                  <div>
                    <span className={`stitch-status-badge ${
                      reviewApp.applicationStatus === 'Approved'
                        ? 'stitch-status-badge--admitted'
                        : reviewApp.applicationStatus === 'Rejected'
                          ? 'stitch-status-badge--declined'
                          : 'stitch-status-badge--review'
                    }`}>
                      {reviewApp.applicationStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Review Notes Input */}
              <div style={{ margin: '16px 0' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
                  Chief Verification Notes (optional):
                </label>
                <textarea
                  className="field__input"
                  rows={2}
                  placeholder="e.g. Verified with village elder; or Rejected due to out-of-ward residence."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  style={{ width: '100%', padding: 10, fontSize: '0.85rem' }}
                />
              </div>

              {actionFeedback && (
                <div style={{ marginBottom: 12, padding: 10, borderRadius: 6, background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', fontSize: '0.85rem' }}>
                  ✓ {actionFeedback}
                </div>
              )}

              {/* Single Action Buttons: Reject or Approve singly */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--glass-border)', paddingTop: 14 }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => handleExecuteDecision('reject')}
                  style={{
                    background: '#dc2626',
                    color: '#fff',
                    borderColor: '#dc2626',
                    padding: '10px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Icon name="rejected" size={16} />
                  Reject Application
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={() => handleExecuteDecision('approve')}
                  style={{
                    background: '#15803d',
                    color: '#fff',
                    borderColor: '#15803d',
                    padding: '10px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Icon name="approved" size={16} />
                  Approve Application
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ChiefLayout>
  );
}
