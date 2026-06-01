import React from 'react';
import { PageShell } from '../../components/PageShell.jsx';
import { SectionCard } from '../../components/SectionCard.jsx';
import { Icon } from '../../components/Icon.jsx';
import { CHIEF } from '../../data/chiefMock.js';
import { CHIEF_SHELL } from './chiefShell.js';

export function ChiefProfilePage() {
  return (
    <PageShell {...CHIEF_SHELL} pageTitle="Profile">
      <SectionCard title="Chief profile" titleLevel="h1">
        <p className="section-card__lead section-card__lead--left">
          Your account details, assigned administrative areas, and security settings.
        </p>
      </SectionCard>

      <SectionCard title="Personal information">
        <dl className="detail-grid">
          <div className="detail-grid__row detail-grid__row--verified">
            <dt>Full name</dt>
            <dd>{CHIEF.fullName}</dd>
          </div>
          <div className="detail-grid__row detail-grid__row--verified">
            <dt>National ID</dt>
            <dd>{CHIEF.nationalId}</dd>
          </div>
          <div className="detail-grid__row detail-grid__row--verified">
            <dt>Phone number</dt>
            <dd>{CHIEF.phone}</dd>
          </div>
          <div className="detail-grid__row">
            <dt>Email</dt>
            <dd>{CHIEF.email}</dd>
          </div>
          <div className="detail-grid__row detail-grid__row--verified">
            <dt>Verification status</dt>
            <dd>
              <span className="badge badge--success">{CHIEF.verificationStatus}</span>
            </dd>
          </div>
        </dl>
      </SectionCard>

      <SectionCard title="Assigned area">
        <dl className="detail-grid">
          <div className="detail-grid__row">
            <dt>Ward</dt>
            <dd>{CHIEF.ward}</dd>
          </div>
          <div className="detail-grid__row">
            <dt>Location</dt>
            <dd>{CHIEF.location}</dd>
          </div>
          <div className="detail-grid__row">
            <dt>Sub-location</dt>
            <dd>{CHIEF.subLocation}</dd>
          </div>
        </dl>
      </SectionCard>

      <SectionCard title="Account security">
        <div className="btn-row">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => window.alert('Change password — demo not connected.')}
          >
            <Icon name="shield" size={20} />
            Change password
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => window.alert('OTP settings — demo not connected.')}
          >
            <Icon name="shield" size={20} />
            OTP settings
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => window.alert('Session management — demo not connected.')}
          >
            <Icon name="review" size={20} />
            Session management
          </button>
        </div>
      </SectionCard>
    </PageShell>
  );
}
