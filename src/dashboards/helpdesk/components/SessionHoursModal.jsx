import React, { useState } from 'react';
import { Icon } from '../../../components/Icon.jsx';
import { getHelpDeskSessionHours } from '../utils/helpDeskData.js';

export function SessionHoursModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const sessionData = getHelpDeskSessionHours();
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);

  const currentMonth = sessionData.monthlyBreakdown[selectedMonthIndex] || sessionData.monthlyBreakdown[0];
  const currentWeek = currentMonth?.weeks[selectedWeekIndex] || currentMonth?.weeks[0];

  return (
    <div className="modal-root" role="presentation" style={{ zIndex: 10000 }}>
      <button
        type="button"
        className="modal-root__backdrop"
        onClick={onClose}
        aria-label="Close session hours modal"
      />
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        style={{
          maxWidth: 640,
          background: '#070d18',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          borderRadius: 16,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(221, 187, 106, 0.15)'
        }}
      >
        <header
          className="modal-panel__header"
          style={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: 8, background: 'rgba(221,187,106,0.15)', borderRadius: 8, color: 'var(--gold-champagne, #ddbb6a)' }}>
              <Icon name="clock" size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: 700 }}>
                Operator Session Hours &amp; Shift Analytics
              </h2>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                {sessionData.shiftSchedule} &bull; {sessionData.activeSessionDuration}
              </span>
            </div>
          </div>
          {/* Visible X Close button - NO cancel button */}
          <button
            type="button"
            className="modal-panel__close"
            onClick={onClose}
            aria-label="Close modal"
            style={{ fontSize: '1.4rem', color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            ×
          </button>
        </header>

        <div className="modal-panel__body" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* 3 Core Metric Tiles: Today, Weekly, Monthly (Rounded Full Hours) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div className="hd-metric-tile" style={{ textAlign: 'center', padding: '14px 10px' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                Logged Today
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>
                {sessionData.today} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>hrs</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Active Session</span>
            </div>

            <div className="hd-metric-tile" style={{ textAlign: 'center', padding: '14px 10px' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                This Week
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--gold-champagne, #ddbb6a)', marginTop: 4 }}>
                {sessionData.thisWeek} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>hrs</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Target: 40 hrs</span>
            </div>

            <div className="hd-metric-tile" style={{ textAlign: 'center', padding: '14px 10px' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                This Month
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
                {sessionData.thisMonth} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>hrs</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Target: 160 hrs</span>
            </div>
          </div>

          {/* Month Selector Tabs */}
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>
              Select Month (Click to view weekly breakdown):
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {sessionData.monthlyBreakdown.map((m, idx) => (
                <button
                  key={m.month}
                  type="button"
                  onClick={() => {
                    setSelectedMonthIndex(idx);
                    setSelectedWeekIndex(0);
                  }}
                  className={`btn ${selectedMonthIndex === idx ? 'btn--primary' : 'btn--secondary'}`}
                  style={{
                    fontSize: '0.82rem',
                    padding: '8px 14px',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span>{m.month}</span>
                  <span style={{ opacity: 0.8, fontSize: '0.75rem', fontWeight: 700 }}>({m.totalHours} hrs)</span>
                </button>
              ))}
            </div>
          </div>

          {/* Weekly Selector for Selected Month */}
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>
              Weeks in {currentMonth?.month} (Click to view daily graph):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
              {currentMonth?.weeks.map((w, idx) => (
                <button
                  key={w.label}
                  type="button"
                  onClick={() => setSelectedWeekIndex(idx)}
                  className={`btn ${selectedWeekIndex === idx ? 'btn--primary' : 'btn--secondary'}`}
                  style={{
                    fontSize: '0.78rem',
                    padding: '10px 8px',
                    borderRadius: 8,
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{w.label}</span>
                  <strong style={{ fontSize: '0.92rem' }}>{w.totalHours} hrs</strong>
                </button>
              ))}
            </div>
          </div>

          {/* Daily Hours Bar Graph for Selected Week */}
          <div
            style={{
              background: '#050a12',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 10,
              padding: 16
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <strong style={{ fontSize: '0.88rem', color: '#fff' }}>
                  Daily Hours Logged &bull; {currentWeek?.label}
                </strong>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  Full rounded shift hours vs daily 8h target
                </div>
              </div>
              <span className="badge badge--success" style={{ fontSize: '0.74rem' }}>
                Total: {currentWeek?.totalHours} hrs
              </span>
            </div>

            {/* Visual Bar Graph */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                height: 120,
                padding: '0 12px 10px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                gap: 12
              }}
            >
              {currentWeek?.daily.map((d) => {
                const heightPct = Math.min(100, Math.round((d.hours / 8) * 100));
                const isTargetMet = d.hours >= 8;
                return (
                  <div
                    key={d.day}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                      justifyContent: 'flex-end',
                      gap: 6
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isTargetMet ? '#10b981' : '#f59e0b' }}>
                      {d.hours}h
                    </span>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: 36,
                        height: `${heightPct}%`,
                        minHeight: 8,
                        borderRadius: '6px 6px 0 0',
                        background: isTargetMet
                          ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)'
                          : 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)',
                        boxShadow: isTargetMet
                          ? '0 0 10px rgba(16, 185, 129, 0.3)'
                          : '0 0 10px rgba(245, 158, 11, 0.3)'
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Day Labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px 0', gap: 12 }}>
              {currentWeek?.daily.map((d) => (
                <div key={d.day} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600 }}>{d.day}</div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{d.date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
