import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../../components/PageShell.jsx';
import { PageIntro } from '../../components/student/PageIntro.jsx';
import { StatusPill } from '../../components/StatusPill.jsx';
import { Icon } from '../../components/Icon.jsx';
import { STUDENT_SHELL } from '../studentShell.js';
import { STUDENT_APPLICATIONS } from '../../data/studentMock.js';

export function StudentApplicationsPage() {
  const [expandedId, setExpandedId] = useState(STUDENT_APPLICATIONS[0]?.id);

  return (
    <PageShell pageTitle="Applications" {...STUDENT_SHELL}>
      <PageIntro
        lead="Your bursary applications for this ward — one active cycle at a time."
      />

      <div className="page-section--full">
        <Link className="btn btn--primary" to="/student/new-application">
          <Icon name="plus" size={20} />
          Start new application
        </Link>
      </div>

      <section className="application-list page-section--full" aria-label="Your applications">
        {STUDENT_APPLICATIONS.map((app) => {
          const open = expandedId === app.id;
          return (
            <article key={app.id} className={`application-row ${open ? 'application-row--open' : ''}`}>
              <button
                type="button"
                className="application-row__head"
                aria-expanded={open}
                onClick={() => setExpandedId(open ? null : app.id)}
              >
                <div className="application-row__main">
                  <h3 className="application-row__year">{app.year} Bursary</h3>
                  <StatusPill status={app.status} />
                </div>
                <span className="application-row__code">Tracking: {app.trackingCode}</span>
                <Icon name={open ? 'chevronLeft' : 'chevronRight'} size={20} />
              </button>
              {open ? (
                <div className="application-row__body">
                  <dl className="detail-grid">
                    <div className="detail-grid__row">
                      <dt>Submitted</dt>
                      <dd>{app.submittedAt}</dd>
                    </div>
                    <div className="detail-grid__row">
                      <dt>Safe tracking code</dt>
                      <dd>{app.trackingCode}</dd>
                    </div>
                  </dl>
                  <Link className="btn btn--secondary btn--compact" to="/student/documents">
                    View documents
                  </Link>
                </div>
              ) : null}
            </article>
          );
        })}
      </section>
    </PageShell>
  );
}
