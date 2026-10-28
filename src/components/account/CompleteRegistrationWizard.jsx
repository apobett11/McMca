import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  mergeWizardCompleted,
  saveWizardStep
} from '../../lib/accountQueries';
import { supabase } from '../../lib/supabase';
import { useWizardSession } from '../../hooks/useWizardSession';
import { WizardShell } from './WizardShell.jsx';
import { PersonalInfoFields } from './PersonalInfoFields.jsx';
import { ParentInfoFields } from './ParentInfoFields.jsx';
import { InstitutionFields } from './InstitutionFields.jsx';
import { AccountConfirmModal } from './AccountConfirmModal.jsx';
import { IdentityScanStep } from './IdentityScanStep.jsx';
import { HomeFields } from './HomeFields.jsx';
import { FamilyFields, validateFamilyData } from './FamilyFields.jsx';
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
    ward: household.ward || profile.ward || 'Tendeno/Sorget Ward',
    county: household.county || profile.county || '',
    subCounty: household.subCounty || '',
    location: household.location || '',
    subLocation: household.subLocation || '',
    village: household.village || '',
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
    ward: household.ward || 'Tendeno/Sorget Ward',
    county: household.county || '',
    subCounty: household.subCounty || '',
    location: household.location || '',
    subLocation: household.subLocation || '',
    village: household.village || '',
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
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [pendingParent, setPendingParent] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [stepErrors, setStepErrors] = useState({});
  const [bootError, setBootError] = useState('');
  const [done, setDone] = useState(false);
  const [showAccountConfirm, setShowAccountConfirm] = useState(false);
  const [accountConfirmed, setAccountConfirmed] = useState(false);

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
    if (field === 'schoolName' || field === 'schoolLevel' || field === 'accountNumber' || field === 'bankName' || field === 'bankBranch') {
      setAccountConfirmed(false);
    }
    if (stepErrors[field]) {
      setStepErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  function handleChangeAccountInfo() {
    setShowAccountConfirm(false);
    setAccountConfirmed(false);
    wizard.updateField('bankBranch', '');
    wizard.updateField('bankName', '');
    wizard.updateField('accountNumber', '');
    setTimeout(() => {
      const el = document.getElementById('sch-bankBranch') || document.getElementById('sch-bankName');
      el?.focus();
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }

  function handleProceedAccountInfo() {
    setShowAccountConfirm(false);
    setAccountConfirmed(true);
    handleNext(true);
  }

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

  async function handleNext(bypassConfirm = false) {
    if (!profile || !user?.id) return;
    const key = wizard.currentStep?.key;
    setSubmitting(true);
    wizard.setError('');
    try {
      let stepPayload = {};

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
        stepPayload = patch;
        setProfile((prev) => ({ ...prev, ...patch }));

        try {
          const table = role === ACCOUNT_ROLE.PARENT ? 'parent_profiles' : 'student_profiles';
          await supabase.from(table).update(patch).eq('id', profile.id);
          await saveWizardStep({
            authUserId: user.id,
            ownerType: role,
            ownerId: profile.id,
            flowId,
            stepKey: key,
            payload: patch,
            completed: true
          });
        } catch (dbErr) {
          console.warn('DB step save fallback:', dbErr);
        }
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

        stepPayload = {
          parentFirstName: wizard.values.parentFirstName,
          parentMiddleName: wizard.values.parentMiddleName,
          parentLastName: wizard.values.parentLastName,
          parentRelationship: wizard.values.parentRelationship,
          parentPhone: wizard.values.parentPhone,
          parentNationalId: wizard.values.parentNationalId
        };

        try {
          await savePendingParentFromStudent({
            studentProfileId: profile.id,
            parent: {
              firstName: wizard.values.parentFirstName,
              middleName: wizard.values.parentMiddleName || null,
              lastName: wizard.values.parentLastName,
              relationship: wizard.values.parentRelationship,
              phone: wizard.values.parentPhone,
              nationalId: wizard.values.parentNationalId
            },
            documentsVerified: Boolean(wizard.files.parentIdFront && wizard.files.parentIdBack)
          });
          await saveWizardStep({
            authUserId: user.id,
            ownerType: role,
            ownerId: profile.id,
            flowId,
            stepKey: key,
            payload: stepPayload,
            completed: true
          });
        } catch (dbErr) {
          console.warn('DB parent save fallback:', dbErr);
        }
      }

      if (key === 'institution') {
        const check = validateForm(wizard.values, {
          schoolName: { label: 'School / Institution Name' },
          schoolLevel: { label: 'Institution Level' },
          admissionNumber: { label: 'Admission number or registration number' },
          bankBranch: { label: 'Bank branch' },
          bankName: { label: 'Bank name' },
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

        if (!bypassConfirm && !accountConfirmed) {
          setShowAccountConfirm(true);
          setSubmitting(false);
          return;
        }

        setStepErrors({});
        wizard.setError('');

        stepPayload = {
          schoolName: wizard.values.schoolName,
          schoolLevel: wizard.values.schoolLevel,
          admissionNumber: wizard.values.admissionNumber,
          bankName: wizard.values.bankName,
          bankBranch: wizard.values.bankBranch,
          accountNumber: wizard.values.accountNumber
        };

        try {
          await updateChildProfile(profile.id, {
            school_name: wizard.values.schoolName,
            school_level: wizard.values.schoolLevel,
            admission_number: wizard.values.admissionNumber
          });
          await mergeWizardCompleted('student_profiles', profile.id, {
            institution: {
              bankName: wizard.values.bankName,
              bankBranch: wizard.values.bankBranch,
              accountNumber: wizard.values.accountNumber
            }
          });
          await saveWizardStep({
            authUserId: user.id,
            ownerType: role,
            ownerId: profile.id,
            flowId,
            stepKey: key,
            payload: stepPayload,
            completed: true
          });
        } catch (dbErr) {
          console.warn('DB institution save fallback:', dbErr);
        }
      }

      if (key === 'home_details') {
        const check = validateForm(wizard.values, {
          location: { label: 'Location' },
          subLocation: { label: 'Sub-location' },
          village: { label: 'Village / Neighborhood' },
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

        stepPayload = {
          ward: wizard.values.ward || 'Tendeno/Sorget Ward',
          location: wizard.values.location,
          subLocation: wizard.values.subLocation,
          village: wizard.values.village || '',
          pollingStation: wizard.values.pollingStation,
          constituency: wizard.values.constituency || 'Kipkelion West',
          county: wizard.values.county || 'Kericho County',
          subCounty: wizard.values.subCounty || 'Kipkelion West'
        };

        try {
          if (role === ACCOUNT_ROLE.STUDENT) {
            await saveStudentHousehold(profile.id, stepPayload);
            await supabase.from('student_profiles').update({
              county: wizard.values.county || 'Kericho County',
              ward: wizard.values.ward || 'Tendeno/Sorget Ward',
              location_name: wizard.values.pollingStation || wizard.values.location || wizard.values.constituency
            }).eq('id', profile.id);
          } else {
            await saveParentHousehold(profile.id, stepPayload);
          }
          await saveWizardStep({
            authUserId: user.id,
            ownerType: role,
            ownerId: profile.id,
            flowId,
            stepKey: key,
            payload: stepPayload,
            completed: true
          });
        } catch (dbErr) {
          console.warn('DB home save fallback:', dbErr);
        }
      }

      if (key === 'family_details') {
        const familyCheck = validateFamilyData(wizard.values);
        if (Object.keys(familyCheck).length > 0) {
          setStepErrors(familyCheck);
          wizard.setError(Object.values(familyCheck)[0]);
          setTimeout(() => {
            const firstInvalid = document.querySelector('[aria-invalid="true"], .is-invalid, .field--invalid input, .field--invalid select');
            firstInvalid?.focus();
            firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 50);
          return;
        }

        setStepErrors({});
        wizard.setError('');

        stepPayload = {
          childrenInFamily: wizard.values.childrenInFamily,
          childrenInSchool: wizard.values.childrenInSchool || '',
          childrenPrimary: wizard.values.childrenPrimary || '',
          childrenSecondary: wizard.values.childrenSecondary || '',
          childrenTertiary: wizard.values.childrenTertiary || '',
          parentStatus: wizard.values.parentStatus,
          fatherOccupation: wizard.values.fatherOccupation || wizard.values.parentOccupation || '',
          motherOccupation: wizard.values.motherOccupation || '',
          guardianOccupation: wizard.values.guardianOccupation || '',
          monthlyIncome: wizard.values.monthlyIncome,
          disability: wizard.values.disability,
          disabilityNote: wizard.values.disabilityNote || '',
          otherBursary: wizard.values.otherBursary
        };

        try {
          if (role === ACCOUNT_ROLE.STUDENT) {
            await saveStudentHousehold(profile.id, stepPayload);
          } else {
            await saveParentHousehold(profile.id, stepPayload);
          }
          await saveWizardStep({
            authUserId: user.id,
            ownerType: role,
            ownerId: profile.id,
            flowId,
            stepKey: key,
            payload: stepPayload,
            completed: true
          });
        } catch (dbErr) {
          console.warn('DB family save fallback:', dbErr);
        }
      }

      setSaveStatus('success');
      await new Promise((r) => setTimeout(r, 600));
      setSaveStatus('idle');

      const nextCompleted = wizard.completedKeys.includes(key)
        ? wizard.completedKeys
        : [...wizard.completedKeys, key];
      wizard.setCompletedKeys?.(nextCompleted);
      sessionStorage.setItem(`wizard_completed_${flowId}`, JSON.stringify(nextCompleted));
      sessionStorage.setItem(`wizard_data_${flowId}`, JSON.stringify({ ...wizard.values, ...stepPayload }));

      // Signal on successful completion to check the information
      try {
        window.dispatchEvent(new CustomEvent('mcmca_registration_step_completed', {
          detail: { stepKey: key, flowId, completedKeys: nextCompleted }
        }));
      } catch {}

      const nextIncompleteIdx = steps.findIndex((s) => !nextCompleted.includes(s.key));
      if (nextIncompleteIdx >= 0) {
        wizard.setStepIndex(nextIncompleteIdx);
      } else {
        setDone(true);
      }
      return;
    } catch (err) {
      wizard.setError(err.message || 'Could not complete this step.');
    } finally {
      setSubmitting(false);
    }
  }

  const nextLabel = wizard.stepIndex >= steps.length - 1 ? 'Complete registration' : 'Complete step';

  function canSelectStep() {
    return true;
  }

  const wizardBody = (
    <>
      {bootError ? <p className="field__help">{bootError}</p> : null}
      {done ? (
        <div style={{
          padding: '40px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(15, 23, 42, 0.4)',
          borderRadius: 16,
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10B981',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 18,
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.3)'
          }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px 0', color: '#FFFFFF' }}>
            Registration Complete!
          </h2>
          <p style={{ fontSize: 14, color: '#94A3B8', maxWidth: 440, margin: '0 0 24px 0', lineHeight: 1.55 }}>
            All your registration steps have been saved successfully. You will now be redirected to the dashboard homepage.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                onFinished?.();
                onClose?.();
                if (role === ACCOUNT_ROLE.PARENT) {
                  navigate('/parent/applications');
                } else {
                  navigate('/student/applications');
                }
              }}
              style={{
                borderRadius: 999,
                padding: '12px 28px',
                fontWeight: 700,
                fontSize: 15,
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
              }}
            >
              See Application
            </button>
            <button
              type="button"
              className="btn btn--outline"
              onClick={() => {
                onFinished?.();
                onClose?.();
                if (role === ACCOUNT_ROLE.PARENT) {
                  navigate('/parent/dashboard');
                } else {
                  navigate('/student/dashboard');
                }
              }}
              style={{
                borderRadius: 999,
                padding: '12px 28px',
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer'
              }}
            >
              Go to Dashboard
            </button>
          </div>
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
                parentStatus={wizard.values.parentStatus || profile?.parentStatus}
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

      {/* Account Confirmation Popup Modal */}
      <AccountConfirmModal
        isOpen={showAccountConfirm}
        schoolName={wizard.values.schoolName}
        bankName={wizard.values.bankName}
        accountNumber={wizard.values.accountNumber}
        bankBranch={wizard.values.bankBranch}
        onChangeInformation={handleChangeAccountInfo}
        onProceed={handleProceedAccountInfo}
      />
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
