import React, { useState, useMemo } from 'react';
import { Icon } from '../../../components/Icon.jsx';
import { RefreshButton } from '../../../components/RefreshButton.jsx';
import { ChiefLocationModal } from '../../../dashboards/helpdesk/components/ChiefLocationModal.jsx';
import { McaAnalyticsHub } from '../components/McaAnalyticsHub.tsx';
import {
  VillagesModal,
  GenderModal,
  PollingStationsModal,
  SchoolDistributionModal,
  AgeDistributionModal,
  StationEquityModal
} from '../components/ApplicationsAnalyticsModals.tsx';
import { getFullApplicantPool } from '../../../data/scalableWardDataset.ts';
import { kes, num } from '../../lib/format.ts';

export function ApplicationsPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [locationModalMetric, setLocationModalMetric] = useState<'total' | 'successful' | 'flagged'>('total');

  // Modal states for the 6 smaller analytics cards
  const [activePopup, setActivePopup] = useState<
    'villages' | 'gender' | 'polling' | 'schools' | 'age' | 'stationEquity' | null
  >(null);

  const pool = useMemo(() => getFullApplicantPool(), [refreshing]);

  const total = pool.length;
  const verified = pool.filter((a) => a.inMasterVerifiedPool).length;
  const flagged = pool.filter((a) => a.chiefStatus === 'Under Review' || a.isResidencyFlagged).length;
  const totalAllocated = pool.filter((a) => a.inMasterVerifiedPool).reduce((sum, a) => sum + a.allocatedKes, 0);

  const verifiedPct = total > 0 ? Math.round((verified / total) * 100) : 0;
  const flaggedPct = total > 0 ? Math.round((flagged / total) * 100) : 0;

  // Gender stats for preview
  const femaleCount = pool.filter((a) => a.gender === 'Female').length;
  const maleCount = total - femaleCount;
  const femalePct = total > 0 ? Math.round((femaleCount / total) * 100) : 51;

  // School stats for preview
  const secondaryCount = pool.filter((a) => a.institutionCategory === 'Secondary').length;
  const tvetCount = pool.filter((a) => a.institutionCategory === 'TVET').length;
  const uniCount = pool.filter((a) => a.institutionCategory === 'University').length;

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 300);
  };

  const openLocationModal = (metric: 'total' | 'successful' | 'flagged') => {
    setLocationModalMetric(metric);
    setLocationModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      {/* HERO BANNER (MCA EXECUTIVE STYLING - CYAN / NAVY ACCENT) */}
      <section
        className="dash-single-card"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, var(--surface-elevated, #101c38) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.28)',
          boxShadow: '0 8px 32px rgba(6, 182, 212, 0.08)',
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
                background: 'rgba(6, 182, 212, 0.18)',
                color: '#22d3ee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)',
                border: '1px solid rgba(6, 182, 212, 0.35)'
              }}
            >
              <Icon name="applications" size={28} />
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
                    background: 'rgba(6, 182, 212, 0.2)',
                    color: '#22d3ee',
                    border: '1px solid rgba(6, 182, 212, 0.35)'
                  }}
                >
                  Ward Applications Intake
                </span>
                <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                  Tendeno &amp; Sorget Divisions (NG-CDF)
                </span>
              </div>
              <h1 style={{ margin: '4px 0 0', fontSize: '1.45rem', color: 'var(--text, #fff)', fontWeight: 800, letterSpacing: '-0.01em' }}>
                Ward Applications &amp; Geographic Distribution
              </h1>
              <p style={{ margin: '4px 0 0', color: 'var(--text-2, #94a3b8)', fontSize: '0.88rem' }}>
                Legislative bursary intake analysis, demographic parity, and village-level civic oversight.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <RefreshButton busy={refreshing} onClick={handleRefresh} />
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => openLocationModal('total')}
              style={{
                padding: '9px 18px',
                fontSize: '0.82rem',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
                border: 'none',
                boxShadow: '0 4px 16px rgba(6, 182, 212, 0.35)',
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
          PRIMARY HERO METRIC CARDS (TOTAL APPLICATIONS & FLAGGED APPLICATIONS)
          ========================================================================================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
        {/* CARD 1: TOTAL APPLICATIONS */}
        <div
          className="dash-single-card"
          style={{
            padding: '24px',
            borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(16, 28, 56, 0.95) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#22d3ee', fontWeight: 700 }}>
                Total Ward Applications
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 6 }}>
                <span style={{ fontSize: '2.1rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                  {num(total)}
                </span>
                <span style={{ fontSize: '0.82rem', color: '#34d399', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span>↑ +14.2%</span> <span style={{ color: '#94a3b8', fontWeight: 400 }}>intake rise</span>
                </span>
              </div>
            </div>

            <span
              style={{
                fontSize: '0.72rem',
                padding: '4px 10px',
                borderRadius: 999,
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontWeight: 700
              }}
            >
              100% Ward Reach
            </span>
          </div>

          {/* Detailed Progress Meter */}
          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#94a3b8', marginBottom: 6 }}>
              <span>Master Verified &amp; Cleared</span>
              <strong style={{ color: '#34d399' }}>{num(verified)} ({verifiedPct}%)</strong>
            </div>
            <div style={{ width: '100%', height: 8, borderRadius: 999, background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
              <div style={{ width: `${verifiedPct}%`, height: '100%', background: 'linear-gradient(90deg, #06b6d4, #10b981)', borderRadius: 999 }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, paddingTop: 14, borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.82rem' }}>
            <span style={{ color: '#94a3b8' }}>Cumulative Bursary Funds:</span>
            <span style={{ color: '#22d3ee', fontWeight: 700, fontFamily: 'monospace', fontSize: '0.92rem' }}>
              {kes(totalAllocated)}
            </span>
          </div>
        </div>

        {/* CARD 2: FLAGGED APPLICATIONS */}
        <div
          className="dash-single-card"
          style={{
            padding: '24px',
            borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(16, 28, 56, 0.95) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.28)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fbbf24', fontWeight: 700 }}>
                Flagged Applications in Triage
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 6 }}>
                <span style={{ fontSize: '2.1rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                  {num(flagged)}
                </span>
                <span style={{ fontSize: '0.82rem', color: '#fbbf24', fontWeight: 600 }}>
                  {flaggedPct}% of Total Ingestion
                </span>
              </div>
            </div>

            <span
              style={{
                fontSize: '0.72rem',
                padding: '4px 10px',
                borderRadius: 999,
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontWeight: 700
              }}
            >
              Chief Triage Active
            </span>
          </div>

          {/* Breakdown Mini Bars */}
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#94a3b8' }}>
              <span>Residency &amp; Boundary Queries</span>
              <strong style={{ color: '#f87171' }}>{pool.filter((a) => a.isResidencyFlagged).length} cases</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#94a3b8' }}>
              <span>NEMIS / UPI Record Queries</span>
              <strong style={{ color: '#fbbf24' }}>{pool.filter((a) => a.riskFlag === 'NEMIS Discrepancy').length} cases</strong>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '0.82rem' }}>
            <span style={{ color: '#94a3b8' }}>Investigation Protocol:</span>
            <button
              type="button"
              onClick={() => openLocationModal('flagged')}
              style={{
                background: 'none',
                border: 'none',
                color: '#fbbf24',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: 0,
                fontSize: '0.8rem'
              }}
            >
              <span>Inspect Flagged List</span>
              <Icon name="arrowRight" size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================================
          THE 6 SMALLER CLICKABLE ANALYTICS CARDS WITH DEDICATED POPUP MODALS
          ========================================================================================= */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700 }}>
              Macro Distribution &amp; Demographic Analytics
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
              Click any card below to open its dedicated analytics popup with interactive charts, range matrices, and legislative insights.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {/* 1. VILLAGES CARD */}
          <button
            type="button"
            onClick={() => setActivePopup('villages')}
            className="dash-single-card"
            style={{
              padding: '20px',
              borderRadius: 14,
              border: '1px solid rgba(6, 182, 212, 0.2)',
              background: 'rgba(15, 23, 42, 0.65)',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 14
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#06b6d4';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(6, 182, 212, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="applications" size={20} />
                </div>
                <span style={{ fontSize: '0.72rem', color: '#22d3ee', fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(6, 182, 212, 0.12)' }}>
                  32 Villages
                </span>
              </div>
              <h3 style={{ margin: '12px 0 2px', fontSize: '1.05rem', color: '#f8fafc', fontWeight: 700 }}>
                Villages Distribution
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                Spread across 8 sub-locations (Avg 39.4 apps/village)
              </p>
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#22d3ee', fontWeight: 600 }}>
              <span>View Village Breakdown</span>
              <Icon name="chevronRight" size={14} />
            </div>
          </button>

          {/* 2. GENDER CARD */}
          <button
            type="button"
            onClick={() => setActivePopup('gender')}
            className="dash-single-card"
            style={{
              padding: '20px',
              borderRadius: 14,
              border: '1px solid rgba(236, 72, 153, 0.2)',
              background: 'rgba(15, 23, 42, 0.65)',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 14
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#ec4899';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(236, 72, 153, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="profile" size={20} />
                </div>
                <span style={{ fontSize: '0.72rem', color: '#ec4899', fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(236, 72, 153, 0.12)' }}>
                  Parity 1.05
                </span>
              </div>
              <h3 style={{ margin: '12px 0 2px', fontSize: '1.05rem', color: '#f8fafc', fontWeight: 700 }}>
                Gender Distribution
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                {femalePct}% Female ({femaleCount}) vs {100 - femalePct}% Male ({maleCount})
              </p>
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#ec4899', fontWeight: 600 }}>
              <span>Inspect Gender Parity</span>
              <Icon name="chevronRight" size={14} />
            </div>
          </button>

          {/* 3. POLLING STATIONS CARD */}
          <button
            type="button"
            onClick={() => setActivePopup('polling')}
            className="dash-single-card"
            style={{
              padding: '20px',
              borderRadius: 14,
              border: '1px solid rgba(16, 185, 129, 0.2)',
              background: 'rgba(15, 23, 42, 0.65)',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 14
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#10b981';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="home" size={20} />
                </div>
                <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.12)' }}>
                  8 Centers
                </span>
              </div>
              <h3 style={{ margin: '12px 0 2px', fontSize: '1.05rem', color: '#f8fafc', fontWeight: 700 }}>
                Polling Stations
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                Turnout spread: 132 – 186 apps per civic station
              </p>
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#34d399', fontWeight: 600 }}>
              <span>View Station Turnout</span>
              <Icon name="chevronRight" size={14} />
            </div>
          </button>

          {/* 4. SCHOOL DISTRIBUTION CARD */}
          <button
            type="button"
            onClick={() => setActivePopup('schools')}
            className="dash-single-card"
            style={{
              padding: '20px',
              borderRadius: 14,
              border: '1px solid rgba(245, 158, 11, 0.2)',
              background: 'rgba(15, 23, 42, 0.65)',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 14
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#f59e0b';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(245, 158, 11, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="documents" size={20} />
                </div>
                <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(245, 158, 11, 0.12)' }}>
                  3 Tiers
                </span>
              </div>
              <h3 style={{ margin: '12px 0 2px', fontSize: '1.05rem', color: '#f8fafc', fontWeight: 700 }}>
                School Distribution
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                Sec ({secondaryCount}) • TVET ({tvetCount}) • Uni ({uniCount})
              </p>
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#fbbf24', fontWeight: 600 }}>
              <span>Inspect School Tiers</span>
              <Icon name="chevronRight" size={14} />
            </div>
          </button>

          {/* 5. AGE DISTRIBUTION CARD */}
          <button
            type="button"
            onClick={() => setActivePopup('age')}
            className="dash-single-card"
            style={{
              padding: '20px',
              borderRadius: 14,
              border: '1px solid rgba(59, 130, 246, 0.2)',
              background: 'rgba(15, 23, 42, 0.65)',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 14
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="clock" size={20} />
                </div>
                <span style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(59, 130, 246, 0.12)' }}>
                  14 – 31 Yrs
                </span>
              </div>
              <h3 style={{ margin: '12px 0 2px', fontSize: '1.05rem', color: '#f8fafc', fontWeight: 700 }}>
                Age Distribution
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                Median 19 Yrs • High School, Tertiary &amp; Adult Cohorts
              </p>
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#60a5fa', fontWeight: 600 }}>
              <span>View Age Cohorts</span>
              <Icon name="chevronRight" size={14} />
            </div>
          </button>

          {/* 6. POLLING STATION EQUITY & ANOMALIES CARD */}
          <button
            type="button"
            onClick={() => setActivePopup('stationEquity')}
            className="dash-single-card"
            style={{
              padding: '20px',
              borderRadius: 14,
              border: '1px solid rgba(139, 92, 246, 0.2)',
              background: 'rgba(15, 23, 42, 0.65)',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 14
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#8b5cf6';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="shield" size={20} />
                </div>
                <span style={{ fontSize: '0.72rem', color: '#c084fc', fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: 'rgba(139, 92, 246, 0.12)' }}>
                  Clearance 81.3%
                </span>
              </div>
              <h3 style={{ margin: '12px 0 2px', fontSize: '1.05rem', color: '#f8fafc', fontWeight: 700 }}>
                Station Equity &amp; Anomalies
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                Clearance rate parity (74% – 88%) &amp; triage monitoring
              </p>
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#a78bfa', fontWeight: 600 }}>
              <span>Inspect Station Equity</span>
              <Icon name="chevronRight" size={14} />
            </div>
          </button>
        </div>
      </div>

      {/* =========================================================================================
          DEEP WARD ANALYTICS MATRIX & BENEFICIARY MANIFEST (McaAnalyticsHub)
          ========================================================================================= */}
      <McaAnalyticsHub />

      {/* =========================================================================================
          INTERACTIVE POPUPS (APPLE HIG & PREMIUM UI)
          ========================================================================================= */}
      <VillagesModal
        open={activePopup === 'villages'}
        onClose={() => setActivePopup(null)}
      />

      <GenderModal
        open={activePopup === 'gender'}
        onClose={() => setActivePopup(null)}
      />

      <PollingStationsModal
        open={activePopup === 'polling'}
        onClose={() => setActivePopup(null)}
      />

      <SchoolDistributionModal
        open={activePopup === 'schools'}
        onClose={() => setActivePopup(null)}
      />

      <AgeDistributionModal
        open={activePopup === 'age'}
        onClose={() => setActivePopup(null)}
      />

      <StationEquityModal
        open={activePopup === 'stationEquity'}
        onClose={() => setActivePopup(null)}
      />

      {/* Master Location Modal */}
      <ChiefLocationModal
        open={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        mode="applications"
        metricType={locationModalMetric}
      />
    </div>
  );
}
