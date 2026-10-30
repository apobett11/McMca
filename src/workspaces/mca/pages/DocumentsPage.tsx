import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from '../../../components/Icon.jsx';
import { RefreshButton } from '../../../components/RefreshButton.jsx';
import { ChiefLocationModal } from '../../../dashboards/helpdesk/components/ChiefLocationModal.jsx';
import { getFullApplicantPool, WARD_LOCATIONS, type WardApplicant } from '../../../data/scalableWardDataset.ts';
import {
  fetchHelpDeskAnalytics,
  getCachedAnalytics,
  type HelpDeskAnalyticsSummary
} from '../../helpdesk/services/helpDeskService.ts';
import { kes, num, pct } from '../../lib/format.ts';

export function DocumentsPage() {
  const [analytics, setAnalytics] = useState<HelpDeskAnalyticsSummary>(getCachedAnalytics());
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'comparable' | 'schoolLevels' | 'accountTypes' | 'riseAndRange'>('comparable');

  // Drilldown Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFilter, setModalFilter] = useState<'all' | 'primary' | 'secondary' | 'tertiary' | 'independent' | 'custody' | 'delegated' | 'parents'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Location drilldown modal
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [locationMetric, setLocationMetric] = useState<'total' | 'completed' | 'incomplete_students' | 'incomplete_parents'>('total');

  const applicants = useMemo(() => getFullApplicantPool(), [refreshing]);

  useEffect(() => {
    fetchHelpDeskAnalytics().then(setAnalytics).catch(() => {});
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const data = await fetchHelpDeskAnalytics();
      setAnalytics(data);
    } finally {
      setTimeout(() => setRefreshing(false), 300);
    }
  }

  // =========================================================================================
  // DOCUMENT INTELLIGENCE CALCULATIONS
  // =========================================================================================
  const totalRecords = applicants.length; // 1,260

  // 1. STUDENTS VS PARENTS
  // Total parents: Guardians associated with minor/delegated students
  const parentRecordsTotal = 765;
  const parentRecordsCompleted = 598; // 78.2%
  const parentRecordsIncomplete = parentRecordsTotal - parentRecordsCompleted;
  const parentCompletionPct = Math.round((parentRecordsCompleted / parentRecordsTotal) * 100);

  const studentRecordsTotal = totalRecords;
  const studentRecordsCompleted = applicants.filter((a) => a.inMasterVerifiedPool).length; // 1,025
  const studentRecordsIncomplete = totalRecords - studentRecordsCompleted; // 235
  const studentCompletionPct = Math.round((studentRecordsCompleted / studentRecordsTotal) * 100);

  // 2. STUDENTS ACCORDING TO SCHOOL LEVEL: Primary, Secondary, Tertiary
  // Primary (under 14 / special grants / junior secondary)
  const primaryCount = 120;
  const primaryVerified = 104; // 86.7%
  const primaryPending = primaryCount - primaryVerified;
  const primaryAwardTotal = 540000;
  const primaryAvgFee = 8500;

  // Secondary (Day & Boarding)
  const secondaryApplicants = applicants.filter((a) => a.institutionCategory === 'Secondary');
  const secondaryCount = secondaryApplicants.length; // ~655
  const secondaryVerified = secondaryApplicants.filter((a) => a.inMasterVerifiedPool).length;
  const secondaryPending = secondaryCount - secondaryVerified;
  const secondaryAwardTotal = secondaryApplicants.filter((a) => a.inMasterVerifiedPool).reduce((s, a) => s + a.allocatedKes, 0);
  const secondaryAvgFee = Math.round(secondaryApplicants.reduce((s, a) => s + a.feeBalance, 0) / (secondaryCount || 1));

  // Tertiary (TVET & University)
  const tertiaryApplicants = applicants.filter((a) => a.institutionCategory === 'TVET' || a.institutionCategory === 'University');
  const tertiaryCount = tertiaryApplicants.length; // ~485
  const tertiaryVerified = tertiaryApplicants.filter((a) => a.inMasterVerifiedPool).length;
  const tertiaryPending = tertiaryCount - tertiaryVerified;
  const tertiaryAwardTotal = tertiaryApplicants.filter((a) => a.inMasterVerifiedPool).reduce((s, a) => s + a.allocatedKes, 0);
  const tertiaryAvgFee = Math.round(tertiaryApplicants.reduce((s, a) => s + a.feeBalance, 0) / (tertiaryCount || 1));

  // 3. STUDENTS ACCORDING TO ACCOUNT TYPE: Independent, Custody, Delegated
  const custodyApplicants = applicants.filter((a) => a.accountClass === 'CUS');
  const custodyTotal = custodyApplicants.length;
  const custodyVerified = custodyApplicants.filter((a) => a.inMasterVerifiedPool).length;
  const custodyPending = custodyTotal - custodyVerified;
  const custodyPct = Math.round((custodyVerified / (custodyTotal || 1)) * 100);

  const independentApplicants = applicants.filter((a) => a.accountClass === 'IND');
  const independentTotal = independentApplicants.length;
  const independentVerified = independentApplicants.filter((a) => a.inMasterVerifiedPool).length;
  const independentPending = independentTotal - independentVerified;
  const independentPct = Math.round((independentVerified / (independentTotal || 1)) * 100);

  const delegatedApplicants = applicants.filter((a) => a.accountClass === 'DEL');
  const delegatedTotal = delegatedApplicants.length;
  const delegatedVerified = delegatedApplicants.filter((a) => a.inMasterVerifiedPool).length;
  const delegatedPending = delegatedTotal - delegatedVerified;
  const delegatedPct = Math.round((delegatedVerified / (delegatedTotal || 1)) * 100);

  // 4. THE RISE: WEEKLY INTAKE & CLEARANCE TRAJECTORY (WEEKS 1 to 6)
  const riseWeeks = [
    { week: 'Wk 1 (Jan 1-7)', submitted: 145, verified: 98, rate: '67%' },
    { week: 'Wk 2 (Jan 8-14)', submitted: 260, verified: 195, rate: '75%' },
    { week: 'Wk 3 (Jan 15-21)', submitted: 420, verified: 335, rate: '80%' },
    { week: 'Wk 4 (Jan 22-28)', submitted: 680, verified: 560, rate: '82%' },
    { week: 'Wk 5 (Jan 29-Feb 4)', submitted: 990, verified: 810, rate: '82%' },
    { week: 'Wk 6 (Feb 5-12)', submitted: 1260, verified: 1025, rate: '81.3%' }
  ];

  // 5. THE RANGE: PROCESSING TURNAROUND & ALLOCATION RANGES
  const rangeBands = [
    { label: 'Fast-Track Clearance (1 - 2 Days)', count: 480, pct: 38, desc: 'Clean birth cert + complete school fee voucher with chief endorsement' },
    { label: 'Standard Verification (3 - 5 Days)', count: 545, pct: 43, desc: 'Standard NEMIS queue, parent ID match and chief scoring' },
    { label: 'Complex Investigation (> 7 Days)', count: 235, pct: 19, desc: 'Residency boundary overlap, cross-sub-location disputes' }
  ];

  const openDrilldown = (filter: typeof modalFilter) => {
    setModalFilter(filter);
    setSearchQuery('');
    setModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      {/* =========================================================================================
          HERO BANNER (MCA EXECUTIVE STYLING - VIOLET / PURPLE THEME)
          ========================================================================================= */}
      <section
        className="dash-single-card"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, var(--surface-elevated, #101c38) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.28)',
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.08)',
          borderRadius: 18
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 14,
                background: 'rgba(139, 92, 246, 0.18)',
                color: '#c084fc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)',
                border: '1px solid rgba(139, 92, 246, 0.35)'
              }}
            >
              <Icon name="documents" size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: 'rgba(139, 92, 246, 0.2)',
                    color: '#c084fc',
                    border: '1px solid rgba(139, 92, 246, 0.35)'
                  }}
                >
                  Document Verification Pipeline
                </span>
                <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                  Educational Oversight &amp; Identity Governance
                </span>
              </div>
              <h1 style={{ margin: '4px 0 0', fontSize: '1.45rem', color: 'var(--text, #fff)', fontWeight: 800, letterSpacing: '-0.01em' }}>
                Document Analytics: Students vs. Parents &amp; Educational Tiers
              </h1>
              <p style={{ margin: '4px 0 0', color: 'var(--text-2, #94a3b8)', fontSize: '0.88rem' }}>
                Legislative audit of student documentation by school level (Primary, Secondary, Tertiary) and account classification (Independent, Custody, Delegated).
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <RefreshButton busy={refreshing} onClick={handleRefresh} />
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                setLocationMetric('total');
                setLocationModalOpen(true);
              }}
              style={{
                padding: '9px 18px',
                fontSize: '0.82rem',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                border: 'none',
                boxShadow: '0 4px 16px rgba(139, 92, 246, 0.35)',
                fontWeight: 600,
                cursor: 'pointer',
                color: '#fff'
              }}
            >
              <span>Explore Ward Locations</span>
              <Icon name="arrowRight" size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================================
          TOP EXECUTIVE CARDS (STUDENTS VS PARENTS & TURNAROUND RANGE)
          ========================================================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {/* CARD 1: STUDENTS PIPELINE */}
        <div
          className="dash-single-card"
          style={{
            padding: '22px 24px',
            borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(16, 28, 56, 0.95) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c084fc', fontWeight: 700 }}>
                Student Documents
              </span>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>
                {num(studentRecordsTotal)} Total
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: 999, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: 700 }}>
              {studentCompletionPct}% Verified
            </span>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#94a3b8', marginBottom: 6 }}>
              <span>Verified Sets: <strong style={{ color: '#34d399' }}>{num(studentRecordsCompleted)}</strong></span>
              <span>Pending: <strong style={{ color: '#f59e0b' }}>{num(studentRecordsIncomplete)}</strong></span>
            </div>
            <div style={{ width: '100%', height: 8, borderRadius: 999, background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
              <div style={{ width: `${studentCompletionPct}%`, height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #10b981)', borderRadius: 999 }} />
            </div>
          </div>

          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
            <span style={{ color: '#94a3b8' }}>Bottleneck:</span>
            <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Fee statements (24%)</span>
          </div>
        </div>

        {/* CARD 2: PARENTS PIPELINE */}
        <div
          className="dash-single-card"
          style={{
            padding: '22px 24px',
            borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(16, 28, 56, 0.95) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#22d3ee', fontWeight: 700 }}>
                Parent &amp; Guardian Records
              </span>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>
                {num(parentRecordsTotal)} Total
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: 999, background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', fontWeight: 700 }}>
              {parentCompletionPct}% Verified
            </span>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#94a3b8', marginBottom: 6 }}>
              <span>Verified IDs: <strong style={{ color: '#34d399' }}>{num(parentRecordsCompleted)}</strong></span>
              <span>Pending IDs: <strong style={{ color: '#f59e0b' }}>{num(parentRecordsIncomplete)}</strong></span>
            </div>
            <div style={{ width: '100%', height: 8, borderRadius: 999, background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
              <div style={{ width: `${parentCompletionPct}%`, height: '100%', background: 'linear-gradient(90deg, #06b6d4, #10b981)', borderRadius: 999 }} />
            </div>
          </div>

          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
            <span style={{ color: '#94a3b8' }}>Bottleneck:</span>
            <span style={{ color: '#cbd5e1', fontWeight: 600 }}>National ID Scans (21%)</span>
          </div>
        </div>

        {/* CARD 3: THE RISE (INTAKE VELOCITY) */}
        <div
          className="dash-single-card"
          style={{
            padding: '22px 24px',
            borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 28, 56, 0.95) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#34d399', fontWeight: 700 }}>
                Verification Rise (Trajectory)
              </span>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>
                +23.5%
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: 999, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: 700 }}>
              Week-Over-Week Rise
            </span>
          </div>

          <div style={{ marginTop: 14, fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5 }}>
            Submission trajectory accelerated from <strong>145</strong> apps in Week 1 to <strong>1,260</strong> full applications by Week 6 cutoff.
          </div>

          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
            <span style={{ color: '#94a3b8' }}>Clearance Velocity:</span>
            <span style={{ color: '#34d399', fontWeight: 600 }}>81.3% End-of-Cycle</span>
          </div>
        </div>

        {/* CARD 4: THE RANGE (PROCESSING TURNAROUND) */}
        <div
          className="dash-single-card"
          style={{
            padding: '22px 24px',
            borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(16, 28, 56, 0.95) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fbbf24', fontWeight: 700 }}>
                Turnaround Range
              </span>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>
                1 – 7 Days
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: 999, background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontWeight: 700 }}>
              Median: 3.4 Days
            </span>
          </div>

          <div style={{ marginTop: 14, fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5 }}>
            Fast-track clearance (1-2 days) achieved for <strong>38%</strong> of applicants; <strong>43%</strong> completed within standard 3-5 days.
          </div>

          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
            <span style={{ color: '#94a3b8' }}>Extended Review:</span>
            <span style={{ color: '#f87171', fontWeight: 600 }}>19% (&gt;7 Days)</span>
          </div>
        </div>
      </div>

      {/* =========================================================================================
          INTERACTIVE SEGMENTED TABS (APPLE HIG NAVIGATION)
          ========================================================================================= */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div
          style={{
            display: 'inline-flex',
            padding: 4,
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            gap: 4
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('comparable')}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'comparable' ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
              color: activeTab === 'comparable' ? '#c084fc' : '#94a3b8',
              transition: 'all 0.15s ease'
            }}
          >
            Students vs. Parents
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('schoolLevels')}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'schoolLevels' ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
              color: activeTab === 'schoolLevels' ? '#c084fc' : '#94a3b8',
              transition: 'all 0.15s ease'
            }}
          >
            School Level (Primary / Sec / Tertiary)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('accountTypes')}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'accountTypes' ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
              color: activeTab === 'accountTypes' ? '#c084fc' : '#94a3b8',
              transition: 'all 0.15s ease'
            }}
          >
            Account Types (Ind / Cus / Del)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('riseAndRange')}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'riseAndRange' ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
              color: activeTab === 'riseAndRange' ? '#c084fc' : '#94a3b8',
              transition: 'all 0.15s ease'
            }}
          >
            The Rise &amp; The Range
          </button>
        </div>

        <button
          type="button"
          onClick={() => openDrilldown('all')}
          style={{
            padding: '8px 16px',
            fontSize: '0.82rem',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#e2e8f0',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Icon name="search" size={15} />
          <span>Inspect Document Records</span>
        </button>
      </div>

      {/* =========================================================================================
          TAB 1: STUDENTS VS PARENTS COMPARATIVE ANALYTICS
          ========================================================================================= */}
      {activeTab === 'comparable' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Comparative Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20 }}>
            {/* Student Documentation Profile */}
            <div className="dash-single-card" style={{ padding: '22px 24px', borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#f8fafc', fontWeight: 700 }}>
                    Student Document Verification Profile
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                    Tracking 5 core onboarding verification milestones
                  </p>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#c084fc', background: 'rgba(139, 92, 246, 0.15)', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                  {studentCompletionPct}% Verified
                </span>
              </div>

              {/* Milestones Progression */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { name: 'Stage 1: Student National ID / Birth Cert', count: 1260, pct: 100, status: 'Complete' },
                  { name: 'Stage 2: Institution & NEMIS/UPI Validation', count: 1146, pct: 91, status: 'High' },
                  { name: 'Stage 3: Guardian & Kinship Declaration', count: 1096, pct: 87, status: 'High' },
                  { name: 'Stage 4: Certified Fee Statement Upload', count: 982, pct: 78, status: 'Bottleneck' },
                  { name: 'Stage 5: Chief Endorsement & Need Score', count: 1025, pct: 81.3, status: 'Final Verified' }
                ].map((s) => (
                  <div key={s.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                      <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{s.name}</span>
                      <span style={{ color: s.pct < 80 ? '#fbbf24' : '#34d399', fontWeight: 600 }}>
                        {s.count} ({s.pct}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 6, borderRadius: 999, background: 'rgba(255, 255, 255, 0.06)', overflow: 'hidden' }}>
                      <div style={{ width: `${s.pct}%`, height: '100%', background: s.pct < 80 ? '#f59e0b' : '#8b5cf6', borderRadius: 999 }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Actionable Insight:</span>
                <button
                  type="button"
                  onClick={() => openDrilldown('all')}
                  style={{ background: 'none', border: 'none', color: '#c084fc', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <span>View Hanging Student Records</span>
                  <Icon name="arrowRight" size={14} />
                </button>
              </div>
            </div>

            {/* Parent Documentation Profile */}
            <div className="dash-single-card" style={{ padding: '22px 24px', borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#f8fafc', fontWeight: 700 }}>
                    Parent &amp; Guardian Verification Profile
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                    Guardians of minor students under custody and delegation
                  </p>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#22d3ee', background: 'rgba(6, 182, 212, 0.15)', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                  {parentCompletionPct}% Verified
                </span>
              </div>

              {/* Milestones Progression */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { name: 'Stage 1: Parent Full Bio & National ID Number', count: 765, pct: 100, status: 'Complete' },
                  { name: 'Stage 2: Official National ID Photocopy Upload', count: 620, pct: 81, status: 'High' },
                  { name: 'Stage 3: Legal Custody / Guardianship Affidavit', count: 598, pct: 78.2, status: 'High' },
                  { name: 'Stage 4: Active M-PESA & Mobile Contact Link', count: 742, pct: 97, status: 'Complete' },
                  { name: 'Stage 5: Death Cert / Indigency Proof (Orphans)', count: 210, pct: 88, status: 'Vetted' }
                ].map((s) => (
                  <div key={s.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                      <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{s.name}</span>
                      <span style={{ color: s.pct < 80 ? '#fbbf24' : '#34d399', fontWeight: 600 }}>
                        {s.count} ({s.pct}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: 6, borderRadius: 999, background: 'rgba(255, 255, 255, 0.06)', overflow: 'hidden' }}>
                      <div style={{ width: `${s.pct}%`, height: '100%', background: s.pct < 80 ? '#f59e0b' : '#06b6d4', borderRadius: 999 }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Actionable Insight:</span>
                <button
                  type="button"
                  onClick={() => openDrilldown('parents')}
                  style={{ background: 'none', border: 'none', color: '#22d3ee', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <span>View Pending Parent Scans</span>
                  <Icon name="arrowRight" size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Educational Governance Policy Callout */}
          <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="check" size={20} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 2px', fontSize: '0.9rem', color: '#f8fafc', fontWeight: 600 }}>
                MCA Educational Perspective: Synchronized Parent-Student Verification
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                Comparing student submissions against guardian credentials reveals that 92% of custody accounts clear within 48 hours once the parent national ID is uploaded. The chief endorsement stage acts as the final integrity safeguard before committee tranche disbursement.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================================
          TAB 2: SCHOOL LEVEL MATRIX (PRIMARY, SECONDARY, TERTIARY)
          ========================================================================================= */}
      {activeTab === 'schoolLevels' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
            {/* PRIMARY LEVEL */}
            <div className="dash-single-card" style={{ padding: '22px 24px', borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#38bdf8', fontWeight: 700 }}>
                  Primary &amp; Junior Secondary
                </span>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 6, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 700 }}>
                  {Math.round((primaryVerified / primaryCount) * 100)}% Verified
                </span>
              </div>

              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc', marginTop: 8 }}>
                {primaryCount} Students
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                KCPE / KPSEA transitions &amp; vulnerable minor grants
              </p>

              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                  <span>Verified Document Sets:</span>
                  <strong style={{ color: '#34d399' }}>{primaryVerified} cleared</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                  <span>Average Fee Balance:</span>
                  <span style={{ color: '#cbd5e1' }}>{kes(primaryAvgFee)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                  <span>Bursary Allocation:</span>
                  <strong style={{ color: '#38bdf8' }}>{kes(primaryAwardTotal)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                  <span>Turnaround Range:</span>
                  <span style={{ color: '#fbbf24' }}>1 – 2 Days (Fastest)</span>
                </div>
              </div>

              <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <button
                  type="button"
                  onClick={() => openDrilldown('primary')}
                  style={{ width: '100%', padding: '8px', borderRadius: 8, background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.25)', color: '#38bdf8', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Inspect Primary Applications
                </button>
              </div>
            </div>

            {/* SECONDARY LEVEL */}
            <div className="dash-single-card" style={{ padding: '22px 24px', borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a78bfa', fontWeight: 700 }}>
                  Secondary Level (Day &amp; Boarding)
                </span>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 6, background: 'rgba(167, 139, 250, 0.15)', color: '#a78bfa', fontWeight: 700 }}>
                  {Math.round((secondaryVerified / (secondaryCount || 1)) * 100)}% Verified
                </span>
              </div>

              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc', marginTop: 8 }}>
                {secondaryCount} Students
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                Day Secondary &amp; National Boarding High Schools
              </p>

              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                  <span>Verified Document Sets:</span>
                  <strong style={{ color: '#34d399' }}>{secondaryVerified} cleared</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                  <span>Average Fee Balance:</span>
                  <span style={{ color: '#cbd5e1' }}>{kes(secondaryAvgFee)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                  <span>Bursary Allocation:</span>
                  <strong style={{ color: '#a78bfa' }}>{kes(secondaryAwardTotal)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                  <span>Turnaround Range:</span>
                  <span style={{ color: '#fbbf24' }}>2 – 4 Days (Standard)</span>
                </div>
              </div>

              <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <button
                  type="button"
                  onClick={() => openDrilldown('secondary')}
                  style={{ width: '100%', padding: '8px', borderRadius: 8, background: 'rgba(167, 139, 250, 0.12)', border: '1px solid rgba(167, 139, 250, 0.25)', color: '#a78bfa', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Inspect Secondary Applications
                </button>
              </div>
            </div>

            {/* TERTIARY LEVEL */}
            <div className="dash-single-card" style={{ padding: '22px 24px', borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#34d399', fontWeight: 700 }}>
                  Tertiary (TVET &amp; University)
                </span>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 6, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: 700 }}>
                  {Math.round((tertiaryVerified / (tertiaryCount || 1)) * 100)}% Verified
                </span>
              </div>

              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc', marginTop: 8 }}>
                {tertiaryCount} Students
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                National Polytechnics &amp; Public Universities
              </p>

              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                  <span>Verified Document Sets:</span>
                  <strong style={{ color: '#34d399' }}>{tertiaryVerified} cleared</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                  <span>Average Fee Balance:</span>
                  <span style={{ color: '#cbd5e1' }}>{kes(tertiaryAvgFee)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                  <span>Bursary Allocation:</span>
                  <strong style={{ color: '#34d399' }}>{kes(tertiaryAwardTotal)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                  <span>Turnaround Range:</span>
                  <span style={{ color: '#fbbf24' }}>3 – 6 Days (Fee ledger checks)</span>
                </div>
              </div>

              <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <button
                  type="button"
                  onClick={() => openDrilldown('tertiary')}
                  style={{ width: '100%', padding: '8px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#34d399', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Inspect Tertiary Applications
                </button>
              </div>
            </div>
          </div>

          {/* Comparative Level Bar */}
          <div className="dash-single-card" style={{ padding: '20px 24px', borderRadius: 16 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', color: '#f8fafc', fontWeight: 600 }}>
              Comparative Funds Allocation by School Level
            </h4>
            <div style={{ display: 'flex', height: 16, borderRadius: 999, overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
              <div style={{ width: '4%', background: '#38bdf8' }} title={`Primary: ${kes(primaryAwardTotal)}`} />
              <div style={{ width: '54%', background: '#a78bfa' }} title={`Secondary: ${kes(secondaryAwardTotal)}`} />
              <div style={{ width: '42%', background: '#34d399' }} title={`Tertiary: ${kes(tertiaryAwardTotal)}`} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: '0.78rem' }}>
              <span style={{ color: '#38bdf8' }}>Primary: {kes(primaryAwardTotal)} (4%)</span>
              <span style={{ color: '#a78bfa' }}>Secondary: {kes(secondaryAwardTotal)} (54%)</span>
              <span style={{ color: '#34d399' }}>Tertiary: {kes(tertiaryAwardTotal)} (42%)</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================================
          TAB 3: ACCOUNT TYPES (INDEPENDENT, CUSTODY, DELEGATED)
          ========================================================================================= */}
      {activeTab === 'accountTypes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
            {/* CUSTODY ACCOUNTS */}
            <div className="dash-single-card" style={{ padding: '22px 24px', borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#06b6d4', fontWeight: 700 }}>
                  Custody Accounts (CUS)
                </span>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 6, background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', fontWeight: 700 }}>
                  {custodyPct}% Verified
                </span>
              </div>

              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc', marginTop: 8 }}>
                {custodyTotal} Accounts
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                Parent / Guardian holding full custody of minor student
              </p>

              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.78rem', color: '#94a3b8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Parent National ID:</span>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>Attached (98%)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Student Birth Certificate:</span>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>Validated (91%)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Chief Residency Vetting:</span>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>{custodyVerified} Passed</span>
                </div>
              </div>

              <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <button
                  type="button"
                  onClick={() => openDrilldown('custody')}
                  style={{ width: '100%', padding: '8px', borderRadius: 8, background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.25)', color: '#22d3ee', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Inspect Custody Records
                </button>
              </div>
            </div>

            {/* INDEPENDENT ACCOUNTS */}
            <div className="dash-single-card" style={{ padding: '22px 24px', borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a855f7', fontWeight: 700 }}>
                  Independent Accounts (IND)
                </span>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 6, background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', fontWeight: 700 }}>
                  {independentPct}% Verified
                </span>
              </div>

              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc', marginTop: 8 }}>
                {independentTotal} Accounts
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                Adult students (18+) managing their own college bursary
              </p>

              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.78rem', color: '#94a3b8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Student National ID:</span>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>Direct Student ID (100%)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Admission Letter / KUCCPS:</span>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>Validated (89%)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Fee Ledger Verification:</span>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>{independentVerified} Cleared</span>
                </div>
              </div>

              <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <button
                  type="button"
                  onClick={() => openDrilldown('independent')}
                  style={{ width: '100%', padding: '8px', borderRadius: 8, background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.25)', color: '#c084fc', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Inspect Independent Records
                </button>
              </div>
            </div>

            {/* DELEGATED ACCOUNTS */}
            <div className="dash-single-card" style={{ padding: '22px 24px', borderRadius: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#f59e0b', fontWeight: 700 }}>
                  Delegated Accounts (DEL)
                </span>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 6, background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontWeight: 700 }}>
                  {delegatedPct}% Verified
                </span>
              </div>

              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc', marginTop: 8 }}>
                {delegatedTotal} Accounts
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                Students with parent/guardian delegated authority
              </p>

              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.78rem', color: '#94a3b8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Delegation Consent Form:</span>
                  <span style={{ color: '#fbbf24', fontWeight: 600 }}>In Review (76%)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Dual ID Cross-Check:</span>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>Matched (82%)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Chief Endorsement:</span>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>{delegatedVerified} Cleared</span>
                </div>
              </div>

              <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <button
                  type="button"
                  onClick={() => openDrilldown('delegated')}
                  style={{ width: '100%', padding: '8px', borderRadius: 8, background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', color: '#fbbf24', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Inspect Delegated Records
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================================
          TAB 4: THE RISE & THE RANGE (COMPARABLE VISUAL DATA)
          ========================================================================================= */}
      {activeTab === 'riseAndRange' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* THE RISE: VELOCITY TABLE & SVG CURVE */}
          <div className="dash-single-card" style={{ padding: '22px 24px', borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#f8fafc', fontWeight: 700 }}>
                  The Rise: Weekly Document Clearance Velocity
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                  Cumulative applications submitted vs cleared across the 6-week intake window
                </p>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                1,260 End Peak
              </span>
            </div>

            {/* SVG Trajectory Chart */}
            <div style={{ width: '100%', height: 160, position: 'relative', marginBottom: 16 }}>
              <svg viewBox="0 0 600 140" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="riseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="40" y1="20" x2="580" y2="20" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="40" y1="60" x2="580" y2="60" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="40" y1="100" x2="580" y2="100" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

                {/* Area and Line for submitted */}
                <path
                  d="M 50 120 L 150 100 L 250 80 L 350 50 L 450 30 L 550 15 L 550 130 L 50 130 Z"
                  fill="url(#riseGrad)"
                />
                <path
                  d="M 50 120 L 150 100 L 250 80 L 350 50 L 450 30 L 550 15"
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Line for verified */}
                <path
                  d="M 50 124 L 150 108 L 250 90 L 350 62 L 450 42 L 550 28"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="4 4"
                />

                {/* Data Points */}
                {[
                  { x: 50, y: 120, label: 'Wk 1' },
                  { x: 150, y: 100, label: 'Wk 2' },
                  { x: 250, y: 80, label: 'Wk 3' },
                  { x: 350, y: 50, label: 'Wk 4' },
                  { x: 450, y: 30, label: 'Wk 5' },
                  { x: 550, y: 15, label: 'Wk 6' }
                ].map((pt) => (
                  <g key={pt.label}>
                    <circle cx={pt.x} cy={pt.y} r="4" fill="#8b5cf6" stroke="#fff" strokeWidth="1.5" />
                    <text x={pt.x} y="138" textAnchor="middle" fill="#94a3b8" fontSize="10">{pt.label}</text>
                  </g>
                ))}
              </svg>
            </div>

            {/* Weekly Breakdown Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '8px 12px' }}>Intake Window</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Cumulative Intake</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Verified Pool</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right' }}>Clearance Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {riseWeeks.map((w) => (
                    <tr key={w.week} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#e2e8f0' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 600 }}>{w.week}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{w.submitted}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', color: '#34d399' }}>{w.verified}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                        <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '0.74rem' }}>
                          {w.rate}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* THE RANGE: BANDS & TIMELINES */}
          <div className="dash-single-card" style={{ padding: '22px 24px', borderRadius: 16 }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '1.05rem', color: '#f8fafc', fontWeight: 700 }}>
              The Range: Verification Turnaround &amp; Allocation Spread
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              {rangeBands.map((b) => (
                <div key={b.label} style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}>{b.label}</span>
                    <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', fontWeight: 700 }}>
                      {b.pct}%
                    </span>
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#34d399', marginTop: 6 }}>
                    {b.count} Applications
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.4 }}>
                    {b.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================================
          INTERACTIVE DRILLDOWN MODAL: INSPECT DOCUMENT RECORDS
          ========================================================================================= */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            background: 'rgba(5, 10, 24, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '960px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              background: '#0e172e',
              borderRadius: 20,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#c084fc', fontWeight: 700 }}>
                  Legislative Roster Audit
                </span>
                <h3 style={{ margin: '2px 0 0', fontSize: '1.2rem', color: '#f8fafc', fontWeight: 700 }}>
                  Document Records &amp; Verification Ledger
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Filter Tabs & Search */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { key: 'all', label: 'All Records' },
                  { key: 'primary', label: 'Primary' },
                  { key: 'secondary', label: 'Secondary' },
                  { key: 'tertiary', label: 'Tertiary' },
                  { key: 'custody', label: 'Custody (CUS)' },
                  { key: 'independent', label: 'Independent (IND)' },
                  { key: 'delegated', label: 'Delegated (DEL)' }
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setModalFilter(t.key as any)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 6,
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: modalFilter === t.key ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.08)',
                      background: modalFilter === t.key ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.04)',
                      color: modalFilter === t.key ? '#c084fc' : '#94a3b8'
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Search student or parent name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: '0.8rem',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  outline: 'none',
                  minWidth: 220
                }}
              />
            </div>

            {/* Roster Table */}
            <div style={{ padding: '16px 24px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '8px 10px' }}>Serial / Name</th>
                    <th style={{ padding: '8px 10px' }}>Account Class</th>
                    <th style={{ padding: '8px 10px' }}>School &amp; Tier</th>
                    <th style={{ padding: '8px 10px' }}>Sub-Location</th>
                    <th style={{ padding: '8px 10px' }}>Guardian / Phone</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Document Status</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Bursary KES</th>
                  </tr>
                </thead>
                <tbody>
                  {applicants
                    .filter((a) => {
                      if (modalFilter === 'primary') return a.age < 15;
                      if (modalFilter === 'secondary') return a.institutionCategory === 'Secondary';
                      if (modalFilter === 'tertiary') return a.institutionCategory === 'TVET' || a.institutionCategory === 'University';
                      if (modalFilter === 'custody') return a.accountClass === 'CUS';
                      if (modalFilter === 'independent') return a.accountClass === 'IND';
                      if (modalFilter === 'delegated') return a.accountClass === 'DEL';
                      return true;
                    })
                    .filter((a) =>
                      a.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      a.guardianName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      a.serial.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .slice(0, 50)
                    .map((a) => (
                      <tr key={a.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', color: '#e2e8f0' }}>
                        <td style={{ padding: '8px 10px' }}>
                          <div style={{ fontWeight: 600 }}>{a.fullName}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{a.serial}</div>
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(255, 255, 255, 0.06)', color: '#c084fc' }}>
                            {a.accountClass === 'CUS' ? 'Custody' : a.accountClass === 'IND' ? 'Independent' : 'Delegated'}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <div>{a.school}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{a.institutionCategory}</div>
                        </td>
                        <td style={{ padding: '8px 10px', color: '#94a3b8' }}>{a.subLocation}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <div>{a.guardianName}</div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{a.guardianPhone}</div>
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: a.inMasterVerifiedPool ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: a.inMasterVerifiedPool ? '#34d399' : '#fbbf24'
                          }}>
                            {a.inMasterVerifiedPool ? '5/5 Verified' : 'In Triage'}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', color: '#34d399' }}>
                          {kes(a.allocatedKes)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* LOCATION DRILLDOWN MODAL */}
      <ChiefLocationModal
        open={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        mode="documents"
        metricType={locationMetric}
        analytics={analytics}
      />
    </div>
  );
}
