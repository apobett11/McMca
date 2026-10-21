import React, { useState, useEffect, useMemo } from 'react';
import { MCALayout } from '../components/MCALayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { RefreshButton } from '../../../components/RefreshButton.jsx';
import {
  getMCAApplications,
  getMCACycleSettings,
  saveMCACycleSettings,
  syncMCAApplicationsFromDB,
  MCA_CYCLES,
  WARD_VILLAGES,
  POLLING_STATIONS,
  EDUCATION_LEVELS,
  AGE_BRACKETS,
  CYCLE_STATES
} from '../utils/mcaData.js';

export function MCAApplicationsPage() {
  // Cycle selection persists in sessionStorage until changed or session end
  const [selectedCycle, setSelectedCycle] = useState(() => {
    return sessionStorage.getItem('mcmca_selected_cycle') || MCA_CYCLES[0];
  });

  const handleCycleChange = (cycle) => {
    setSelectedCycle(cycle);
    sessionStorage.setItem('mcmca_selected_cycle', cycle);
  };

  // Cycle settings state (Opening, Closing, State)
  const [cycleSettings, setCycleSettings] = useState(() => getMCACycleSettings());
  const [cycleOpening, setCycleOpening] = useState(cycleSettings.openingDateTime || '2026-01-15T08:00');
  const [cycleClosing, setCycleClosing] = useState(cycleSettings.closingDateTime || '2026-04-30T17:00');
  const [cycleState, setCycleState] = useState(cycleSettings.state || 'allocated');
  const [cycleSavedFeedback, setCycleSavedFeedback] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Applications dataset
  const [allApps, setAllApps] = useState(() => getMCAApplications());

  async function handleRefresh() {
    setRefreshing(true);
    await syncMCAApplicationsFromDB();
    setAllApps(getMCAApplications());
    setCycleSettings(getMCACycleSettings());
    setRefreshing(false);
  }

  useEffect(() => {
    function refresh() {
      setAllApps(getMCAApplications());
      setCycleSettings(getMCACycleSettings());
    }

    syncMCAApplicationsFromDB().catch(() => {});

    window.addEventListener('mcmca_mca_apps_updated', refresh);
    window.addEventListener('mcmca_mca_cycle_settings_updated', refresh);
    return () => {
      window.removeEventListener('mcmca_mca_apps_updated', refresh);
      window.removeEventListener('mcmca_mca_cycle_settings_updated', refresh);
    };
  }, []);

  // Filter apps by active cycle
  const cycleApps = useMemo(() => {
    return allApps.filter((a) => a.year === selectedCycle);
  }, [allApps, selectedCycle]);

  // Aggregate Category Data
  const locationDist = useMemo(() => {
    const data = {};
    WARD_VILLAGES.forEach((v) => { data[v] = { total: 0, accepted: 0, failed: 0, amount: 0 }; });
    cycleApps.forEach((a) => {
      const v = a.village || 'Other';
      if (!data[v]) data[v] = { total: 0, accepted: 0, failed: 0, amount: 0 };
      data[v].total += 1;
      if (a.status === 'Failed') data[v].failed += 1;
      else data[v].accepted += 1;
      data[v].amount += Number(a.bursaryAmount) || 0;
    });
    return data;
  }, [cycleApps]);

  const pollingDist = useMemo(() => {
    const data = {};
    POLLING_STATIONS.forEach((p) => { data[p] = { total: 0, accepted: 0, failed: 0, amount: 0 }; });
    cycleApps.forEach((a) => {
      const p = a.pollingStation || POLLING_STATIONS[0];
      if (!data[p]) data[p] = { total: 0, accepted: 0, failed: 0, amount: 0 };
      data[p].total += 1;
      if (a.status === 'Failed') data[p].failed += 1;
      else data[p].accepted += 1;
      data[p].amount += Number(a.bursaryAmount) || 0;
    });
    return data;
  }, [cycleApps]);

  const ageDist = useMemo(() => {
    const data = {};
    AGE_BRACKETS.forEach((b) => { data[b] = { total: 0, accepted: 0, failed: 0, amount: 0 }; });
    cycleApps.forEach((a) => {
      const b = a.ageBracket || '15 - 18';
      if (!data[b]) data[b] = { total: 0, accepted: 0, failed: 0, amount: 0 };
      data[b].total += 1;
      if (a.status === 'Failed') data[b].failed += 1;
      else data[b].accepted += 1;
      data[b].amount += Number(a.bursaryAmount) || 0;
    });
    return data;
  }, [cycleApps]);

  const educationDist = useMemo(() => {
    const data = {};
    EDUCATION_LEVELS.forEach((e) => { data[e] = { total: 0, accepted: 0, failed: 0, amount: 0 }; });
    cycleApps.forEach((a) => {
      const e = a.educationLevel || 'Secondary';
      if (!data[e]) data[e] = { total: 0, accepted: 0, failed: 0, amount: 0 };
      data[e].total += 1;
      if (a.status === 'Failed') data[e].failed += 1;
      else data[e].accepted += 1;
      data[e].amount += Number(a.bursaryAmount) || 0;
    });
    return data;
  }, [cycleApps]);

  // Save Cycle Control Form
  const handleSaveCycle = (e) => {
    e.preventDefault();
    const updated = {
      cycle: selectedCycle,
      openingDateTime: cycleOpening,
      closingDateTime: cycleClosing,
      state: cycleState
    };
    saveMCACycleSettings(updated);
    setCycleSavedFeedback(true);
    setTimeout(() => setCycleSavedFeedback(false), 3000);
  };

  // --- GENERAL GRAPH STATE ---
  // Switch between Bar Graph and Line Graph
  const [graphType, setGraphType] = useState('bar'); // 'bar' | 'line'

  // Inline Metric Filters (Limit to 5: Total, Failed, Accepted, Pending, Disbursed)
  // By default, Total, Failed, and Accepted are marked on each session
  const [activeSeries, setActiveSeries] = useState({
    total: true,
    failed: true,
    accepted: true,
    pending: false,
    disbursed: false
  });

  const toggleSeries = (key) => {
    setActiveSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Monthly breakdown for general graph
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

  const monthlySeriesData = useMemo(() => {
    return MONTHS.map((m) => {
      const mApps = cycleApps.filter((a) => a.month === m);
      const total = mApps.length;
      const failed = mApps.filter((a) => a.status === 'Failed').length;
      const accepted = mApps.filter((a) => a.status === 'Allocated' || a.status === 'Approved').length;
      const pending = mApps.filter((a) => a.status === 'Pending' || a.status === 'Under Review').length;
      const disbursed = mApps.filter((a) => a.status === 'Disbursed' || a.status === 'Paid to account').length;

      return {
        month: m,
        total,
        failed,
        accepted,
        pending,
        disbursed,
        apps: mApps
      };
    });
  }, [cycleApps]);

  const maxMonthlyVal = useMemo(() => {
    let max = 1;
    monthlySeriesData.forEach((d) => {
      if (d.total > max) max = d.total;
    });
    return max + 1;
  }, [monthlySeriesData]);

  // SMART MONTH DRILLDOWN POPUP (Weekly analysis)
  const [drilldownMonth, setDrilldownMonth] = useState(null);

  const weeklyDataForDrilldown = useMemo(() => {
    if (!drilldownMonth) return [];
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    return weeks.map((w) => {
      const wApps = drilldownMonth.apps.filter((a) => a.week === w || (w === 'Week 2' && !a.week));
      return {
        week: w,
        total: wApps.length,
        failed: wApps.filter((a) => a.status === 'Failed').length,
        accepted: wApps.filter((a) => a.status === 'Allocated' || a.status === 'Approved').length,
        pending: wApps.filter((a) => a.status === 'Pending').length,
        disbursed: wApps.filter((a) => a.status === 'Disbursed' || a.status === 'Paid to account').length
      };
    });
  }, [drilldownMonth]);

  // STRATEGIC CARD POPUP (Locations, Polling Stations, Age, Education Level)
  const [categoryModal, setCategoryModal] = useState(null); // 'locations' | 'polling' | 'age' | 'education' | null
  const [modalTimeframe, setModalTimeframe] = useState('cycle'); // 'cycle' | 'monthly'
  const [modalSelectedMonth, setModalSelectedMonth] = useState('Feb');
  const [modalGraphType, setModalGraphType] = useState('line'); // 'line' (default) | 'bar'

  // Data for active category modal
  const activeModalData = useMemo(() => {
    if (!categoryModal) return { items: [], title: '' };

    let pool = cycleApps;
    if (modalTimeframe === 'monthly') {
      pool = cycleApps.filter((a) => a.month === modalSelectedMonth);
    }

    let raw = {};
    let title = '';

    if (categoryModal === 'locations') {
      title = 'Ward Locations / Villages Strategic Analytics';
      WARD_VILLAGES.forEach((v) => { raw[v] = { name: v, total: 0, accepted: 0, failed: 0, amount: 0 }; });
      pool.forEach((a) => {
        const key = a.village || 'Other';
        if (!raw[key]) raw[key] = { name: key, total: 0, accepted: 0, failed: 0, amount: 0 };
        raw[key].total += 1;
        if (a.status === 'Failed') raw[key].failed += 1;
        else raw[key].accepted += 1;
        raw[key].amount += Number(a.bursaryAmount) || 0;
      });
    } else if (categoryModal === 'polling') {
      title = 'Polling Stations Distribution Analytics';
      POLLING_STATIONS.forEach((p) => { raw[p] = { name: p, total: 0, accepted: 0, failed: 0, amount: 0 }; });
      pool.forEach((a) => {
        const key = a.pollingStation || POLLING_STATIONS[0];
        if (!raw[key]) raw[key] = { name: key, total: 0, accepted: 0, failed: 0, amount: 0 };
        raw[key].total += 1;
        if (a.status === 'Failed') raw[key].failed += 1;
        else raw[key].accepted += 1;
        raw[key].amount += Number(a.bursaryAmount) || 0;
      });
    } else if (categoryModal === 'age') {
      title = 'Age Brackets Demographics Analytics';
      AGE_BRACKETS.forEach((b) => { raw[b] = { name: b, total: 0, accepted: 0, failed: 0, amount: 0 }; });
      pool.forEach((a) => {
        const key = a.ageBracket || '15 - 18';
        if (!raw[key]) raw[key] = { name: key, total: 0, accepted: 0, failed: 0, amount: 0 };
        raw[key].total += 1;
        if (a.status === 'Failed') raw[key].failed += 1;
        else raw[key].accepted += 1;
        raw[key].amount += Number(a.bursaryAmount) || 0;
      });
    } else if (categoryModal === 'education') {
      title = 'Education Levels Allocation Analytics';
      EDUCATION_LEVELS.forEach((e) => { raw[e] = { name: e, total: 0, accepted: 0, failed: 0, amount: 0 }; });
      pool.forEach((a) => {
        const key = a.educationLevel || 'Secondary';
        if (!raw[key]) raw[key] = { name: key, total: 0, accepted: 0, failed: 0, amount: 0 };
        raw[key].total += 1;
        if (a.status === 'Failed') raw[key].failed += 1;
        else raw[key].accepted += 1;
        raw[key].amount += Number(a.bursaryAmount) || 0;
      });
    }

    const items = Object.values(raw);
    const grandTotal = items.reduce((s, it) => s + it.total, 0);

    const colors = ['#38bdf8', '#34d399', '#fbbf24', '#a78bfa', '#f43f5e', '#2dd4bf'];

    const itemsWithShare = items.map((it, idx) => ({
      ...it,
      share: grandTotal > 0 ? Math.round((it.total / grandTotal) * 100) : 0,
      color: colors[idx % colors.length]
    }));

    return { title, items: itemsWithShare, grandTotal };
  }, [categoryModal, modalTimeframe, modalSelectedMonth, cycleApps]);

  return (
    <MCALayout pageTitle="Applications & Cycle Analytics">
      {/* CYCLE SWITCHER HEADER */}
      <section className="mca-section" style={{ marginBottom: 24 }}>
        <div className="mca-section__header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <h1 className="mca-section__title" style={{ fontSize: '1.6rem' }}>
              <Icon name="applications" size={24} />
              Bursary Distribution & Strategic Intake Control
            </h1>
            <p className="mca-section__desc">
              Strategic ward analytics by polling station, location, demographics, cycle window controls, and intake trends.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Select Cycle (Persisted):
            </span>
            <div className="mca-filter-pills" role="tablist">
              {MCA_CYCLES.map((cycle) => (
                <button
                  key={cycle}
                  type="button"
                  role="tab"
                  aria-selected={selectedCycle === cycle}
                  className={`mca-filter-pill ${selectedCycle === cycle ? 'mca-filter-pill--active' : ''}`}
                  onClick={() => handleCycleChange(cycle)}
                >
                  {cycle} {cycle === '2026/2027' ? '★ Active' : ''}
                </button>
              ))}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
              <RefreshButton busy={refreshing} onClick={handleRefresh} />
              <button
                type="button"
                className="mca-btn mca-btn--schedule"
                onClick={() => {
                  const headers = ['Serial', 'Name', 'School', 'Level', 'Location', 'Polling Station', 'Bursary Amount', 'Status'];
                  const rows = cycleApps.map(a => [a.serial, a.fullName, a.school, a.educationLevel, a.location, a.pollingStation, a.bursaryAmount, a.status]);
                  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
                  const link = document.createElement('a');
                  link.setAttribute('href', encodeURI(csvContent));
                  link.setAttribute('download', `mcmca_bursary_export_${selectedCycle.replace('/', '_')}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                style={{ padding: '6px 14px', fontSize: '0.82rem' }}
              >
                Export CSV / Report
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4 CLICKABLE CATEGORY CARDS */}
      <section className="mca-section" aria-label="Category Analytics Cards">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {/* Card 1: Locations */}
          <div
            className="mca-card mca-card--clickable"
            onClick={() => setCategoryModal('locations')}
            title="Click to view full Locations Strategic Analytics"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Locations / Villages</span>
              <span className="mca-badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                {WARD_VILLAGES.length} Villages
              </span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff' }}>
              {cycleApps.length} <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Applications</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              Click to open tables, graphs & pie charts →
            </div>
          </div>

          {/* Card 2: Polling Stations (Replaced Institutions) */}
          <div
            className="mca-card mca-card--clickable"
            onClick={() => setCategoryModal('polling')}
            title="Click to view Polling Stations Strategic Analytics"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Polling Stations</span>
              <span className="mca-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                {POLLING_STATIONS.length} Stations
              </span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff' }}>
              {cycleApps.length} <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Voter Hubs</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              Click to open polling station distribution →
            </div>
          </div>

          {/* Card 3: Age Brackets */}
          <div
            className="mca-card mca-card--clickable"
            onClick={() => setCategoryModal('age')}
            title="Click to view Age Cohort Analytics"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Age Demographics</span>
              <span className="mca-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                4 Tiers
              </span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff' }}>
              {cycleApps.length} <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Students</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#fbbf24', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              Click to view age cohort distribution →
            </div>
          </div>

          {/* Card 4: Education Level */}
          <div
            className="mca-card mca-card--clickable"
            onClick={() => setCategoryModal('education')}
            title="Click to view Education Level Analytics"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600 }}>Education Levels</span>
              <span className="mca-badge" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc' }}>
                Primary to Uni
              </span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff' }}>
              {cycleApps.length} <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>Allocations</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#c084fc', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              Click to view education tier breakdown →
            </div>
          </div>
        </div>
      </section>

      {/* NEW CARD: CURRENT CYCLE APPLICATION WINDOW & STATE CONTROL */}
      <section className="mca-section" aria-label="Current Cycle Control">
        <div className="mca-card" style={{ borderLeft: '4px solid #3b82f6', background: 'linear-gradient(145deg, #121f3d 0%, #162445 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="clock" size={18} />
                Current Cycle Administration ({selectedCycle})
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '4px 0 0' }}>
                Set official bursary application opening/closing windows and update live disbursement lifecycle state.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>Current State:</span>
              <span
                className="mca-badge"
                style={{
                  background: cycleState === 'paid to account' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                  color: cycleState === 'paid to account' ? '#34d399' : '#60a5fa',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
              >
                {cycleState.toUpperCase()}
              </span>
            </div>
          </div>

          {cycleSavedFeedback && (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '8px 14px', borderRadius: 8, fontSize: '0.84rem', fontWeight: 600, marginBottom: 14 }}>
              ✓ Cycle opening/closing times and state updated successfully!
            </div>
          )}

          <form onSubmit={handleSaveCycle}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
              {/* Opening Date & Time */}
              <div className="mca-form-group" style={{ margin: 0 }}>
                <label className="mca-form-label">Application Opening Date & Time</label>
                <input
                  type="datetime-local"
                  className="mca-input"
                  value={cycleOpening}
                  onChange={(e) => setCycleOpening(e.target.value)}
                  required
                />
              </div>

              {/* Closing Date & Time */}
              <div className="mca-form-group" style={{ margin: 0 }}>
                <label className="mca-form-label">Application Closing Date & Time</label>
                <input
                  type="datetime-local"
                  className="mca-input"
                  value={cycleClosing}
                  onChange={(e) => setCycleClosing(e.target.value)}
                  required
                />
              </div>

              {/* State Dropdown */}
              <div className="mca-form-group" style={{ margin: 0 }}>
                <label className="mca-form-label">Bursary State</label>
                <select
                  className="mca-select"
                  value={cycleState}
                  onChange={(e) => setCycleState(e.target.value)}
                >
                  {CYCLE_STATES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Save Button */}
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  type="submit"
                  className="mca-btn mca-btn--schedule"
                  style={{ width: '100%', padding: '10px 14px', height: 42 }}
                >
                  Save Cycle Settings
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* GENERAL GRAPH PER YEAR (MONTHLY DISTRIBUTION WITH RED FAILED APPS) */}
      <section className="mca-section" aria-label="General Yearly Graph">
        <div className="mca-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                Intake Distribution Timeline ({selectedCycle})
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '4px 0 0' }}>
                Monthly intake curve with red failed applications. Click any month node/bar for a weekly smart drilldown popup.
              </p>
            </div>

            {/* CONTROLS: GRAPH TYPE SWITCH & INLINE SMALL 5 METRICS BUTTONS */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {/* Line vs Bar toggle */}
              <div style={{ display: 'flex', background: 'var(--mca-surface)', padding: 3, borderRadius: 8, border: '1px solid var(--mca-border)' }}>
                <button
                  type="button"
                  className={`mca-btn mca-btn--sm ${graphType === 'bar' ? 'mca-btn--schedule' : 'mca-btn--cancel'}`}
                  style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                  onClick={() => setGraphType('bar')}
                >
                  Bar
                </button>
                <button
                  type="button"
                  className={`mca-btn mca-btn--sm ${graphType === 'line' ? 'mca-btn--schedule' : 'mca-btn--cancel'}`}
                  style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                  onClick={() => setGraphType('line')}
                >
                  Line
                </button>
              </div>

              {/* 5 Small Inline Filter Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {/* 1. Total (Default marked) */}
                <button
                  type="button"
                  onClick={() => toggleSeries('total')}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '1px solid #38bdf8',
                    background: activeSeries.total ? '#38bdf8' : 'transparent',
                    color: activeSeries.total ? '#000' : '#38bdf8'
                  }}
                >
                  Total
                </button>

                {/* 2. Failed (Red, Default marked) */}
                <button
                  type="button"
                  onClick={() => toggleSeries('failed')}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '1px solid #ef4444',
                    background: activeSeries.failed ? '#ef4444' : 'transparent',
                    color: activeSeries.failed ? '#fff' : '#ef4444'
                  }}
                >
                  Failed (Red)
                </button>

                {/* 3. Accepted (Default marked) */}
                <button
                  type="button"
                  onClick={() => toggleSeries('accepted')}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '1px solid #34d399',
                    background: activeSeries.accepted ? '#34d399' : 'transparent',
                    color: activeSeries.accepted ? '#000' : '#34d399'
                  }}
                >
                  Accepted
                </button>

                {/* 4. Pending */}
                <button
                  type="button"
                  onClick={() => toggleSeries('pending')}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '1px solid #fbbf24',
                    background: activeSeries.pending ? '#fbbf24' : 'transparent',
                    color: activeSeries.pending ? '#000' : '#fbbf24'
                  }}
                >
                  Pending
                </button>

                {/* 5. Disbursed */}
                <button
                  type="button"
                  onClick={() => toggleSeries('disbursed')}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '1px solid #818cf8',
                    background: activeSeries.disbursed ? '#818cf8' : 'transparent',
                    color: activeSeries.disbursed ? '#000' : '#818cf8'
                  }}
                >
                  Disbursed
                </button>
              </div>
            </div>
          </div>

          {/* GRAPH VISUALIZATION (BAR OR LINE) */}
          <div style={{ height: 260, width: '100%', position: 'relative', marginTop: 10 }}>
            {graphType === 'bar' ? (
              /* BAR GRAPH */
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 210, borderBottom: '1px solid var(--mca-border)', paddingBottom: 6 }}>
                {monthlySeriesData.map((d) => (
                  <div
                    key={d.month}
                    onClick={() => setDrilldownMonth(d)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      height: '100%',
                      cursor: 'pointer',
                      flex: 1,
                      padding: '0 4px'
                    }}
                    title={`Click ${d.month} for 4-week drilldown popup`}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, width: '100%', maxWidth: 44, height: '100%' }}>
                      {/* Total Bar */}
                      {activeSeries.total && (
                        <div
                          style={{
                            flex: 1,
                            height: `${(d.total / maxMonthlyVal) * 100}%`,
                            background: '#38bdf8',
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.25s ease'
                          }}
                          title={`Total: ${d.total}`}
                        />
                      )}

                      {/* Failed Bar (Red) */}
                      {activeSeries.failed && (
                        <div
                          style={{
                            flex: 1,
                            height: `${(d.failed / maxMonthlyVal) * 100}%`,
                            background: '#ef4444',
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.25s ease'
                          }}
                          title={`Failed: ${d.failed}`}
                        />
                      )}

                      {/* Accepted Bar */}
                      {activeSeries.accepted && (
                        <div
                          style={{
                            flex: 1,
                            height: `${(d.accepted / maxMonthlyVal) * 100}%`,
                            background: '#34d399',
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.25s ease'
                          }}
                          title={`Accepted: ${d.accepted}`}
                        />
                      )}

                      {/* Pending Bar */}
                      {activeSeries.pending && (
                        <div
                          style={{
                            flex: 1,
                            height: `${(d.pending / maxMonthlyVal) * 100}%`,
                            background: '#fbbf24',
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.25s ease'
                          }}
                          title={`Pending: ${d.pending}`}
                        />
                      )}

                      {/* Disbursed Bar */}
                      {activeSeries.disbursed && (
                        <div
                          style={{
                            flex: 1,
                            height: `${(d.disbursed / maxMonthlyVal) * 100}%`,
                            background: '#818cf8',
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.25s ease'
                          }}
                          title={`Disbursed: ${d.disbursed}`}
                        />
                      )}
                    </div>

                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', marginTop: 8 }}>
                      {d.month}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              /* LINE GRAPH */
              <div style={{ height: 210, width: '100%', position: 'relative', borderBottom: '1px solid var(--mca-border)' }}>
                <svg width="100%" height="100%" viewBox="0 0 600 200" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="50" x2="600" y2="50" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
                  <line x1="0" y1="100" x2="600" y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
                  <line x1="0" y1="150" x2="600" y2="150" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />

                  {/* Lines for each active series */}
                  {(() => {
                    const step = 600 / (monthlySeriesData.length - 1);

                    const buildPoints = (metricKey) => {
                      return monthlySeriesData
                        .map((d, i) => {
                          const x = i * step;
                          const y = 180 - (d[metricKey] / maxMonthlyVal) * 150;
                          return `${x},${y}`;
                        })
                        .join(' ');
                    };

                    return (
                      <>
                        {activeSeries.total && (
                          <polyline
                            points={buildPoints('total')}
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="3"
                          />
                        )}
                        {activeSeries.failed && (
                          <polyline
                            points={buildPoints('failed')}
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="3.5"
                          />
                        )}
                        {activeSeries.accepted && (
                          <polyline
                            points={buildPoints('accepted')}
                            fill="none"
                            stroke="#34d399"
                            strokeWidth="3"
                          />
                        )}
                        {activeSeries.pending && (
                          <polyline
                            points={buildPoints('pending')}
                            fill="none"
                            stroke="#fbbf24"
                            strokeWidth="2.5"
                            strokeDasharray="4"
                          />
                        )}
                        {activeSeries.disbursed && (
                          <polyline
                            points={buildPoints('disbursed')}
                            fill="none"
                            stroke="#818cf8"
                            strokeWidth="2.5"
                          />
                        )}

                        {/* Interactive Click Nodes per month */}
                        {monthlySeriesData.map((d, i) => {
                          const x = i * step;
                          const y = 180 - (d.total / maxMonthlyVal) * 150;
                          return (
                            <circle
                              key={d.month}
                              cx={x}
                              cy={y}
                              r="7"
                              fill="#38bdf8"
                              stroke="#0a1329"
                              strokeWidth="2"
                              style={{ cursor: 'pointer' }}
                              onClick={() => setDrilldownMonth(d)}
                            />
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>

                {/* X-Axis labels for line graph */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, padding: '0 4px' }}>
                  {monthlySeriesData.map((d) => (
                    <span
                      key={d.month}
                      onClick={() => setDrilldownMonth(d)}
                      style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', cursor: 'pointer' }}
                    >
                      {d.month}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, fontSize: '0.74rem', color: '#94a3b8' }}>
              <span>💡 Tip: Click any month above to open smart weekly breakdown</span>
              <span style={{ color: '#ef4444', fontWeight: 600 }}>Red Line/Bar = Failed Applications</span>
            </div>
          </div>
        </div>
      </section>

      {/* POPUP 1: SMART MONTH DRILLDOWN POPUP (WEEKS BREAKDOWN) */}
      {drilldownMonth && (
        <div className="mca-modal-overlay" onClick={() => setDrilldownMonth(null)} role="dialog" aria-modal="true">
          <div className="mca-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680 }}>
            <div className="mca-modal-header">
              <div>
                <h3 className="mca-modal-title">
                  {drilldownMonth.month} Intake: Weekly Breakdown ({selectedCycle})
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Total Monthly Intake: <strong>{drilldownMonth.total} Applications</strong> • {drilldownMonth.failed} Failed
                </span>
              </div>
              <button
                type="button"
                className="mca-modal-close-btn"
                onClick={() => setDrilldownMonth(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Weekly Bars Projection */}
            <div style={{ background: 'var(--mca-surface)', padding: 18, borderRadius: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 160, borderBottom: '1px solid var(--mca-border)', paddingBottom: 6 }}>
                {weeklyDataForDrilldown.map((w) => (
                  <div key={w.week} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 130, width: 36 }}>
                      {/* Total */}
                      <div
                        style={{
                          flex: 1,
                          height: `${Math.max((w.total / Math.max(drilldownMonth.total, 1)) * 100, 10)}%`,
                          background: '#38bdf8',
                          borderRadius: '3px 3px 0 0'
                        }}
                        title={`Total: ${w.total}`}
                      />
                      {/* Failed (Red) */}
                      <div
                        style={{
                          flex: 1,
                          height: `${Math.max((w.failed / Math.max(drilldownMonth.total, 1)) * 100, w.failed > 0 ? 10 : 0)}%`,
                          background: '#ef4444',
                          borderRadius: '3px 3px 0 0'
                        }}
                        title={`Failed: ${w.failed}`}
                      />
                      {/* Accepted */}
                      <div
                        style={{
                          flex: 1,
                          height: `${Math.max((w.accepted / Math.max(drilldownMonth.total, 1)) * 100, 10)}%`,
                          background: '#34d399',
                          borderRadius: '3px 3px 0 0'
                        }}
                        title={`Accepted: ${w.accepted}`}
                      />
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', marginTop: 6 }}>
                      {w.week}
                    </span>
                  </div>
                ))}
              </div>

              {/* Weekly summary legend */}
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 12, fontSize: '0.74rem' }}>
                <span style={{ color: '#38bdf8' }}>■ Blue: Total</span>
                <span style={{ color: '#ef4444' }}>■ Red: Failed</span>
                <span style={{ color: '#34d399' }}>■ Green: Accepted</span>
              </div>
            </div>

            {/* Weekly summary metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {weeklyDataForDrilldown.map((w) => (
                <div key={w.week} style={{ background: 'var(--mca-surface)', padding: '10px 8px', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{w.week}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', marginTop: 2 }}>{w.total} Apps</div>
                  <div style={{ fontSize: '0.72rem', color: w.failed > 0 ? '#ef4444' : '#34d399', marginTop: 2 }}>
                    {w.failed > 0 ? `${w.failed} Failed` : '0 Failed'}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                type="button"
                className="mca-btn mca-btn--cancel"
                onClick={() => setDrilldownMonth(null)}
              >
                Close Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP 2: CATEGORY STRATEGIC ANALYTICS MODAL (TABLES, GRAPHS & PIE CHARTS) */}
      {categoryModal && (
        <div className="mca-modal-overlay" onClick={() => setCategoryModal(null)} role="dialog" aria-modal="true">
          <div className="mca-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 840, width: '95%' }}>
            <div className="mca-modal-header">
              <div>
                <h3 className="mca-modal-title">{activeModalData.title}</h3>
                <span style={{ fontSize: '0.78rem', color: '#60a5fa' }}>
                  Cycle: {selectedCycle} • Planning & Strategic Equity Structuring
                </span>
              </div>
              <button
                type="button"
                className="mca-modal-close-btn"
                onClick={() => setCategoryModal(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* CONTROLS ON TOP: FULL CYCLE VS MONTHLY, MONTH DROPDOWN, GRAPH TYPE SWITCH */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 18, background: 'var(--mca-surface)', padding: 12, borderRadius: 10 }}>
              {/* Full Cycle vs Monthly */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Scope:</span>
                <button
                  type="button"
                  className={`mca-btn mca-btn--sm ${modalTimeframe === 'cycle' ? 'mca-btn--schedule' : 'mca-btn--cancel'}`}
                  onClick={() => setModalTimeframe('cycle')}
                >
                  Full Cycle
                </button>
                <button
                  type="button"
                  className={`mca-btn mca-btn--sm ${modalTimeframe === 'monthly' ? 'mca-btn--schedule' : 'mca-btn--cancel'}`}
                  onClick={() => setModalTimeframe('monthly')}
                >
                  Monthly
                </button>

                {modalTimeframe === 'monthly' && (
                  <select
                    className="mca-select"
                    style={{ padding: '4px 8px', fontSize: '0.78rem', width: 'auto' }}
                    value={modalSelectedMonth}
                    onChange={(e) => setModalSelectedMonth(e.target.value)}
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>{m} (4 Weeks)</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Line (default) vs Bar Graph Switch */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Graph:</span>
                <button
                  type="button"
                  className={`mca-btn mca-btn--sm ${modalGraphType === 'line' ? 'mca-btn--schedule' : 'mca-btn--cancel'}`}
                  onClick={() => setModalGraphType('line')}
                >
                  Line (Default)
                </button>
                <button
                  type="button"
                  className={`mca-btn mca-btn--sm ${modalGraphType === 'bar' ? 'mca-btn--schedule' : 'mca-btn--cancel'}`}
                  onClick={() => setModalGraphType('bar')}
                >
                  Bar
                </button>
              </div>
            </div>

            {/* VISUAL DISTRIBUTION & PIE CHART */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
              {/* Graph Distribution */}
              <div style={{ background: 'var(--mca-surface)', padding: 16, borderRadius: 12 }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: '0 0 12px', color: '#fff' }}>
                  Distribution Curve ({modalGraphType === 'line' ? 'Line Graph' : 'Bar Graph'})
                </h4>

                {modalGraphType === 'line' ? (
                  /* Line Graph */
                  <div style={{ height: 160, position: 'relative' }}>
                    <svg width="100%" height="100%" viewBox="0 0 400 140" preserveAspectRatio="none">
                      {(() => {
                        const count = activeModalData.items.length;
                        if (count === 0) return null;
                        const maxVal = Math.max(...activeModalData.items.map((it) => it.total), 1);
                        const step = 400 / Math.max(count - 1, 1);
                        const points = activeModalData.items
                          .map((it, i) => `${i * step},${120 - (it.total / maxVal) * 100}`)
                          .join(' ');
                        return (
                          <>
                            <polyline points={points} fill="none" stroke="#38bdf8" strokeWidth="3" />
                            {activeModalData.items.map((it, i) => (
                              <circle
                                key={it.name}
                                cx={i * step}
                                cy={120 - (it.total / maxVal) * 100}
                                r="5"
                                fill="#38bdf8"
                                stroke="#0a1329"
                                strokeWidth="2"
                              />
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                ) : (
                  /* Bar Graph */
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 160, borderBottom: '1px solid var(--mca-border)' }}>
                    {(() => {
                      const maxVal = Math.max(...activeModalData.items.map((it) => it.total), 1);
                      return activeModalData.items.map((it) => (
                        <div key={it.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                          <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700 }}>{it.total}</span>
                          <div
                            style={{
                              width: '60%',
                              maxWidth: 32,
                              height: `${(it.total / maxVal) * 120}px`,
                              background: it.color,
                              borderRadius: '4px 4px 0 0'
                            }}
                          />
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>

              {/* Pie / Donut Chart */}
              <div style={{ background: 'var(--mca-surface)', padding: 16, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <svg width="120" height="120" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
                  {(() => {
                    let cumulative = 0;
                    return activeModalData.items.map((it) => {
                      const strokeDasharray = `${it.share} ${100 - it.share}`;
                      const strokeDashoffset = -cumulative;
                      cumulative += it.share;
                      return (
                        <circle
                          key={it.name}
                          r="35"
                          cx="50"
                          cy="50"
                          fill="transparent"
                          stroke={it.color}
                          strokeWidth="18"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          pathLength="100"
                        />
                      );
                    });
                  })()}
                </svg>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
                  {activeModalData.items.map((it) => (
                    <div key={it.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: '#cbd5e1' }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: it.color }} />
                      <span style={{ fontWeight: 600, maxWidth: 120, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        {it.name}
                      </span>
                      <span style={{ color: '#94a3b8' }}>({it.share}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* DETAILED DATA TABLE FOR STRATEGIC ANALYSIS */}
            <div style={{ background: 'var(--mca-surface)', borderRadius: 12, padding: 14, overflowX: 'auto', marginBottom: 16 }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: '0 0 10px', color: '#fff' }}>
                Strategic Distribution Table
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--mca-border)', color: '#94a3b8' }}>
                    <th style={{ padding: '8px 10px' }}>Item / Zone</th>
                    <th style={{ padding: '8px 10px' }}>Total Applications</th>
                    <th style={{ padding: '8px 10px' }}>Accepted / Allocated</th>
                    <th style={{ padding: '8px 10px', color: '#ef4444' }}>Failed</th>
                    <th style={{ padding: '8px 10px' }}>KES Allocated</th>
                    <th style={{ padding: '8px 10px' }}>Equity Share</th>
                  </tr>
                </thead>
                <tbody>
                  {activeModalData.items.map((it) => (
                    <tr key={it.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: '#fff' }}>{it.name}</td>
                      <td style={{ padding: '8px 10px' }}>{it.total}</td>
                      <td style={{ padding: '8px 10px', color: '#34d399' }}>{it.accepted}</td>
                      <td style={{ padding: '8px 10px', color: it.failed > 0 ? '#ef4444' : '#94a3b8' }}>{it.failed}</td>
                      <td style={{ padding: '8px 10px', color: '#34d399', fontWeight: 700 }}>
                        KES {it.amount.toLocaleString()}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#38bdf8' }}>{it.share}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* STRATEGIC PLANNING TOOLS */}
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#60a5fa', marginBottom: 4 }}>
                🎯 MCA Executive Planning Insight:
              </div>
              <p style={{ fontSize: '0.82rem', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
                Distribution gap is within balanced parity across Tendeno and Sorget electoral segments.
                Ensure polling stations with higher failure counts receive ward desk advisory support during verification.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
              <button
                type="button"
                className="mca-btn mca-btn--cancel"
                onClick={() => setCategoryModal(null)}
              >
                Close Back
              </button>
            </div>
          </div>
        </div>
      )}
    </MCALayout>
  );
}
