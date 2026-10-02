import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ParentLayout } from '../components/ParentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { useAuth } from '../../../context/AuthContext';
import { EDUCATION_LEVEL_LABEL, joinFullName } from '../../../lib/accountAllocation';
import { fetchParentAccount, fetchParentChildren } from '../../../lib/accountQueries';
import { ContinueRegistrationPrompt } from '../../../components/account/ContinueRegistrationPrompt.jsx';

export function ParentDashboardPage() {
  const { user } = useAuth();
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

  return (
    <ParentLayout pageTitle="Children" parentName={parentName} layout="dashboard">
      <ContinueRegistrationPrompt formsPath="/parent/applications" />
      <div className="stitch-support-hero">
        <h1 className="stitch-support-hero__title" style={{ fontSize: 32 }}>Your children</h1>
        <p className="stitch-support-hero__desc">
          Students linked to your account, and where each application stands.
        </p>
      </div>

      <div className="btn-row" style={{ marginBottom: 24 }}>
        <Link className="btn btn--primary" to="/parent/children/new" style={{ borderRadius: 999, width: 'auto', padding: '10px 24px' }}>
          <Icon name="plus" size={18} />
          Add a child
        </Link>
      </div>

      {error ? (
        <div className="notice" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
          <strong>Could not load</strong>
          <p>{error}</p>
        </div>
      ) : null}

      {loading ? (
        <p>Loading children…</p>
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
                    <h4 className="linked-student-card__name">{name}</h4>
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
                    Continue student record
                  </Link>
                  <Link className="btn btn--secondary btn--compact" to="/parent/applications">
                    Applications
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </ParentLayout>
  );
}
