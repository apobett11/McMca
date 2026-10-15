import React, { useState, useEffect, useMemo } from 'react';
import { MCALayout } from '../components/MCALayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import {
  getMCAIssues,
  markIssueAsDone,
  scheduleIssue,
  cancelIssue,
  WARD_VILLAGES,
  VILLAGE_COLORS
} from '../utils/mcaData.js';

export function MCAIssuesPage() {
  const [issues, setIssues] = useState(() => getMCAIssues());
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'calendar'
  const [selectedVillage, setSelectedVillage] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Status Drilldown Popup Modal state (When top cards are clicked)
  const [statusPopupFilter, setStatusPopupFilter] = useState(null); // 'ALL' | 'waiting' | 'scheduled' | 'done' | 'cancelled' | null
  const [popupViewType, setPopupViewType] = useState('cards'); // 'cards' | 'table'
  const [popupSortField, setPopupSortField] = useState('date'); // 'date' | 'village' | 'urgency' | 'title'
  const [popupSortOrder, setPopupSortOrder] = useState('desc'); // 'asc' | 'desc'

  // Action Modals State
  const [doneModalIssue, setDoneModalIssue] = useState(null);
  const [doneComment, setDoneComment] = useState('');
  const [donePhotoUrl, setDonePhotoUrl] = useState('');

  const [scheduleModalIssue, setScheduleModalIssue] = useState(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('10:00 AM');
  const [scheduleNotes, setScheduleNotes] = useState('');

  const [cancelModalIssue, setCancelModalIssue] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    function refreshIssues() {
      setIssues(getMCAIssues());
    }
    window.addEventListener('mcmca_mca_issues_updated', refreshIssues);
    return () => {
      window.removeEventListener('mcmca_mca_issues_updated', refreshIssues);
    };
  }, []);

  // Top Counts
  const totalCount = issues.length;
  const waitingCount = issues.filter((i) => i.status === 'waiting').length;
  const scheduledCount = issues.filter((i) => i.status === 'scheduled').length;
  const doneCount = issues.filter((i) => i.status === 'done').length;
  const cancelledCount = issues.filter((i) => i.status === 'cancelled').length;

  // General Issues Analytics: Overall & Per Village Resolution Percentage
  const overallResolutionRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const villageAnalytics = useMemo(() => {
    return WARD_VILLAGES.map((v) => {
      const vIssues = issues.filter((i) => i.village === v);
      const vTotal = vIssues.length;
      const vDone = vIssues.filter((i) => i.status === 'done').length;
      const vWaiting = vIssues.filter((i) => i.status === 'waiting').length;
      const vScheduled = vIssues.filter((i) => i.status === 'scheduled').length;
      const rate = vTotal > 0 ? Math.round((vDone / vTotal) * 100) : 0;

      return {
        village: v,
        total: vTotal,
        done: vDone,
        waiting: vWaiting,
        scheduled: vScheduled,
        resolutionRate: rate,
        color: VILLAGE_COLORS[v] || '#3b82f6'
      };
    });
  }, [issues]);

  // Filtered issues for the main page feed
  const displayIssues = useMemo(() => {
    let result = [...issues];

    if (selectedVillage !== 'ALL') {
      result = result.filter((i) => i.village === selectedVillage);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.title?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.residentName?.toLowerCase().includes(q) ||
          i.village?.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [issues, selectedVillage, searchQuery]);

  // Issues for the Top Card Popup Drilldown Modal
  const popupIssuesList = useMemo(() => {
    if (!statusPopupFilter) return [];
    let pool = statusPopupFilter === 'ALL'
      ? [...issues]
      : issues.filter((i) => i.status === statusPopupFilter);

    // Sort inline
    pool.sort((a, b) => {
      let cmp = 0;
      if (popupSortField === 'date') {
        cmp = (a.dateReported || '').localeCompare(b.dateReported || '');
      } else if (popupSortField === 'village') {
        cmp = (a.village || '').localeCompare(b.village || '');
      } else if (popupSortField === 'urgency') {
        cmp = (a.urgency || '').localeCompare(b.urgency || '');
      } else if (popupSortField === 'title') {
        cmp = (a.title || '').localeCompare(b.title || '');
      }
      return popupSortOrder === 'asc' ? cmp : -cmp;
    });

    return pool;
  }, [issues, statusPopupFilter, popupSortField, popupSortOrder]);

  // Submissions
  function handleConfirmDone(e) {
    e.preventDefault();
    if (!doneModalIssue) return;

    const photos = donePhotoUrl.trim()
      ? [donePhotoUrl.trim()]
      : ['https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80'];

    markIssueAsDone(
      doneModalIssue.id,
      doneComment.trim() || 'Work inspected and verified by Hon. MCA Hillary Bett.',
      photos
    );

    setDoneModalIssue(null);
    setDoneComment('');
    setDonePhotoUrl('');
  }

  function handleConfirmSchedule(e) {
    e.preventDefault();
    if (!scheduleModalIssue || !scheduleDate) return;

    scheduleIssue(
      scheduleModalIssue.id,
      scheduleDate,
      scheduleTime,
      scheduleNotes.trim() || 'Ward inspection visit'
    );

    setScheduleModalIssue(null);
    setScheduleDate('');
    setScheduleTime('10:00 AM');
    setScheduleNotes('');
  }

  function handleConfirmCancel(e) {
    e.preventDefault();
    if (!cancelModalIssue) return;

    cancelIssue(cancelModalIssue.id, cancelReason.trim() || 'Dismissed by MCA');
    setCancelModalIssue(null);
    setCancelReason('');
  }

  // Monthly Calendar generator (October 2026 default cycle)
  const calendarDays = useMemo(() => {
    // 31 days in October 2026. Starts on Thursday (day index 4)
    const days = [];
    const scheduledIssues = issues.filter((i) => i.status === 'scheduled' && i.scheduledDate);

    for (let d = 1; d <= 31; d++) {
      const dateStr = `2026-10-${d < 10 ? '0' + d : d}`;
      const dayTasks = scheduledIssues.filter((i) => i.scheduledDate === dateStr);
      days.push({ dayNumber: d, dateStr, tasks: dayTasks });
    }
    return days;
  }, [issues]);

  return (
    <MCALayout pageTitle="Citizen Issues & Developments">
      {/* HEADER & VIEW TOGGLE */}
      <section className="mca-section" style={{ marginBottom: 20 }}>
        <div className="mca-section__header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h1 className="mca-section__title" style={{ fontSize: '1.6rem' }}>
                <Icon name="calendar" size={24} />
                Citizen Issues & Ward Developments
              </h1>
              <p className="mca-section__desc">
                Review resident grievances, village resolution analytics, colored monthly calendar, and diary site inspections.
              </p>
            </div>

            {/* TAB TOGGLE: ISSUES FEED VS CALENDAR */}
            <div style={{ display: 'flex', background: 'var(--mca-surface)', padding: 4, borderRadius: 10, border: '1px solid var(--mca-border)' }}>
              <button
                type="button"
                className={`mca-btn mca-btn--sm ${activeTab === 'feed' ? 'mca-btn--schedule' : 'mca-btn--cancel'}`}
                onClick={() => setActiveTab('feed')}
              >
                <Icon name="review" size={14} /> Issues Feed ({displayIssues.length})
              </button>
              <button
                type="button"
                className={`mca-btn mca-btn--sm ${activeTab === 'calendar' ? 'mca-btn--schedule' : 'mca-btn--cancel'}`}
                onClick={() => setActiveTab('calendar')}
              >
                <Icon name="calendar" size={14} /> Scheduled Calendar ({scheduledCount})
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* GENERAL ISSUES RESOLUTION ANALYTICS (PERCENTAGE & PER VILLAGE) */}
      <section className="mca-section" aria-label="General Issues Analytics">
        <div className="mca-card" style={{ background: 'linear-gradient(145deg, #0e1a38 0%, #152445 100%)', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                Ward Grievance Resolution Analytics
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '4px 0 0' }}>
                Overall ward resolution speed and progress tracking across all 6 administrative villages.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>Ward Resolution Rate</span>
                <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#34d399' }}>{overallResolutionRate}%</span>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', fontWeight: 800 }}>
                {doneCount}/{totalCount}
              </div>
            </div>
          </div>

          {/* Resolution percentage per village grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            {villageAnalytics.map((va) => (
              <div
                key={va.village}
                onClick={() => setSelectedVillage(selectedVillage === va.village ? 'ALL' : va.village)}
                style={{
                  background: 'var(--mca-surface)',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: `1px solid ${selectedVillage === va.village ? va.color : 'var(--mca-border)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: va.color }} />
                    {va.village}
                  </span>
                  <span style={{ fontSize: '0.74rem', color: va.color, fontWeight: 700 }}>
                    {va.resolutionRate}%
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${va.resolutionRate}%`, height: '100%', background: va.color }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.7rem', color: '#94a3b8' }}>
                  <span>{va.done} Done</span>
                  <span>{va.total} Total</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TOP ANALYTICS CARDS (CLICKABLE -> OPENS STRATEGIC POPUP DRILLDOWN WITH TABLE OPTION) */}
      <section className="mca-section" aria-label="Status Quick Cards">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
          {/* Card 1: Total Issues */}
          <div
            className="mca-card mca-card--clickable"
            onClick={() => { setStatusPopupFilter('ALL'); setPopupViewType('cards'); }}
            title="Click to open Total Issues strategic popup"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Total Issues</span>
              <Icon name="review" size={18} />
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff' }}>{totalCount}</div>
            <div style={{ fontSize: '0.72rem', color: '#38bdf8', marginTop: 4 }}>Click for village popup & table →</div>
          </div>

          {/* Card 2: Waiting */}
          <div
            className="mca-card mca-card--clickable"
            onClick={() => { setStatusPopupFilter('waiting'); setPopupViewType('cards'); }}
            title="Click to open Waiting Issues strategic popup"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 600 }}>Waiting</span>
              <span className="mca-badge mca-badge--waiting">{waitingCount}</span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fbbf24' }}>{waitingCount}</div>
            <div style={{ fontSize: '0.72rem', color: '#fbbf24', marginTop: 4 }}>Click for village popup & table →</div>
          </div>

          {/* Card 3: Scheduled */}
          <div
            className="mca-card mca-card--clickable"
            onClick={() => { setStatusPopupFilter('scheduled'); setPopupViewType('cards'); }}
            title="Click to open Scheduled Issues strategic popup"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 600 }}>Scheduled</span>
              <span className="mca-badge mca-badge--scheduled">{scheduledCount}</span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#60a5fa' }}>{scheduledCount}</div>
            <div style={{ fontSize: '0.72rem', color: '#60a5fa', marginTop: 4 }}>Click for village popup & table →</div>
          </div>

          {/* Card 4: Done */}
          <div
            className="mca-card mca-card--clickable"
            onClick={() => { setStatusPopupFilter('done'); setPopupViewType('cards'); }}
            title="Click to open Completed Issues strategic popup"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>Done</span>
              <span className="mca-badge mca-badge--done">{doneCount}</span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#34d399' }}>{doneCount}</div>
            <div style={{ fontSize: '0.72rem', color: '#34d399', marginTop: 4 }}>Click for village popup & table →</div>
          </div>

          {/* Card 5: Cancelled */}
          <div
            className="mca-card mca-card--clickable"
            onClick={() => { setStatusPopupFilter('cancelled'); setPopupViewType('cards'); }}
            title="Click to open Cancelled Issues strategic popup"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: 600 }}>Cancelled</span>
              <span className="mca-badge mca-badge--cancelled">{cancelledCount}</span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f87171' }}>{cancelledCount}</div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4 }}>Click for village popup & table →</div>
          </div>
        </div>
      </section>

      {/* VIEW TAB 1: ISSUES FEED */}
      {activeTab === 'feed' && (
        <>
          {/* SEARCH & VILLAGE FILTER CHIPS */}
          <section className="mca-section" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8' }}>Filter Village:</span>
                <div className="mca-filter-pills">
                  <button
                    type="button"
                    className={`mca-filter-pill ${selectedVillage === 'ALL' ? 'mca-filter-pill--active' : ''}`}
                    onClick={() => setSelectedVillage('ALL')}
                  >
                    All Villages ({issues.length})
                  </button>
                  {WARD_VILLAGES.map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={`mca-filter-pill ${selectedVillage === v ? 'mca-filter-pill--active' : ''}`}
                      onClick={() => setSelectedVillage(v)}
                    >
                      <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: VILLAGE_COLORS[v] || '#fff', marginRight: 5 }} />
                      {v} ({issues.filter(i => i.village === v).length})
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ width: '100%', maxWidth: 320 }}>
                <input
                  type="text"
                  className="mca-input"
                  placeholder="Search grievance or citizen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* ISSUES LIST */}
          <section className="mca-section" aria-label="Issues Feed List">
            {displayIssues.length === 0 ? (
              <div className="mca-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                <p>No issues match current filters.</p>
                <button
                  type="button"
                  className="mca-btn mca-btn--schedule"
                  onClick={() => { setSelectedVillage('ALL'); setSearchQuery(''); }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="mca-issues-list">
                {displayIssues.map((iss) => (
                  <article key={iss.id} className="mca-issue-card">
                    <div className="mca-issue-card__top">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              background: 'rgba(255,255,255,0.08)',
                              color: VILLAGE_COLORS[iss.village] || '#60a5fa',
                              border: `1px solid ${VILLAGE_COLORS[iss.village] || 'rgba(255,255,255,0.1)'}`
                            }}
                          >
                            ● {iss.village}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                            {iss.category}
                          </span>
                        </div>
                        <h3 className="mca-issue-card__title">{iss.title}</h3>
                        <p className="mca-issue-card__desc">{iss.description}</p>
                      </div>

                      <div>
                        {iss.status === 'waiting' && <span className="mca-badge mca-badge--waiting">Waiting</span>}
                        {iss.status === 'scheduled' && <span className="mca-badge mca-badge--scheduled">Scheduled</span>}
                        {iss.status === 'done' && <span className="mca-badge mca-badge--done">Done</span>}
                        {iss.status === 'cancelled' && <span className="mca-badge mca-badge--cancelled">Cancelled</span>}
                      </div>
                    </div>

                    <div className="mca-issue-card__meta">
                      <span><strong>Citizen:</strong> {iss.residentName} ({iss.residentPhone})</span>
                      <span><strong>Reported:</strong> {iss.dateReported}</span>
                      <span><strong>Urgency:</strong> {iss.urgency || 'Normal'}</span>
                      {iss.scheduledDate && (
                        <span style={{ color: '#60a5fa' }}>
                          <strong>Diary Visit:</strong> {iss.scheduledDate} at {iss.scheduledTime || '10:00 AM'}
                        </span>
                      )}
                    </div>

                    {/* ACTIONS */}
                    <div className="mca-issue-card__actions">
                      {iss.status !== 'done' && (
                        <button
                          type="button"
                          className="mca-btn mca-btn--done"
                          onClick={() => {
                            setDoneModalIssue(iss);
                            setDoneComment('');
                            setDonePhotoUrl('');
                          }}
                        >
                          <Icon name="check" size={16} /> Tick as Done (Add Photos)
                        </button>
                      )}

                      {iss.status !== 'done' && iss.status !== 'cancelled' && (
                        <button
                          type="button"
                          className="mca-btn mca-btn--schedule"
                          onClick={() => {
                            setScheduleModalIssue(iss);
                            setScheduleDate(iss.scheduledDate || '');
                            setScheduleTime(iss.scheduledTime || '10:00 AM');
                            setScheduleNotes(iss.scheduledNotes || '');
                          }}
                        >
                          <Icon name="calendar" size={16} />
                          {iss.status === 'scheduled' ? 'Reschedule Diary Visit' : 'Schedule Issue in Diary'}
                        </button>
                      )}

                      {iss.status !== 'done' && iss.status !== 'cancelled' && (
                        <button
                          type="button"
                          className="mca-btn mca-btn--cancel"
                          onClick={() => {
                            setCancelModalIssue(iss);
                            setCancelReason('');
                          }}
                        >
                          Cancel Issue
                        </button>
                      )}

                      {iss.status === 'done' && (
                        <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Icon name="check" size={16} />
                          Published to Homepage Developments ({iss.completedAt || 'Verified'})
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* VIEW TAB 2: SCHEDULED CALENDAR PER MONTH WITH VILLAGE COLOR CODES */}
      {activeTab === 'calendar' && (
        <section className="mca-section" aria-label="Scheduled Calendar">
          <div className="mca-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                  MCA Inspection Diary: October 2026
                </h2>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '4px 0 0' }}>
                  Scheduled site tasks color-coded per village. Click any scheduled event to reschedule or mark done.
                </p>
              </div>

              {/* Village Color Code Legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {WARD_VILLAGES.map((v) => (
                  <span
                    key={v}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '0.72rem',
                      color: '#cbd5e1',
                      background: 'var(--mca-surface)',
                      padding: '3px 8px',
                      borderRadius: 6
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: VILLAGE_COLORS[v] || '#fff' }} />
                    {v}
                  </span>
                ))}
              </div>
            </div>

            {/* Calendar Grid (October 2026) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} style={{ textAlign: 'center', fontSize: '0.74rem', fontWeight: 700, color: '#94a3b8', padding: '6px 0' }}>
                  {d}
                </div>
              ))}

              {/* Empty offset days for Oct 1 (Thursday = 4 empty days Sun-Wed) */}
              {[1, 2, 3, 4].map((offset) => (
                <div key={`offset-${offset}`} style={{ minHeight: 70, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }} />
              ))}

              {/* Day cells 1 to 31 */}
              {calendarDays.map((cd) => (
                <div
                  key={cd.dateStr}
                  style={{
                    minHeight: 80,
                    background: cd.tasks.length > 0 ? 'rgba(59, 130, 246, 0.08)' : 'var(--mca-surface)',
                    border: cd.tasks.length > 0 ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid var(--mca-border)',
                    borderRadius: 8,
                    padding: 6,
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: cd.tasks.length > 0 ? '#38bdf8' : '#94a3b8', marginBottom: 4 }}>
                    {cd.dayNumber}
                  </span>

                  {/* Tasks on this day */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                    {cd.tasks.map((t) => {
                      const color = VILLAGE_COLORS[t.village] || '#3b82f6';
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            setScheduleModalIssue(t);
                            setScheduleDate(t.scheduledDate || '');
                            setScheduleTime(t.scheduledTime || '10:00 AM');
                            setScheduleNotes(t.scheduledNotes || '');
                          }}
                          style={{
                            background: color,
                            color: '#000',
                            padding: '3px 6px',
                            borderRadius: 4,
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            lineHeight: 1.2,
                            cursor: 'pointer',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden'
                          }}
                          title={`${t.scheduledTime}: ${t.title} (${t.village})`}
                        >
                          {t.scheduledTime} • {t.village}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* POPUP: TOP CARD DRILLDOWN MODAL (ANALYTICS PER VILLAGE + TABLE VIEW WITH INLINE SORTS) */}
      {statusPopupFilter && (
        <div className="mca-modal-overlay" onClick={() => setStatusPopupFilter(null)} role="dialog" aria-modal="true">
          <div className="mca-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 860, width: '95%' }}>
            <div className="mca-modal-header">
              <div>
                <h3 className="mca-modal-title">
                  {statusPopupFilter === 'ALL' ? 'Total Issues' : `${statusPopupFilter.toUpperCase()} Issues`} Strategic Drilldown
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  {popupIssuesList.length} issues in category • Resolution analytics by village
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Switch between Cards and Table */}
                <div style={{ display: 'flex', background: 'var(--mca-surface)', padding: 3, borderRadius: 8 }}>
                  <button
                    type="button"
                    className={`mca-btn mca-btn--sm ${popupViewType === 'cards' ? 'mca-btn--schedule' : 'mca-btn--cancel'}`}
                    onClick={() => setPopupViewType('cards')}
                  >
                    Cards
                  </button>
                  <button
                    type="button"
                    className={`mca-btn mca-btn--sm ${popupViewType === 'table' ? 'mca-btn--schedule' : 'mca-btn--cancel'}`}
                    onClick={() => setPopupViewType('table')}
                  >
                    Table
                  </button>
                </div>

                <button
                  type="button"
                  className="mca-modal-close-btn"
                  onClick={() => setStatusPopupFilter(null)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Village Distribution Summary for selected status */}
            <div style={{ background: 'var(--mca-surface)', padding: 12, borderRadius: 10, marginBottom: 16 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>
                Village Distribution ({statusPopupFilter.toUpperCase()}):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {WARD_VILLAGES.map((v) => {
                  const count = popupIssuesList.filter((i) => i.village === v).length;
                  return (
                    <div
                      key={v}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.05)',
                        border: `1px solid ${VILLAGE_COLORS[v]}`,
                        fontSize: '0.78rem'
                      }}
                    >
                      <span style={{ color: VILLAGE_COLORS[v], fontWeight: 700 }}>● {v}:</span>{' '}
                      <span style={{ color: '#fff', fontWeight: 800 }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* VIEW MODE A: TABLE VIEW (WITH INLINE SORTS BELOW TABLE HEAD) */}
            {popupViewType === 'table' ? (
              <div style={{ background: 'var(--mca-surface)', borderRadius: 12, padding: 14, overflowX: 'auto', marginBottom: 16 }}>
                {/* Inline sorts bar directly under table header label */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Inline Sorts:</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['date', 'village', 'urgency', 'title'].map((field) => (
                      <button
                        key={field}
                        type="button"
                        onClick={() => {
                          if (popupSortField === field) {
                            setPopupSortOrder(popupSortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setPopupSortField(field);
                            setPopupSortOrder('desc');
                          }
                        }}
                        style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: popupSortField === field ? '#38bdf8' : 'rgba(255,255,255,0.05)',
                          color: popupSortField === field ? '#000' : '#cbd5e1',
                          border: '1px solid var(--mca-border)'
                        }}
                      >
                        {field.toUpperCase()} {popupSortField === field ? (popupSortOrder === 'asc' ? '↑' : '↓') : ''}
                      </button>
                    ))}
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--mca-border)', color: '#94a3b8' }}>
                      <th style={{ padding: '8px 10px' }}>Title & Scope</th>
                      <th style={{ padding: '8px 10px' }}>Village</th>
                      <th style={{ padding: '8px 10px' }}>Category</th>
                      <th style={{ padding: '8px 10px' }}>Citizen</th>
                      <th style={{ padding: '8px 10px' }}>Date</th>
                      <th style={{ padding: '8px 10px' }}>Status</th>
                      <th style={{ padding: '8px 10px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {popupIssuesList.map((iss) => (
                      <tr key={iss.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: '#fff', maxWidth: 220 }}>
                          {iss.title}
                        </td>
                        <td style={{ padding: '8px 10px', color: VILLAGE_COLORS[iss.village] || '#60a5fa' }}>
                          ● {iss.village}
                        </td>
                        <td style={{ padding: '8px 10px', color: '#cbd5e1' }}>{iss.category}</td>
                        <td style={{ padding: '8px 10px', color: '#94a3b8' }}>{iss.residentName}</td>
                        <td style={{ padding: '8px 10px', color: '#94a3b8' }}>{iss.dateReported}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span className={`mca-badge mca-badge--${iss.status}`}>
                            {iss.status}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          {iss.status !== 'done' && (
                            <button
                              type="button"
                              className="mca-btn mca-btn--sm mca-btn--done"
                              onClick={() => {
                                setDoneModalIssue(iss);
                                setStatusPopupFilter(null);
                              }}
                            >
                              Done
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* VIEW MODE B: CARDS VIEW */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto', marginBottom: 16 }}>
                {popupIssuesList.map((iss) => (
                  <div key={iss.id} className="mca-card" style={{ padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: VILLAGE_COLORS[iss.village] || '#60a5fa' }}>
                            ● {iss.village}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>• {iss.category}</span>
                        </div>
                        <h4 style={{ fontSize: '0.96rem', fontWeight: 700, margin: '2px 0 4px', color: '#fff' }}>
                          {iss.title}
                        </h4>
                        <p style={{ fontSize: '0.82rem', color: '#cbd5e1', margin: 0 }}>
                          {iss.description}
                        </p>
                      </div>

                      <span className={`mca-badge mca-badge--${iss.status}`}>
                        {iss.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button
                type="button"
                className="mca-btn mca-btn--cancel"
                onClick={() => setStatusPopupFilter(null)}
              >
                Close Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP 1: TICK AS DONE MODAL (COMMENTS + PICTURES GO TO HOMEPAGE DEVELOPMENTS) */}
      {doneModalIssue && (
        <div className="mca-modal-overlay" role="dialog" aria-modal="true">
          <div className="mca-modal-dialog">
            <div className="mca-modal-header">
              <div>
                <h3 className="mca-modal-title">Mark Issue as Done</h3>
                <span style={{ fontSize: '0.76rem', color: '#34d399', fontWeight: 600 }}>
                  Completion photos and comments will publish to Homepage Developments!
                </span>
              </div>
              <button
                type="button"
                className="mca-modal-close-btn"
                onClick={() => setDoneModalIssue(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleConfirmDone}>
              <div style={{ background: 'var(--mca-surface)', padding: 12, borderRadius: 10, marginBottom: 16 }}>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Issue Title & Village:</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginTop: 2 }}>
                  {doneModalIssue.title}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#60a5fa', marginTop: 2 }}>
                  {doneModalIssue.village} ({doneModalIssue.category})
                </div>
              </div>

              <div className="mca-form-group">
                <label className="mca-form-label">MCA Completion Comment / Remarks</label>
                <textarea
                  className="mca-textarea"
                  rows={3}
                  placeholder="Detail the work accomplished, handover to residents, or contractor sign-off..."
                  value={doneComment}
                  onChange={(e) => setDoneComment(e.target.value)}
                  required
                />
              </div>

              <div className="mca-form-group">
                <label className="mca-form-label">Attach Project Photo URL (Publishes to Homepage)</label>
                <input
                  type="url"
                  className="mca-input"
                  placeholder="https://images.unsplash.com/... or paste image URL"
                  value={donePhotoUrl}
                  onChange={(e) => setDonePhotoUrl(e.target.value)}
                />
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginTop: 4 }}>
                  Tip: A verified civic infrastructure photo will be assigned if left empty.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  className="mca-btn mca-btn--cancel"
                  onClick={() => setDoneModalIssue(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="mca-btn mca-btn--done"
                  style={{ padding: '10px 20px', fontWeight: 700 }}
                >
                  Confirm & Publish to Homepage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP 2: SCHEDULE / RESCHEDULE MODAL */}
      {scheduleModalIssue && (
        <div className="mca-modal-overlay" role="dialog" aria-modal="true">
          <div className="mca-modal-dialog">
            <div className="mca-modal-header">
              <div>
                <h3 className="mca-modal-title">
                  {scheduleModalIssue.status === 'scheduled' ? 'Reschedule Diary Hearing' : 'Schedule Issue in MCA Diary'}
                </h3>
                <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                  {scheduleModalIssue.village} • {scheduleModalIssue.title}
                </span>
              </div>
              <button
                type="button"
                className="mca-modal-close-btn"
                onClick={() => setScheduleModalIssue(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleConfirmSchedule}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="mca-form-group">
                  <label className="mca-form-label">Inspection Date</label>
                  <input
                    type="date"
                    className="mca-input"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    required
                  />
                </div>
                <div className="mca-form-group">
                  <label className="mca-form-label">Time</label>
                  <input
                    type="text"
                    className="mca-input"
                    placeholder="e.g. 10:00 AM"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="mca-form-group">
                <label className="mca-form-label">Diary / Inspection Notes</label>
                <textarea
                  className="mca-textarea"
                  rows={3}
                  placeholder="e.g. Joint site inspection with Kenya Power Engineer and Village Elders..."
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  className="mca-btn mca-btn--cancel"
                  onClick={() => setScheduleModalIssue(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="mca-btn mca-btn--schedule"
                  style={{ padding: '10px 20px', fontWeight: 700 }}
                >
                  Save in Diary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP 3: CANCEL MODAL */}
      {cancelModalIssue && (
        <div className="mca-modal-overlay" role="dialog" aria-modal="true">
          <div className="mca-modal-dialog">
            <div className="mca-modal-header">
              <h3 className="mca-modal-title" style={{ color: '#f87171' }}>Cancel Citizen Issue</h3>
              <button
                type="button"
                className="mca-modal-close-btn"
                onClick={() => setCancelModalIssue(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleConfirmCancel}>
              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', marginBottom: 14 }}>
                Are you sure you want to cancel <strong>"{cancelModalIssue.title}"</strong>?
              </p>

              <div className="mca-form-group">
                <label className="mca-form-label">Cancellation Reason</label>
                <textarea
                  className="mca-textarea"
                  rows={2}
                  placeholder="e.g. Handled by national road agency, duplicate ticket, etc."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
                <button
                  type="button"
                  className="mca-btn mca-btn--cancel"
                  onClick={() => setCancelModalIssue(null)}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="mca-btn mca-btn--cancel"
                  style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                >
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MCALayout>
  );
}
