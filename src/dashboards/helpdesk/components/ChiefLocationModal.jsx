import React, { useState, useMemo } from 'react';
import { Icon } from '../../../components/Icon.jsx';
import { getFullApplicantPool } from '../../../data/scalableWardDataset.ts';
import { getDocumentRegistrations } from '../../../workspaces/helpdesk/services/helpDeskService.ts';

export function ChiefLocationModal({
  open,
  onClose,
  mode = 'applications', // 'applications' | 'documents'
  metricType = 'total',
  analytics
}) {
  // Active selected village for table view; null means showing locations & sublocations
  const [activeVillageView, setActiveVillageView] = useState(null);
  // Track which sublocations have their village list dropped down/expanded: { [subLocationName]: boolean }
  const [expandedSubLocs, setExpandedSubLocs] = useState({});

  // Table filters & sorting
  const [tableSort, setTableSort] = useState('all'); // 'all' | 'successful' | 'failed'
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Selected administrative location tab
  const [activeLocation, setActiveLocation] = useState('Tendeno');

  const allApplicants = useMemo(() => getFullApplicantPool(), []);
  const allDocRegistrations = useMemo(() => getDocumentRegistrations(), []);

  if (!open) return null;

  const toggleSubLocDropdown = (subLocName) => {
    setExpandedSubLocs((prev) => ({
      ...prev,
      [subLocName]: !prev[subLocName]
    }));
  };

  const handleSelectVillage = (villageName, subLocName, locName) => {
    setActiveVillageView({
      village: villageName,
      subLocation: subLocName,
      location: locName
    });
    setTableSort(
      metricType === 'successful' || metricType === 'completed'
        ? 'successful'
        : metricType === 'flagged' || metricType === 'incomplete_students' || metricType === 'incomplete_parents'
        ? 'failed'
        : 'all'
    );
    setSearch('');
    setPage(1);
  };

  const subLocationsList = analytics?.subLocations?.[activeLocation] || [];

  // Filter rows for the active village
  const tableRows = (mode === 'applications' ? allApplicants : allDocRegistrations).filter((item) => {
    if (!activeVillageView) return false;
    if (item.location !== activeVillageView.location) return false;
    if (item.subLocation !== activeVillageView.subLocation) return false;
    if (activeVillageView.village !== 'all' && item.village !== activeVillageView.village) return false;

    const isApp = mode === 'applications';
    const isSuccess = isApp
      ? item.chiefStatus === 'Cleared' || item.appealStatus === 'Accepted'
      : item.status === 'Completed';

    if (tableSort === 'successful' && !isSuccess) return false;
    if (tableSort === 'failed' && isSuccess) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const name = isApp ? item.fullName : item.name;
      const match =
        name?.toLowerCase().includes(q) ||
        item.serial?.toLowerCase().includes(q) ||
        item.nationalId?.toLowerCase().includes(q) ||
        item.school?.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(tableRows.length / pageSize));
  const paginatedRows = tableRows.slice((page - 1) * pageSize, page * pageSize);

  const getMetricCount = (item) => {
    if (!item) return 0;
    switch (metricType) {
      case 'successful':
        return item.successful;
      case 'flagged':
        return item.flagged;
      case 'completed':
        return item.completedDocuments;
      case 'incomplete_students':
        return item.incompleteStudents;
      case 'incomplete_parents':
        return item.incompleteParents;
      default:
        return item.total;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        className="dash-single-card"
        style={{
          width: '100%',
          maxWidth: 980,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface-elevated, #0f172a)',
          border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.12))',
          borderRadius: 'var(--radius-xl, 14px)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid var(--glass-border, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'rgba(217, 119, 6, 0.15)',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Icon name="applications" size={18} />
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text, #f8fafc)', fontWeight: 700 }}>
                {activeVillageView
                  ? `${activeVillageView.village === 'all' ? `All Villages in ${activeVillageView.subLocation}` : activeVillageView.village} · Applications Table`
                  : 'Ward Administrative Locations & Village Breakdown'}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                {activeVillageView
                  ? `${activeVillageView.location} Location · ${activeVillageView.subLocation} Sub-Location`
                  : 'Click any sub-location to dropdown its villages directly, then click a village to view its table.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 22px' }}>
          {/* VIEW A: LOCATIONS & IN-PLACE DROPDOWN OF VILLAGES */}
          {!activeVillageView ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* LOCATION TABS (TENDENO & SORGET) */}
              <div style={{ display: 'flex', gap: 10 }}>
                {['Tendeno', 'Sorget'].map((loc) => {
                  const locItem = analytics?.locations?.find((l) => l.location === loc);
                  const count = getMetricCount(locItem);
                  const isActive = activeLocation === loc;

                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setActiveLocation(loc)}
                      className="dash-strip-card"
                      style={{
                        flex: 1,
                        padding: '16px 20px',
                        cursor: 'pointer',
                        borderColor: isActive ? 'var(--gold-soft, #d97706)' : undefined,
                        background: isActive ? 'rgba(217, 119, 6, 0.08)' : 'var(--surface-elevated, #1a2234)',
                        textAlign: 'left'
                      }}
                    >
                      <div className="dash-strip-card__head">
                        <div>
                          <span className="dash-strip-card__label">{loc} Location</span>
                          <h3 className="dash-strip-card__val" style={{ fontSize: '1.35rem', marginTop: 4 }}>
                            {count.toLocaleString()} Applications
                          </h3>
                        </div>
                        <span className={`stitch-status-badge ${isActive ? 'stitch-status-badge--admitted' : 'stitch-status-badge--review'}`}>
                          {isActive ? 'Active Selection' : 'Click to View'}
                        </span>
                      </div>
                      <div className="dash-strip-card__foot" style={{ marginTop: 10 }}>
                        <span>4 Sub-Locations · 16 Villages</span>
                        <span style={{ color: '#d97706', fontWeight: 600 }}>Explore &gt;</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* SUB-LOCATIONS CARDS WITH IN-PLACE VILLAGE DROPDOWN */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text)', fontWeight: 600 }}>
                    {activeLocation} Sub-Locations ({subLocationsList.length})
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    Click &quot;View Villages&quot; to dropdown the villages list inside the card
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                  {subLocationsList.map((sub) => {
                    const count = getMetricCount(sub);
                    const isExpanded = Boolean(expandedSubLocs[sub.subLocation]);

                    return (
                      <div
                        key={sub.subLocation}
                        className="dash-single-card"
                        style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: isExpanded ? '1px solid #d97706' : '1px solid var(--glass-border)',
                          borderRadius: 10,
                          padding: 16,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {/* Sub-Location Head */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <div>
                            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', fontWeight: 600 }}>
                              {sub.subLocation} Sub-Location
                            </span>
                            <h4 style={{ margin: '4px 0 0', fontSize: '1.15rem', color: 'var(--text)', fontWeight: 700 }}>
                              {count.toLocaleString()} Applications
                            </h4>
                          </div>
                          <span className="stitch-status-badge stitch-status-badge--review" style={{ fontSize: '0.72rem' }}>
                            {sub.villages?.length || 4} Villages
                          </span>
                        </div>

                        {/* In-Place Dropdown Toggle */}
                        <button
                          type="button"
                          onClick={() => toggleSubLocDropdown(sub.subLocation)}
                          className="btn btn--secondary"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderRadius: 6,
                            marginTop: 4
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>
                            {isExpanded ? 'Hide Villages' : 'View Villages List'}
                          </span>
                          <span style={{ fontSize: '0.85rem' }}>{isExpanded ? '▲' : '▼'}</span>
                        </button>

                        {/* DROPDOWN LIST OF VILLAGES IN THERE (NO EXTRA POPUP!) */}
                        {isExpanded && (
                          <div
                            style={{
                              marginTop: 6,
                              padding: '8px 6px',
                              background: 'rgba(0, 0, 0, 0.25)',
                              borderRadius: 6,
                              border: '1px solid rgba(255, 255, 255, 0.06)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 4
                            }}
                          >
                            {/* All Villages Option */}
                            <button
                              type="button"
                              onClick={() => handleSelectVillage('all', sub.subLocation, activeLocation)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 10px',
                                borderRadius: 4,
                                background: 'transparent',
                                border: 'none',
                                color: '#d97706',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                textAlign: 'left'
                              }}
                              className="chief-village-opt"
                            >
                              <span>★ All Villages in {sub.subLocation}</span>
                              <span>{count} &gt;</span>
                            </button>

                            {/* Individual Villages */}
                            {sub.villages?.map((v) => (
                              <button
                                key={v}
                                type="button"
                                onClick={() => handleSelectVillage(v, sub.subLocation, activeLocation)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '7px 10px',
                                  borderRadius: 4,
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--text)',
                                  fontSize: '0.82rem',
                                  cursor: 'pointer',
                                  textAlign: 'left'
                                }}
                                className="chief-village-opt"
                              >
                                <span>• {v}</span>
                                <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>View Table &gt;</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* VIEW B: TABLE LABELLED WITH THE VILLAGE AT THE TOP */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* TOP ACTION BAR: BACK BUTTON + VILLAGE LABEL + SORTS IN TABLE HEAD */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setActiveVillageView(null)}
                    className="btn btn--secondary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <span>&larr;</span> Back to Villages
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#d97706' }}>
                      {activeVillageView.village === 'all'
                        ? `All Villages in ${activeVillageView.subLocation}`
                        : activeVillageView.village}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      ({tableRows.length} applications)
                    </span>
                  </div>
                </div>

                {/* SORTS AT THE TABLE HEAD: ALL, SUCCESSFUL, FAILED */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                    Sort by:
                  </span>
                  <button
                    type="button"
                    onClick={() => { setTableSort('all'); setPage(1); }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 6,
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: tableSort === 'all' ? '1px solid #d97706' : '1px solid var(--glass-border)',
                      background: tableSort === 'all' ? 'rgba(217, 119, 6, 0.2)' : 'transparent',
                      color: tableSort === 'all' ? '#d97706' : 'var(--text)'
                    }}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTableSort('successful'); setPage(1); }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 6,
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: tableSort === 'successful' ? '1px solid #10b981' : '1px solid var(--glass-border)',
                      background: tableSort === 'successful' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                      color: tableSort === 'successful' ? '#10b981' : 'var(--text)'
                    }}
                  >
                    Successful
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTableSort('failed'); setPage(1); }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 6,
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: tableSort === 'failed' ? '1px solid #ef4444' : '1px solid var(--glass-border)',
                      background: tableSort === 'failed' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                      color: tableSort === 'failed' ? '#ef4444' : 'var(--text)'
                    }}
                  >
                    Failed
                  </button>

                  <input
                    type="text"
                    placeholder="Search applicant..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    style={{
                      padding: '5px 10px',
                      fontSize: '0.78rem',
                      borderRadius: 6,
                      border: '1px solid var(--glass-border)',
                      background: 'rgba(0,0,0,0.3)',
                      color: '#fff',
                      width: 140
                    }}
                  />
                </div>
              </div>

              {/* DATA TABLE STYLED AS CHIEF DATA TABLE */}
              <div className="data-table-wrap" style={{ overflowX: 'auto', border: '1px solid var(--glass-border)', borderRadius: 8 }}>
                <table className="data-table data-table--chief" style={{ width: '100%', margin: 0 }}>
                  <thead>
                    <tr>
                      <th scope="col" style={{ whiteSpace: 'nowrap' }}>Serial</th>
                      <th scope="col" style={{ whiteSpace: 'nowrap' }}>Applicant / Student</th>
                      <th scope="col" style={{ whiteSpace: 'nowrap' }}>National ID / UPI</th>
                      <th scope="col" style={{ whiteSpace: 'nowrap' }}>{mode === 'applications' ? 'School / Category' : 'Document Stage'}</th>
                      <th scope="col" style={{ whiteSpace: 'nowrap' }}>Village</th>
                      <th scope="col" style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '36px 20px', textAlign: 'center', color: '#94a3b8' }}>
                          No applications match the active criteria in this village.
                        </td>
                      </tr>
                    ) : (
                      paginatedRows.map((row) => {
                        const isApp = mode === 'applications';
                        const isSuccess = isApp
                          ? row.chiefStatus === 'Cleared' || row.appealStatus === 'Accepted'
                          : row.status === 'Completed';

                        return (
                          <tr key={row.id}>
                            <td style={{ color: '#d97706', fontWeight: 700, fontFamily: 'monospace' }}>
                              {row.serial}
                            </td>
                            <td>
                              <strong>{isApp ? row.fullName : row.name}</strong>
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                [{isApp ? row.accountClass : (row.isParent ? 'PARENT' : 'STUDENT')}]
                              </div>
                            </td>
                            <td style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>
                              {row.nationalId}
                            </td>
                            <td>
                              {isApp ? `${row.school} · ${row.institutionCategory}` : row.currentStage}
                            </td>
                            <td>
                              {row.village}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <span className={`stitch-status-badge ${isSuccess ? 'stitch-status-badge--admitted' : 'stitch-status-badge--declined'}`}>
                                {isApp ? (isSuccess ? 'Cleared' : (row.riskFlag || 'Flagged')) : row.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', fontSize: '0.8rem', color: '#94a3b8' }}>
                  <span>
                    Showing {(page - 1) * pageSize + 1}–{Math.min(tableRows.length, page * pageSize)} of {tableRows.length} applications
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    >
                      Previous
                    </button>
                    <span style={{ color: 'var(--text)' }}>{page} / {totalPages}</span>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div
          style={{
            padding: '14px 22px',
            borderTop: '1px solid var(--glass-border, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.15)'
          }}
        >
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Tendeno / Sorget Ward NG-CDF Bursary Funnel
          </span>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onClose}
            style={{ padding: '8px 20px', fontSize: '0.82rem' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
