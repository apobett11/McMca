import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ParentLayout } from '../components/ParentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { useAuth } from '../../../context/AuthContext';
import { joinFullName, validateForm } from '../../../lib/accountAllocation';
import {
  fetchDashboardRegistrationState,
  fetchParentApplicationBoard,
  mergeWizardCompleted,
  saveParentHousehold,
  updateChildProfile
} from '../../../lib/accountQueries';
import {
  emptyHousehold,
  familyComplete,
  formatMoney,
  groupApplicationsByCycle,
  homeComplete,
  readHousehold
} from '../../../lib/household.js';
import { getStatusConfig } from '../../../utils/statusConfig.js';
import { CompleteRegistrationWizard } from '../../../components/account/CompleteRegistrationWizard.jsx';
import { HomeFields } from '../../../components/account/HomeFields.jsx';
import { FamilyFields } from '../../../components/account/FamilyFields.jsx';
import { InstitutionFields } from '../../../components/account/InstitutionFields.jsx';
import { PersonalInfoFields } from '../../../components/account/PersonalInfoFields.jsx';

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
  return map[status] || 'stitch-status-badge--withdrawn';
}

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

export function ParentApplicationsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [wizardOpen, setWizardOpen] = useState(Boolean(location.state?.continueRegistration));
  const [registrationIncomplete, setRegistrationIncomplete] = useState(false);
  const [parent, setParent] = useState(null);
  const [children, setChildren] = useState([]);
  const [applications, setApplications] = useState([]);
  const [windows, setWindows] = useState([]);
  const [household, setHousehold] = useState(emptyHousehold());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editor, setEditor] = useState(null);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function loadBoard() {
    if (!user?.id) return;
    const board = await fetchParentApplicationBoard(user.id);
    setParent(board.parent);
    setChildren(board.children);
    setApplications(board.applications);
    setWindows(board.windows);
    setHousehold(readHousehold(board.parent));
  }

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user?.id) return;
      setLoading(true);
      try {
        const state = await fetchDashboardRegistrationState(user.id, 'parent');
        if (!active) return;
        setRegistrationIncomplete(state.incomplete);
        await loadBoard();
        if (!active) return;
        setError('');
      } catch (err) {
        if (active) setError(err.message || 'Could not load applications.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [user?.id, wizardOpen]);

  const groups = groupApplicationsByCycle(children, applications, windows);
  const homeReady = homeComplete(household);
  const familyReady = familyComplete(household);

  function openEditor(kind, child) {
    setFormError('');
    if (kind === 'personal' && child) {
      setDraft({
        firstName: child.first_name || '',
        middleName: child.middle_name || '',
        lastName: child.last_name || '',
        gender: child.gender || '',
        dateOfBirth: child.date_of_birth || ''
      });
    } else if (kind === 'institution' && child) {
      const bank = child.wizard_completed?.institution || {};
      setDraft({
        schoolName: child.school_name || '',
        schoolLevel: child.school_level || '',
        admissionNumber: child.admission_number || '',
        bankName: bank.bankName || '',
        bankBranch: bank.bankBranch || '',
        accountNumber: bank.accountNumber || ''
      });
    } else {
      setDraft(household);
    }
    setEditor({ kind, childId: child?.id || null });
  }

  async function saveEditor() {
    if (!editor || !parent || !user?.id) return;
    setSaving(true);
    setFormError('');
    try {
      if (editor.kind === 'home' || editor.kind === 'family') {
        const schema = editor.kind === 'home'
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
        if (!check.ok) throw new Error(Object.values(check.errors)[0]);
        if (editor.kind === 'family' && draft.disability === 'yes' && !String(draft.disabilityNote || '').trim()) {
          throw new Error('Describe the disability and the support needed.');
        }
        const next = { ...household, ...draft };
        await saveParentHousehold(parent.id, user.id, next);
        setHousehold(next);
      } else if (editor.kind === 'personal') {
        const check = validateForm(draft, {
          firstName: {},
          lastName: {},
          gender: { label: 'Gender' },
          dateOfBirth: {}
        });
        if (!check.ok) throw new Error(Object.values(check.errors)[0]);
        await updateChildProfile(editor.childId, {
          first_name: draft.firstName.trim(),
          middle_name: draft.middleName?.trim() || null,
          last_name: draft.lastName.trim(),
          gender: draft.gender,
          date_of_birth: draft.dateOfBirth
        });
      } else if (editor.kind === 'institution') {
        const check = validateForm(draft, {
          schoolName: { label: 'School or institution' },
          schoolLevel: { label: 'School level' },
          admissionNumber: { label: 'Admission number' }
        });
        if (!check.ok) throw new Error(Object.values(check.errors)[0]);
        await mergeWizardCompleted('student_profiles', editor.childId, {
          institution: {
            bankName: draft.bankName || '',
            bankBranch: draft.bankBranch || '',
            accountNumber: draft.accountNumber || ''
          }
        });
        await updateChildProfile(editor.childId, {
          school_name: draft.schoolName.trim(),
          school_level: draft.schoolLevel,
          admission_number: draft.admissionNumber.trim()
        });
      }
      await loadBoard();
      setEditor(null);
    } catch (err) {
      setFormError(err.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  const editorChild = children.find((child) => child.id === editor?.childId);

  return (
    <ParentLayout pageTitle="Applications" layout="dashboard">
      <div className="stitch-apps-header">
        <h1 className="stitch-apps-header__title">Applications</h1>
        <p className="stitch-apps-header__sub">
          Each child is listed under their bursary cycle. A new child joins the latest cycle.
        </p>
      </div>

      {registrationIncomplete ? (
        <div className="notice continue-reg-banner">
          <strong>Verify your information</strong>
          <p>Your details are on file. Open the form to confirm them and add both sides of your ID.</p>
          <button
            type="button"
            className="btn btn--primary"
            style={{ borderRadius: 999, width: 'auto', marginTop: 12 }}
            onClick={() => setWizardOpen(true)}
          >
            <Icon name="profile" size={18} />
            Continue
          </button>
        </div>
      ) : null}

      <section className="stitch-apps-history">
        <div className="stitch-apps-history__head">
          <h2 className="stitch-section-title">By cycle</h2>
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
          <div className="notice">
            <strong>No applications yet</strong>
            <p>Add a child to place them on the current bursary cycle.</p>
            <Link className="btn btn--primary" to="/parent/children/new" style={{ borderRadius: 999, width: 'auto', marginTop: 12 }}>
              <Icon name="plus" size={18} />
              Add a child
            </Link>
          </div>
        ) : (
          groups.map((group) => (
            <div className="cycle-block" key={group.cycle}>
              <h3 className="stitch-section-title">{group.cycle}</h3>
              <div className="stitch-apps-table">
                <table>
                  <thead>
                    <tr>
                      <th>Full name</th>
                      <th>School</th>
                      <th>Status</th>
                      <th>Amount allocated</th>
                      <th>Requested</th>
                      <th>Fee balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row) => {
                      const app = row.application;
                      const status = app ? getStatusConfig(app.application_status) : { label: 'Not started' };
                      return (
                        <tr key={app ? app.id : row.child.id}>
                          <td data-label="Full name" style={{ fontWeight: 600 }}>{childName(row.child)}</td>
                          <td data-label="School">{app?.institution_name || row.child.school_name || '—'}</td>
                          <td data-label="Status">
                            <span className={`stitch-status-badge ${app ? statusClass(app.application_status) : 'stitch-status-badge--withdrawn'}`}>
                              {status.label}
                            </span>
                          </td>
                          <td data-label="Amount allocated">{formatMoney(app?.allocated_amount)}</td>
                          <td data-label="Requested">{formatMoney(app?.requested_amount)}</td>
                          <td data-label="Fee balance">{formatMoney(app?.fee_balance)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="stitch-apps-history">
        <div className="stitch-apps-history__head">
          <h2 className="stitch-section-title">Forms</h2>
        </div>
        <p className="field__help" style={{ marginTop: 0 }}>
          Home and family are filled once for your account. Every child you add uses those details.
        </p>

        {loading ? null : children.length === 0 ? (
          <div className="notice">
            <strong>Household first</strong>
            <p>Save home and family details here, then add a child. The new student inherits them.</p>
            <div className="form-flag-row">
              <Flag done={homeReady} label={homeReady ? 'Home on file' : 'Home details'} onClick={() => openEditor('home')} />
              <Flag done={familyReady} label={familyReady ? 'Family on file' : 'Family details'} onClick={() => openEditor('family')} />
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
                        <Flag done={personal} label={personal ? 'Done' : 'Needed'} onClick={() => openEditor('personal', child)} />
                      </td>
                      <td data-label="Parent">
                        <Flag done label="On file" locked />
                      </td>
                      <td data-label="Institution">
                        <Flag done={institution} label={institution ? 'Done' : 'Needed'} onClick={() => openEditor('institution', child)} />
                      </td>
                      <td data-label="Home">
                        <Flag done={homeReady} label={homeReady ? 'On file' : 'Needed'} onClick={() => openEditor('home', child)} />
                      </td>
                      <td data-label="Family">
                        <Flag done={familyReady} label={familyReady ? 'On file' : 'Needed'} onClick={() => openEditor('family', child)} />
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
            <h2>
              {editor.kind === 'home' ? 'Home details' : null}
              {editor.kind === 'family' ? 'Family details' : null}
              {editor.kind === 'personal' ? `${editorChild ? childName(editorChild) : 'Student'} — personal details` : null}
              {editor.kind === 'institution' ? `${editorChild ? childName(editorChild) : 'Student'} — institution` : null}
            </h2>
            {editor.kind === 'home' || editor.kind === 'family' ? (
              <p className="field__help">Saved once. New children receive this as their home information.</p>
            ) : null}
            {editor.kind === 'personal' ? (
              <PersonalInfoFields values={draft} onChange={(key, value) => setDraft((prev) => ({ ...prev, [key]: value }))} includeContact={false} idPrefix={`child-${editor.childId}-`} />
            ) : null}
            {editor.kind === 'institution' ? (
              <InstitutionFields values={draft} onChange={(key, value) => setDraft((prev) => ({ ...prev, [key]: value }))} idPrefix={`child-${editor.childId}-`} />
            ) : null}
            {editor.kind === 'home' ? (
              <HomeFields values={draft} onChange={(key, value) => setDraft((prev) => ({ ...prev, [key]: value }))} idPrefix="parent-home-" />
            ) : null}
            {editor.kind === 'family' ? (
              <FamilyFields values={draft} onChange={(key, value) => setDraft((prev) => ({ ...prev, [key]: value }))} idPrefix="parent-fam-" />
            ) : null}
            {formError ? <p className="field__help">{formError}</p> : null}
            <div className="form-flag-row">
              <button type="button" className="btn btn--primary" onClick={saveEditor} disabled={saving}>
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
          onFinished={() => setRegistrationIncomplete(false)}
        />
      ) : null}
    </ParentLayout>
  );
}
