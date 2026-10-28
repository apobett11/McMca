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
import { EDUCATION_LEVEL_LABEL } from '../../../lib/accountAllocation/constants.js';

function childName(child) {
  return joinFullName({
    firstName: child.first_name,
    middleName: child.middle_name,
    lastName: child.last_name
  }) || 'Student';
}

function levelLabel(value) {
  if (!value) return '—';
  return EDUCATION_LEVEL_LABEL[value] || value;
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
        ward: { label: 'Ward' },
        location: { label: 'Location' },
        subLocation: { label: 'Sub-location' },
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
    <ParentLayout pageTitle="Documents & Household" layout="dashboard">
      <div className="stitch-apps-header">
        <h1 className="stitch-apps-header__title">Documents & Household Details</h1>
        <p className="stitch-apps-header__sub">
          General household information is completed once and automatically applies to all linked children.
        </p>
      </div>

      {registrationIncomplete ? (
        <div className="notice continue-reg-banner">
          <strong>Finish your household details first</strong>
          <p>Complete your personal, home location, and family details before adding students. Those details will be pre-filled on every child.</p>
          <button
            type="button"
            className="btn btn--primary"
            style={{ borderRadius: 999, width: 'auto', marginTop: 12 }}
            onClick={() => setWizardOpen(true)}
          >
            Complete household registration
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="notice" role="alert">
          <strong>Could not load</strong>
          <p>{error}</p>
        </div>
      ) : null}

      {/* Linked Children Documents Single Row Table */}
      <section className="stitch-apps-history">
        <div className="stitch-apps-history__head">
          <div>
            <h2 className="stitch-section-title" style={{ margin: 0 }}>Linked Children & Documents</h2>
            <p className="field__help" style={{ margin: '4px 0 0' }}>
              Single row per student showing only student-specific documents and registration status.
            </p>
          </div>
          <div className="btn-row">
            <RefreshButton onClick={refresh} busy={refreshing} />
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setChildModal({ mode: 'add' })}
              disabled={!canAddChild}
              title={
                !sharedReady
                  ? 'Complete household registration first'
                  : hasIncompleteChild
                    ? 'Finish current child before adding another'
                    : 'Add a child'
              }
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
            <strong>No children linked yet</strong>
            <p>Your general household information is saved. Add your child to fill their 3 student-specific steps (Personal, Institution, Documents).</p>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setChildModal({ mode: 'add' })}
              disabled={!canAddChild}
              style={{ borderRadius: 999, width: 'auto', marginTop: 12 }}
            >
              <Icon name="plus" size={18} />
              Add a child
            </button>
          </div>
        ) : (
          <div className="stitch-apps-table">
            <table>
              <thead>
                <tr>
                  <th>Student name</th>
                  <th>School / Institution</th>
                  <th>Level</th>
                  <th>Birth Certificate / ID</th>
                  <th>Fee / Academic Docs</th>
                  <th>Household Info</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {children.map((child) => {
                  const hasBirthCert = Boolean(child.birth_certificate_number);
                  const hasSchool = Boolean(child.school_name && child.admission_number);

                  return (
                    <tr key={child.id}>
                      <td data-label="Student name" style={{ fontWeight: 600 }}>
                        {childName(child)}
                      </td>
                      <td data-label="School / Institution">
                        {child.school_name || 'School not added yet'}
                      </td>
                      <td data-label="Level">
                        {levelLabel(child.school_level)}
                      </td>
                      <td data-label="Birth Certificate / ID">
                        <span className={`stitch-status-badge ${hasBirthCert ? 'stitch-status-badge--admitted' : 'stitch-status-badge--withdrawn'}`}>
                          {hasBirthCert ? 'On file' : 'Needed'}
                        </span>
                      </td>
                      <td data-label="Fee / Academic Docs">
                        <span className={`stitch-status-badge ${hasSchool ? 'stitch-status-badge--admitted' : 'stitch-status-badge--withdrawn'}`}>
                          {hasSchool ? 'On file' : 'Needed'}
                        </span>
                      </td>
                      <td data-label="Household Info">
                        <span className="stitch-status-badge stitch-status-badge--admitted" title="Home and family details pre-filled from parent account">
                          Pre-filled from Parent
                        </span>
                      </td>
                      <td data-label="Actions">
                        <button
                          type="button"
                          className="btn btn--secondary btn--compact"
                          onClick={() => setChildModal({ mode: 'edit', child })}
                          style={{ borderRadius: 999 }}
                        >
                          <Icon name="review" size={14} />
                          Update child
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Inline General Information Editor Modal / Panel */}
        {editor ? (
          <div className="wizard-panel" style={{ marginTop: 20 }}>
            <h2>{editor === 'home' ? 'General Location Details' : 'Family Details'}</h2>
            <p className="field__help">Saved once for your parent account. Automatically applies to every child.</p>
            {editor === 'home' ? (
              <HomeFields
                values={draft}
                onChange={(key, value) => setDraft((prev) => ({ ...prev, [key]: value }))}
                idPrefix="parent-home-"
              />
            ) : (
              <FamilyFields
                values={draft}
                onChange={(key, value) => setDraft((prev) => ({ ...prev, [key]: value }))}
                idPrefix="parent-fam-"
              />
            )}
            {formError ? <p className="field__help" style={{ color: '#ef4444' }}>{formError}</p> : null}
            <div className="form-flag-row" style={{ marginTop: 14 }}>
              <button type="button" className="btn btn--primary" onClick={saveShared} disabled={saving} style={{ borderRadius: 999, width: 'auto' }}>
                {saving ? 'Saving…' : 'Save General Details'}
              </button>
              <button type="button" className="btn btn--secondary" onClick={() => setEditor(null)} disabled={saving} style={{ borderRadius: 999, width: 'auto' }}>
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
