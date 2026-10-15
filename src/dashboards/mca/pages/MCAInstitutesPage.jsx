import React, { useState, useEffect } from 'react';
import { MCALayout } from '../components/MCALayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import {
  getInstitutions,
  saveInstitution,
  updateInstituteVacancies,
  getInstituteApplicationCounts
} from '../../../data/institutionData.js';
import { WARD_VILLAGES } from '../utils/mcaData.js';

export function MCAInstitutesPage() {
  const [institutes, setInstitutes] = useState(() => getInstitutions());
  const [appCounts, setAppCounts] = useState(() => getInstituteApplicationCounts());
  const [selectedVillage, setSelectedVillage] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Add Institute Modal state (3 steps)
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [modalData, setModalData] = useState({
    name: '',
    type: 'Vocational Training Centre (VTC)',
    location: WARD_VILLAGES[0] || 'Tendeno Central',
    campusAddress: '',
    vacancies: 40,
    fees: 20000,
    subsidizedPercent: 80,
    requirements: '',
    courses: '',
    contactPerson: '',
    phone: ''
  });
  const [modalError, setModalError] = useState('');
  const [editingVacancyId, setEditingVacancyId] = useState(null);
  const [tempVacancyVal, setTempVacancyVal] = useState('');

  useEffect(() => {
    function refresh() {
      setInstitutes(getInstitutions());
      setAppCounts(getInstituteApplicationCounts());
    }
    refresh();
    window.addEventListener('mcmca_institutions_updated', refresh);
    window.addEventListener('mcmca_inst_apps_updated', refresh);
    return () => {
      window.removeEventListener('mcmca_institutions_updated', refresh);
      window.removeEventListener('mcmca_inst_apps_updated', refresh);
    };
  }, []);

  const totalVacancies = institutes.reduce((acc, curr) => acc + (Number(curr.vacancies) || 0), 0);
  const totalAppsCount = Object.values(appCounts).reduce((acc, curr) => acc + curr, 0);
  const filledCount = institutes.filter(inst => {
    const applied = appCounts[inst.name] || 0;
    return applied >= (Number(inst.vacancies) || 0) && (Number(inst.vacancies) || 0) > 0;
  }).length;

  const filteredInstitutes = institutes.filter(inst => {
    const matchesVillage = selectedVillage === 'All' || inst.location === selectedVillage;
    const matchesQuery = !searchQuery || inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesVillage && matchesQuery;
  });

  function handleSaveNewInstitute(e) {
    e.preventDefault();
    setModalError('');
    if (modalStep === 1) {
      if (!modalData.name.trim()) {
        setModalError('Please enter the institution name.');
        return;
      }
      setModalStep(2);
    } else if (modalStep === 2) {
      if (Number(modalData.vacancies) <= 0) {
        setModalError('Please specify at least 1 vacancy.');
        return;
      }
      setModalStep(3);
    } else if (modalStep === 3) {
      const coursesArr = modalData.courses
        ? modalData.courses.split('\n').map(c => c.trim()).filter(Boolean)
        : ['Vocational & Technical Trades'];
      const reqArr = modalData.requirements
        ? modalData.requirements.split('\n').map(r => r.trim()).filter(Boolean)
        : ['National ID / Birth Cert Copy'];

      const newInst = {
        name: modalData.name.trim(),
        type: modalData.type,
        location: modalData.location,
        campusAddress: modalData.campusAddress.trim(),
        vacancies: Number(modalData.vacancies) || 30,
        fees: Number(modalData.fees) || 20000,
        subsidizedPercent: Number(modalData.subsidizedPercent) || 80,
        courses: coursesArr,
        requirements: reqArr,
        contactPerson: modalData.contactPerson.trim() || 'Principal / Admissions',
        phone: modalData.phone.trim() || '+254 722 000 000',
        establishedYear: new Date().getFullYear(),
        status: 'Active'
      };

      saveInstitution(newInst);
      setAddModalOpen(false);
      setModalStep(1);
      setModalData({
        name: '',
        type: 'Vocational Training Centre (VTC)',
        location: WARD_VILLAGES[0] || 'Tendeno Central',
        campusAddress: '',
        vacancies: 40,
        fees: 20000,
        subsidizedPercent: 80,
        requirements: '',
        courses: '',
        contactPerson: '',
        phone: ''
      });
    }
  }

  function handleUpdateVacancy(instId, currentVal) {
    const val = parseInt(tempVacancyVal !== '' ? tempVacancyVal : currentVal, 10);
    if (!isNaN(val) && val >= 0) {
      updateInstituteVacancies(instId, val);
    }
    setEditingVacancyId(null);
    setTempVacancyVal('');
  }

  return (
    <MCALayout pageTitle="Educational & Vocational Institutes">
      <div className="mca-page-container" style={{ padding: '24px 20px', maxWidth: 1200, margin: '0 auto' }}>
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
                background: 'rgba(59,130,246,0.15)',
                color: '#60a5fa',
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Ward Assembly Oversight
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#f8fafc' }}>
              Ward Institutes & Vacancy Allocation
            </h1>
            <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>
              Monitor institutional application volume, configure school vacancies, and add new accredited vocational institutions.
            </p>
          </div>

          <button
            type="button"
            onClick={() => { setAddModalOpen(true); setModalStep(1); setModalError(''); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '12px 20px',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span>
            <span>Add New Institute</span>
          </button>
        </div>

        {/* Top KPI Metrics Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24
        }}>
          <div style={{
            background: '#162032',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            padding: 18
          }}>
            <div style={{ color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              Total Institutions
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f8fafc', marginTop: 6 }}>
              {institutes.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#60a5fa', marginTop: 4 }}>
              Across Tendeno & Sorget Ward
            </div>
          </div>

          <div style={{
            background: '#162032',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            padding: 18
          }}>
            <div style={{ color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              Allocated Vacancies
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#38bdf8', marginTop: 6 }}>
              {totalVacancies.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
              Total student slots approved
            </div>
          </div>

          <div style={{
            background: '#162032',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            padding: 18
          }}>
            <div style={{ color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              Applications Recorded
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fbbf24', marginTop: 6 }}>
              {totalAppsCount.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
              Aggregated numbers only
            </div>
          </div>

          <div style={{
            background: '#162032',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            padding: 18
          }}>
            <div style={{ color: '#94a3b8', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              Capacity Status
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: filledCount > 0 ? '#f87171' : '#34d399', marginTop: 6 }}>
              {filledCount} Filled
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
              {institutes.length - filledCount} institutions with open slots
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div style={{
          background: '#162032',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          padding: 16,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 14,
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>🔍</span>
            <input
              type="text"
              placeholder="Search institute name or village..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '8px 12px',
                color: '#f8fafc',
                fontSize: '0.85rem',
                width: '100%',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#94a3b8', fontSize: '0.8125rem', fontWeight: 600 }}>Location:</span>
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              style={{
                background: '#0f172a',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 8,
                padding: '8px 14px',
                color: '#f8fafc',
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="All">All Locations</option>
              {WARD_VILLAGES.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Institutions Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 20
        }}>
          {filteredInstitutes.map(inst => {
            const appsCount = appCounts[inst.name] || 0;
            const vacanciesNum = Number(inst.vacancies) || 0;
            const remaining = Math.max(0, vacanciesNum - appsCount);
            const isFilled = appsCount >= vacanciesNum && vacanciesNum > 0;
            const percentFilled = vacanciesNum > 0 ? Math.min(100, Math.round((appsCount / vacanciesNum) * 100)) : 100;
            const isEditing = editingVacancyId === inst.id;

            return (
              <div
                key={inst.id}
                style={{
                  background: '#162032',
                  border: isFilled ? '1px solid rgba(239,68,68,0.45)' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 16,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isFilled ? '0 4px 18px rgba(239,68,68,0.12)' : '0 4px 12px rgba(0,0,0,0.15)',
                  position: 'relative'
                }}
              >
                <div>
                  {/* Status Banner */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{
                      background: 'rgba(59,130,246,0.12)',
                      color: '#93c5fd',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 6
                    }}>
                      {inst.type}
                    </span>

                    {isFilled ? (
                      <span style={{
                        background: 'rgba(239,68,68,0.2)',
                        color: '#f87171',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: 12,
                        border: '1px solid rgba(239,68,68,0.4)',
                        textTransform: 'uppercase'
                      }}>
                        🚨 Capacity Filled
                      </span>
                    ) : (
                      <span style={{
                        background: 'rgba(16,185,129,0.15)',
                        color: '#34d399',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 12
                      }}>
                        ✓ Open ({remaining} Left)
                      </span>
                    )}
                  </div>

                  <h3 style={{ margin: '0 0 6px', fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.3 }}>
                    {inst.name}
                  </h3>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 14 }}>
                    📍 {inst.location} • Est. {inst.establishedYear || 2020}
                  </div>

                  {/* Highlighting Filled Status Alert if Filled */}
                  {isFilled && (
                    <div style={{
                      background: 'rgba(239,68,68,0.12)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: '0.8rem',
                      color: '#fca5a5',
                      marginBottom: 14,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <span>⚠️</span>
                      <span><strong>Notice:</strong> All {vacanciesNum} vacancies filled. Contact principal to increase allocation.</span>
                    </div>
                  )}

                  {/* Applications vs Vacancy Metric (Strictly Numbers Only) */}
                  <div style={{
                    background: 'rgba(15,23,42,0.6)',
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 14,
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.8125rem' }}>
                      <span style={{ color: '#94a3b8' }}>Applications Recorded:</span>
                      <strong style={{ color: '#fbbf24', fontSize: '0.95rem' }}>{appsCount} Applications</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.8125rem' }}>
                      <span style={{ color: '#94a3b8' }}>Allocated Vacancies:</span>
                      <strong style={{ color: '#38bdf8', fontSize: '0.95rem' }}>{vacanciesNum} Slots</strong>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: 6, background: '#334155', borderRadius: 3, overflow: 'hidden', marginTop: 8 }}>
                      <div style={{
                        width: `${percentFilled}%`,
                        height: '100%',
                        background: isFilled ? '#ef4444' : percentFilled > 80 ? '#f59e0b' : '#3b82f6',
                        borderRadius: 3
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginTop: 4 }}>
                      <span>{percentFilled}% Capacity</span>
                      <span>{remaining} Available</span>
                    </div>
                  </div>

                  {/* Fees & Bursary Subsidy */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: 12 }}>
                    <span>Tuition Fees: <strong>KES {(inst.fees || 0).toLocaleString()}</strong></span>
                    <span style={{ color: '#34d399' }}>Bursary Grant: <strong>{inst.subsidizedPercent || 80}%</strong></span>
                  </div>

                  {/* Courses List Preview */}
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 16 }}>
                    <div style={{ fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>Programs Offered:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(inst.courses || []).slice(0, 3).map((c, i) => (
                        <span key={i} style={{
                          background: 'rgba(255,255,255,0.06)',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: '0.7rem'
                        }}>
                          {c}
                        </span>
                      ))}
                      {(inst.courses || []).length > 3 && (
                        <span style={{ color: '#64748b', fontSize: '0.7rem' }}>
                          +{(inst.courses || []).length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* MCA Vacancy Adjustment Controls */}
                <div style={{
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  paddingTop: 14,
                  marginTop: 6
                }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="number"
                        min="0"
                        value={tempVacancyVal}
                        onChange={(e) => setTempVacancyVal(e.target.value)}
                        placeholder={String(vacanciesNum)}
                        style={{
                          width: 80,
                          background: '#0f172a',
                          border: '1px solid #3b82f6',
                          borderRadius: 8,
                          padding: '6px 8px',
                          color: '#f8fafc',
                          fontSize: '0.85rem'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateVacancy(inst.id, vacanciesNum)}
                        style={{
                          background: '#10b981',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '6px 12px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => { setEditingVacancyId(null); setTempVacancyVal(''); }}
                        style={{
                          background: 'transparent',
                          color: '#94a3b8',
                          border: '1px solid #475569',
                          borderRadius: 8,
                          padding: '6px 10px',
                          fontSize: '0.78rem',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Contact: {inst.phone || 'MCA Desk'}
                      </span>
                      <button
                        type="button"
                        onClick={() => { setEditingVacancyId(inst.id); setTempVacancyVal(String(vacanciesNum)); }}
                        style={{
                          background: 'rgba(59,130,246,0.15)',
                          color: '#60a5fa',
                          border: '1px solid rgba(59,130,246,0.3)',
                          borderRadius: 8,
                          padding: '6px 12px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <span>✏️</span> Set Vacancies
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 3-STEP ADD NEW INSTITUTE POPUP MODAL */}
        {addModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15,23,42,0.8)',
              backdropFilter: 'blur(6px)',
              zIndex: 300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16
            }}
            onClick={() => setAddModalOpen(false)}
          >
            <div
              style={{
                background: '#162032',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 20,
                width: '100%',
                maxWidth: 540,
                padding: 26,
                position: 'relative',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* X Close button */}
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                style={{
                  position: 'absolute',
                  top: 18,
                  right: 18,
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  borderRadius: 8,
                  color: '#94a3b8',
                  width: 30,
                  height: 30,
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>

              <span style={{
                background: 'rgba(59,130,246,0.15)',
                color: '#60a5fa',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 6,
                textTransform: 'uppercase'
              }}>
                MCA Institution Setup
              </span>
              <h2 style={{ margin: '8px 0 4px', fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc' }}>
                Add Accredited Institute
              </h2>
              <p style={{ margin: '0 0 16px', fontSize: '0.8125rem', color: '#94a3b8' }}>
                Register a new technical or vocational training institution for ward placement and bursary subsidies.
              </p>

              {/* Step indicator */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
                paddingBottom: 12,
                borderBottom: '1px solid rgba(255,255,255,0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: modalStep === 1 ? '#60a5fa' : modalStep > 1 ? '#34d399' : '#64748b', fontSize: '0.8rem', fontWeight: 700 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: modalStep === 1 ? '#2563eb' : modalStep > 1 ? '#10b981' : '#334155',
                    color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem'
                  }}>1</span>
                  <span>Basic Info</span>
                </div>
                <div style={{ flex: 1, height: 1, background: modalStep > 1 ? '#10b981' : '#334155', margin: '0 8px' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: modalStep === 2 ? '#60a5fa' : modalStep > 2 ? '#34d399' : '#64748b', fontSize: '0.8rem', fontWeight: 700 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: modalStep === 2 ? '#2563eb' : modalStep > 2 ? '#10b981' : '#334155',
                    color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem'
                  }}>2</span>
                  <span>Vacancies & Fees</span>
                </div>
                <div style={{ flex: 1, height: 1, background: modalStep > 2 ? '#10b981' : '#334155', margin: '0 8px' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: modalStep === 3 ? '#60a5fa' : '#64748b', fontSize: '0.8rem', fontWeight: 700 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: modalStep === 3 ? '#2563eb' : '#334155',
                    color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem'
                  }}>3</span>
                  <span>Requirements & Contacts</span>
                </div>
              </div>

              {modalError && (
                <div style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  color: '#f87171',
                  fontSize: '0.8rem',
                  marginBottom: 14
                }}>
                  {modalError}
                </div>
              )}

              <form onSubmit={handleSaveNewInstitute}>
                {/* STEP 1: Basic Info */}
                {modalStep === 1 && (
                  <div>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: '0.8125rem', color: '#cbd5e1', marginBottom: 6, fontWeight: 600 }}>
                        Institution Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={modalData.name}
                        onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                        placeholder="e.g. Tendeno Community Technology Hub"
                        style={{
                          width: '100%', boxSizing: 'border-box', background: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
                          padding: '10px 12px', color: '#f8fafc', fontSize: '0.875rem'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: '0.8125rem', color: '#cbd5e1', marginBottom: 6, fontWeight: 600 }}>
                        Institution Category *
                      </label>
                      <select
                        value={modalData.type}
                        onChange={(e) => setModalData({ ...modalData, type: e.target.value })}
                        style={{
                          width: '100%', background: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
                          padding: '10px 12px', color: '#f8fafc', fontSize: '0.875rem'
                        }}
                      >
                        <option value="Vocational Training Centre (VTC)">Vocational Training Centre (VTC)</option>
                        <option value="Technical Institute">Technical Institute</option>
                        <option value="Youth Polytechnic">Youth Polytechnic</option>
                        <option value="Technical College">Technical College</option>
                        <option value="Community College">Community College</option>
                        <option value="Vocational Skills Hub">Vocational Skills Hub</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: '0.8125rem', color: '#cbd5e1', marginBottom: 6, fontWeight: 600 }}>
                        Ward Village / Location *
                      </label>
                      <select
                        value={modalData.location}
                        onChange={(e) => setModalData({ ...modalData, location: e.target.value })}
                        style={{
                          width: '100%', background: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
                          padding: '10px 12px', color: '#f8fafc', fontSize: '0.875rem'
                        }}
                      >
                        {WARD_VILLAGES.map(v => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ marginBottom: 18 }}>
                      <label style={{ display: 'block', fontSize: '0.8125rem', color: '#cbd5e1', marginBottom: 6, fontWeight: 600 }}>
                        Campus Address / Landmarks
                      </label>
                      <input
                        type="text"
                        value={modalData.campusAddress}
                        onChange={(e) => setModalData({ ...modalData, campusAddress: e.target.value })}
                        placeholder="e.g. Near Tendeno Health Centre, Off Main Road"
                        style={{
                          width: '100%', boxSizing: 'border-box', background: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
                          padding: '10px 12px', color: '#f8fafc', fontSize: '0.875rem'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => setAddModalOpen(false)}
                        style={{
                          flex: 1, background: 'transparent', border: '1px solid #475569',
                          color: '#cbd5e1', borderRadius: 10, padding: 11, cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        style={{
                          flex: 2, background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                          border: 'none', color: '#ffffff', borderRadius: 10, padding: 11,
                          fontWeight: 700, cursor: 'pointer'
                        }}
                      >
                        Next: Vacancies & Fees →
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Vacancies & Fees */}
                {modalStep === 2 && (
                  <div>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: '0.8125rem', color: '#cbd5e1', marginBottom: 6, fontWeight: 600 }}>
                        Allocated Student Vacancies *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={modalData.vacancies}
                        onChange={(e) => setModalData({ ...modalData, vacancies: e.target.value })}
                        placeholder="e.g. 50"
                        style={{
                          width: '100%', boxSizing: 'border-box', background: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
                          padding: '10px 12px', color: '#f8fafc', fontSize: '0.875rem'
                        }}
                      />
                      <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4, display: 'block' }}>
                        Maximum capacity before the institution status shifts to "Capacity Filled".
                      </span>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: '0.8125rem', color: '#cbd5e1', marginBottom: 6, fontWeight: 600 }}>
                        Estimated School Fees (KES / Year) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={modalData.fees}
                        onChange={(e) => setModalData({ ...modalData, fees: e.target.value })}
                        placeholder="e.g. 24000"
                        style={{
                          width: '100%', boxSizing: 'border-box', background: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
                          padding: '10px 12px', color: '#f8fafc', fontSize: '0.875rem'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: 18 }}>
                      <label style={{ display: 'block', fontSize: '0.8125rem', color: '#cbd5e1', marginBottom: 6, fontWeight: 600 }}>
                        Ward Bursary Subsidy Percentage (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={modalData.subsidizedPercent}
                        onChange={(e) => setModalData({ ...modalData, subsidizedPercent: e.target.value })}
                        placeholder="e.g. 80"
                        style={{
                          width: '100%', boxSizing: 'border-box', background: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
                          padding: '10px 12px', color: '#f8fafc', fontSize: '0.875rem'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => setModalStep(1)}
                        style={{
                          flex: 1, background: 'transparent', border: '1px solid #475569',
                          color: '#cbd5e1', borderRadius: 10, padding: 11, cursor: 'pointer'
                        }}
                      >
                        ← Back
                      </button>
                      <button
                        type="submit"
                        style={{
                          flex: 2, background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                          border: 'none', color: '#ffffff', borderRadius: 10, padding: 11,
                          fontWeight: 700, cursor: 'pointer'
                        }}
                      >
                        Next: Requirements & Courses →
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Requirements & Courses */}
                {modalStep === 3 && (
                  <div>
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: '0.8125rem', color: '#cbd5e1', marginBottom: 6, fontWeight: 600 }}>
                        Trade Specializations & Courses (One per line)
                      </label>
                      <textarea
                        rows={3}
                        value={modalData.courses}
                        onChange={(e) => setModalData({ ...modalData, courses: e.target.value })}
                        placeholder={"Electrical & Solar Systems\nAutomotive Mechanics\nPlumbing & Water Technology"}
                        style={{
                          width: '100%', boxSizing: 'border-box', background: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
                          padding: '10px 12px', color: '#f8fafc', fontSize: '0.85rem', resize: 'vertical'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: '0.8125rem', color: '#cbd5e1', marginBottom: 6, fontWeight: 600 }}>
                        Entry Requirements (One per line)
                      </label>
                      <textarea
                        rows={2}
                        value={modalData.requirements}
                        onChange={(e) => setModalData({ ...modalData, requirements: e.target.value })}
                        placeholder={"KCPE / KCSE Leavers Certificate\nNational ID or Birth Certificate\nTendeno Ward Resident"}
                        style={{
                          width: '100%', boxSizing: 'border-box', background: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
                          padding: '10px 12px', color: '#f8fafc', fontSize: '0.85rem', resize: 'vertical'
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8125rem', color: '#cbd5e1', marginBottom: 4, fontWeight: 600 }}>
                          Contact Person / Principal
                        </label>
                        <input
                          type="text"
                          value={modalData.contactPerson}
                          onChange={(e) => setModalData({ ...modalData, contactPerson: e.target.value })}
                          placeholder="e.g. Mr. Robert Cheruiyot"
                          style={{
                            width: '100%', boxSizing: 'border-box', background: '#0f172a',
                            border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
                            padding: '8px 10px', color: '#f8fafc', fontSize: '0.8125rem'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8125rem', color: '#cbd5e1', marginBottom: 4, fontWeight: 600 }}>
                          Contact Phone
                        </label>
                        <input
                          type="tel"
                          value={modalData.phone}
                          onChange={(e) => setModalData({ ...modalData, phone: e.target.value })}
                          placeholder="e.g. +254 711 223 344"
                          style={{
                            width: '100%', boxSizing: 'border-box', background: '#0f172a',
                            border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
                            padding: '8px 10px', color: '#f8fafc', fontSize: '0.8125rem'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => setModalStep(2)}
                        style={{
                          flex: 1, background: 'transparent', border: '1px solid #475569',
                          color: '#cbd5e1', borderRadius: 10, padding: 11, cursor: 'pointer'
                        }}
                      >
                        ← Back
                      </button>
                      <button
                        type="submit"
                        style={{
                          flex: 2, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          border: 'none', color: '#ffffff', borderRadius: 10, padding: 11,
                          fontWeight: 700, cursor: 'pointer'
                        }}
                      >
                        Finish & Add Institute
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </MCALayout>
  );
}
