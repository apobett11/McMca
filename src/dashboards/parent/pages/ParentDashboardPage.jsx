import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ParentLayout } from '../components/ParentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { useAuth } from '../../../context/AuthContext';
import { EDUCATION_LEVEL_LABEL, joinFullName } from '../../../lib/accountAllocation';
import { fetchParentAccount, fetchParentChildren } from '../../../lib/accountQueries';
import { ContinueRegistrationPrompt } from '../../../components/account/ContinueRegistrationPrompt.jsx';
import { getTimeGreeting } from '../../../utils/greeting.js';

const QUICK_LINKS = [
  { to: '/parent/applications', icon: 'applications', title: 'Applications', desc: 'Bursary records', tone: 'primary' },
  { to: '/parent/documents', icon: 'documents', title: 'Documents', desc: 'Certificates and files', tone: 'secondary' },
  { to: '/parent/notifications', icon: 'bell', title: 'Notifications', desc: 'Alerts for your children', tone: 'tertiary' },
  { to: '/parent/children/new', icon: 'plus', title: 'Add a child', desc: 'Register a student', tone: 'error' }
];

export function ParentDashboardPage() {
  const { user } = useAuth();
  const greeting = getTimeGreeting();
  const [parent, setParent] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user?.id) return;
      try {
        const profile = await fetchParentAccount(user.id);
        const list = await fetchParentChildren(user.id);
        if (!active) return;
        setParent(profile);
        setChildren(list);
      } catch (err) {
        if (active) setError(err.message || 'Could not load children.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [user?.id]);

  const parentName = parent
    ? joinFullName({ firstName: parent.first_name, middleName: parent.middle_name, lastName: parent.last_name })
    : 'Parent';
  const initials = parentName.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2) || 'PR';

  return (
    <ParentLayout pageTitle="Home" parentName={parentName} layout="dashboard">
      <ContinueRegistrationPrompt formsPath="/parent/applications" />
      <div className="stitch-dashboard">
        <section className="student-hero">
          <div className="student-hero__identity">
            <div className="student-hero__avatar" aria-hidden="true">{initials}</div>
            <div className="student-hero__copy">
              <h1 className="student-hero__title">{greeting}, {parentName}</h1>
              <p className="student-hero__meta">
                {loading ? 'Loading your household…' : `${children.length} linked student${children.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>
          <div className="student-hero__readiness">
            <div className="student-hero__ring" aria-hidden="true">
              <Icon name="profile" size={18} />
            </div>
            <div>
              <p className="student-hero__readiness-label">Household</p>
              <p className="student-hero__readiness-desc">
                {loading
                  ? 'Checking linked students.'
                  : children.length
                    ? 'Open a student to continue their record.'
                    : 'Add a child to start an application.'}
              </p>
            </div>
          </div>
        </section>

        <section className="dash-suite">
          <div className="dash-suite__head">
            <h2 className="stitch-section-title">Quick actions</h2>
          </div>
          <div className="dash-suite__grid">
            {QUICK_LINKS.map((item) => (
              <Link key={item.to} to={item.to} className="dash-suite__card luxury-gradient-card">
                <div className={`dash-suite__icon dash-suite__icon--${item.tone}`}>
                  <Icon name={item.icon} size={22} />
                </div>
                <p className="dash-suite__card-title">{item.title}</p>
                <p className="dash-suite__card-desc">{item.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="dash-activity">
          <div className="dash-suite__head">
            <h2 className="stitch-section-title">Your children</h2>
            <Link className="btn btn--primary" to="/parent/children/new">
              <Icon name="plus" size={18} />
              Add a child
            </Link>
          </div>

          {error ? (
            <div className="notice">
              <strong>Could not load</strong>
              <p>{error}</p>
            </div>
          ) : null}

          {loading ? (
            <div className="skeleton-wrap">
              <div className="skeleton skeleton--hero" />
            </div>
          ) : children.length === 0 ? (
            <div className="wizard-panel">
              <h2>No students linked yet</h2>
              <p className="field__help">
                Add a child from here. Students who already listed your ID will show up after they finish their account.
              </p>
            </div>
          ) : (
            <div className="student-cards-grid">
              {children.map((child) => {
                const name = joinFullName({
                  firstName: child.first_name,
                  middleName: child.middle_name,
                  lastName: child.last_name
                });
                return (
                  <article key={child.id} className="linked-student-card">
                    <div className="linked-student-card__head">
                      <div className="linked-student-card__avatar linked-student-card__avatar--blue" aria-hidden="true">
                        {name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="linked-student-card__name">{name}</h3>
                        <p className="linked-student-card__school">{child.school_name || 'School not added yet'}</p>
                      </div>
                    </div>
                    <dl className="linked-student-card__meta">
                      <div>
                        <dt>Education</dt>
                        <dd>{EDUCATION_LEVEL_LABEL[child.school_level] || child.school_level || '—'}</dd>
                      </div>
                    </dl>
                    <div className="linked-student-card__actions">
                      <Link className="btn btn--primary btn--compact" to={`/parent/children/${child.id}`}>
                        <Icon name="applications" size={16} />
                        Continue record
                      </Link>
                      <Link className="btn btn--secondary btn--compact" to="/parent/applications">
                        <Icon name="documents" size={16} />
                        Applications
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </ParentLayout>
  );
}
