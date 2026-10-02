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

export function CompleteRegistrationWizard({ open, onClose, onFinished, startAtKey = null, handoffOnComplete = false }) {
  const { user, role } = useAuth();
  const [profile, setProfile] = useState(null);
  const [pendingParent, setPendingParent] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
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

  useEffect(() => {
    let active = true;
    async function load() {
      if (!open || !user?.id || !role) return;
      setBootError('');
      setDone(false);
      try {
        const state = await fetchDashboardRegistrationState(user.id, role);
        if (!active) return;
        setProfile(state.profile);
        if (state.profile && role === ACCOUNT_ROLE.STUDENT) {
          const parents = await fetchLinkedParents(state.profile.id);
          const docs = await fetchIdentityDocuments(role, state.profile.id);
          if (!active) return;
          setPendingParent(parents[0] || null);
          setDocuments(docs);
        } else if (state.profile) {
          const docs = await fetchIdentityDocuments(role, state.profile.id);
          if (!active) return;
          setDocuments(docs);
        }
      } catch (err) {
        if (active) setBootError(err.message || 'Could not load your details.');
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
          wizard.setError(Object.values(check.errors)[0]);
          return;
        }
        if (!hasIdentityCardSides(documents)) {
          await persistIdPair({
            authUserId: user.id,
            ownerType: role,
            ownerId: profile.id,
            studentProfileId: role === ACCOUNT_ROLE.STUDENT ? profile.id : null,
            expected: {
              fullName: joinFullName(wizard.values),
              nationalId: wizard.values.nationalId
            },
            front: wizard.files.idPhoto,
            frontResult: wizard.verifications?.idPhoto,
            back: wizard.files.idBack,
            backResult: wizard.verifications?.idBack
          });
          await refreshDocuments();
        }
        const patch = {
          first_name: wizard.values.firstName.trim(),
          middle_name: wizard.values.middleName?.trim() || null,
          last_name: wizard.values.lastName.trim(),
          gender: wizard.values.gender,
          date_of_birth: wizard.values.dateOfBirth,
          phone_number: wizard.values.phone,
          national_id: wizard.values.nationalId
        };
        const updated = role === ACCOUNT_ROLE.PARENT
          ? await updateParentProfile(profile.id, patch)
          : await updateChildProfile(profile.id, patch);
        setProfile(updated);
        await wizard.completeStep('personal_information', {
          firstName: wizard.values.firstName,
          middleName: wizard.values.middleName,
          lastName: wizard.values.lastName,
          gender: wizard.values.gender,
          dateOfBirth: wizard.values.dateOfBirth,
          phone: wizard.values.phone,
          nationalId: wizard.values.nationalId
        }, ['idPhoto', 'idBack']);
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
          wizard.setError(Object.values(check.errors)[0]);
          return;
        }
        if (!hasParentIdSides(documents)) {
          await persistIdPair({
            authUserId: user.id,
            ownerType: role,
            ownerId: profile.id,
            studentProfileId: profile.id,
            expected: {
              fullName: joinFullName({
                firstName: wizard.values.parentFirstName,
                middleName: wizard.values.parentMiddleName,
                lastName: wizard.values.parentLastName
              }),
              nationalId: wizard.values.parentNationalId
            },
            front: wizard.files.parentIdFront,
            frontResult: wizard.verifications?.parentIdFront,
            back: wizard.files.parentIdBack,
            backResult: wizard.verifications?.parentIdBack,
            frontKind: DOCUMENT_KIND.PARENT_ID_FRONT,
            backKind: DOCUMENT_KIND.PARENT_ID_BACK
          });
          await refreshDocuments();
        }
        await savePendingParentFromStudent({
          studentProfileId: profile.id,
          parent: {
            firstName: wizard.values.parentFirstName,
            middleName: wizard.values.parentMiddleName,
            lastName: wizard.values.parentLastName,
            relationship: wizard.values.parentRelationship,
            phone: wizard.values.parentPhone,
            nationalId: wizard.values.parentNationalId
          },
          documentsVerified: true
        });
        await wizard.completeStep('parent_information', {
          parentFirstName: wizard.values.parentFirstName,
          parentMiddleName: wizard.values.parentMiddleName,
          parentLastName: wizard.values.parentLastName,
          parentRelationship: wizard.values.parentRelationship,
          parentPhone: wizard.values.parentPhone,
          parentNationalId: wizard.values.parentNationalId
        }, ['parentIdFront', 'parentIdBack']);
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
          wizard.setError(Object.values(check.errors)[0]);
          return;
        }
        const institution = {
          bankName: wizard.values.bankName || '',
          bankBranch: wizard.values.bankBranch || '',
          accountNumber: wizard.values.accountNumber || ''
        };
        await mergeWizardCompleted('student_profiles', profile.id, { institution });
        const updated = await updateChildProfile(profile.id, {
          school_name: wizard.values.schoolName.trim(),
          school_level: wizard.values.schoolLevel,
          admission_number: wizard.values.admissionNumber.trim()
        });
        setProfile({ ...updated, wizard_completed: { ...(updated.wizard_completed || {}), institution } });
        await wizard.completeStep('institution', {
          schoolName: wizard.values.schoolName,
          schoolLevel: wizard.values.schoolLevel,
          admissionNumber: wizard.values.admissionNumber,
          bankName: wizard.values.bankName,
          bankBranch: wizard.values.bankBranch,
          accountNumber: wizard.values.accountNumber
        });
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
          wizard.setError(Object.values(check.errors)[0]);
          return;
        }
        const household = {
          ...readHousehold(profile),
          constituency: wizard.values.constituency.trim(),
          ward: wizard.values.ward.trim(),
          county: wizard.values.county.trim(),
          subCounty: wizard.values.subCounty.trim(),
          pollingStation: wizard.values.pollingStation.trim()
        };
        const updated = role === ACCOUNT_ROLE.PARENT
          ? { ...profile, wizard_completed: await saveParentHousehold(profile.id, user.id, household) }
          : await saveStudentHousehold(profile.id, household);
        setProfile(updated);
        await wizard.completeStep('home_details', {
          constituency: household.constituency,
          ward: household.ward,
          county: household.county,
          subCounty: household.subCounty,
          pollingStation: household.pollingStation
        });
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
          wizard.setError(Object.values(check.errors)[0]);
          return;
        }
        if (wizard.values.disability === 'yes' && !String(wizard.values.disabilityNote || '').trim()) {
          wizard.setError('Describe the disability and the support needed.');
          return;
        }
        const household = {
          ...readHousehold(profile),
          childrenInFamily: wizard.values.childrenInFamily,
          childrenInSchool: wizard.values.childrenInSchool,
          childrenPrimary: wizard.values.childrenPrimary,
          childrenSecondary: wizard.values.childrenSecondary,
          childrenTertiary: wizard.values.childrenTertiary,
          parentStatus: wizard.values.parentStatus,
          fatherOccupation: wizard.values.fatherOccupation,
          motherOccupation: wizard.values.motherOccupation,
          monthlyIncome: wizard.values.monthlyIncome,
          disability: wizard.values.disability,
          disabilityNote: wizard.values.disabilityNote,
          otherBursary: wizard.values.otherBursary
        };
        const updated = role === ACCOUNT_ROLE.PARENT
          ? { ...profile, wizard_completed: await saveParentHousehold(profile.id, user.id, household) }
          : await saveStudentHousehold(profile.id, household);
        setProfile(updated);
        const alreadyDone = wizard.allComplete;
        const next = await wizard.completeStep('family_details', household);
        if (next.complete && !alreadyDone) {
          const docs = await refreshDocuments();
          const activation = await activateOwnerAccount({
            role,
            profile: updated,
            documents: docs,
            identityMatchOk: hasIdentityCardSides(docs)
          });
          if (role === ACCOUNT_ROLE.PARENT && activation.ok && activation.profile) {
            await linkIndependentParentsOnActivation(activation.profile);
          }
          if (handoffOnComplete) {
            onFinished?.();
            return;
          }
          setDone(true);
          onFinished?.();
        }
      }
    } catch (err) {
      wizard.setError(err.message || 'Could not save this step.');
    } finally {
      setSubmitting(false);
    }
  }

  const nextLabel = wizard.stepIndex >= steps.length - 1 ? 'Save' : 'Continue';

  function canSelectStep(index) {
    if (wizard.allComplete) return true;
    return index <= wizard.stepIndex || wizard.completedKeys.includes(steps[index]?.key);
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
          {bootError ? <p className="field__help">{bootError}</p> : null}
          {done ? (
            <>
              <p className="field__help" style={{ marginTop: 0 }}>Your details are saved.</p>
              <button type="button" className="btn btn--primary" onClick={onClose} style={{ borderRadius: 999, width: 'auto' }}>
                Close
              </button>
            </>
          ) : wizard.loading || !profile ? (
            <p className="field__help">Loading your details…</p>
          ) : (
            <WizardShell
              embedded
              steps={steps}
              stepIndex={wizard.stepIndex}
              error={wizard.error}
              submitting={submitting}
              nextLabel={nextLabel}
              onBack={() => wizard.setStepIndex((i) => Math.max(0, i - 1))}
              onNext={handleNext}
              onStepSelect={(index) => {
                if (canSelectStep(index)) wizard.setStepIndex(index);
              }}
              canSelectStep={canSelectStep}
              completedKeys={wizard.completedKeys}
            >
              {wizard.currentStep?.key === 'personal_information' ? (
                <>
                  <PersonalInfoFields values={wizard.values} onChange={wizard.updateField} idPrefix="dash-" />
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
                  <ParentInfoFields values={wizard.values} onChange={wizard.updateField} />
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
                <InstitutionFields values={wizard.values} onChange={wizard.updateField} />
              ) : null}
              {wizard.currentStep?.key === 'home_details' ? (
                <HomeFields values={wizard.values} onChange={wizard.updateField} idPrefix="dash-home-" />
              ) : null}
              {wizard.currentStep?.key === 'family_details' ? (
                <FamilyFields values={wizard.values} onChange={wizard.updateField} idPrefix="dash-fam-" />
              ) : null}
            </WizardShell>
          )}
        </div>
      </div>
    </div>
  );
}
