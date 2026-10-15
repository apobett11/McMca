import React, { useState, useEffect, useMemo } from 'react';
import { HelpDeskLayout } from '../components/HelpDeskLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import {
  getInstitutions,
  getInstitutionApplications,
  updateApplication,
  getDuplicatesAndIssues
} from '../../../data/institutionData.js';

export function HelpDeskInstitutionsPage() {
  const [institutions, setInstitutions] = useState(() => getInstitutions());
  const [applications, setApplications] = useState(() => getInstitutionApplications());
  const [feedback, setFeedback] = useState('');

  // Table Filters & Sort
  const [selectedInstitute, setSelectedInstitute] = useState('All');
  const [selectedIssue, setSelectedIssue] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('institute_asc'); // institute_asc, institute_desc, date_desc, date_asc, name_asc

  // Modals & Action State
  const [selectedApp, setSelectedApp] = useState(null);
  const [smsModalData, setSmsModalData] = useState(null);
  const [smsText, setSmsText] = useState('');

  useEffect(() => {
    function refresh() {
      setInstitutions(getInstitutions());
      setApplications(getInstitutionApplications());
    }
    refresh();
    window.addEventListener('mcmca_institutions_updated', refresh);
    window.addEventListener('mcmca_inst_apps_updated', refresh);
    return () => {
      window.removeEventListener('mcmca_institutions_updated', refresh);
      window.removeEventListener('mcmca_inst_apps_updated', refresh);
    };
  }, []);

  function triggerFeedback(msg) {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 4000);
  }

  // Duplicate and issue detection
  const { duplicateGroups, invalidOrIncomplete } = useMemo(() => {
    return getDuplicatesAndIssues();
  }, [applications]);

  // Filtered and sorted applications
  const filteredApplications = useMemo(() => {
    let result = [...applications];

    // Filter by Institute
    if (selectedInstitute !== 'All') {
      result = result.filter(a => a.preferredInstitute === selectedInstitute);
    }

    // Filter by Issue
    if (selectedIssue === 'Duplicate') {
      result = result.filter(a => (a.issueFlag || '').includes('Duplicate'));
    } else if (selectedIssue === 'Notice') {
      result = result.filter(a => (a.issueFlag || '').includes('Invalid') || (a.issueFlag || '').includes('Notice'));
    } else if (selectedIssue === 'Clean') {
      result = result.filter(a => a.issueFlag === 'Clean' || !a.issueFlag);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a =>
        (a.referenceNo || '').toLowerCase().includes(q) ||
        (a.firstName || '').toLowerCase().includes(q) ||
        (a.lastName || '').toLowerCase().includes(q) ||
        (a.email || '').toLowerCase().includes(q) ||
        (a.phone || '').toLowerCase().includes(q) ||
        (a.preferredInstitute || '').toLowerCase().includes(q)
      );
    }

    // Sort per institute and other metrics
    result.sort((a, b) => {
      if (sortOption === 'institute_asc') {
        const cmp = (a.preferredInstitute || '').localeCompare(b.preferredInstitute || '');
        return cmp !== 0 ? cmp : new Date(b.submittedAt) - new Date(a.submittedAt);
      }
      if (sortOption === 'institute_desc') {
        const cmp = (b.preferredInstitute || '').localeCompare(a.preferredInstitute || '');
        return cmp !== 0 ? cmp : new Date(b.submittedAt) - new Date(a.submittedAt);
      }
      if (sortOption === 'date_desc') {
        return new Date(b.submittedAt) - new Date(a.submittedAt);
      }
      if (sortOption === 'date_asc') {
        return new Date(a.submittedAt) - new Date(b.submittedAt);
      }
      if (sortOption === 'name_asc') {
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      }
      return 0;
    });

    return result;
  }, [applications, selectedInstitute, selectedIssue, searchQuery, sortOption]);

  function handleResolveIssue(appId, newFlag = 'Clean') {
    updateApplication(appId, { issueFlag: newFlag });
    triggerFeedback(`Application status updated to "${newFlag}".`);
  }

  function handleMarkDuplicatesReviewed(items) {
    items.forEach(item => {
      updateApplication(item.id, { issueFlag: 'Clean (Duplicate Verified)' });
    });
    triggerFeedback(`Both applications marked verified and linked.`);
  }

  function openSmsModal(applicantName, phone, reason = 'Duplicate Registration') {
    setSmsModalData({ applicantName, phone, reason });
    setSmsText(`Hello ${applicantName}, this is the McMCA Help Desk regarding your institution registration. Please confirm your primary school preference.`);
  }

  function handleSendSms() {
    triggerFeedback(`SMS notification dispatched to ${smsModalData.phone}.`);
    setSmsModalData(null);
    setSmsText('');
  }

  return (
    <HelpDeskLayout pageTitle="Institutions Admissions Desk">
      <div className="helpdesk-container" style={{ padding: '24px 20px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Page Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{
                background: 'rgba(221,187,106,0.15)',
                color: 'var(--gold-champagne, #ddbb6a)',
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Admissions & Verification Desk
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: 'var(--text, #f8fafc)' }}>
              Institution Applications & Duplicate Resolution
            </h1>
            <p style={{ margin: '6px 0 0', color: 'var(--text-2, #94a3b8)', fontSize: '0.875rem' }}>
              All applications are accepted unconditionally. Review duplicate submissions, resolve candidate notices, and sort by institution.
            </p>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div style={{
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 10,
            padding: '10px 16px',
            color: '#34d399',
            fontSize: '0.875rem',
            fontWeight: 600,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span>✓</span>
            <span>{feedback}</span>
          </div>
        )}

        {/* KPI Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 26
        }}>
          <div style={{
            background: 'var(--surface, #162032)',
            border: '1px solid var(--border, rgba(255,255,255,0.08))',
            borderRadius: 14,
            padding: 18
          }}>
            <div style={{ color: 'var(--text-3, #94a3b8)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>
              Total Applications
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text, #f8fafc)', marginTop: 6 }}>
              {applications.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#60a5fa', marginTop: 4 }}>
              Across {institutions.length} Accredited Institutes
            </div>
          </div>

          <div style={{
            background: 'var(--surface, #162032)',
            border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: 14,
            padding: 18
          }}>
            <div style={{ color: '#34d399', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>
              Accepted (Non-Rejectable)
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#34d399', marginTop: 6 }}>
              {applications.length} (100%)
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-3, #94a3b8)', marginTop: 4 }}>
              All candidates retained & recorded
            </div>
          </div>

          <div style={{
            background: 'var(--surface, #162032)',
            border: duplicateGroups.length > 0 ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--border, rgba(255,255,255,0.08))',
            borderRadius: 14,
            padding: 18
          }}>
            <div style={{ color: '#fbbf24', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>
              Duplicate Email Submissions
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fbbf24', marginTop: 6 }}>
              {duplicateGroups.length} Flags
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-3, #94a3b8)', marginTop: 4 }}>
              Same email used multiple times
            </div>
          </div>

          <div style={{
            background: 'var(--surface, #162032)',
            border: invalidOrIncomplete.length > 0 ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border, rgba(255,255,255,0.08))',
            borderRadius: 14,
            padding: 18
          }}>
            <div style={{ color: '#f87171', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>
              Verification Notices
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f87171', marginTop: 6 }}>
              {invalidOrIncomplete.length} Notices
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-3, #94a3b8)', marginTop: 4 }}>
              Missing docs or invalid contact phone
            </div>
          </div>
        </div>

        {/* SECTION 1: DUPLICATE EMAIL NOTICES & DUAL APPLICATION CARDS */}
        {duplicateGroups.length > 0 && (
          <div style={{ marginBottom: 30 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: '1.1rem' }}>👥</span>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text, #f8fafc)' }}>
                Duplicate Email Submissions Detected ({duplicateGroups.length})
              </h2>
            </div>
            <p style={{ margin: '0 0 14px', fontSize: '0.8125rem', color: 'var(--text-2, #94a3b8)' }}>
              Both applications are shown side-by-side. The Help Desk can review choices, communicate with the candidate, or link both preferences.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {duplicateGroups.map(({ email, items }, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--surface, #162032)',
                    border: '1px solid rgba(245,158,11,0.35)',
                    borderRadius: 16,
                    padding: 20,
                    boxShadow: '0 4px 14px rgba(245,158,11,0.08)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 10,
                    marginBottom: 14,
                    paddingBottom: 10,
                    borderBottom: '1px solid rgba(255,255,255,0.08)'
                  }}>
                    <div>
                      <span style={{
                        background: 'rgba(245,158,11,0.15)',
                        color: '#fbbf24',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        padding: '3px 8px',
                        borderRadius: 6,
                        marginRight: 8
                      }}>
                        Duplicate Email
                      </span>
                      <strong style={{ color: '#f8fafc', fontSize: '0.95rem' }}>{email}</strong>
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginLeft: 8 }}>
                        ({items.length} applications registered)
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => handleMarkDuplicatesReviewed(items)}
                        style={{
                          background: 'rgba(16,185,129,0.15)',
                          color: '#34d399',
                          border: '1px solid rgba(16,185,129,0.3)',
                          borderRadius: 8,
                          padding: '6px 12px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        ✓ Mark Both Verified
                      </button>
                      <button
                        type="button"
                        onClick={() => openSmsModal(`${items[0].firstName} ${items[0].lastName}`, items[0].phone, 'Duplicate Confirmation')}
                        style={{
                          background: 'rgba(59,130,246,0.15)',
                          color: '#60a5fa',
                          border: '1px solid rgba(59,130,246,0.3)',
                          borderRadius: 8,
                          padding: '6px 12px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        📞 SMS Applicant
                      </button>
                    </div>
                  </div>

                  {/* Dual Applications Grid (Showing Both Applications) */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 14
                  }}>
                    {items.map((app, appIdx) => (
                      <div
                        key={app.id}
                        style={{
                          background: 'rgba(15,23,42,0.6)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: 12,
                          padding: 14
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ color: '#60a5fa', fontWeight: 700, fontSize: '0.8125rem' }}>
                            Application #{appIdx + 1}: {app.referenceNo}
                          </span>
                          <span style={{ color: '#34d399', fontSize: '0.72rem', fontWeight: 700 }}>
                            ● Accepted
                          </span>
                        </div>

                        <div style={{ color: '#f8fafc', fontWeight: 800, fontSize: '1rem', marginBottom: 2 }}>
                          {app.firstName} {app.lastName} ({app.gender})
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginBottom: 8 }}>
                          Phone: {app.phone} • Sub-Location: {app.location}
                        </div>

                        <div style={{
                          background: 'rgba(59,130,246,0.08)',
                          borderRadius: 8,
                          padding: '8px 10px',
                          marginBottom: 8,
                          fontSize: '0.8rem'
                        }}>
                          <div style={{ color: '#93c5fd', fontWeight: 700 }}>
                            🏫 {app.preferredInstitute}
                          </div>
                          <div style={{ color: '#cbd5e1', fontSize: '0.75rem', marginTop: 2 }}>
                            Program: {app.preferredCourse || 'Technical Specialization'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b' }}>
                          <span>Submitted: {new Date(app.submittedAt).toLocaleDateString()}</span>
                          <span>Doc: {app.fileName || 'None'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: INVALID / INCOMPLETE APPLICATIONS CARDS */}
        {invalidOrIncomplete.length > 0 && (
          <div style={{ marginBottom: 30 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: '1.1rem' }}>⚠️</span>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text, #f8fafc)' }}>
                Verification Notices ({invalidOrIncomplete.length})
              </h2>
            </div>
            <p style={{ margin: '0 0 14px', fontSize: '0.8125rem', color: 'var(--text-2, #94a3b8)' }}>
              Applications missing mandatory certificate files or with malformed contact numbers. (Still accepted per policy; prompt for document upload).
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 14
            }}>
              {invalidOrIncomplete.map(app => {
                const isShortPhone = (app.phone || '').replace(/\D/g, '').length < 9;
                const isMissingFile = !app.fileName;

                return (
                  <div
                    key={app.id}
                    style={{
                      background: 'var(--surface, #162032)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: 14,
                      padding: 16
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.95rem' }}>
                          {app.firstName} {app.lastName}
                        </div>
                        <div style={{ color: '#60a5fa', fontSize: '0.75rem', fontWeight: 600 }}>
                          {app.referenceNo} • {app.preferredInstitute}
                        </div>
                      </div>
                      <span style={{
                        background: 'rgba(239,68,68,0.15)',
                        color: '#f87171',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 10
                      }}>
                        Notice Required
                      </span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#fca5a5', marginBottom: 10 }}>
                      {isMissingFile && <div>• Missing academic certificate / result slip</div>}
                      {isShortPhone && <div>• Contact phone invalid format: "{app.phone}"</div>}
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button
                        type="button"
                        onClick={() => openSmsModal(`${app.firstName} ${app.lastName}`, app.phone, 'Document Request')}
                        style={{
                          flex: 1,
                          background: 'rgba(59,130,246,0.15)',
                          color: '#60a5fa',
                          border: '1px solid rgba(59,130,246,0.3)',
                          borderRadius: 8,
                          padding: '6px 8px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Request Docs
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolveIssue(app.id, 'Clean')}
                        style={{
                          background: 'rgba(16,185,129,0.15)',
                          color: '#34d399',
                          border: '1px solid rgba(16,185,129,0.3)',
                          borderRadius: 8,
                          padding: '6px 12px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 3: FULL APPLICATIONS TABLE (SORTABLE PER INSTITUTE) */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: '1.1rem' }}>📋</span>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text, #f8fafc)' }}>
              All Recorded Institution Applications ({filteredApplications.length})
            </h2>
          </div>

          {/* Table Filters & Sort Controls */}
          <div style={{
            background: 'var(--surface, #162032)',
            border: '1px solid var(--border, rgba(255,255,255,0.08))',
            borderRadius: 14,
            padding: 16,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16
          }}>
            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 240 }}>
              <span style={{ color: '#94a3b8' }}>🔍</span>
              <input
                type="text"
                placeholder="Search candidate, phone, email, or ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  padding: '7px 12px',
                  color: '#f8fafc',
                  fontSize: '0.85rem',
                  width: '100%',
                  outline: 'none'
                }}
              />
            </div>

            {/* Filter per Institute */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600 }}>Institute:</span>
              <select
                value={selectedInstitute}
                onChange={(e) => setSelectedInstitute(e.target.value)}
                style={{
                  background: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 8,
                  padding: '6px 10px',
                  color: '#f8fafc',
                  fontSize: '0.8125rem'
                }}
              >
                <option value="All">All Institutes ({institutions.length})</option>
                {institutions.map(inst => (
                  <option key={inst.id} value={inst.name}>{inst.name}</option>
                ))}
              </select>
            </div>

            {/* Filter per Issue */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600 }}>Status:</span>
              <select
                value={selectedIssue}
                onChange={(e) => setSelectedIssue(e.target.value)}
                style={{
                  background: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 8,
                  padding: '6px 10px',
                  color: '#f8fafc',
                  fontSize: '0.8125rem'
                }}
              >
                <option value="All">All Flags</option>
                <option value="Clean">Clean</option>
                <option value="Duplicate">Duplicate Email</option>
                <option value="Notice">Verification Notice</option>
              </select>
            </div>

            {/* Sort Options */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600 }}>Sort By:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                style={{
                  background: '#0f172a',
                  border: '1px solid rgba(59,130,246,0.3)',
                  borderRadius: 8,
                  padding: '6px 10px',
                  color: '#60a5fa',
                  fontSize: '0.8125rem',
                  fontWeight: 600
                }}
              >
                <option value="institute_asc">Institution (A → Z)</option>
                <option value="institute_desc">Institution (Z → A)</option>
                <option value="date_desc">Submission Date (Newest)</option>
                <option value="date_asc">Submission Date (Oldest)</option>
                <option value="name_asc">Candidate Name (A → Z)</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div style={{
            background: 'var(--surface, #162032)',
            border: '1px solid var(--border, rgba(255,255,255,0.08))',
            borderRadius: 14,
            overflowX: 'auto',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15,23,42,0.8)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '12px 14px', color: '#94a3b8', fontWeight: 700 }}>Ref / Candidate</th>
                  <th style={{ padding: '12px 14px', color: '#94a3b8', fontWeight: 700 }}>Chosen Institute</th>
                  <th style={{ padding: '12px 14px', color: '#94a3b8', fontWeight: 700 }}>Course / Trade</th>
                  <th style={{ padding: '12px 14px', color: '#94a3b8', fontWeight: 700 }}>Contact Info</th>
                  <th style={{ padding: '12px 14px', color: '#94a3b8', fontWeight: 700 }}>Submitted</th>
                  <th style={{ padding: '12px 14px', color: '#94a3b8', fontWeight: 700 }}>Flag / Issue</th>
                  <th style={{ padding: '12px 14px', color: '#94a3b8', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '12px 14px', color: '#94a3b8', fontWeight: 700 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                      No institution applications match your filter selection.
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map(app => (
                    <tr
                      key={app.id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#f8fafc' }}>
                          {app.firstName} {app.lastName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#60a5fa' }}>
                          {app.referenceNo} • {app.gender}
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: '#e2e8f0' }}>
                          {app.preferredInstitute}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          📍 {app.location}
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px', color: '#cbd5e1' }}>
                        {app.preferredCourse || 'Vocational Training'}
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ color: '#f8fafc' }}>{app.phone}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{app.email || 'No Email'}</div>
                      </td>

                      <td style={{ padding: '12px 14px', color: '#94a3b8', fontSize: '0.78rem' }}>
                        {new Date(app.submittedAt).toLocaleDateString()}
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        {(app.issueFlag || '').includes('Duplicate') ? (
                          <span style={{
                            background: 'rgba(245,158,11,0.15)',
                            color: '#fbbf24',
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.72rem',
                            fontWeight: 700
                          }}>
                            Duplicate Email
                          </span>
                        ) : (app.issueFlag || '').includes('Notice') || (app.issueFlag || '').includes('Invalid') ? (
                          <span style={{
                            background: 'rgba(239,68,68,0.15)',
                            color: '#f87171',
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.72rem',
                            fontWeight: 700
                          }}>
                            Verification Notice
                          </span>
                        ) : (
                          <span style={{
                            background: 'rgba(16,185,129,0.12)',
                            color: '#34d399',
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.72rem',
                            fontWeight: 600
                          }}>
                            Clean
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        {/* Always accepted policy */}
                        <span style={{
                          background: 'rgba(16,185,129,0.15)',
                          color: '#34d399',
                          padding: '4px 10px',
                          borderRadius: 20,
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }} title="Cannot be rejected. Unconditionally accepted.">
                          ✓ Accepted
                        </span>
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedApp(app)}
                          style={{
                            background: 'rgba(59,130,246,0.15)',
                            color: '#60a5fa',
                            border: '1px solid rgba(59,130,246,0.3)',
                            borderRadius: 6,
                            padding: '5px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* DETAILS MODAL */}
        {selectedApp && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15,23,42,0.8)',
              backdropFilter: 'blur(5px)',
              zIndex: 350,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16
            }}
            onClick={() => setSelectedApp(null)}
          >
            <div
              style={{
                background: '#162032',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 18,
                maxWidth: 500,
                width: '100%',
                padding: 24,
                position: 'relative',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  borderRadius: 6,
                  color: '#94a3b8',
                  width: 28,
                  height: 28,
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>

              <span style={{
                background: 'rgba(16,185,129,0.15)',
                color: '#34d399',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 6
              }}>
                Accepted Application
              </span>
              <h2 style={{ margin: '8px 0 2px', fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                {selectedApp.firstName} {selectedApp.lastName}
              </h2>
              <div style={{ color: '#60a5fa', fontSize: '0.8rem', marginBottom: 16 }}>
                Ref: {selectedApp.referenceNo} • Submitted: {new Date(selectedApp.submittedAt).toLocaleString()}
              </div>

              <div style={{
                background: 'rgba(15,23,42,0.6)',
                borderRadius: 12,
                padding: 14,
                fontSize: '0.8125rem',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#94a3b8' }}>Gender:</span>
                  <strong style={{ color: '#f8fafc' }}>{selectedApp.gender}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#94a3b8' }}>National ID:</span>
                  <strong style={{ color: '#f8fafc' }}>{selectedApp.nationalId || 'N/A'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#94a3b8' }}>Candidate Phone:</span>
                  <strong style={{ color: '#f8fafc' }}>{selectedApp.phone}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#94a3b8' }}>Candidate Email:</span>
                  <strong style={{ color: '#f8fafc' }}>{selectedApp.email || 'None'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#94a3b8' }}>Location / Ward Village:</span>
                  <strong style={{ color: '#f8fafc' }}>{selectedApp.location}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#94a3b8' }}>Selected Institute:</span>
                  <strong style={{ color: '#60a5fa' }}>{selectedApp.preferredInstitute}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Selected Course:</span>
                  <strong style={{ color: '#f8fafc' }}>{selectedApp.preferredCourse || 'General'}</strong>
                </div>
              </div>

              <div style={{
                background: 'rgba(15,23,42,0.6)',
                borderRadius: 12,
                padding: 14,
                fontSize: '0.8125rem',
                marginBottom: 16
              }}>
                <div style={{ fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>Parent / Guardian Information:</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#94a3b8' }}>Name:</span>
                  <strong>{selectedApp.parentName || 'N/A'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#94a3b8' }}>Relationship:</span>
                  <strong>{selectedApp.parentRelationship || 'Parent'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#94a3b8' }}>Phone:</span>
                  <strong>{selectedApp.parentPhone || 'N/A'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Email:</span>
                  <strong>{selectedApp.parentEmail || 'N/A'}</strong>
                </div>
              </div>

              {selectedApp.fileName && (
                <div style={{
                  background: 'rgba(59,130,246,0.1)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  borderRadius: 10,
                  padding: 12,
                  fontSize: '0.8rem',
                  color: '#93c5fd',
                  marginBottom: 18
                }}>
                  📎 Uploaded Document: <strong>{selectedApp.fileName}</strong>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => openSmsModal(`${selectedApp.firstName} ${selectedApp.lastName}`, selectedApp.phone, 'Follow-up Call / SMS')}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Contact Candidate
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    color: '#94a3b8',
                    border: '1px solid #475569',
                    borderRadius: 10,
                    padding: '10px',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SMS MODAL */}
        {smsModalData && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15,23,42,0.85)',
              zIndex: 400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16
            }}
            onClick={() => setSmsModalData(null)}
          >
            <div
              style={{
                background: '#162032',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 18,
                maxWidth: 440,
                width: '100%',
                padding: 22,
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', color: '#f8fafc' }}>
                Dispatch Contact SMS
              </h3>
              <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 14 }}>
                To: {smsModalData.applicantName} ({smsModalData.phone})
              </div>

              <textarea
                rows={4}
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: '#0f172a',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 10,
                  padding: 12,
                  color: '#f8fafc',
                  fontSize: '0.85rem',
                  resize: 'vertical',
                  marginBottom: 16
                }}
              />

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setSmsModalData(null)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: '1px solid #475569',
                    color: '#94a3b8',
                    borderRadius: 10,
                    padding: 10,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendSms}
                  style={{
                    flex: 2,
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 10,
                    padding: 10,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </HelpDeskLayout>
  );
}
