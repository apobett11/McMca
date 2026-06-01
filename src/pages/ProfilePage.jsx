import React from 'react';
import { PageShell } from '../components/PageShell.jsx';
import { SectionCard } from '../components/SectionCard.jsx';
import { LinkedStudentCard } from '../components/LinkedStudentCard.jsx';
import { Icon } from '../components/Icon.jsx';
import { PARENT, LINKED_STUDENTS } from '../data/parentMock.js';

const dependents = LINKED_STUDENTS.filter((s) => !s.isAdult);
const adults = LINKED_STUDENTS.filter((s) => s.isAdult);

export function ProfilePage({
  portalVariant = 'parent',
  portalLabel = 'Parent portal',
  homePath,
  profilePath
} = {}) {
  return (
    <PageShell
      pageTitle="Profile"
      userInitials="MK"
      portalVariant={portalVariant}
      portalLabel={portalLabel}
      homePath={homePath}
      profilePath={profilePath}
    >
      <SectionCard title="Parent profile" titleLevel="h1">
        <p className="section-card__lead section-card__lead--left">
          Your account details and linked student management.
        </p>
      </SectionCard>

      <SectionCard title="Parent information">
        <dl className="detail-grid">
          <div className="detail-grid__row detail-grid__row--verified">
            <dt>Full name</dt>
            <dd>{PARENT.fullName}</dd>
          </div>
          <div className="detail-grid__row detail-grid__row--verified">
            <dt>National ID</dt>
            <dd>{PARENT.nationalId}</dd>
          </div>
          <div className="detail-grid__row detail-grid__row--verified">
            <dt>Phone number</dt>
            <dd>{PARENT.phone}</dd>
          </div>
          <div className="detail-grid__row">
            <dt>Email</dt>
            <dd>{PARENT.email}</dd>
          </div>
          <div className="detail-grid__row detail-grid__row--verified">
            <dt>Verification status</dt>
            <dd>
              <span className="badge badge--success">{PARENT.verificationStatus}</span>
            </dd>
          </div>
        </dl>
      </SectionCard>

      <SectionCard title="Dependent students">
        <p className="section-card__lead section-card__lead--left">
          Students you manage with full or delegated access.
        </p>
        <div className="linked-students-grid">
          {dependents.map((s) => (
            <LinkedStudentCard key={s.id} student={s} variant="dependent" />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Linked adult students">
        <p className="section-card__lead section-card__lead--left">
          Adult students linked for household visibility — viewer access only.
        </p>
        <div className="linked-students-grid">
          {adults.map((s) => (
            <LinkedStudentCard key={s.id} student={s} variant="adult" />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Delegated access overview">
        <div className="delegation-summary">
          <div className="delegation-summary__item">
            <span className="badge badge--access-full">Full Control</span>
            <p>1 student — you manage all actions via their dashboard.</p>
          </div>
          <div className="delegation-summary__item">
            <span className="badge badge--access-delegated">Delegated Access</span>
            <p>1 student — independent login enabled with your oversight.</p>
          </div>
          <div className="delegation-summary__item">
            <span className="badge badge--access-viewer">Viewer Only</span>
            <p>1 adult student — read-only visibility, no control actions.</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Account security">
        <div className="btn-row">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => window.alert('OTP verification — demo not connected.')}
          >
            <Icon name="shield" size={20} />
            Verify phone
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => window.alert('Change password — demo not connected.')}
          >
            <Icon name="shield" size={20} />
            Change password
          </button>
        </div>
      </SectionCard>
    </PageShell>
  );
}
