import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StudentLayout } from '../components/StudentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { useAuth } from '../../../context/AuthContext';
import { fetchDashboardRegistrationState } from '../../../lib/accountQueries';
import { DASHBOARD_STUDENT_STEPS } from '../../../lib/accountAllocation/wizardFlows';
import { getTimeGreeting } from '../../../utils/greeting.js';
import { ContinueRegistrationPrompt } from '../../../components/account/ContinueRegistrationPrompt.jsx';

function preparednessCopy(done, total) {
  if (!total || done <= 0) return 'Start your details to build a bursary record.';
  if (done >= total) return 'Every form step is on file.';
  if (done < total / 2) return 'Several steps still need your attention.';
  return 'Most steps are done. Finish the rest to apply.';
}

export function StudentDashboardPage() {
  const { user } = useAuth();
  const greeting = getTimeGreeting();
  const [profile, setProfile] = useState(null);
  const [completedKeys, setCompletedKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user?.id) return;
      setLoading(true);
      try {
        const state = await fetchDashboardRegistrationState(user.id, 'student');
        if (!active) return;
        setProfile(state.profile);
        setCompletedKeys(state.completedKeys || []);
        setError('');
      } catch (err) {
        if (active) setError(err.message || 'Could not load your overview.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [user?.id]);

  const steps = DASHBOARD_STUDENT_STEPS;
  const doneCount = steps.filter((step) => completedKeys.includes(step.key)).length;
  const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;
  const studentName = [profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean).join(' ')
    || user?.user_metadata?.full_name
    || 'Student';
  const complete = doneCount === steps.length && steps.length > 0;

  return (
    <StudentLayout pageTitle="Overview" layout="dashboard" studentName={profile ? studentName : ''}>
      <ContinueRegistrationPrompt formsPath="/student/forms" />
      <div className="stitch-dashboard">
        <section className="student-hero">
          <div className="student-hero__identity">
            <div className="student-hero__avatar" aria-hidden="true">
              {studentName.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div className="student-hero__copy">
              <h1 className="student-hero__title">{greeting}, {studentName}</h1>
              <p className="student-hero__meta">{profile?.school_name || 'Student overview'}</p>
            </div>
          </div>
          <div className="student-hero__readiness">
            <div className="student-hero__ring" aria-hidden="true">
              <span>{loading ? '…' : `${pct}%`}</span>
            </div>
            <div>
              <p className="student-hero__readiness-label">Preparedness</p>
              <p className="student-hero__readiness-desc">
                {loading ? 'Checking your saved steps.' : preparednessCopy(doneCount, steps.length)}
              </p>
            </div>
          </div>
        </section>

        <section className="dash-activity">
          <div className="dash-suite__head">
            <h2 className="stitch-section-title">Form steps</h2>
            <Link
              className="btn btn--primary"
              to="/student/forms"
              state={{ continueRegistration: !complete }}
            >
              <Icon name={complete ? 'applications' : 'chevronRight'} size={18} />
              {complete ? 'Review forms' : 'Finish remaining steps'}
            </Link>
          </div>

          {error ? (
            <div className="notice" role="alert">
              <strong>Could not load</strong>
              <p>{error}</p>
            </div>
          ) : null}

          {loading ? (
            <div className="skeleton-wrap">
              <div className="skeleton skeleton--hero" />
            </div>
          ) : (
            <ul className="prep-list">
              {steps.map((step) => {
                const done = completedKeys.includes(step.key);
                return (
                  <li key={step.key} className={`prep-list__item${done ? ' prep-list__item--done' : ''}`}>
                    <input type="checkbox" checked={done} readOnly onChange={() => {}} tabIndex={-1} aria-label={`${step.title} ${done ? 'completed' : 'not completed'}`} />
                    <span className="prep-list__title">{step.title}</span>
                    <span className={`stitch-status-badge ${done ? 'stitch-status-badge--admitted' : 'stitch-status-badge--withdrawn'}`}>
                      {done ? 'Done' : 'Needed'}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </StudentLayout>
  );
}
