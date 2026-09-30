import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StudentLayout } from '../components/StudentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { MinimalDocChecklist } from '../../../components/MinimalDocChecklist.jsx';
import { useStudentCase } from '../context/StudentCaseContext.jsx';
import { fetchPollingStations, submitBursaryApplication } from '../../../lib/queries.js';
import { useSecureData } from '../../../lib/useSecureData.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { EDUCATION_LEVELS } from '../../../domain/education.js';

export function StudentWizardPage() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { data, loading, error, refresh } = useStudentCase();
  const { data: stations } = useSecureData(fetchPollingStations);
  const [form, setForm] = useState({});
  const [cycle, setCycle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const evaluation = data?.evaluation;
  const profile = data?.profile;
  const cycles = data?.cycles || [];
  const selectedCycle = cycle || cycles[0]?.label || '';
  const guardian = data?.guardians?.[0];

  const field = (key, fallback = '') => form[key] ?? profile?.[key] ?? fallback;
  const schoolName = field('school_name');
  const educationLevel = field('education_level');
  const ward = field('ward');
  const pollingStation = field('polling_station');
  const amountRequested = form.amount_requested ?? '';
  const setField = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const stationList = stations || [];
  const wards = useMemo(() => [...new Set((stations || []).map((item) => item.ward))], [stations]);
  const wardStations = stationList.filter((item) => item.ward === ward);
  const hasStations = stationList.length > 0;
  const ready =
    schoolName.trim() && educationLevel && ward.trim() && pollingStation.trim() && Number(amountRequested) > 0;

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError('');
    try {
      await submitBursaryApplication(userId, {
        cycle: selectedCycle,
        institutionName: schoolName,
        educationLevel,
        ward,
        pollingStation,
        amountRequested
      });
    } catch (err) {
      setSubmitError(err.message || 'Could not send the application.');
      setSubmitting(false);
      return;
    }
    await refresh();
    navigate('/student/applications');
  }

  return (
    <StudentLayout pageTitle="New application" layout="dashboard">
      <Link className="back-link" to="/student/applications">
        <Icon name="chevronLeft" size={18} />
        Back to applications
      </Link>

      <div className="stitch-support-hero">
        <h1 className="stitch-support-hero__title" style={{ fontSize: 32 }}>Apply</h1>
        <p className="stitch-support-hero__desc">
          The application uses the ID, parent, and documents already on this profile. It is sent to the chief as pending.
        </p>
      </div>

      {loading ? (
        <div className="skeleton-wrap">
          <div className="skeleton skeleton--line" />
          <div className="skeleton skeleton--line-short" />
        </div>
      ) : error ? (
        <div className="notice" role="alert">
          <strong>Application unavailable</strong>
          <p>{error.message}</p>
        </div>
      ) : (
        <section className="wizard-panel page-section--full" aria-label="Apply">
          {!evaluation.profile.active ? (
            <>
              <p className="wizard-step-label">Profile inactive</p>
              <ul className="mini-checklist">
                {evaluation.profile.missing.map((item) => (
                  <li key={item.key} className="mini-checklist__item">
                    <span className="mini-checklist__label">
                      <Icon name="profile" size={16} /> {item.label}
                      <span className="field__help">{item.hint}</span>
                    </span>
                    <span className="mini-checklist__mark mini-checklist__mark--missing" aria-label="Missing">
                      <Icon name="rejected" size={14} />
                    </span>
                  </li>
                ))}
              </ul>
              <Link className="btn btn--primary" to="/student/profile" style={{ borderRadius: 999, width: 'auto', padding: '10px 24px' }}>
                <Icon name="profile" size={18} />
                Activate profile
              </Link>
            </>
          ) : evaluation.applicationNeeds.length ? (
            <>
              <p className="wizard-step-label">Documents still needed</p>
              <MinimalDocChecklist
                items={evaluation.checklist
                  .filter((item) => item.requiredToApply)
                  .map((item) => ({
                    label: item.label,
                    status: item.satisfied ? 'ok' : 'missing'
                  }))}
              />
              <Link className="btn btn--primary" to="/student/documents" style={{ borderRadius: 999, width: 'auto', padding: '10px 24px' }}>
                <Icon name="upload" size={18} />
                Upload documents
              </Link>
            </>
          ) : evaluation.openApplication ? (
            <>
              <p className="wizard-step-label">Application already open</p>
              <p className="field__help">{evaluation.blockReason}</p>
              <Link className="btn btn--secondary" to="/student/applications" style={{ borderRadius: 999, width: 'auto' }}>
                View application
              </Link>
            </>
          ) : (
            <>
              <p className="wizard-step-label">Confirm and send to the chief</p>
              {submitError ? (
                <div className="notice" role="alert">
                  <strong>Not sent</strong>
                  <p>{submitError}</p>
                </div>
              ) : null}
              <dl className="detail-grid">
                <div className="detail-grid__row">
                  <dt>Student</dt>
                  <dd>{[profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ') || '—'}</dd>
                </div>
                <div className="detail-grid__row">
                  <dt>Parent</dt>
                  <dd>{guardian ? `${guardian.full_name} · ${guardian.phone_number}` : '—'}</dd>
                </div>
              </dl>
              <div className="field">
                <label htmlFor="schoolName">School</label>
                <input
                  id="schoolName"
                  value={schoolName}
                  onChange={setField('school_name')}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="educationLevel">Education level</label>
                <select id="educationLevel" value={educationLevel} onChange={setField('education_level')} required>
                  <option value="">Select level</option>
                  {EDUCATION_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="ward">Ward</label>
                {hasStations ? (
                  <select
                    id="ward"
                    value={ward}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, ward: event.target.value, polling_station: '' }))
                    }
                    required
                  >
                    <option value="">Select ward</option>
                    {wards.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input id="ward" value={ward} onChange={setField('ward')} required />
                )}
              </div>
              <div className="field">
                <label htmlFor="pollingStation">Polling station</label>
                {hasStations ? (
                  <select
                    id="pollingStation"
                    value={pollingStation}
                    onChange={setField('polling_station')}
                    disabled={!ward}
                    required
                  >
                    <option value="">{ward ? 'Select polling station' : 'Select a ward first'}</option>
                    {wardStations.map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input id="pollingStation" value={pollingStation} onChange={setField('polling_station')} required />
                )}
                <span className="field__help">Where the parent or guardian is registered to vote.</span>
              </div>
              <div className="field">
                <label htmlFor="amountRequested">Amount requested (KES)</label>
                <input
                  id="amountRequested"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  value={amountRequested}
                  onChange={setField('amount_requested')}
                  required
                />
                <span className="field__help">Match the balance on your fee structure.</span>
              </div>
              <div className="field">
                <label htmlFor="cycle">Bursary cycle</label>
                <select id="cycle" value={selectedCycle} onChange={(event) => setCycle(event.target.value)}>
                  {cycles.map((item) => (
                    <option key={item.label} value={item.label}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <MinimalDocChecklist
                items={evaluation.checklist.map((item) => ({
                  label: item.locked ? `${item.label} (kept)` : item.label,
                  status: item.satisfied ? 'ok' : 'missing'
                }))}
              />
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleSubmit}
                disabled={!evaluation.canApply || submitting || !ready}
                style={{ borderRadius: 999, width: 'auto', padding: '10px 24px' }}
              >
                <Icon name="arrowRight" size={18} />
                {submitting ? 'Sending…' : 'Send to chief'}
              </button>
            </>
          )}
        </section>
      )}
    </StudentLayout>
  );
}
