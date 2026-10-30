import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  // Mobile detection
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));

  // Active selected location
  const [activeLocation, setActiveLocation] = useState('Tendeno');
  // Active selected sub-location
  const [activeSubLoc, setActiveSubLoc] = useState('Tendeno Central');
  // Sub-location that has its village floating popover open (desktop/hover)
  const [hoveredSubLoc, setHoveredSubLoc] = useState(null);

  // Mobile specific: whether the sub-location popup is open
  const [mobileSubLocPopupOpen, setMobileSubLocPopupOpen] = useState(false);
  // Mobile specific: active subloc that scrolled for village view
  const [mobileSelectedSubLoc, setMobileSelectedSubLoc] = useState(null);

  // Active selected village for table view; null means browsing locations/sublocations
  const [activeVillageView, setActiveVillageView] = useState(null);

  // Table filters & sorting
  const [tableSort, setTableSort] = useState('all'); // 'all' | 'successful' | 'failed'
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const subLocRefs = useRef({});

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset state on open
  useEffect(() => {
    if (open) {
      setActiveVillageView(null);
      setHoveredSubLoc(null);
      setMobileSubLocPopupOpen(false);
      setMobileSelectedSubLoc(null);
      setTableSort(
        metricType === 'successful' || metricType === 'completed'
          ? 'successful'
          : metricType === 'flagged' || metricType === 'incomplete_students' || metricType === 'incomplete_parents'
          ? 'failed'
          : 'all'
      );
      setSearch('');
      setPage(1);
    }
  }, [open, metricType]);

  const allApplicants = useMemo(() => getFullApplicantPool(), []);
  const allDocRegistrations = useMemo(() => getDocumentRegistrations(), []);

  if (!open) return null;

  const handleSelectVillage = (villageName, subLocName, locName) => {
    setActiveVillageView({
      village: villageName,
      subLocation: subLocName,
      location: locName
    });
    setHoveredSubLoc(null);
    setMobileSubLocPopupOpen(false);
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
        padding: isMobile ? 8 : 16
      }}
      onClick={onClose}
    >
      <div
        className="dash-single-card"
        style={{
          width: '100%',
          maxWidth: 980,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface-elevated, #0f172a)',
          border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.12))',
          borderRadius: 'var(--radius-xl, 14px)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.65)',
          overflow: 'hidden',
          animation: 'emilModalIn 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => {
          e.stopPropagation();
          // Clicking anywhere outside floating village list closes it
          if (!e.target.closest('.chief-village-popover') && !e.target.closest('.subloc-card-btn')) {
            setHoveredSubLoc(null);
          }
        }}
      >
        {/* MODAL HEADER WITH VISIBLE X BUTTON */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--glass-border, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: 'rgba(0, 0, 0, 0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(217, 119, 6, 0.15)',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Icon name="applications" size={17} />
            </span>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text, #f8fafc)', fontWeight: 700 }}>
                {activeVillageView
                  ? `${activeVillageView.village === 'all' ? `All Villages in ${activeVillageView.subLocation}` : activeVillageView.village} · Applications Table`
                  : 'Ward Administrative Locations & Village Breakdown'}
              </h2>
              <p style={{ margin: '1px 0 0', fontSize: '0.74rem', color: '#94a3b8' }}>
                {activeVillageView
                  ? `${activeVillageView.location} Location · ${activeVillageView.subLocation} Sub-Location`
                  : 'Select Location & Sub-Location to hover/view villages, then click a village to load the applications.'}
              </p>
            </div>
          </div>

          {/* VISIBLE X BUTTON ON TOP RIGHT */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--glass-border)',
              color: '#94a3b8',
              cursor: 'pointer',
              width: 30,
              height: 30,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.borderColor = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.borderColor = 'var(--glass-border)';
            }}
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE IN, NOT DISPLACING WHOLE POPUP) */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: isMobile ? '14px 12px' : '18px 20px' }}>
          {!activeVillageView ? (
            /* LOCATIONS AND SUB-LOCATIONS BROWSER */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* SECTION TITLE: LOCATIONS */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#d97706', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Locations
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    2 Administrative Areas in Ward
                  </span>
                </div>

                {/* DESKTOP LOCATIONS: CARDS SIDE BY SIDE WITH ACTIVE STATE */}
                {!isMobile ? (
                  <div style={{ display: 'flex', gap: 10 }}>
                    {['Tendeno', 'Sorget'].map((loc) => {
                      const locItem = analytics?.locations?.find((l) => l.location === loc);
                      const count = getMetricCount(locItem);
                      const isActive = activeLocation === loc;

                      return (
                        <div
                          key={loc}
                          onClick={() => {
                            setActiveLocation(loc);
                            const firstSub = analytics?.subLocations?.[loc]?.[0]?.subLocation || '';
                            setActiveSubLoc(firstSub);
                            setHoveredSubLoc(null);
                          }}
                          className="dash-strip-card"
                          style={{
                            flex: 1,
                            padding: '12px 16px',
                            cursor: 'pointer',
                            border: isActive ? '2px solid #d97706' : '1px solid var(--glass-border)',
                            background: isActive ? 'rgba(217, 119, 6, 0.12)' : 'var(--surface-elevated, #1a2234)',
                            boxShadow: isActive ? '0 0 16px rgba(217, 119, 6, 0.22)' : undefined,
                            transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
                          }}
                        >
                          <div className="dash-strip-card__head" style={{ marginBottom: 4 }}>
                            <div>
                              <span className="dash-strip-card__label" style={{ color: isActive ? '#f59e0b' : undefined, fontWeight: 700 }}>
                                {loc} Location
                              </span>
                              <h4 className="dash-strip-card__val" style={{ fontSize: '1.2rem', marginTop: 2 }}>
                                {count.toLocaleString()} Applications
                              </h4>
                            </div>
                            <span className={`stitch-status-badge ${isActive ? 'stitch-status-badge--admitted' : 'stitch-status-badge--review'}`} style={{ fontSize: '0.7rem' }}>
                              {isActive ? '● Active Location' : 'Select'}
                            </span>
                          </div>
                          <div className="dash-strip-card__foot" style={{ fontSize: '0.75rem', marginTop: 4 }}>
                            <span>4 Sub-Locations · 16 Villages</span>
                            <span style={{ color: '#d97706', fontWeight: 600 }}>Explore &gt;</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* MOBILE VIEW: CLEAN LIST CARDS PREVENTING CONFUSION */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {['Tendeno', 'Sorget'].map((loc) => {
                      const locItem = analytics?.locations?.find((l) => l.location === loc);
                      const count = getMetricCount(locItem);
                      const isActive = activeLocation === loc;

                      return (
                        <div
                          key={loc}
                          onClick={() => {
                            setActiveLocation(loc);
                            setMobileSubLocPopupOpen(true);
                          }}
                          style={{
                            padding: '12px 14px',
                            borderRadius: 8,
                            background: isActive ? 'rgba(217, 119, 6, 0.14)' : 'rgba(255, 255, 255, 0.03)',
                            border: isActive ? '1px solid #d97706' : '1px solid var(--glass-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer'
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>
                              {loc} Location
                            </span>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                              {count.toLocaleString()} Applications · Tap to view Sub-Locations
                            </div>
                          </div>
                          <span style={{ color: '#d97706', fontSize: '1rem', fontWeight: 700 }}>&gt;</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* LITTLE SPACE BETWEEN LOCATIONS AND SUB-LOCATIONS */}
              <div style={{ height: 4 }} />

              {/* SECTION TITLE: SUB-LOCATIONS */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#d97706', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Sub-Locations ({activeLocation})
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Hover or click &quot;Villages&quot; for floating list (does not shift cards)
                  </span>
                </div>

                {/* SMALLER SUB-LOCATION CARDS WITH ACTIVE STATE & FLOATING HOVER VILLAGE LIST */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 10,
                    position: 'relative'
                  }}
                >
                  {subLocationsList.map((sub) => {
                    const count = getMetricCount(sub);
                    const isActive = activeSubLoc === sub.subLocation;
                    const isHoverOpen = hoveredSubLoc === sub.subLocation;

                    return (
                      <div
                        key={sub.subLocation}
                        ref={(el) => (subLocRefs.current[sub.subLocation] = el)}
                        style={{
                          position: 'relative',
                          background: isActive ? 'rgba(217, 119, 6, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                          border: isActive ? '2px solid #d97706' : '1px solid var(--glass-border)',
                          borderRadius: 8,
                          padding: '10px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                          boxShadow: isActive ? '0 0 14px rgba(217, 119, 6, 0.2)' : undefined,
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          setActiveSubLoc(sub.subLocation);
                          setHoveredSubLoc(isHoverOpen ? null : sub.subLocation);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <div>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                              {sub.subLocation}
                            </span>
                            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>
                              {count.toLocaleString()}
                            </div>
                          </div>
                          <span
                            className="stitch-status-badge stitch-status-badge--review"
                            style={{ fontSize: '0.68rem', padding: '2px 6px' }}
                          >
                            {sub.villages?.length || 4} Villages
                          </span>
                        </div>

                        {/* BUTTON TRIGGERING FLOATING HOVER POPUP */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                          <span style={{ fontSize: '0.72rem', color: isActive ? '#f59e0b' : '#94a3b8' }}>
                            {isActive ? '● Selected Sub-Location' : 'Click to select'}
                          </span>
                          <button
                            type="button"
                            className="subloc-card-btn"
                            style={{
                              padding: '3px 8px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              borderRadius: 4,
                              background: isHoverOpen ? '#d97706' : 'rgba(255, 255, 255, 0.08)',
                              color: isHoverOpen ? '#000' : 'var(--text)',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveSubLoc(sub.subLocation);
                              setHoveredSubLoc(isHoverOpen ? null : sub.subLocation);
                            }}
                          >
                            <span>Villages</span>
                            <span>{isHoverOpen ? '▲' : '▾'}</span>
                          </button>
                        </div>

                        {/* VILLAGE LIST APPEARS AS A FLOATING HOVER ABOVE THE CARDS (DOES NOT AFFECT SUB-LOCATION CARDS) */}
                        {isHoverOpen && (
                          <div
                            className="chief-village-popover"
                            style={{
                              position: 'absolute',
                              top: 'calc(100% + 6px)',
                              left: 0,
                              zIndex: 100,
                              minWidth: 230,
                              background: 'var(--surface-elevated, #0f172a)',
                              border: '1px solid #d97706',
                              borderRadius: 8,
                              boxShadow: '0 16px 36px rgba(0, 0, 0, 0.85), 0 0 14px rgba(217, 119, 6, 0.25)',
                              padding: 6,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 3,
                              animation: 'popIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div style={{ padding: '4px 8px', fontSize: '0.7rem', color: '#94a3b8', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', fontWeight: 600 }}>
                              Select Village in {sub.subLocation}
                            </div>

                            {/* All Villages item */}
                            <button
                              type="button"
                              onClick={() => handleSelectVillage('all', sub.subLocation, activeLocation)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '6px 8px',
                                borderRadius: 4,
                                background: 'rgba(217, 119, 6, 0.12)',
                                border: 'none',
                                color: '#d97706',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                textAlign: 'left'
                              }}
                            >
                              <span>★ All Villages</span>
                              <span>{count} &gt;</span>
                            </button>

                            {/* Individual village items */}
                            {sub.villages?.map((v) => (
                              <button
                                key={v}
                                type="button"
                                onClick={() => handleSelectVillage(v, sub.subLocation, activeLocation)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '5px 8px',
                                  borderRadius: 4,
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--text)',
                                  fontSize: '0.76rem',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  transition: 'background 0.12s ease'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                              >
                                <span>• {v}</span>
                                <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>Table &gt;</span>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* TOP ACTION BAR: BACK BUTTON + VILLAGE LABEL + SORTS IN TABLE HEAD */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setActiveVillageView(null)}
                    className="btn btn--secondary"
                    style={{ padding: '5px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    <span>&larr;</span> Back to Locations
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#d97706' }}>
                      {activeVillageView.village === 'all'
                        ? `All Villages in ${activeVillageView.subLocation}`
                        : activeVillageView.village}
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                      ({tableRows.length} applications)
                    </span>
                  </div>
                </div>

                {/* SORTS AT THE TABLE HEAD: ALL, SUCCESSFUL, FAILED */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                    Sort by:
                  </span>
                  <button
                    type="button"
                    onClick={() => { setTableSort('all'); setPage(1); }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: '0.75rem',
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
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: '0.75rem',
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
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: '0.75rem',
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
                      padding: '4px 8px',
                      fontSize: '0.75rem',
                      borderRadius: 6,
                      border: '1px solid var(--glass-border)',
                      background: 'rgba(0,0,0,0.3)',
                      color: '#fff',
                      width: 120
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
                        <td colSpan={6} style={{ padding: '30px 16px', textAlign: 'center', color: '#94a3b8' }}>
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
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', fontSize: '0.78rem', color: '#94a3b8' }}>
                  <span>
                    Showing {(page - 1) * pageSize + 1}–{Math.min(tableRows.length, page * pageSize)} of {tableRows.length} applications
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                    >
                      Previous
                    </button>
                    <span style={{ color: 'var(--text)' }}>{page} / {totalPages}</span>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER WITH SMALLER CLOSE BUTTON */}
        <div
          style={{
            padding: '10px 18px',
            borderTop: '1px solid var(--glass-border, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.2)'
          }}
        >
          <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
            Tendeno / Sorget Ward NG-CDF Bursary Funnel
          </span>
          {/* SMALLER CLOSE BUTTON */}
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onClose}
            style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: 6 }}
          >
            Close
          </button>
        </div>
      </div>

      {/* MOBILE POPUP FOR SUB-LOCATIONS */}
      {isMobile && mobileSubLocPopupOpen && (
        <div
          role="dialog"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
          onClick={() => setMobileSubLocPopupOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxHeight: '80vh',
              background: 'var(--surface-elevated, #0f172a)',
              borderTop: '2px solid #d97706',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: '16px 16px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#d97706', fontWeight: 700 }}>
                {activeLocation} Sub-Locations
              </h3>
              <button
                type="button"
                onClick={() => setMobileSubLocPopupOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8' }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {subLocationsList.map((sub) => {
                const count = getMetricCount(sub);
                const isSelected = mobileSelectedSubLoc === sub.subLocation;

                return (
                  <div
                    key={sub.subLocation}
                    style={{
                      borderRadius: 8,
                      border: isSelected ? '1px solid #d97706' : '1px solid var(--glass-border)',
                      background: isSelected ? 'rgba(217, 119, 6, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      padding: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6
                    }}
                  >
                    <div
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => setMobileSelectedSubLoc(isSelected ? null : sub.subLocation)}
                    >
                      <div>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)' }}>
                          {sub.subLocation}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {count.toLocaleString()} Applications · {sub.villages?.length || 4} Villages
                        </div>
                      </div>
                      <span style={{ color: '#d97706' }}>{isSelected ? '▲' : '▼'}</span>
                    </div>

                    {/* VILLAGE LIST ON MOBILE (SCROLLS TO GIVE SPACE) */}
                    {isSelected && (
                      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 8 }}>
                        <button
                          type="button"
                          onClick={() => handleSelectVillage('all', sub.subLocation, activeLocation)}
                          style={{
                            padding: '6px 10px',
                            background: 'rgba(217, 119, 6, 0.15)',
                            color: '#d97706',
                            border: 'none',
                            borderRadius: 4,
                            textAlign: 'left',
                            fontSize: '0.8rem',
                            fontWeight: 700
                          }}
                        >
                          ★ All Villages in {sub.subLocation} ({count}) &gt;
                        </button>
                        {sub.villages?.map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => handleSelectVillage(v, sub.subLocation, activeLocation)}
                            style={{
                              padding: '6px 10px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              color: 'var(--text)',
                              border: 'none',
                              borderRadius: 4,
                              textAlign: 'left',
                              fontSize: '0.8rem'
                            }}
                          >
                            • {v} &gt;
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
      )}
    </div>
  );
}
