import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ParentLayout } from '../components/ParentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { useAuth } from '../../../context/AuthContext';
import { joinFullName } from '../../../lib/accountAllocation';
import { fetchParentAccount } from '../../../lib/accountQueries';

export function ParentProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user?.id) return;
      try {
        const profile = await fetchParentAccount(user.id);
        if (active) setParent(profile);
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

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <ParentLayout pageTitle="Profile" parentName={parentName} layout="dashboard">
      {loading ? (
        <div className="skeleton-wrap">
          <div className="skeleton skeleton--hero" />
        </div>
      ) : (
        <>
          <section className="student-hero">
            <div className="student-hero__identity">
              <div className="student-hero__avatar" aria-hidden="true">{initials}</div>
              <div className="student-hero__copy">
                <h1 className="student-hero__title">{parentName}</h1>
                <p className="student-hero__meta">{parent?.email || user?.email || 'Parent account'}</p>
              </div>
            </div>
          </section>

          <div className="stitch-profile-grid">
            <section className="stitch-profile-section">
              <div className="stitch-profile-section__head">
                <h2 className="stitch-profile-section__title">
                  <Icon name="profile" size={22} />
                  Personal information
                </h2>
              </div>
              <dl className="detail-grid">
                <div className="detail-grid__row"><dt>Full name</dt><dd>{parentName}</dd></div>
                <div className="detail-grid__row"><dt>National ID</dt><dd>{parent?.national_id || '—'}</dd></div>
                <div className="detail-grid__row"><dt>Phone</dt><dd>{parent?.phone_number || '—'}</dd></div>
                <div className="detail-grid__row"><dt>Email</dt><dd>{parent?.email || user?.email || '—'}</dd></div>
                <div className="detail-grid__row"><dt>Gender</dt><dd>{parent?.gender || '—'}</dd></div>
              </dl>
            </section>

            <div className="stitch-profile-right">
              <section className="stitch-profile-section">
                <div className="stitch-profile-section__head">
                  <h2 className="stitch-profile-section__title">
                    <Icon name="shield" size={22} />
                    Account
                  </h2>
                </div>
                <p className="stitch-profile-security__hint">
                  Identity details are confirmed from Applications. Ward staff will not ask for your password.
                </p>
                <button type="button" className="stitch-profile-security__btn stitch-profile-security__btn--danger" onClick={handleSignOut}>
                  <Icon name="logout" size={18} />
                  Sign out
                </button>
              </section>
            </div>
          </div>
        </>
      )}
    </ParentLayout>
  );
}
