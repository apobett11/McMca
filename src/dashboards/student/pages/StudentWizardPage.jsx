import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { StudentLayout } from '../components/StudentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';

const STEPS = ['Student details', 'Guardian contact', 'Review and submit'];
const CYCLES = ['2025/2026 Bursary Cycle', '2024/2025 Bursary Cycle'];

export function StudentWizardPage() {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    institution: '',
    cycle: '2025/2026 Bursary Cycle',
    guardianName: '',
    guardianPhone: ''
  });

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function canProceed() {
    if (step === 0) return form.firstName.trim() && form.lastName.trim() && form.institution.trim();
    if (step === 1) return form.guardianName.trim() && form.guardianPhone.trim();
    return true;
  }

  async function goNext() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const { data: profile, error: profileError } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('auth_user_id', userId)
        .single();
      if (profileError) throw profileError;

      await supabase
        .from('student_profiles')
        .update({
          first_name: form.firstName,
          last_name: form.lastName,
          school_name: form.institution
        })
        .eq('auth_user_id', userId);

      const { error: appError } = await supabase
        .from('student_applications')
        .insert({
          student_profile_id: profile.id,
          application_status: 'submitted',
          institution_name: form.institution
        });
      if (appError) throw appError;

      const { data: app } = await supabase
        .from('student_applications')
        .select('id')
        .eq('student_profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (app) {
        await supabase
          .from('application_details')
          .insert({
            application_id: app.id,
            guardian_name: form.guardianName,
            guardian_phone: form.guardianPhone
          });
      }

      navigate('/student/applications');
    } catch (err) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <StudentLayout pageTitle="New application" layout="dashboard">
      <Link className="back-link" to="/student/applications">
        <Icon name="chevronLeft" size={18} />
        Back to applications
      </Link>

      <div className="stitch-support-hero">
        <h1 className="stitch-support-hero__title" style={{ fontSize: 32 }}>New Application</h1>
        <p className="stitch-support-hero__desc">Complete each step below. Your information will be saved securely.</p>
      </div>

      {error && (
        <div className="notice page-section--full" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', marginBottom: 16 }}>
          <strong>Error</strong>
          <p>{error}</p>
        </div>
      )}

      <section className="wizard-panel page-section--full" aria-label="Application wizard">
        <div className="wizard-progress" aria-hidden="true">
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`wizard-progress__step ${idx <= step ? 'wizard-progress__step--active' : ''} ${idx < step ? 'wizard-progress__step--done' : ''}`}
            />
          ))}
        </div>
        <p className="wizard-step-label">
          Step {step + 1} of {STEPS.length}: {STEPS[step]}
        </p>

        {step === 0 ? (
          <>
            <div className="field">
              <label htmlFor="firstName">Student first name</label>
              <input id="firstName" type="text" placeholder="e.g. Brian" value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="lastName">Student last name</label>
              <input id="lastName" type="text" placeholder="e.g. Kamau" value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="institution">Institution name</label>
              <input id="institution" type="text" placeholder="e.g. St. Mary Primary School" value={form.institution} onChange={(e) => updateField('institution', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="cycle">Bursary cycle</label>
              <select id="cycle" value={form.cycle} onChange={(e) => updateField('cycle', e.target.value)}>
                {CYCLES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <div className="field">
              <label htmlFor="guardianName">Parent or guardian name</label>
              <input id="guardianName" type="text" placeholder="Full name" value={form.guardianName} onChange={(e) => updateField('guardianName', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="guardianPhone">Phone number for updates</label>
              <input id="guardianPhone" type="tel" placeholder="e.g. 07XX XXX XXX" value={form.guardianPhone} onChange={(e) => updateField('guardianPhone', e.target.value)} />
              <p className="field__help">We will use this for OTP verification and important alerts only.</p>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <div role="region" aria-label="Review your details">
            <p className="field__help" style={{ marginTop: 0 }}>Please check your details before submitting.</p>
            <dl className="detail-grid">
              <div className="detail-grid__row"><dt>Student</dt><dd>{form.firstName || '—'} {form.lastName}</dd></div>
              <div className="detail-grid__row"><dt>Institution</dt><dd>{form.institution || '—'}</dd></div>
              <div className="detail-grid__row"><dt>Cycle</dt><dd>{form.cycle}</dd></div>
              <div className="detail-grid__row"><dt>Guardian</dt><dd>{form.guardianName || '—'}</dd></div>
              <div className="detail-grid__row"><dt>Guardian phone</dt><dd>{form.guardianPhone || '—'}</dd></div>
            </dl>
          </div>
        ) : null}

        <div className="btn-row" style={{ marginTop: 14 }}>
          {step > 0 ? (
            <button type="button" className="btn btn--secondary" onClick={() => setStep((s) => s - 1)} style={{ borderRadius: 999, width: 'auto' }}>
              <Icon name="chevronLeft" size={18} />
              Previous
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn--primary"
            onClick={goNext}
            disabled={!canProceed() || submitting}
            style={{ borderRadius: 999, width: 'auto', padding: '10px 24px' }}
          >
            {submitting ? 'Submitting...' : step < STEPS.length - 1 ? 'Continue' : 'Submit application'}
            <Icon name="chevronRight" size={18} />
          </button>
        </div>
      </section>
    </StudentLayout>
  );
}