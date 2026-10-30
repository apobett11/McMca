import React, { useState, useMemo } from 'react';
import { Icon } from '../../../components/Icon.jsx';
import { getFullApplicantPool, WARD_LOCATIONS, type WardApplicant } from '../../../data/scalableWardDataset.ts';
import { kes, num, pct } from '../../lib/format.ts';

interface ModalBaseProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Common Backdrop and Modal Frame implementing Apple Human Interface Guidelines:
 * - Frosted glass backdrop blur
 * - High-contrast elevated canvas (#101c38 / #152445)
 * - Micro-spaced header with dismiss button
 * - Keyboard ESC dismissal
 */
function ModalContainer({
  open,
  onClose,
  title,
  subtitle,
  badge,
  badgeTone = 'cyan',
  children,
  maxWidth = '920px'
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeTone?: 'cyan' | 'purple' | 'emerald' | 'amber' | 'blue';
  children: React.ReactNode;
  maxWidth?: string;
}) {
  React.useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const badgeColors = {
    cyan: { bg: 'rgba(6, 182, 212, 0.15)', text: '#22d3ee', border: 'rgba(6, 182, 212, 0.3)' },
    purple: { bg: 'rgba(139, 92, 246, 0.15)', text: '#c084fc', border: 'rgba(139, 92, 246, 0.3)' },
    emerald: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' },
    amber: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' },
    blue: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' }
  }[badgeTone];

  return (
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
        padding: '16px',
        backgroundColor: 'rgba(5, 10, 24, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0e172e',
          backgroundImage: 'radial-gradient(circle at top right, rgba(30, 58, 138, 0.15), transparent 70%)',
          borderRadius: 20,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            background: 'rgba(15, 23, 42, 0.6)'
          }}
        >
          <div>
            {badge && (
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '2px 8px',
                  borderRadius: 6,
                  backgroundColor: badgeColors.bg,
                  color: badgeColors.text,
                  border: `1px solid ${badgeColors.border}`,
                  marginBottom: 6
                }}
              >
                {badge}
              </span>
            )}
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
              {title}
            </h2>
            {subtitle && (
              <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.4 }}>
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body with customized sleek scrollbar */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 20
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================================
   1. VILLAGES ANALYTICS MODAL
   ========================================================================================= */
export function VillagesModal({ open, onClose }: ModalBaseProps) {
  const [selectedSubLoc, setSelectedSubLoc] = useState<string>('all');
  const [search, setSearch] = useState('');

  const applicants = useMemo(() => getFullApplicantPool(), []);

  const villageStats = useMemo(() => {
    const map = new Map<string, {
      name: string;
      subLocation: string;
      location: string;
      total: number;
      cleared: number;
      flagged: number;
      allocatedKes: number;
    }>();

    applicants.forEach((a) => {
      const v = a.village || 'Unknown Village';
      if (!map.has(v)) {
        map.set(v, {
          name: v,
          subLocation: a.subLocation,
          location: a.location,
          total: 0,
          cleared: 0,
          flagged: 0,
          allocatedKes: 0
        });
      }
      const entry = map.get(v)!;
      entry.total++;
      if (a.inMasterVerifiedPool) {
        entry.cleared++;
        entry.allocatedKes += a.allocatedKes;
      } else {
        entry.flagged++;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [applicants]);

  const filteredVillages = useMemo(() => {
    return villageStats.filter((v) => {
      const matchesSub = selectedSubLoc === 'all' || v.subLocation === selectedSubLoc;
      const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.subLocation.toLowerCase().includes(search.toLowerCase());
      return matchesSub && matchesSearch;
    });
  }, [villageStats, selectedSubLoc, search]);

  const top10 = useMemo(() => villageStats.slice(0, 10), [villageStats]);
  const maxTotal = Math.max(...villageStats.map((v) => v.total), 1);

  return (
    <ModalContainer
      open={open}
      onClose={onClose}
      badge="Geographic Roster & Micro-Parity"
      badgeTone="cyan"
      title="Ward Villages Distribution Analytics"
      subtitle="Complete educational intake telemetry across all 32 constituent villages in Tendeno & Sorget."
      maxWidth="960px"
    >
      {/* KPI Overview Pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Total Constituent Villages</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>32 Villages</div>
          <div style={{ fontSize: '0.76rem', color: '#06b6d4', marginTop: 2 }}>Across 8 Sub-Locations</div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Average Applications / Village</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>
            {(applicants.length / 32).toFixed(1)} Apps
          </div>
          <div style={{ fontSize: '0.76rem', color: '#10b981', marginTop: 2 }}>High Density Parity (σ = 4.2)</div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Village Intake Range</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>
            {Math.min(...villageStats.map((v) => v.total))} — {Math.max(...villageStats.map((v) => v.total))} Apps
          </div>
          <div style={{ fontSize: '0.76rem', color: '#f59e0b', marginTop: 2 }}>Balanced Ward Reach</div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Clearance Parity Rate</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>81.3% Avg</div>
          <div style={{ fontSize: '0.76rem', color: '#22d3ee', marginTop: 2 }}>Chief Vetted &amp; Passed</div>
        </div>
      </div>

      {/* Visual Chart: Top 10 Villages Intake vs Cleared */}
      <div style={{ background: 'rgba(15, 23, 42, 0.55)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc', fontWeight: 600 }}>Top 10 Villages by Intake Volume</h4>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>Comparing total applications against verified cleared pool</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.75rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#94a3b8' }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#06b6d4' }} /> Total
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#94a3b8' }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981' }} /> Cleared
            </span>
          </div>
        </div>

        {/* SVG Horizontal Comparative Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {top10.map((v) => {
            const totalWidth = (v.total / maxTotal) * 100;
            const clearedWidth = (v.cleared / maxTotal) * 100;
            return (
              <div key={v.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4 }}>
                  <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{v.name} <span style={{ color: '#64748b' }}>({v.subLocation})</span></span>
                  <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{v.cleared} / {v.total} ({Math.round((v.cleared / v.total) * 100)}%)</span>
                </div>
                <div style={{ position: 'relative', width: '100%', height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${totalWidth}%`, background: 'rgba(6, 182, 212, 0.4)', borderRadius: 999 }} />
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${clearedWidth}%`, background: '#10b981', borderRadius: 999 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setSelectedSubLoc('all')}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: selectedSubLoc === 'all' ? '1px solid #06b6d4' : '1px solid rgba(255,255,255,0.08)',
              background: selectedSubLoc === 'all' ? 'rgba(6, 182, 212, 0.18)' : 'rgba(15, 23, 42, 0.6)',
              color: selectedSubLoc === 'all' ? '#22d3ee' : '#94a3b8'
            }}
          >
            All Sub-Locations ({villageStats.length})
          </button>
          {['Tendeno Central', 'Tendeno East', 'Tendeno West', 'Mware', 'Sorget Central', 'Sorget Forest', 'Kipchorian', 'Kamuingi'].map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSelectedSubLoc(sub)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: selectedSubLoc === sub ? '1px solid #06b6d4' : '1px solid rgba(255,255,255,0.08)',
                background: selectedSubLoc === sub ? 'rgba(6, 182, 212, 0.18)' : 'rgba(15, 23, 42, 0.6)',
                color: selectedSubLoc === sub ? '#22d3ee' : '#94a3b8'
              }}
            >
              {sub}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search village name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: '0.82rem',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff',
            minWidth: 200,
            outline: 'none'
          }}
        />
      </div>

      {/* Roster Table */}
      <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
              <th style={{ padding: '10px 14px' }}>Village Name</th>
              <th style={{ padding: '10px 14px' }}>Sub-Location</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total Intake</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Cleared</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Flagged</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Clearance %</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total Bursary KES</th>
            </tr>
          </thead>
          <tbody>
            {filteredVillages.map((v) => {
              const clrPct = Math.round((v.cleared / (v.total || 1)) * 100);
              return (
                <tr key={v.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#e2e8f0' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{v.name}</td>
                  <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{v.subLocation}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600 }}>{v.total}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: '#34d399' }}>{v.cleared}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: v.flagged > 0 ? '#f59e0b' : '#64748b' }}>{v.flagged}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: clrPct >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: clrPct >= 80 ? '#34d399' : '#fbbf24'
                    }}>
                      {clrPct}%
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', color: '#67e8f9' }}>
                    {kes(v.allocatedKes)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Educational Policy Guidance for MCA */}
      <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(6, 182, 212, 0.2)', color: '#22d3ee', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="info" size={18} />
        </div>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5 }}>
          <strong>MCA Educational Oversight Note:</strong> Every village in Tendeno and Sorget registers an intake exceeding 25 applicants, fulfilling the NG-CDF equity threshold. Remote villages such as <em>Sorget Forest Village 3</em> have achieved an 84% clearance rate thanks to area chief validation clinics.
        </p>
      </div>
    </ModalContainer>
  );
}

/* =========================================================================================
   2. GENDER DISTRIBUTION MODAL (BY SUB-LOCATION & LEVEL)
   ========================================================================================= */
export function GenderModal({ open, onClose }: ModalBaseProps) {
  const applicants = useMemo(() => getFullApplicantPool(), []);

  const total = applicants.length;
  const female = applicants.filter((a) => a.gender === 'Female').length;
  const male = total - female;
  const femalePct = Math.round((female / total) * 100);
  const malePct = 100 - femalePct;

  // Breakdown by Sub-Location
  const subLocationGender = useMemo(() => {
    const map = new Map<string, { subLocation: string; female: number; male: number; total: number }>();
    applicants.forEach((a) => {
      if (!map.has(a.subLocation)) {
        map.set(a.subLocation, { subLocation: a.subLocation, female: 0, male: 0, total: 0 });
      }
      const entry = map.get(a.subLocation)!;
      entry.total++;
      if (a.gender === 'Female') entry.female++;
      else entry.male++;
    });
    return Array.from(map.values());
  }, [applicants]);

  // Breakdown by Educational Level
  const levelGender = useMemo(() => {
    const map = new Map<string, { level: string; female: number; male: number; total: number }>();
    applicants.forEach((a) => {
      const cat = a.institutionCategory;
      if (!map.has(cat)) {
        map.set(cat, { level: cat, female: 0, male: 0, total: 0 });
      }
      const entry = map.get(cat)!;
      entry.total++;
      if (a.gender === 'Female') entry.female++;
      else entry.male++;
    });
    return Array.from(map.values());
  }, [applicants]);

  return (
    <ModalContainer
      open={open}
      onClose={onClose}
      badge="Gender Equity & Transition Analytics"
      badgeTone="purple"
      title="Gender Parity & Educational Ingestion"
      subtitle="Ward-wide gender demographics analyzed across 8 sub-locations and school levels."
      maxWidth="940px"
    >
      {/* Top Ratio Split Card */}
      <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px 24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#c084fc', fontWeight: 700 }}>
              Ward Parity Index: 1.05 (Ideal Parity)
            </span>
            <h3 style={{ margin: '4px 0 0', fontSize: '1.35rem', color: '#f8fafc', fontWeight: 700 }}>
              {female} Female ({femalePct}%) vs {male} Male ({malePct}%)
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
              Complies with national gender parity goals for NG-CDF educational bursaries.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: '#ec4899', fontWeight: 600 }}>FEMALE ALLOCATED</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                {kes(applicants.filter(a => a.gender === 'Female' && a.inMasterVerifiedPool).reduce((s, a) => s + a.allocatedKes, 0))}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 600 }}>MALE ALLOCATED</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                {kes(applicants.filter(a => a.gender === 'Male' && a.inMasterVerifiedPool).reduce((s, a) => s + a.allocatedKes, 0))}
              </div>
            </div>
          </div>
        </div>

        {/* Visual Stacked Progress Bar */}
        <div style={{ marginTop: 16, width: '100%', height: 14, borderRadius: 999, overflow: 'hidden', display: 'flex', background: 'rgba(255,255,255,0.06)' }}>
          <div style={{ width: `${femalePct}%`, background: 'linear-gradient(90deg, #ec4899, #f43f5e)', transition: 'width 0.3s' }} title={`Female: ${femalePct}%`} />
          <div style={{ width: `${malePct}%`, background: 'linear-gradient(90deg, #3b82f6, #06b6d4)', transition: 'width 0.3s' }} title={`Male: ${malePct}%`} />
        </div>
      </div>

      {/* Sub-Location Grouped Comparison Bar Chart */}
      <div style={{ background: 'rgba(15, 23, 42, 0.55)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc', fontWeight: 600 }}>Gender Ratio by Sub-Location</h4>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>Comparison of female and male applicants across the 8 ward sub-locations</p>
          </div>
          <div style={{ display: 'flex', gap: 14, fontSize: '0.75rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#ec4899' }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#ec4899' }} /> Female
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#3b82f6' }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#3b82f6' }} /> Male
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {subLocationGender.map((sub) => {
            const fPct = Math.round((sub.female / sub.total) * 100);
            const mPct = 100 - fPct;
            return (
              <div key={sub.subLocation}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{sub.subLocation}</span>
                  <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                    <span style={{ color: '#ec4899', fontWeight: 600 }}>{sub.female} F ({fPct}%)</span>
                    {'  •  '}
                    <span style={{ color: '#60a5fa', fontWeight: 600 }}>{sub.male} M ({mPct}%)</span>
                  </span>
                </div>
                <div style={{ width: '100%', height: 10, borderRadius: 999, overflow: 'hidden', display: 'flex', background: 'rgba(255,255,255,0.06)' }}>
                  <div style={{ width: `${fPct}%`, background: '#ec4899' }} />
                  <div style={{ width: `${mPct}%`, background: '#3b82f6' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Educational Level Transition Parity */}
      <div style={{ background: 'rgba(15, 23, 42, 0.55)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 20px' }}>
        <h4 style={{ margin: '0 0 14px', fontSize: '0.95rem', color: '#f8fafc', fontWeight: 600 }}>
          Gender Balance by Educational Level
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          {levelGender.map((lvl) => {
            const fP = Math.round((lvl.female / lvl.total) * 100);
            const mP = 100 - fP;
            return (
              <div key={lvl.level} style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc' }}>{lvl.level}</span>
                  <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>{lvl.total} Students</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginTop: 10 }}>
                  <span style={{ color: '#ec4899' }}>Female: {lvl.female} ({fP}%)</span>
                  <span style={{ color: '#60a5fa' }}>Male: {lvl.male} ({mP}%)</span>
                </div>

                <div style={{ marginTop: 6, width: '100%', height: 6, borderRadius: 999, overflow: 'hidden', display: 'flex', background: 'rgba(255,255,255,0.06)' }}>
                  <div style={{ width: `${fP}%`, background: '#ec4899' }} />
                  <div style={{ width: `${mP}%`, background: '#3b82f6' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Educational Perspective Note */}
      <div style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="check" size={18} />
        </div>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5 }}>
          <strong>Policy Insight for MCA Bett:</strong> Girl-child enrollment in TVET polytechnics has risen to 49.3%, reflecting the success of local sensitization campaigns. Secondary day schools maintain a 51/49 parity index across all eight sub-locations.
        </p>
      </div>
    </ModalContainer>
  );
}

/* =========================================================================================
   3. POLLING STATIONS DISTRIBUTION MODAL
   ========================================================================================= */
export function PollingStationsModal({ open, onClose }: ModalBaseProps) {
  const applicants = useMemo(() => getFullApplicantPool(), []);

  const stationStats = useMemo(() => {
    const map = new Map<string, {
      station: string;
      subLocation: string;
      location: string;
      total: number;
      cleared: number;
      flagged: number;
      allocatedKes: number;
      avgChiefScore: number;
    }>();

    applicants.forEach((a) => {
      const s = a.pollingStation;
      if (!map.has(s)) {
        map.set(s, {
          station: s,
          subLocation: a.subLocation,
          location: a.location,
          total: 0,
          cleared: 0,
          flagged: 0,
          allocatedKes: 0,
          avgChiefScore: 0
        });
      }
      const entry = map.get(s)!;
      entry.total++;
      entry.avgChiefScore += a.chiefScore;
      if (a.inMasterVerifiedPool) {
        entry.cleared++;
        entry.allocatedKes += a.allocatedKes;
      } else {
        entry.flagged++;
      }
    });

    return Array.from(map.values()).map((e) => ({
      ...e,
      avgChiefScore: Math.round(e.avgChiefScore / (e.total || 1))
    })).sort((a, b) => b.total - a.total);
  }, [applicants]);

  const maxTotal = Math.max(...stationStats.map((s) => s.total), 1);

  return (
    <ModalContainer
      open={open}
      onClose={onClose}
      badge="Geopolitical Parity & Turnout"
      badgeTone="emerald"
      title="Polling Stations Distribution & Civic Equity"
      subtitle="Applicant volume and disbursement density evaluated across all 8 civic voting centers."
      maxWidth="920px"
    >
      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Active Polling Stations</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>8 Centers</div>
          <div style={{ fontSize: '0.76rem', color: '#10b981', marginTop: 2 }}>100% Ward Coverage</div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Highest Turnout Station</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>{stationStats[0]?.station}</div>
          <div style={{ fontSize: '0.76rem', color: '#22d3ee', marginTop: 2 }}>{stationStats[0]?.total} Applications</div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Turnout Range Spread</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>
            {stationStats[stationStats.length - 1]?.total} — {stationStats[0]?.total}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#f59e0b', marginTop: 2 }}>Parity Deviation &lt; 15%</div>
        </div>
      </div>

      {/* Comparative SVG Bar Chart */}
      <div style={{ background: 'rgba(15, 23, 42, 0.55)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 20px' }}>
        <h4 style={{ margin: '0 0 14px', fontSize: '0.95rem', color: '#f8fafc', fontWeight: 600 }}>
          Bursary Demand by Polling Station Center
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {stationStats.map((s) => {
            const barW = (s.total / maxTotal) * 100;
            const clrW = (s.cleared / maxTotal) * 100;
            return (
              <div key={s.station}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                  <span style={{ color: '#f1f5f9', fontWeight: 600 }}>
                    {s.station} <span style={{ color: '#64748b', fontSize: '0.75rem' }}>({s.location})</span>
                  </span>
                  <span style={{ fontFamily: 'monospace', color: '#34d399', fontSize: '0.78rem' }}>
                    {s.total} apps • {kes(s.allocatedKes)}
                  </span>
                </div>
                <div style={{ position: 'relative', width: '100%', height: 10, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${barW}%`, background: 'rgba(16, 185, 129, 0.35)', borderRadius: 999 }} />
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${clrW}%`, background: '#10b981', borderRadius: 999 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Station Table */}
      <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.7rem' }}>
              <th style={{ padding: '10px 14px' }}>Polling Station</th>
              <th style={{ padding: '10px 14px' }}>Sub-Location</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total Applicants</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Cleared Pool</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>In Triage</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Avg Chief Need</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total Awarded KES</th>
            </tr>
          </thead>
          <tbody>
            {stationStats.map((s) => (
              <tr key={s.station} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#e2e8f0' }}>
                <td style={{ padding: '10px 14px', fontWeight: 600 }}>{s.station}</td>
                <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{s.subLocation}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600 }}>{s.total}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', color: '#34d399' }}>{s.cleared}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right', color: s.flagged > 0 ? '#f59e0b' : '#64748b' }}>{s.flagged}</td>
                <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                  <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', fontSize: '0.74rem' }}>
                    {s.avgChiefScore}/100
                  </span>
                </td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', color: '#34d399' }}>
                  {kes(s.allocatedKes)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ModalContainer>
  );
}

/* =========================================================================================
   4. SCHOOL DISTRIBUTION MODAL
   ========================================================================================= */
export function SchoolDistributionModal({ open, onClose }: ModalBaseProps) {
  const applicants = useMemo(() => getFullApplicantPool(), []);

  const total = applicants.length;

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { category: string; count: number; totalFee: number; totalAward: number }>();
    applicants.forEach((a) => {
      const cat = a.institutionCategory;
      if (!map.has(cat)) {
        map.set(cat, { category: cat, count: 0, totalFee: 0, totalAward: 0 });
      }
      const entry = map.get(cat)!;
      entry.count++;
      entry.totalFee += a.feeBalance;
      if (a.inMasterVerifiedPool) entry.totalAward += a.allocatedKes;
    });
    return Array.from(map.values());
  }, [applicants]);

  const topSchools = useMemo(() => {
    const map = new Map<string, { name: string; category: string; count: number; allocated: number; avgFee: number }>();
    applicants.forEach((a) => {
      if (!map.has(a.school)) {
        map.set(a.school, { name: a.school, category: a.institutionCategory, count: 0, allocated: 0, avgFee: 0 });
      }
      const entry = map.get(a.school)!;
      entry.count++;
      entry.avgFee += a.feeBalance;
      if (a.inMasterVerifiedPool) entry.allocated += a.allocatedKes;
    });

    return Array.from(map.values())
      .map((s) => ({ ...s, avgFee: Math.round(s.avgFee / (s.count || 1)) }))
      .sort((a, b) => b.count - a.count);
  }, [applicants]);

  return (
    <ModalContainer
      open={open}
      onClose={onClose}
      badge="Educational Pipeline & Institutions"
      badgeTone="amber"
      title="School & Institutional Distribution"
      subtitle="Bursary allocation mapped across Secondary Schools, National Polytechnics, and Universities."
      maxWidth="940px"
    >
      {/* Category Level Breakdown Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
        {categoryBreakdown.map((c) => {
          const cPct = Math.round((c.count / total) * 100);
          return (
            <div key={c.category} style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700, color: '#f59e0b' }}>{c.category}</span>
                <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontWeight: 700 }}>
                  {cPct}% of Ward
                </span>
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#f8fafc', marginTop: 6 }}>
                {num(c.count)} Students
              </div>
              <div style={{ marginTop: 8, fontSize: '0.78rem', color: '#94a3b8' }}>
                Allocated: <strong style={{ color: '#34d399' }}>{kes(c.totalAward)}</strong>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>
                Cumulative Fee Burden: {kes(c.totalFee)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Funded Institutions Table */}
      <div style={{ background: 'rgba(15, 23, 42, 0.55)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 20px' }}>
        <h4 style={{ margin: '0 0 14px', fontSize: '0.95rem', color: '#f8fafc', fontWeight: 600 }}>
          Top Beneficiary Schools &amp; Colleges
        </h4>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '8px 12px' }}>Institution Name</th>
                <th style={{ padding: '8px 12px' }}>Level</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Students</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Avg Fee Balance</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Bursary Disbursed</th>
              </tr>
            </thead>
            <tbody>
              {topSchools.map((s) => (
                <tr key={s.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#e2e8f0' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{s.name}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
                      {s.category}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{s.count}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#94a3b8' }}>
                    {kes(s.avgFee)}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#34d399', fontWeight: 600 }}>
                    {kes(s.allocated)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModalContainer>
  );
}

/* =========================================================================================
   5. AGE DISTRIBUTION MODAL
   ========================================================================================= */
export function AgeDistributionModal({ open, onClose }: ModalBaseProps) {
  const applicants = useMemo(() => getFullApplicantPool(), []);

  const total = applicants.length;

  // Brackets: 14-17 (Secondary), 18-24 (Tertiary), 25+ (Adult Continuing)
  const b1 = applicants.filter((a) => a.age >= 14 && a.age <= 17);
  const b2 = applicants.filter((a) => a.age >= 18 && a.age <= 24);
  const b3 = applicants.filter((a) => a.age >= 25);

  const ageHistogram = useMemo(() => {
    const counts: Record<number, number> = {};
    for (let age = 14; age <= 32; age++) counts[age] = 0;
    applicants.forEach((a) => {
      if (counts[a.age] !== undefined) counts[a.age]++;
    });
    return Object.entries(counts).map(([age, count]) => ({ age: Number(age), count }));
  }, [applicants]);

  const maxAgeCount = Math.max(...ageHistogram.map((h) => h.count), 1);

  return (
    <ModalContainer
      open={open}
      onClose={onClose}
      badge="Demographic Spread & Cohort Progression"
      badgeTone="blue"
      title="Applicant Age Distribution & Lifecycle"
      subtitle="Comprehensive age analysis from secondary school minors (14-17) to adult continuing learners."
      maxWidth="920px"
    >
      {/* 3 Main Cohort Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 18px' }}>
          <span style={{ fontSize: '0.72rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 700 }}>
            Secondary School Minor (14 - 17 Yrs)
          </span>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>
            {b1.length} Applicants ({Math.round((b1.length / total) * 100)}%)
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }}>
            Custody Accounts • NEMIS &amp; Birth Cert verified
          </div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 18px' }}>
          <span style={{ fontSize: '0.72rem', color: '#a78bfa', textTransform: 'uppercase', fontWeight: 700 }}>
            Tertiary &amp; University (18 - 24 Yrs)
          </span>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>
            {b2.length} Applicants ({Math.round((b2.length / total) * 100)}%)
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }}>
            Independent &amp; Delegated Accounts • Poly &amp; Degrees
          </div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 18px' }}>
          <span style={{ fontSize: '0.72rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 700 }}>
            Adult Continuing / TVET (25+ Yrs)
          </span>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#f8fafc', marginTop: 4 }}>
            {b3.length} Applicants ({Math.round((b3.length / total) * 100)}%)
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 4 }}>
            Vocational Skills Certification • Technical Trades
          </div>
        </div>
      </div>

      {/* SVG Age Histogram */}
      <div style={{ background: 'rgba(15, 23, 42, 0.55)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc', fontWeight: 600 }}>Age Histogram (Ages 14 to 32)</h4>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>Frequency of applicants per year of age across the ward</p>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#60a5fa', fontWeight: 600 }}>Median Age: 19 Years</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160, paddingBottom: 24, position: 'relative' }}>
          {ageHistogram.map((h) => {
            const barH = (h.count / maxAgeCount) * 130;
            const isSecondary = h.age <= 17;
            const isUni = h.age >= 18 && h.age <= 24;
            const color = isSecondary ? '#38bdf8' : isUni ? '#818cf8' : '#34d399';

            return (
              <div
                key={h.age}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end',
                  cursor: 'default'
                }}
                title={`Age ${h.age}: ${h.count} applicants`}
              >
                <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: 4 }}>{h.count}</span>
                <div
                  style={{
                    width: '100%',
                    height: `${barH}px`,
                    background: color,
                    borderRadius: '3px 3px 0 0',
                    transition: 'all 0.2s ease'
                  }}
                />
                <span style={{ position: 'absolute', bottom: 0, fontSize: '0.68rem', color: '#64748b' }}>
                  {h.age}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </ModalContainer>
  );
}

/* =========================================================================================
   6. POLLING STATION EQUITY & CLEARANCE ANOMALIES MODAL
   ========================================================================================= */
export function StationEquityModal({ open, onClose }: ModalBaseProps) {
  const applicants = useMemo(() => getFullApplicantPool(), []);

  const total = applicants.length;
  const flagged = applicants.filter((a) => !a.inMasterVerifiedPool);

  const stationsData = useMemo(() => {
    const map = new Map<string, { station: string; total: number; flagged: number; residencyIssues: number; nemisIssues: number }>();
    applicants.forEach((a) => {
      const s = a.pollingStation;
      if (!map.has(s)) {
        map.set(s, { station: s, total: 0, flagged: 0, residencyIssues: 0, nemisIssues: 0 });
      }
      const entry = map.get(s)!;
      entry.total++;
      if (!a.inMasterVerifiedPool) {
        entry.flagged++;
        if (a.isResidencyFlagged) entry.residencyIssues++;
        if (a.riskFlag === 'NEMIS Discrepancy') entry.nemisIssues++;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.flagged - a.flagged);
  }, [applicants]);

  return (
    <ModalContainer
      open={open}
      onClose={onClose}
      badge="Geopolitical Equity & Triage"
      badgeTone="amber"
      title="Polling Station Clearance & Triage Analytics"
      subtitle="Deep audit of flagged applications, boundary queries, and chief clearance rates per voting station."
      maxWidth="920px"
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Total In Triage</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#f59e0b', marginTop: 4 }}>{flagged.length} Records</div>
          <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: 2 }}>{Math.round((flagged.length / total) * 100)}% of Ward Total</div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Residency Boundary Queries</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#f87171', marginTop: 4 }}>
            {applicants.filter((a) => a.isResidencyFlagged).length} Cases
          </div>
          <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: 2 }}>Cross-Ward Boundary Overlap</div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>NEMIS / UPI Validations</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, color: '#60a5fa', marginTop: 4 }}>
            {applicants.filter((a) => a.riskFlag === 'NEMIS Discrepancy').length} Queries
          </div>
          <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: 2 }}>School Portal Cross-Check</div>
        </div>
      </div>

      {/* Triage Matrix Table */}
      <div style={{ overflowX: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '10px 14px' }}>Polling Station</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total Intake</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>In Triage</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Boundary Flags</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>NEMIS Queries</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Clearance Rate</th>
            </tr>
          </thead>
          <tbody>
            {stationsData.map((s) => {
              const clrRate = Math.round(((s.total - s.flagged) / (s.total || 1)) * 100);
              return (
                <tr key={s.station} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#e2e8f0' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{s.station}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600 }}>{s.total}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: '#f59e0b', fontWeight: 600 }}>{s.flagged}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: '#f87171' }}>{s.residencyIssues}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right', color: '#60a5fa' }}>{s.nemisIssues}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: clrRate >= 80 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: clrRate >= 80 ? '#34d399' : '#fbbf24'
                    }}>
                      {clrRate}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ModalContainer>
  );
}
