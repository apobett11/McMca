import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell.jsx';
import { SectionCard } from '../components/SectionCard.jsx';
import { StudentCard } from '../components/StudentCard.jsx';
import { AddChildModal } from '../components/AddChildModal.jsx';
import { Icon } from '../components/Icon.jsx';
import { PARENT, LINKED_STUDENTS } from '../data/parentMock.js';
import { getTimeGreeting } from '../utils/greeting.js';

function DashboardSkeleton() {
  return (
    <div className="skeleton-wrap" aria-busy="true" aria-label="Loading dashboard">
      <div className="skeleton skeleton--hero" />
      <div className="skeleton skeleton--line" />
      <div className="skeleton skeleton--line-short" />
    </div>
  );
}

export function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [addChildOpen, setAddChildOpen] = useState(false);
  const greeting = getTimeGreeting();

  const stats = useMemo(() => {
    const urgent = LINKED_STUDENTS.filter((s) => s.requiresAttention).length;
    const approved = LINKED_STUDENTS.filter((s) =>
      ['Approved', 'Disbursed', 'Funds Sent'].includes(s.applicationStatus)
    ).length;
    return {
      linked: LINKED_STUDENTS.length,
      urgent,
      approved
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(timer);
  }, []);

  return (
    <PageShell
      pageTitle="Dashboard"
      notificationBadge={stats.urgent > 0}
      layout="dashboard"
      userInitials="MK"
      portalLabel="Parent portal"
    >
      <section className="parent-hero page-section--full" aria-label="Household overview">
        <div className="parent-hero__content">
          <p className="parent-hero__greeting">
            {greeting}, {PARENT.fullName.split(' ')[0]}
          </p>
          <h1 className="parent-hero__title">Household overview</h1>
          <p className="parent-hero__sub">
            Overview and navigation for linked student dashboards — applications, uploads, and
            appeals happen inside each child&apos;s profile.
          </p>
        </div>
        <div className="parent-hero__chips" role="list">
          <div className="stat-chip stat-chip--blue" role="listitem">
            <span className="stat-chip__value">{stats.linked}</span>
            <span className="stat-chip__label">Linked students</span>
          </div>
          <div className="stat-chip stat-chip--orange" role="listitem">
            <span className="stat-chip__value">{stats.urgent}</span>
            <span className="stat-chip__label">Need attention</span>
          </div>
          <div className="stat-chip stat-chip--green" role="listitem">
            <span className="stat-chip__value">{stats.approved}</span>
            <span className="stat-chip__label">Approved / disbursed</span>
          </div>
        </div>
      </section>

      {stats.urgent > 0 ? (
        <div className="alert-banner page-section--full" role="status">
          <Icon name="bell" size={20} />
          <div>
            <strong>{stats.urgent} student(s) need attention</strong>
            <p>Review missing documents or pending items — open their profile to take action.</p>
          </div>
          <Link className="btn btn--secondary btn--compact" to="/documents">
            View documents
          </Link>
        </div>
      ) : null}

      <SectionCard
        title="Linked students"
        className="page-section--full"
        id="linked-students"
      >
        <p className="section-card__lead section-card__lead--left">
          Summary cards only — use <strong>View profile</strong> to open the operational student
          dashboard.
        </p>
        <button
          type="button"
          className="btn btn--accent"
          onClick={() => setAddChildOpen(true)}
        >
          <Icon name="plus" size={20} />
          Add child
        </button>
      </SectionCard>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="student-cards-grid page-section--full">
          {LINKED_STUDENTS.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      )}

      <SectionCard title="Recent household notifications" className="page-section--full">
        <ul className="feed-list">
          {LINKED_STUDENTS.filter((s) => s.requiresAttention || s.latestNotification)
            .slice(0, 3)
            .map((s) => (
              <li key={s.id} className={`feed-item ${s.requiresAttention ? 'feed-item--unread' : ''}`}>
                <div className="feed-item__icon" aria-hidden="true">
                  <Icon name="bell" size={20} />
                </div>
                <div>
                  <p className="feed-item__tag">{s.fullName}</p>
                  <p className="feed-item__title">{s.latestNotification}</p>
                  <p className="feed-item__body">{s.latestActivity}</p>
                </div>
              </li>
            ))}
        </ul>
        <Link className="btn btn--ghost" to="/notifications">
          See all notifications
        </Link>
      </SectionCard>

      <AddChildModal open={addChildOpen} onClose={() => setAddChildOpen(false)} />
    </PageShell>
  );
}
