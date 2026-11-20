import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ParentLayout } from '../components/ParentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { RefreshButton } from '../../../components/RefreshButton.jsx';
import { useAuth } from '../../../context/AuthContext';
import { useCachedQuery } from '../../../lib/useCachedQuery';
import { loadParentBoard, parentBoardKey } from '../../../lib/portalData';
import { DASHBOARD_PARENT_STEPS } from '../../../lib/accountAllocation/wizardFlows';
import { joinFullName } from '../../../lib/accountAllocation';
import { cycleTitle, formatMoney } from '../../../lib/household.js';
import { EDUCATION_LEVEL_LABEL } from '../../../lib/accountAllocation/constants.js';
import { getStatusConfig } from '../../../utils/statusConfig.js';
import { CompleteRegistrationWizard } from '../../../components/account/CompleteRegistrationWizard.jsx';
import { getTimeGreeting } from '../../../utils/greeting.js';
import { AddChildModal } from '../../../components/account/AddChildModal.jsx';

function preparednessCopy(done, total) {
  if (!total || done <= 0) return 'Start your details to build a household record.';
  if (done >= total) return 'Every household step is on file.';
  if (done < total / 2) return 'Several steps still need your attention.';
  return 'Most steps are done. Finish the rest to add a child.';
}

function statusClass(status) {
  const map = {
    submitted: 'stitch-status-badge--review',
    under_review: 'stitch-status-badge--review',
    chief_approved: 'stitch-status-badge--admitted',
    approved: 'stitch-status-badge--admitted',
    funds_sent: 'stitch-status-badge--admitted',
    disbursed: 'stitch-status-badge--admitted',
    rejected: 'stitch-status-badge--declined',
    appealed: 'stitch-status-badge--review',
    draft: 'stitch-status-badge--withdrawn'
  };
  return map[String(status || '').toLowerCase()] || 'stitch-status-badge--withdrawn';
}

function levelLabel(value) {
  if (!value) return '—';
  return EDUCATION_LEVEL_LABEL[value] || value;
}

export function ParentDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const greeting = getTimeGreeting();
  const { data, loading, refreshing, error, refresh } = useCachedQuery(
    user?.id ? parentBoardKey(user.id) : null,
    () => loadParentBoard(user.id),
    { enabled: Boolean(user?.id) }
  );

  const [extraCompleted, setExtraCompleted] = useState([]);
  const [addChildModalOpen, setAddChildModalOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    function onStepCompleted(e) {
      if (e.detail?.completedKeys) {
        setExtraCompleted(e.detail.completedKeys);
      }
    }
    window.addEventListener('mcmca_registration_step_completed', onStepCompleted);
    return () => window.removeEventListener('mcmca_registration_step_completed', onStepCompleted);
  }, []);

  const parent = data?.parent || null;
  const children = data?.children || [];
  const applications = data?.applications || [];
  const windows = data?.windows || [];
  const showSkeleton = loading && !data;

  const parentName = parent
    ? joinFullName({ firstName: parent.first_name, middleName: parent.middle_name, lastName: parent.last_name })
    : 'Parent';
  const initials = parentName.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2) || 'PR';

  // Merge session completed keys with DB completed keys and pre-checked personal info
  const sessionCompleted = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('wizard_completed_dashboard_parent') || '[]');
    } catch {
      return [];
    }
  })();
  const dbCompleted = data?.registration?.completedKeys || [];
  const completedKeys = Array.from(new Set([...dbCompleted, ...sessionCompleted, ...extraCompleted, 'personal_information']));

  const steps = DASHBOARD_PARENT_STEPS;
  const doneCount = steps.filter((step) => completedKeys.includes(step.key)).length;
  const pct = steps.length ? Math.round((doneCount / steps.length) * 100) : 0;
  const complete = doneCount === steps.length && steps.length > 0;

  // The parent must never be allowed to add another student child before they finish one.
  const hasIncompleteChild = children.some(
    (c) => !c.school_name || (!c.admission_number && !c.birth_certificate_number)
  );

  function handleAddChildClick() {
    if (!complete) {
      setActionNotice('You must finish your household registration steps (Personal, Family, General) before adding a child.');
      setTimeout(() => setActionNotice(''), 6000);
      return;
    }
    if (hasIncompleteChild) {
      setActionNotice('You must finish adding the current child before adding another student.');
      setTimeout(() => setActionNotice(''), 6000);
      return;
    }
    setAddChildModalOpen(true);
  }

  const sortedApps = [...applications].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );

  // When parent logs in and registration is incomplete, show forms immediately without asking now or later
  useEffect(() => {
    if (!loading && data && !complete) {
      setWizardOpen(true);
    }
  }, [loading, data, complete]);

  // Reactive household metrics & expected children in school
  const sessionHousehold = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('wizard_data_dashboard_parent') || '{}');
    } catch {
      return {};
    }
  })();
  const household = { ...(data?.household || {}), ...sessionHousehold };

  const rawInSchool = household.childrenInSchool !== undefined && household.childrenInSchool !== '' ? Number(household.childrenInSchool) : null;
  const rawInFamily = household.childrenInFamily !== undefined && household.childrenInFamily !== '' ? Number(household.childrenInFamily) : null;
  const targetInSchool = (rawInSchool !== null && rawInSchool > 0) ? rawInSchool : (rawInFamily !== null && rawInFamily > 0 ? rawInFamily : 1);
  const currentLinkedChildren = children.length;
  const allChildrenAdded = targetInSchool > 0 ? (currentLinkedChildren >= targetInSchool) : (currentLinkedChildren > 0);

  const addChildCard = {
    id: 'add-child',
    title: 'Add a child',
    desc: 'Register a student',
    analytics: `Current children: ${currentLinkedChildren} linked${targetInSchool > 0 ? ` (${currentLinkedChildren}/${targetInSchool} in school)` : ''}`,
    cta: '+ Add Child',
    tone: allChildrenAdded ? 'primary' : 'error',
    isRed: !allChildrenAdded,
    badge: allChildrenAdded ? 'Completed' : `Action Needed (${currentLinkedChildren}/${targetInSchool})`,
    onClick: handleAddChildClick
  };

  const applicationsCard = {
    id: 'applications',
    title: 'Applications',
    desc: 'Bursary records',
    analytics: `${applications.length} submitted record${applications.length === 1 ? '' : 's'}`,
    cta: 'View Records →',
    tone: 'primary',
    to: '/parent/applications',
    badge: `${applications.length} Active`
  };

  const documentsCard = {
    id: 'documents',
    title: 'Documents',
    desc: 'Shared details and each child',
    analytics: `Household & ${currentLinkedChildren} student record${currentLinkedChildren === 1 ? '' : 's'}`,
    cta: 'Open Documents →',
    tone: 'secondary',
    to: '/parent/documents',
    badge: 'On file'
  };

  const messagesCard = {
    id: 'messages',
    title: 'Contact Office',
    desc: 'MCA & Chief messages',
    analytics: 'Direct administrative helpdesk',
    cta: 'Send Message →',
    tone: 'tertiary',
    to: '/parent/messages',
    badge: 'Support'
  };

  // Smart ordering:
  // If not all children added: Add a child is FIRST (and RED). Messages is ALWAYS LAST.
  // If all children added: Applications is FIRST, Documents, Add child, and Messages ALWAYS LAST.
  const smartQuickCards = allChildrenAdded
    ? [applicationsCard, documentsCard, addChildCard, messagesCard]
    : [addChildCard, applicationsCard, documentsCard, messagesCard];

  const totalAllocated = applications.reduce((sum, app) => sum + (Number(app.allocated_amount) || 0), 0);

  return (
    <ParentLayout pageTitle="Home" parentName={parentName} layout="dashboard">
      {wizardOpen && (
        <CompleteRegistrationWizard
          open={wizardOpen}
          startAtKey={steps.find((s) => !completedKeys.includes(s.key))?.key || 'family_details'}
          onClose={() => setWizardOpen(false)}
          onFinished={() => {
            setWizardOpen(false);
            refresh().catch(() => {});
          }}
        />
      )}
      <div className="stitch-dashboard">
        {/* 1. Google Stitch Household Command Hero */}
        <section className="parent-household-hero">
          <div className="parent-hero__top">
            <div className="parent-identity-cluster">
              <div className="parent-avatar-ring" aria-hidden="true">
                <div className="parent-avatar-inner">{initials}</div>
              </div>
              <div className="parent-identity-text">
                <h1>{greeting}, {parentName}</h1>
                <div className="parent-identity-meta">
                  <span className="stitch-status-badge stitch-status-badge--admitted" style={{ fontSize: 11 }}>
                    Household Guardian
                  </span>
                  <span>•</span>
                  <span>
                    {showSkeleton
                      ? 'Loading household…'
                      : `${children.length} linked student${children.length === 1 ? '' : 's'}`}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <RefreshButton onClick={refresh} busy={refreshing} />
              <button
                type="button"
                className="btn-parent-add-child"
                onClick={handleAddChildClick}
                disabled={!complete || hasIncompleteChild}
                title={
                  !complete
                    ? 'Finish household registration first'
                    : hasIncompleteChild
                      ? 'Finish current child before adding another'
                      : 'Add a child'
                }
              >
                <Icon name="plus" size={18} />
                <span>Add Dependent Child</span>
              </button>
            </div>
          </div>

          {/* 4-Item Household Aggregate Metric Strip */}
          <div className="parent-metrics-strip">
            <div className="parent-metric-tile">
              <span className="parent-metric-lbl">Linked Students</span>
              <div className="parent-metric-val">{children.length}</div>
              <span className="parent-metric-sub">
                Target: {targetInSchool || children.length} in school
              </span>
            </div>

            <div className="parent-metric-tile">
              <span className="parent-metric-lbl">Household Readiness</span>
              <div className={`parent-metric-val ${complete ? 'parent-metric-val--emerald' : 'parent-metric-val--indigo'}`}>
                {pct}%
              </div>
              <span className="parent-metric-sub">
                {doneCount} of {steps.length} steps verified
              </span>
            </div>

            <div className="parent-metric-tile">
              <span className="parent-metric-lbl">Bursary Records</span>
              <div className="parent-metric-val">{applications.length}</div>
              <span className="parent-metric-sub">
                Active cycle submissions
              </span>
            </div>

            <div className="parent-metric-tile">
              <span className="parent-metric-lbl">Total Grants Awarded</span>
              <div className="parent-metric-val parent-metric-val--emerald">
                {formatMoney(totalAllocated)}
              </div>
              <span className="parent-metric-sub">
                Cumulative household allocation
              </span>
            </div>
          </div>
        </section>

        {actionNotice ? (
          <div className="notice" style={{ marginBottom: 20, background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
            <p style={{ margin: 0, color: 'var(--text, #F8FAFC)' }}>{actionNotice}</p>
          </div>
        ) : null}

        {/* 2. Dependent Students Grid */}
        <section className="parent-section-wrap">
          <div className="parent-section-head">
            <div>
              <h2 className="parent-section-title">Dependent Students ({children.length})</h2>
              <p className="parent-section-desc">
                Individual dossiers, school records, and bursary applications for your children.
              </p>
            </div>
            {children.length > 0 && (
              <button
                type="button"
                className="btn btn--outline btn--compact"
                onClick={handleAddChildClick}
                disabled={!complete || hasIncompleteChild}
                style={{ borderRadius: 999 }}
              >
                <Icon name="plus" size={14} />
                <span>Add Another Child</span>
              </button>
            )}
          </div>

          {showSkeleton ? (
            <div className="skeleton-wrap" style={{ padding: 24 }}>
              <div className="skeleton skeleton--hero" />
            </div>
          ) : children.length === 0 ? (
            <div className="dash-apps-empty" style={{
              background: 'var(--par-surface, #0F172A)',
              border: '1.5px solid var(--par-border, rgba(255,255,255,0.08))',
              borderRadius: 'var(--par-radius-xl, 22px)',
              padding: '40px 24px',
              textAlign: 'center'
            }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818CF8',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16
              }}>
                <Icon name="plus" size={28} />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>
                No Dependent Students Linked Yet
              </h3>
              <p style={{ maxWidth: 460, margin: '0 auto 20px', color: '#94A3B8', fontSize: 14 }}>
                Add your school-going children to track their verification, upload required documents, and submit bursary applications.
              </p>
              <button
                type="button"
                className="btn-parent-add-child"
                onClick={handleAddChildClick}
              >
                <Icon name="plus" size={18} />
                <span>Add First Dependent Child</span>
              </button>
            </div>
          ) : (
            <div className="parent-children-grid">
              {children.map((child) => {
                const name = joinFullName({
                  firstName: child.first_name,
                  middleName: child.middle_name,
                  lastName: child.last_name
                });
                const childApps = applications.filter((a) => a.student_profile_id === child.id);
                return (
                  <article key={child.id} className="parent-child-card">
                    <div>
                      <div className="parent-child-top">
                        <div className="parent-child-identity">
                          <div className="parent-child-avatar">
                            {name.charAt(0) || 'S'}
                          </div>
                          <div>
                            <div className="parent-child-name">{name}</div>
                            <div className="parent-child-school">
                              {child.school_name || 'Institution not specified'}
                            </div>
                          </div>
                        </div>
                        <span className={`stitch-status-badge ${child.school_name ? 'stitch-status-badge--admitted' : 'stitch-status-badge--review'}`} style={{ fontSize: 11 }}>
                          {child.school_name ? 'Verified' : 'Pending'}
                        </span>
                      </div>

                      <div style={{
                        marginTop: 14,
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        color: 'var(--par-text-secondary, #94A3B8)'
                      }}>
                        <span>Level: <strong style={{ color: '#F8FAFC' }}>{levelLabel(child.institution_level)}</strong></span>
                        <span>Applications: <strong style={{ color: '#F8FAFC' }}>{childApps.length}</strong></span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                      <Link
                        className="btn btn--primary btn--compact"
                        to={`/parent/children/${child.id}`}
                        style={{ flex: 1, justifyContent: 'center' }}
                      >
                        <Icon name="applications" size={16} />
                        <span>Manage Dossier</span>
                      </Link>
                      <Link
                        className="btn btn--outline btn--compact"
                        to="/parent/applications"
                        style={{ flex: 1, justifyContent: 'center' }}
                      >
                        <Icon name="documents" size={16} />
                        <span>Applications</span>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* 3. Two-Column Operational Split */}
        <div className="student-grid">
          {/* Left Column: Applications Ledger */}
          <div className="student-stage-col">
            <section className="dash-single-card">
              <div className="dash-single-card__head">
                <div>
                  <h2 className="stitch-section-title" style={{ margin: 0 }}>Household Bursary Ledger</h2>
                  <p className="field__help" style={{ margin: '4px 0 0' }}>
                    Cycle applications and grant disbursements for your linked students.
                  </p>
                </div>
                {sortedApps.length > 0 && (
                  <Link className="btn btn--outline btn--compact" to="/parent/applications" style={{ borderRadius: 999 }}>
                    View full ledger →
                  </Link>
                )}
              </div>

              {showSkeleton ? (
                <div className="skeleton-wrap" style={{ padding: 20 }}>
                  <div className="skeleton skeleton--hero" />
                </div>
              ) : sortedApps.length === 0 ? (
                <div style={{ padding: '36px 20px', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 12px', color: '#94A3B8', fontSize: 14 }}>
                    No bursary applications have been filed for this household cycle yet.
                  </p>
                  <Link
                    to="/parent/applications"
                    className="btn btn--secondary btn--compact"
                    style={{ borderRadius: 999, display: 'inline-flex' }}
                  >
                    Submit an Application
                  </Link>
                </div>
              ) : (
                <div className="stitch-apps-table" style={{ border: 'none', borderRadius: 0 }}>
                  <table style={{ minWidth: 520 }}>
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Cycle</th>
                        <th>Institution</th>
                        <th>Status</th>
                        <th>Allocated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedApps.map((app) => {
                        const child = children.find((c) => c.id === app.student_profile_id);
                        const name = child ? joinFullName({
                          firstName: child.first_name,
                          middleName: child.middle_name,
                          lastName: child.last_name
                        }) : 'Student';
                        const status = getStatusConfig(app.application_status);
                        return (
                          <tr key={app.id}>
                            <td data-label="Student" style={{ fontWeight: 600, color: '#F8FAFC' }}>{name}</td>
                            <td data-label="Cycle">{cycleTitle(app, windows, app.created_at)}</td>
                            <td data-label="Institution">{app.institution_name || '—'}</td>
                            <td data-label="Status">
                              <span className={`stitch-status-badge ${statusClass(app.application_status)}`}>
                                {status.label}
                              </span>
                            </td>
                            <td data-label="Allocated" style={{ fontWeight: 700, color: '#10B981' }}>
                              {formatMoney(app.allocated_amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Household Registration Checklist & Quick Direct Suite */}
          <div className="student-stage-col">
            <section className="dash-single-card" style={{ marginBottom: 20 }}>
              <div className="dash-single-card__head">
                <div>
                  <h3 className="stitch-section-title" style={{ margin: 0, fontSize: '1.05rem' }}>
                    Household Readiness Checklist
                  </h3>
                  <p className="field__help" style={{ margin: '4px 0 0' }}>
                    {doneCount} of {steps.length} requirements fulfilled. Click any item to edit.
                  </p>
                </div>
                <span className={`stitch-status-badge ${complete ? 'stitch-status-badge--admitted' : 'stitch-status-badge--review'}`}>
                  {complete ? 'Complete' : `${steps.length - doneCount} Needed`}
                </span>
              </div>

              {showSkeleton ? (
                <div className="skeleton-wrap" style={{ padding: 16 }}>
                  <div className="skeleton skeleton--hero" />
                </div>
              ) : (
                <ul className="checklist-single-card__list">
                  {steps.map((step) => {
                    const done = completedKeys.includes(step.key);
                    return (
                      <li
                        key={step.key}
                        className={`checklist-single-card__row${done ? ' checklist-single-card__row--done' : ''}`}
                        onClick={() => navigate('/parent/documents', { state: { startAtKey: step.key, continueRegistration: true } })}
                        style={{ cursor: 'pointer' }}
                      >
                        <input
                          type="checkbox"
                          checked={done}
                          onChange={() => {
                            navigate('/parent/documents', { state: { startAtKey: step.key, continueRegistration: true } });
                          }}
                          tabIndex={0}
                          aria-label={`${step.title} ${done ? 'completed' : 'not completed'}`}
                          style={{ cursor: 'pointer' }}
                        />
                        <span className="checklist-single-card__title" style={{ color: done ? '#94A3B8' : '#F8FAFC' }}>
                          {step.title}
                        </span>
                        <span className={`stitch-status-badge ${done ? 'stitch-status-badge--admitted' : 'stitch-status-badge--withdrawn'}`}>
                          {done ? 'Done' : 'Needed'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Quick Actions Navigation Suite */}
            <section className="dash-suite">
              <div className="dash-suite__head">
                <h3 className="stitch-section-title" style={{ fontSize: '1.05rem', margin: 0 }}>Quick Direct Tools</h3>
              </div>
              <div className="dash-suite__grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                {smartQuickCards.map((item) => {
                  const cardContent = (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div className={`dash-suite__icon dash-suite__icon--${item.tone}`} style={{ margin: 0 }}>
                          <Icon name={item.id === 'add-child' ? 'plus' : item.id === 'applications' ? 'applications' : item.id === 'documents' ? 'documents' : 'support'} size={20} />
                        </div>
                        {item.badge && (
                          <span className={`stitch-status-badge ${item.isRed ? 'stitch-status-badge--declined' : 'stitch-status-badge--admitted'}`} style={{ fontSize: 10 }}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="dash-suite__card-title" style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px', color: '#F8FAFC' }}>{item.title}</p>
                      <p className="dash-suite__card-desc" style={{ marginBottom: 10, fontSize: 12 }}>{item.desc}</p>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        color: item.isRed ? '#EF4444' : 'var(--par-accent-indigo-light, #818CF8)',
                        marginTop: 'auto'
                      }}>
                        <span>{item.cta}</span>
                      </div>
                    </>
                  );

                  if (item.onClick) {
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className="dash-suite__card"
                        onClick={item.onClick}
                        style={{
                          textAlign: 'left',
                          cursor: 'pointer',
                          background: item.isRed ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)' : 'var(--par-surface, #0F172A)',
                          border: item.isRed ? '1.5px solid rgba(239, 68, 68, 0.45)' : '1px solid var(--par-border, rgba(255,255,255,0.08))',
                          font: 'inherit',
                          width: '100%',
                          padding: 16,
                          borderRadius: 14
                        }}
                      >
                        {cardContent}
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={item.id}
                      to={item.to}
                      className="dash-suite__card"
                      style={{
                        textDecoration: 'none',
                        padding: 16,
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'var(--par-surface, #0F172A)',
                        border: '1px solid var(--par-border, rgba(255,255,255,0.08))',
                        borderRadius: 14
                      }}
                    >
                      {cardContent}
                    </Link>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>

      {addChildModalOpen && parent ? (
        <AddChildModal
          parent={parent}
          existingChildren={children}
          onClose={() => setAddChildModalOpen(false)}
          onSaved={() => {
            setAddChildModalOpen(false);
            refresh().catch(() => {});
          }}
        />
      ) : null}
    </ParentLayout>
  );
}
