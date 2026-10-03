import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ParentLayout } from '../components/ParentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { RefreshButton } from '../../../components/RefreshButton.jsx';
import { useAuth } from '../../../context/AuthContext';
import { joinFullName, validateForm } from '../../../lib/accountAllocation';
import { saveParentHousehold } from '../../../lib/accountQueries';
import { useCachedQuery } from '../../../lib/useCachedQuery';
import { writeQueryCache } from '../../../lib/queryCache';
import { loadParentApplications, parentBoardKey } from '../../../lib/portalData';
import { emptyHousehold, familyComplete, homeComplete } from '../../../lib/household.js';
import { CompleteRegistrationWizard } from '../../../components/account/CompleteRegistrationWizard.jsx';
import { HomeFields } from '../../../components/account/HomeFields.jsx';
import { FamilyFields } from '../../../components/account/FamilyFields.jsx';
import { AddChildModal } from '../../../components/account/AddChildModal.jsx';

function childName(child) {
  return joinFullName({
    firstName: child.first_name,
    middleName: child.middle_name,
    lastName: child.last_name
  });
}

function Flag({ done, label, onClick, locked }) {
  return (
    <button
      type="button"
      className={`form-flag${locked ? ' form-flag--locked' : ''}`}
      onClick={locked ? undefined : onClick}
      disabled={locked}
    >
      <span className={`stitch-status-badge ${done ? 'stitch-status-badge--admitted' : 'stitch-status-badge--withdrawn'}`}>
        {label}
      </span>
    </button>
  );
}

export function ParentDocumentsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [wizardOpen, setWizardOpen] = useState(Boolean(location.state?.continueRegistration));
  const [childModal, setChildModal] = useState(location.state?.addChild ? { mode: 'add' } : null);
  const [editor, setEditor] = useState(null);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const { data, loading, refreshing, error, refresh, update } = useCachedQuery(
    user?.id ? `${user.id}:parent-applications` : null,
    () => loadParentApplications(user.id),
    { enabled: Boolean(user?.id) }
  );
  const registrationIncomplete = Boolean(data?.registrationIncomplete);
  const parent = data?.parent || null;
  const children = data?.children || [];
  const household = data?.household || emptyHousehold();
  const showSkeleton = loading && !data;
  const homeReady = homeComplete(household);
  const familyReady = familyComplete(household);
  const parentReady = Boolean(parent?.first_name && parent?.last_name && parent?.national_id);
  const sharedReady = parentReady && homeReady && familyReady;
  const hasIncompleteChild = children.some((c) => !c.school_name || (!c.admission_number && !c.birth_certificate_number));
  const canAddChild = sharedReady && !hasIncompleteChild;

  function remember(next) {
    if (user?.id) {
      writeQueryCache(parentBoardKey(user.id), {
        parent: next.parent,
        children: next.children || [],
        applications: next.applications || [],
        windows: next.windows || [],
        household: next.household
      });
    }
    return next;
  }

  function openShared(kind) {
    setFormError('');
    setDraft(household);
    setEditor(kind);
  }

  async function saveShared() {
    if (!parent || !user?.id || !editor) return;
    const schema = editor === 'home'
      ? {
        constituency: { label: 'Constituency' },
        ward: { label: 'Ward' },
        county: { label: 'County' },
        subCounty: { label: 'Sub-county' },
        pollingStation: { label: 'Polling station' }
      }
      : {
        childrenInFamily: { label: 'Children in the family' },
        parentStatus: { label: 'Parents in the household' },
        monthlyIncome: { label: 'Monthly household income' },
        disability: { label: 'Disability in the family' },
        otherBursary: { label: 'Other bursary' }
      };
    const check = validateForm(draft, schema);
    if (!check.ok) {
      setFormError(Object.values(check.errors)[0]);
      return;
    }
    if (editor === 'family' && draft.disability === 'yes' && !String(draft.disabilityNote || '').trim()) {
      setFormError('Describe the disability and the support needed.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const nextHousehold = { ...household, ...draft };
      await saveParentHousehold(parent.id, user.id, nextHousehold);
      update((prev) => remember({ ...(prev || {}), household: nextHousehold }));
      setEditor(null);
    } catch (err) {
      setFormError(err.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ParentLayout pageTitle="Documents" layout="dashboard">
      <div className="stitch-apps-header">
        <h1 className="stitch-apps-header__title">Forms</h1>
        <p className="stitch-apps-header__sub">
          Home and family are filled once for your account. Every child you add uses those details.
        </p>
      </div>

      {registrationIncomplete ? (
        <div className="notice continue-reg-banner">
          <strong>Finish your details first</strong>
          <p>Save your details, home, and family before a child is added. Those details are copied onto each student.</p>
          <button type="button" className="btn btn--primary" style={{ borderRadius: 999, width: 'auto', marginTop: 12 }} onClick={() => setWizardOpen(true)}>
            Continue
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="notice" role="alert">
          <strong>Could not load</strong>
          <p>{error}</p>
        </div>
      ) : null}

      <section className="stitch-apps-history">
        <div className="dash-suite__head">
          <h2 className="stitch-section-title">Students</h2>
          <div className="btn-row">
            <RefreshButton onClick={refresh} busy={refreshing} />
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setChildModal({ mode: 'add' })}
              disabled={!canAddChild}
              title={!sharedReady ? 'Household details needed first' : hasIncompleteChild ? 'Finish current child before adding another' : 'Add a child'}
            >
              <Icon name="plus" size={18} />
              Add a child
            </button>
          </div>
        </div>

        {showSkeleton ? (
          <div className="skeleton-wrap">
            <div className="skeleton skeleton--hero" />
          </div>
        ) : children.length === 0 ? (
          <div className="notice">
            <strong>Household first</strong>
            <p>Save home and family details here, then add a child. The new student inherits them.</p>
            <div className="form-flag-row">
              <Flag done={parentReady} label={parentReady ? 'Parent on file' : 'Parent details'} onClick={() => setWizardOpen(true)} />
              <Flag done={homeReady} label={homeReady ? 'Home on file' : 'Home details'} onClick={() => openShared('home')} />
              <Flag done={familyReady} label={familyReady ? 'Family on file' : 'Family details'} onClick={() => openShared('family')} />
            </div>
          </div>
        ) : (
          <div className="stitch-apps-table">
            <table>
              <thead>
                <tr>
                  <th>Full name</th>
                  <th>Personal</th>
                  <th>Parent</th>
                  <th>Institution</th>
                  <th>Home</th>
                  <th>Family</th>
                  <th>Documents</th>
                </tr>
              </thead>
              <tbody>
                {children.map((child) => {
                  const personal = Boolean(child.first_name && child.last_name && child.date_of_birth && child.gender);
                  const institution = Boolean(child.school_name && child.school_level && child.admission_number);
                  return (
                    <tr key={child.id}>
                      <td data-label="Full name" style={{ fontWeight: 600 }}>{childName(child)}</td>
                      <td data-label="Personal">
                        <Flag done={personal} label={personal ? 'Done' : 'Needed'} onClick={() => setChildModal({ mode: 'edit', child })} />
                      </td>
                      <td data-label="Parent">
                        <Flag done={parentReady} label={parentReady ? 'On file' : 'Needed'} locked={parentReady} onClick={() => setWizardOpen(true)} />
                      </td>
                      <td data-label="Institution">
                        <Flag done={institution} label={institution ? 'Done' : 'Needed'} onClick={() => setChildModal({ mode: 'edit', child })} />
                      </td>
                      <td data-label="Home">
                        <Flag done={homeReady} label={homeReady ? 'On file' : 'Needed'} onClick={() => openShared('home')} />
                      </td>
                      <td data-label="Family">
                        <Flag done={familyReady} label={familyReady ? 'On file' : 'Needed'} onClick={() => openShared('family')} />
                      </td>
                      <td data-label="Documents">
                        <button type="button" className="btn btn--secondary btn--compact" onClick={() => setChildModal({ mode: 'edit', child })}>
                          Update
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {editor ? (
          <div className="wizard-panel" style={{ marginTop: 16 }}>
            <h2>{editor === 'home' ? 'Home details' : 'Family details'}</h2>
            <p className="field__help">Saved once. Every child uses this household.</p>
            {editor === 'home' ? (
              <HomeFields values={draft} onChange={(key, value) => setDraft((prev) => ({ ...prev, [key]: value }))} idPrefix="parent-home-" />
            ) : (
              <FamilyFields values={draft} onChange={(key, value) => setDraft((prev) => ({ ...prev, [key]: value }))} idPrefix="parent-fam-" />
            )}
            {formError ? <p className="field__help">{formError}</p> : null}
            <div className="form-flag-row">
              <button type="button" className="btn btn--primary" onClick={saveShared} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button type="button" className="btn btn--secondary" onClick={() => setEditor(null)} disabled={saving}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {wizardOpen ? (
        <CompleteRegistrationWizard
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          onFinished={() => {
            setWizardOpen(false);
            update((prev) => ({ ...(prev || {}), registrationIncomplete: false }));
            refresh().catch(() => {});
          }}
        />
      ) : null}

      {childModal && parent ? (
        <AddChildModal
          parent={parent}
          child={childModal.child}
          existingChildren={children}
          onClose={() => setChildModal(null)}
          onSaved={() => refresh().catch(() => {})}
        />
      ) : null}
    </ParentLayout>
  );
}
