import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChiefLayout } from '../components/ChiefLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import {
  getChiefProfile,
  isChiefProfileComplete,
  getChiefAppeals,
  updateChiefAppealDecision
} from '../utils/chiefData.js';

export function ChiefAppealsPage() {
  const profile = getChiefProfile();
  const chiefName = profile?.fullName || 'Chief';

  const [appeals, setAppeals] = useState(() => getChiefAppeals());
  const [selectedSchool, setSelectedSchool] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('appealSubmissionDate');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'

  // Review modal state
  const [reviewAppeal, setReviewAppeal] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionFeedback, setActionFeedback] = useState('');

  useEffect(() => {
    function onAppealsUpdated(e) {
      setAppeals(e.detail);
    }
    window.addEventListener('mcmca_chief_appeals_updated', onAppealsUpdated);
    return () => window.removeEventListener('mcmca_chief_appeals_updated', onAppealsUpdated);
  }, []);

  // Top Analytics calculations
  const totalCount = appeals.length;
  const approvedCount = appeals.filter((a) => a.appealStatus === 'Approved').length;
  const rejectedCount = appeals.filter((a) => a.appealStatus === 'Rejected').length;
  const pendingCount = appeals.filter((a) => a.appealStatus === 'Submitted' || a.appealStatus === 'Under Review' || a.appealStatus === 'Clarification Requested').length;
  const resolvedCount = approvedCount + rejectedCount;
  const resolvedPercentage = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

  // School options
  const schoolOptions = useMemo(() => {
    const set = new Set();
    appeals.forEach((a) => {
      if (a.school) set.add(a.school);
    });
    return Array.from(set);
  }, [appeals]);

  // Reason distribution / grounds breakdown
  const groundsSummary = useMemo(() => {
    const grounds = {};
    appeals.forEach((a) => {
      let label = 'General Ground';
      const r = (a.appealReason || '').toLowerCase();
      if (r.includes('deadline') || r.includes('late')) label = 'Late Deadline';
      else if (r.includes('income') || r.includes('affidavit')) label = 'Income Change';
      else if (r.includes('guardian') || r.includes('parent')) label = 'Guardian Change';
      grounds[label] = (grounds[label] || 0) + 1;
    });
    return Object.entries(grounds).map(([name, count]) => ({ name, count }));
  }, [appeals]);

  // Filter & Sort table data
  const filteredRows = useMemo(() => {
    return appeals
      .filter((app) => {
        // School filter
        if (selectedSchool !== 'all' && app.school?.toLowerCase() !== selectedSchool.toLowerCase()) {
          return false;
        }

        // Status filter
        if (statusFilter !== 'all' && app.appealStatus !== statusFilter) return false;

        // Search text
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = app.fullName?.toLowerCase().includes(q);
          const matchSchool = app.school?.toLowerCase().includes(q);
          const matchReason = app.appealReason?.toLowerCase().includes(q);
          const matchId = app.id?.toLowerCase().includes(q);
          if (!matchName && !matchSchool && !matchReason && !matchId) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField] || '';
        let valB = b[sortField] || '';

        if (sortField === 'appealSubmissionDate' || sortField === 'lastUpdated') {
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
  }, [appeals, selectedSchool, statusFilter, search, sortField, sortOrder]);

  function handleSort(field) {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }

  function handleOpenReview(app) {
    setReviewAppeal(app);
    setReviewNotes(app.reviewNotes || '');
    setActionFeedback('');
  }

  function handleExecuteDecision(decision) {
    if (!reviewAppeal) return;
    const updated = updateChiefAppealDecision(reviewAppeal.id, decision, reviewNotes);
    setAppeals(updated);
    const statusLabel = decision === 'approve' ? 'Approved' : decision === 'reject' ? 'Rejected' : 'Clarification Requested';
    setActionFeedback(`Appeal for ${reviewAppeal.fullName} marked as ${statusLabel}.`);
    setTimeout(() => {
      setReviewAppeal(null);
      setActionFeedback('');
    }, 1200);
  }

  return (
    <ChiefLayout chiefName={chiefName} pageTitle="Appeals" layout="dashboard">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {!isChiefProfileComplete(profile) ? (
          <div
            className="dash-single-card"
            style={{
              padding: '40px 24px',
              textAlign: 'center',
              background: 'var(--surface-elevated)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(217, 119, 6, 0.15)',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Icon name="info" size={26} />
            </div>
            <div>
              <h2 style={{ margin: '0 0 6px', fontSize: '1.25rem', color: 'var(--text)' }}>Registration Required</h2>
              <p style={{ margin: 0, color: 'var(--text-2, #94a3b8)', fontSize: '0.92rem', maxWidth: 440 }}>
                You need to complete registration of personal details to access the applications and appeals.
              </p>
            </div>
            <Link
              to="/chief/home"
              className="btn btn--primary"
              style={{ borderRadius: 999, padding: '10px 24px', textDecoration: 'none' }}
            >
              Complete Registration on Dashboard
            </Link>
          </div>
        ) : (
          <>
            {/* COMPACT HORIZONTAL ANALYTICS (little numbers in a horizontal card) */}
            <section
              className="dash-single-card"
              style={{
                padding: '12px 18px',
                background: 'var(--surface-elevated)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Total:</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}>{totalCount}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Resolution:</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#10b981' }}>{resolvedPercentage}%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Approved:</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#10b981' }}>{approvedCount}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: '0.74rem', color: pendingCount > 0 ? '#f59e0b' : '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Pending Hearing:</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 700, color: pendingCount > 0 ? '#f59e0b' : '#10b981' }}>{pendingCount}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Grounds:</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}>{groundsSummary.length} categories</span>
                </div>
              </div>
            </section>

            {/* SORTABLE APPEALS TABLE WITH SORTS & FILTERS IN TABLE HEAD */}
            <section className="dash-single-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--glass-border)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 className="stitch-section-title" style={{ margin: 0, fontSize: '1.05rem' }}>
                    Appeals Queue ({filteredRows.length})
                  </h2>
                  {search && (
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      filtering for &quot;{search}&quot;
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 220 }}>
                  <input
                    type="text"
                    className="field__input"
                    placeholder="Search applicant, school, reason..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ padding: '6px 12px', fontSize: '0.82rem', width: 220, borderRadius: 6 }}
                  />
                  {(selectedSchool !== 'all' || statusFilter !== 'all' || search) && (
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => {
                        setSelectedSchool('all');
                        setStatusFilter('all');
                        setSearch('');
                      }}
                      style={{ padding: '6px 10px', fontSize: '0.75rem', borderRadius: 6, whiteSpace: 'nowrap' }}
                      title="Reset all filters"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              <div className="data-table-wrap" style={{ overflowX: 'auto' }}>
                <table className="data-table data-table--chief" style={{ width: '100%', margin: 0 }}>
                  <thead>
                    <tr>
                      <th scope="col" onClick={() => handleSort('fullName')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        Student {sortField === 'fullName' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th scope="col" style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span onClick={() => handleSort('school')} style={{ cursor: 'pointer' }}>
                            School {sortField === 'school' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                          </span>
                          <select
                            value={selectedSchool}
                            onChange={(e) => setSelectedSchool(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 4px',
                              borderRadius: 4,
                              border: '1px solid var(--border-subtle, #334155)',
                              background: 'var(--surface-container-high, #1e293b)',
                              color: 'inherit',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="all">All Schools</option>
                            {schoolOptions.map((sch) => (
                              <option key={sch} value={sch}>{sch}</option>
                            ))}
                          </select>
                        </div>
                      </th>
                      <th scope="col" onClick={() => handleSort('appealReason')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        Appeal Grounds {sortField === 'appealReason' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th scope="col" onClick={() => handleSort('supportingDocumentsStatus')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        Evidence Status {sortField === 'supportingDocumentsStatus' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th scope="col" style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span onClick={() => handleSort('appealStatus')} style={{ cursor: 'pointer' }}>
                            Appeal Status {sortField === 'appealStatus' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                          </span>
                          <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 4px',
                              borderRadius: 4,
                              border: '1px solid var(--border-subtle, #334155)',
                              background: 'var(--surface-container-high, #1e293b)',
                              color: 'inherit',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="all">All Statuses</option>
                            <option value="Submitted">Submitted</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Clarification Requested">Clarification</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>
                      </th>
                      <th scope="col" onClick={() => handleSort('appealSubmissionDate')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        Submitted {sortField === 'appealSubmissionDate' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th scope="col" style={{ textAlign: 'right', paddingRight: 20 }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '36px 20px', textAlign: 'center', color: '#94a3b8' }}>
                          No appeals match the current filters.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row) => (
                        <tr key={row.id}>
                          <td data-label="Student">
                            <strong>{row.fullName}</strong>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Case #{row.id}</div>
                          </td>
                          <td data-label="School">
                            {row.school}
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{row.educationLevel} · {row.grade}</div>
                          </td>
                          <td data-label="Appeal Grounds" style={{ maxWidth: 280 }}>
                            <div style={{ fontSize: '0.84rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.appealReason}>
                              {row.appealReason}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#ef4444' }}>
                              Rejection: {row.originalRejectionReason}
                            </div>
                          </td>
                          <td data-label="Evidence Status">
                            <span className={`badge ${row.supportingDocumentsStatus === 'Complete' ? 'badge--success' : 'badge--error'}`} style={{ fontSize: '0.72rem' }}>
                              {row.supportingDocumentsStatus}
                            </span>
                          </td>
                          <td data-label="Appeal Status">
                            <span
                              className={`stitch-status-badge ${
                                row.appealStatus === 'Approved'
                                  ? 'stitch-status-badge--admitted'
                                  : row.appealStatus === 'Rejected'
                                    ? 'stitch-status-badge--declined'
                                    : 'stitch-status-badge--review'
                              }`}
                            >
                              {row.appealStatus}
                            </span>
                          </td>
                          <td data-label="Submitted" style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                            {new Date(row.appealSubmissionDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td data-label="Action" style={{ textAlign: 'right', paddingRight: 20 }}>
                            <button
                              type="button"
                              className="btn btn--secondary btn--table"
                              onClick={() => handleOpenReview(row)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', padding: '5px 12px' }}
                            >
                              <Icon name="review" size={14} />
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

            {/* INDIVIDUAL APPEAL REVIEW MODAL */}
            {reviewAppeal && (
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.75)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999,
                  padding: 16
                }}
              >
                <div
                  className="dash-single-card"
                  style={{
                    width: '100%',
                    maxWidth: 580,
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    padding: 24,
                    background: 'var(--surface-elevated)',
                    border: '1px solid var(--glass-border)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
                  }}
                >
                  {/* Modal Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--glass-border)', paddingBottom: 14 }}>
                    <div>
                      <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gold-champagne, #ddbb6a)', fontWeight: 700 }}>
                        Appeal Verification Workspace
                      </span>
                      <h2 style={{ margin: '4px 0 0', fontSize: '1.25rem', color: 'var(--text)' }}>
                        {reviewAppeal.fullName}
                      </h2>
                      <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                        Case #{reviewAppeal.id} · {reviewAppeal.school} ({reviewAppeal.educationLevel} - {reviewAppeal.grade})
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => setReviewAppeal(null)}
                      style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Ground & Rejection Summary */}
                  <div style={{
                    margin: '16px 0',
                    padding: 14,
                    borderRadius: 8,
                    background: 'rgba(217, 119, 6, 0.08)',
                    border: '1px solid rgba(217, 119, 6, 0.25)'
                  }}>
                    <strong style={{ fontSize: '0.85rem', color: '#f59e0b' }}>Submitted Appeal Grounds:</strong>
                    <p style={{ margin: '4px 0 10px', fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.5 }}>
                      &ldquo;{reviewAppeal.appealReason}&rdquo;
                    </p>
                    <div style={{ fontSize: '0.8rem', color: '#ef4444' }}>
                      <strong>Original Rejection Reason:</strong> {reviewAppeal.originalRejectionReason}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '16px 0' }}>
                    <div style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Supporting Documents</span>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: reviewAppeal.supportingDocumentsStatus === 'Complete' ? '#10b981' : '#ef4444' }}>
                        {reviewAppeal.supportingDocumentsStatus}
                      </div>
                    </div>

                    <div style={{ padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Current Appeal Status</span>
                      <div>
                        <span className={`stitch-status-badge ${
                          reviewAppeal.appealStatus === 'Approved'
                            ? 'stitch-status-badge--admitted'
                            : reviewAppeal.appealStatus === 'Rejected'
                              ? 'stitch-status-badge--declined'
                              : 'stitch-status-badge--review'
                        }`}>
                          {reviewAppeal.appealStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Review Notes Input */}
                  <div style={{ margin: '16px 0' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
                      Chief Determination Notes (optional):
                    </label>
                    <textarea
                      className="field__input"
                      rows={2}
                      placeholder="e.g. Evidence examined and verified valid; or Documents still inadequate."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      style={{ width: '100%', padding: 10, fontSize: '0.85rem' }}
                    />
                  </div>

                  {/* Action Feedback */}
                  {actionFeedback && (
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: 8,
                      background: 'rgba(34, 197, 94, 0.15)',
                      color: '#4ade80',
                      fontSize: '0.88rem',
                      marginBottom: 16
                    }}>
                      ✓ {actionFeedback}
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--glass-border)', paddingTop: 16 }}>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => setReviewAppeal(null)}
                      style={{ padding: '8px 16px' }}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="btn"
                      onClick={() => handleExecuteDecision('reject')}
                      style={{
                        background: '#dc2626',
                        color: '#fff',
                        borderColor: '#dc2626',
                        padding: '8px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Icon name="rejected" size={16} />
                      Reject Appeal
                    </button>

                    <button
                      type="button"
                      className="btn"
                      onClick={() => handleExecuteDecision('approve')}
                      style={{
                        background: '#15803d',
                        color: '#fff',
                        borderColor: '#15803d',
                        padding: '8px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Icon name="approved" size={16} />
                      Approve Appeal
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </ChiefLayout>
  );
}
