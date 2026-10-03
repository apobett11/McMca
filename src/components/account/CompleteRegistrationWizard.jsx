import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ACCOUNT_ROLE,
  DOCUMENT_KIND,
  WIZARD_FLOW,
  hasIdentityCardSides,
  hasParentIdSides,
  joinFullName,
  validateForm
} from '../../lib/accountAllocation';
import { getWizardSteps } from '../../lib/accountAllocation/wizardFlows';
import {
  activateOwnerAccount,
  fetchDashboardRegistrationState,
  fetchIdentityDocuments,
  fetchLinkedParents,
  linkIndependentParentsOnActivation,
  persistIdPair,
  savePendingParentFromStudent,
  updateChildProfile,
  updateParentProfile,
  saveStudentHousehold,
  saveParentHousehold,
  mergeWizardCompleted
} from '../../lib/accountQueries';
import { useWizardSession } from '../../hooks/useWizardSession';
import { WizardShell } from './WizardShell.jsx';
import { PersonalInfoFields } from './PersonalInfoFields.jsx';
import { ParentInfoFields } from './ParentInfoFields.jsx';
import { InstitutionFields } from './InstitutionFields.jsx';
import { IdentityScanStep } from './IdentityScanStep.jsx';
import { HomeFields } from './HomeFields.jsx';
import { FamilyFields } from './FamilyFields.jsx';
import { readHousehold } from '../../lib/household.js';
import { readQueryCache, writeQueryCache } from '../../lib/queryCache';

function studentSeed(profile, pending) {
  if (!profile) return {};
  const household = readHousehold(profile);
  return {
    firstName: profile.first_name || '',
    middleName: profile.middle_name || '',
    lastName: profile.last_name || '',
    gender: profile.gender || '',
    dateOfBirth: profile.date_of_birth || '',
    phone: profile.phone_number || '',
    nationalId: profile.national_id || '',
    schoolName: profile.school_name || '',
    schoolLevel: profile.school_level || '',
    admissionNumber: profile.admission_number || '',
    bankName: profile.wizard_completed?.institution?.bankName || '',
    bankBranch: profile.wizard_completed?.institution?.bankBranch || '',
    accountNumber: profile.wizard_completed?.institution?.accountNumber || '',
    parentFirstName: pending?.parent_first_name || '',
    parentMiddleName: pending?.parent_middle_name || '',
    parentLastName: pending?.parent_last_name || '',
    parentRelationship: pending?.relationship || '',
    parentPhone: pending?.parent_phone || '',
    parentNationalId: pending?.parent_national_id || '',
    constituency: household.constituency || '',
    ward: household.ward || profile.ward || '',
    county: household.county || profile.county || '',
    subCounty: household.subCounty || '',
    pollingStation: household.pollingStation || profile.location_name || '',
    childrenInFamily: household.childrenInFamily || '',
    childrenInSchool: household.childrenInSchool || '',
    childrenPrimary: household.childrenPrimary || '',
    childrenSecondary: household.childrenSecondary || '',
    childrenTertiary: household.childrenTertiary || '',
    parentStatus: household.parentStatus || '',
    fatherOccupation: household.fatherOccupation || '',
    motherOccupation: household.motherOccupation || '',
    monthlyIncome: household.monthlyIncome || '',
    disability: household.disability || '',
    disabilityNote: household.disabilityNote || '',
    otherBursary: household.otherBursary || ''
  };
}

function parentSeed(profile) {
  if (!profile) return {};
  const household = readHousehold(profile);
  return {
    firstName: profile.first_name || '',
    middleName: profile.middle_name || '',
    lastName: profile.last_name || '',
    gender: profile.gender || '',
    dateOfBirth: profile.date_of_birth || '',
    phone: profile.phone_number || '',
    nationalId: profile.national_id || '',
    constituency: household.constituency || '',
    ward: household.ward || '',
    county: household.county || '',
    subCounty: household.subCounty || '',
    pollingStation: household.pollingStation || '',
    childrenInFamily: household.childrenInFamily || '',
    childrenInSchool: household.childrenInSchool || '',
    childrenPrimary: household.childrenPrimary || '',
    childrenSecondary: household.childrenSecondary || '',
    childrenTertiary: household.childrenTertiary || '',
    parentStatus: household.parentStatus || '',
    fatherOccupation: household.fatherOccupation || '',
    motherOccupation: household.motherOccupation || '',
    monthlyIncome: household.monthlyIncome || '',
    disability: household.disability || '',
    disabilityNote: household.disabilityNote || '',
    otherBursary: household.otherBursary || ''
  };
}

export function CompleteRegistrationWizard({ open, onClose, onFinished, startAtKey = null, handoffOnComplete = false, inline = false }) {
  const { user, role } = useAuth();
  const [profile, setProfile] = useState(null);
  const [pendingParent, setPendingParent] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [stepErrors, setStepErrors] = useState({});
  const [bootError, setBootError] = useState('');
  const [done, setDone] = useState(false);

  const flowId = role === ACCOUNT_ROLE.PARENT
    ? WIZARD_FLOW.DASHBOARD_PARENT
    : WIZARD_FLOW.DASHBOARD_STUDENT;
  const steps = useMemo(() => getWizardSteps(flowId), [flowId]);
  const seedValues = useMemo(
    () => (role === ACCOUNT_ROLE.PARENT ? parentSeed(profile) : studentSeed(profile, pendingParent)),
    [role, profile, pendingParent]
  );

  const wizard = useWizardSession({
    flowId,
    ownerType: role,
    ownerId: profile?.id,
    authUserId: user?.id,
    steps,
    cacheOwnerKey: profile ? `${role}:${profile.id}:dashboard` : 'anon-dashboard',
    enabled: open && Boolean(profile) && Boolean(user?.id),
    seedValues,
    initialStepKey: startAtKey
  });

  const handleFieldChange = (field, value) => {
    wizard.updateField(field, value);
    if (stepErrors[field]) {
      setStepErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  useEffect(() => {
    let active = true;
    async function load() {
      if (!open || !user?.id || !role) return;
      setBootError('');
      setDone(false);
      const cacheKey = `${user.id}:${role}:wizard-state`;
      const cached = readQueryCache(cacheKey);
      if (cached?.profile) {
        setProfile(cached.profile);
        setPendingParent(cached.pendingParent || null);
        setDocuments(cached.documents || []);
      }
      try {
        const state = await fetchDashboardRegistrationState(user.id, role);
        if (!active) return;
        setProfile(state.profile);
        let parentItem = null;
        let docs = [];
        if (state.profile && role === ACCOUNT_ROLE.STUDENT) {
          const parents = await fetchLinkedParents(state.profile.id);
          docs = await fetchIdentityDocuments(role, state.profile.id);
          if (!active) return;
          parentItem = parents[0] || null;
          setPendingParent(parentItem);
          setDocuments(docs);
        } else if (state.profile) {
          docs = await fetchIdentityDocuments(role, state.profile.id);
          if (!active) return;
          setDocuments(docs);
        }
        writeQueryCache(cacheKey, {
          profile: state.profile,
          pendingParent: parentItem,
          documents: docs
        });
      } catch (err) {
        if (active && !cached?.profile) setBootError(err.message || 'Could not load your details.');
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [open, user?.id, role]);

  if (!open) return null;

  async function refreshDocuments() {
    if (!profile) return [];
    const docs = await fetchIdentityDocuments(role, profile.id);
    setDocuments(docs);
    if (user?.id && role) {
      const cacheKey = `${user.id}:${role}:wizard-state`;
      const cached = readQueryCache(cacheKey);
      if (cached) writeQueryCache(cacheKey, { ...cached, documents: docs });
    }
    return docs;
  }

  async function handleNext() {
    if (!profile || !user?.id) return;
    const key = wizard.currentStep?.key;
    setSubmitting(true);
    wizard.setError('');
    try {
      if (key === 'personal_information') {
        const check = validateForm(wizard.values, {
          firstName: {},
          lastName: {},
          gender: { label: 'Gender' },
          dateOfBirth: {},
          phone: {},
          nationalId: {}
        });
        if (!check.ok) {
          setStepErrors(check.errors);
          wizard.setError(Object.values(check.errors)[0]);
          setTimeout(() => {
            const firstInvalid = document.querySelector('[aria-invalid="true"], .is-invalid, .field--invalid input, .field--invalid select');
            firstInvalid?.focus();
            firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 50);
          return;
        }
        setStepErrors({});
        wizard.setError('');

        const patch = {
          first_name: wizard.values.firstName.trim(),
          middle_name: wizard.values.middleName?.trim() || null,
          last_name: wizard.values.lastName.trim(),
          gender: wizard.values.gender,
          date_of_birth: wizard.values.dateOfBirth,
          phone_number: wizard.values.phone,
          national_id: wizard.values.nationalId
        };
        setProfile((prev) => ({ ...prev, ...patch }));

        setSaveStatus('success');
        await new Promise((r) => setTimeout(r, 600));
        setSaveStatus('idle');

        const nextCompleted = wizard.completedKeys.includes('personal_information')
          ? wizard.completedKeys
          : [...wizard.completedKeys, 'personal_information'];
        wizard.setCompletedKeys?.(nextCompleted);
        sessionStorage.setItem(`wizard_completed_${flowId}`, JSON.stringify(nextCompleted));

        const nextIncompleteIdx = steps.findIndex((s) => !nextCompleted.includes(s.key));
        if (nextIncompleteIdx >= 0) {
          wizard.setStepIndex(nextIncompleteIdx);
        }
        return;
      }

      if (key === 'parent_information') {
        const check = validateForm(wizard.values, {
          parentFirstName: {},
          parentLastName: {},
          parentRelationship: { label: 'Relationship' },
          parentPhone: {},
          parentNationalId: {}
        });
        if (!check.ok) {
          setStepErrors(check.errors);
          wizard.setError(Object.values(check.errors)[0]);
          setTimeout(() => {
            const firstInvalid = document.querySelector('[aria-invalid="true"], .is-invalid, .field--invalid input, .field--invalid select');
            firstInvalid?.focus();
            firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 50);
          return;
        }
        setStepErrors({});
        wizard.setError('');

        setSaveStatus('success');
        await new Promise((r) => setTimeout(r, 600));
        setSaveStatus('idle');

        const nextCompleted = wizard.completedKeys.includes('parent_information')
          ? wizard.completedKeys
          : [...wizard.completedKeys, 'parent_information'];
        wizard.setCompletedKeys?.(nextCompleted);
        sessionStorage.setItem(`wizard_completed_${flowId}`, JSON.stringify(nextCompleted));

        const nextIncompleteIdx = steps.findIndex((s) => !nextCompleted.includes(s.key));
        if (nextIncompleteIdx >= 0) {
          wizard.setStepIndex(nextIncompleteIdx);
        }
        return;
      }

      if (key === 'institution') {
        const check = validateForm(wizard.values, {
          schoolName: { label: 'School or institution' },
          schoolLevel: { label: 'School level' },
          admissionNumber: { label: 'Admission number' },
          bankName: { label: 'Bank name' },
          bankBranch: { label: 'Bank branch' },
          accountNumber: { label: 'Account number' }
        });
        if (!check.ok) {
          setStepErrors(check.errors);
          wizard.setError(Object.values(check.errors)[0]);
          setTimeout(() => {
            const firstInvalid = document.querySelector('[aria-invalid="true"], .is-invalid, .field--invalid input, .field--invalid select');
            firstInvalid?.focus();
            firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 50);
          return;
        }
        setStepErrors({});
        wizard.setError('');

        setSaveStatus('success');
        await new Promise((r) => setTimeout(r, 600));
        setSaveStatus('idle');

        const nextCompleted = wizard.completedKeys.includes('institution')
          ? wizard.completedKeys
          : [...wizard.completedKeys, 'institution'];
        wizard.setCompletedKeys?.(nextCompleted);
        sessionStorage.setItem(`wizard_completed_${flowId}`, JSON.stringify(nextCompleted));

        const nextIncompleteIdx = steps.findIndex((s) => !nextCompleted.includes(s.key));
        if (nextIncompleteIdx >= 0) {
          wizard.setStepIndex(nextIncompleteIdx);
        }
        return;
      }

      if (key === 'home_details') {
        const check = validateForm(wizard.values, {
          constituency: { label: 'Constituency' },
          ward: { label: 'Ward' },
          county: { label: 'County' },
          subCounty: { label: 'Sub-county' },
          pollingStation: { label: 'Polling station' }
        });
        if (!check.ok) {
          setStepErrors(check.errors);
          wizard.setError(Object.values(check.errors)[0]);
          setTimeout(() => {
            const firstInvalid = document.querySelector('[aria-invalid="true"], .is-invalid, .field--invalid input, .field--invalid select');
            firstInvalid?.focus();
            firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 50);
          return;
        }
        setStepErrors({});
        wizard.setError('');

        setSaveStatus('success');
        await new Promise((r) => setTimeout(r, 600));
        setSaveStatus('idle');

        const nextCompleted = wizard.completedKeys.includes('home_details')
          ? wizard.completedKeys
          : [...wizard.completedKeys, 'home_details'];
        wizard.setCompletedKeys?.(nextCompleted);
        sessionStorage.setItem(`wizard_completed_${flowId}`, JSON.stringify(nextCompleted));

        const nextIncompleteIdx = steps.findIndex((s) => !nextCompleted.includes(s.key));
        if (nextIncompleteIdx >= 0) {
          wizard.setStepIndex(nextIncompleteIdx);
        }
        return;
      }

      if (key === 'family_details') {
        const check = validateForm(wizard.values, {
          childrenInFamily: { label: 'Children in the family' },
          parentStatus: { label: 'Parents in the household' },
          monthlyIncome: { label: 'Monthly household income' },
          disability: { label: 'Disability in the family' },
          otherBursary: { label: 'Other bursary' }
        });
        if (!check.ok) {
          setStepErrors(check.errors);
          wizard.setError(Object.values(check.errors)[0]);
          setTimeout(() => {
            const firstInvalid = document.querySelector('[aria-invalid="true"], .is-invalid, .field--invalid input, .field--invalid select');
            firstInvalid?.focus();
            firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 50);
          return;
        }
        if (wizard.values.disability === 'yes' && !String(wizard.values.disabilityNote || '').trim()) {
          setStepErrors((prev) => ({ ...prev, disabilityNote: 'Describe the disability and the support needed.' }));
          wizard.setError('Describe the disability and the support needed.');
          setTimeout(() => {
            const firstInvalid = document.querySelector('[name="disabilityNote"], [aria-invalid="true"]');
            firstInvalid?.focus();
            firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 50);
          return;
        }
        setStepErrors({});
        wizard.setError('');

        setSaveStatus('success');
        await new Promise((r) => setTimeout(r, 600));
        setSaveStatus('idle');

        const nextCompleted = wizard.completedKeys.includes('family_details')
          ? wizard.completedKeys
          : [...wizard.completedKeys, 'family_details'];
        wizard.setCompletedKeys?.(nextCompleted);
        sessionStorage.setItem(`wizard_completed_${flowId}`, JSON.stringify(nextCompleted));

        const nextIncompleteIdx = steps.findIndex((s) => !nextCompleted.includes(s.key));
        if (nextIncompleteIdx >= 0) {
          wizard.setStepIndex(nextIncompleteIdx);
        } else {
          if (handoffOnComplete) {
            onFinished?.();
            return;
          }
          setDone(true);
          onFinished?.();
        }
        return;
      }
    } catch (err) {
      wizard.setError(err.message || 'Could not complete this step.');
    } finally {
      setSubmitting(false);
    }
  }

  const nextLabel = wizard.stepIndex >= steps.length - 1 ? 'Save registration' : 'Complete step';

  function canSelectStep() {
    return true;
  }

  const wizardBody = (
    <>
      {bootError ? <p className="field__help">{bootError}</p> : null}
      {done ? (
        <div className="notice" style={{ padding: '24px', textAlign: 'center' }}>
          <p className="field__help" style={{ marginTop: 0 }}>Your details are saved for this session.</p>
          {!inline && (
            <button type="button" className="btn btn--primary" onClick={onClose} style={{ borderRadius: 999, width: 'auto', marginTop: 12 }}>
              Close
            </button>
          )}
        </div>
      ) : wizard.loading || !profile ? (
        <p className="field__help">Loading your details…</p>
      ) : (
        <WizardShell
          embedded={!inline}
          steps={steps}
          stepIndex={wizard.stepIndex}
          error={wizard.error}
          submitting={submitting}
          nextLabel={nextLabel}
          saveStatus={saveStatus}
          onBack={() => {
            setStepErrors({});
            wizard.setError('');
            wizard.setStepIndex((i) => Math.max(0, i - 1));
          }}
          onNext={handleNext}
          onStepSelect={(index) => {
            if (canSelectStep(index)) {
              setStepErrors({});
              wizard.setError('');
              wizard.setStepIndex(index);
            }
          }}
          canSelectStep={canSelectStep}
          completedKeys={wizard.completedKeys}
        >
          {wizard.currentStep?.key === 'personal_information' ? (
            <>
              <PersonalInfoFields
                values={wizard.values}
                onChange={handleFieldChange}
                errors={stepErrors}
                idPrefix="dash-"
              />
              <IdentityScanStep
                values={wizard.values}
                files={wizard.files}
                onFile={wizard.updateFile}
                registeredName={joinFullName(wizard.values)}
                registeredId={wizard.values.nationalId}
              />
            </>
          ) : null}
          {wizard.currentStep?.key === 'parent_information' ? (
            <>
              <ParentInfoFields
                values={wizard.values}
                onChange={handleFieldChange}
                errors={stepErrors}
              />
              <IdentityScanStep
                values={{
                  firstName: wizard.values.parentFirstName,
                  middleName: wizard.values.parentMiddleName,
                  lastName: wizard.values.parentLastName,
                  nationalId: wizard.values.parentNationalId
                }}
                files={wizard.files}
                onFile={wizard.updateFile}
                registeredName={joinFullName({
                  firstName: wizard.values.parentFirstName,
                  middleName: wizard.values.parentMiddleName,
                  lastName: wizard.values.parentLastName
                })}
                registeredId={wizard.values.parentNationalId}
                fileField="parentIdFront"
                backField="parentIdBack"
              />
            </>
          ) : null}
          {wizard.currentStep?.key === 'institution' ? (
            <InstitutionFields
              values={wizard.values}
              onChange={handleFieldChange}
              errors={stepErrors}
            />
          ) : null}
          {wizard.currentStep?.key === 'home_details' ? (
            <HomeFields
              values={wizard.values}
              onChange={handleFieldChange}
              errors={stepErrors}
              idPrefix="dash-home-"
            />
          ) : null}
          {wizard.currentStep?.key === 'family_details' ? (
            <FamilyFields
              values={wizard.values}
              onChange={handleFieldChange}
              errors={stepErrors}
              idPrefix="dash-fam-"
            />
          ) : null}
        </WizardShell>
      )}
    </>
  );

  if (inline) {
    return (
      <div className="wizard-page-view" style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
        {wizardBody}
      </div>
    );
  }

  return (
    <div className="modal-root modal-root--center" role="dialog" aria-modal="true" aria-labelledby="reg-wizard-title">
      <button type="button" className="modal-root__backdrop" onClick={onClose} aria-label="Close" />
      <div className="modal-panel modal-panel--wizard">
        <div className="modal-panel__header">
          <h2 id="reg-wizard-title" className="modal-panel__title">
            {done ? 'Registration saved' : 'Finish registration'}
          </h2>
          <button type="button" className="modal-panel__close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-panel__body">
          {wizardBody}
        </div>
      </div>
    </div>
  );
}
