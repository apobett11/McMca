import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ParentLayout } from '../components/ParentLayout.jsx';
import { WizardShell } from '../../../components/account/WizardShell.jsx';
import { PersonalInfoFields } from '../../../components/account/PersonalInfoFields.jsx';
import { VerifiedField } from '../../../components/account/VerifiedField.jsx';
import { DocumentScanField } from '../../../components/account/DocumentScanField.jsx';
import { useAuth } from '../../../context/AuthContext';
import { useWizardSession } from '../../../hooks/useWizardSession';
import {
  DOCUMENT_KIND,
  EDUCATION_LEVEL_LABEL,
  WIZARD_FLOW,
  allocateStudentClassFromEducation,
  describeAllocatedClass,
  joinFullName,
  validateForm
} from '../../../lib/accountAllocation';
import { educationLevelOptions, getWizardSteps } from '../../../lib/accountAllocation/wizardFlows';
import {
  createChildForParent,
  fetchParentAccount,
  persistVerifiedIdentityDocument,
  saveWizardStep
} from '../../../lib/accountQueries';
import { UPLOAD_KIND } from '../../../lib/documentUpload';

export function ParentAddChildPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [parent, setParent] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const steps = useMemo(() => getWizardSteps(WIZARD_FLOW.PARENT_ADD_CHILD), []);
  const wizard = useWizardSession({
    flowId: WIZARD_FLOW.PARENT_ADD_CHILD,
    ownerType: 'parent',
    ownerId: parent?.id,
    authUserId: user?.id,
    steps,
    cacheOwnerKey: parent?.id ? `parent:${parent.id}:add-child` : 'parent-add-child',
    enabled: Boolean(parent?.id)
  });

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user?.id) return;
      const profile = await fetchParentAccount(user.id);
      if (active) setParent(profile);
    }
    load();
    return () => { active = false; };
  }, [user?.id]);

  const allocation = wizard.values.educationLevel
    ? allocateStudentClassFromEducation(wizard.values.educationLevel)
    : null;

  async function handleNext() {
    const step = wizard.currentStep;
    if (!step || !parent || !user?.id) return;
    wizard.setError('');

    if (step.key === 'personal_information') {
      const check = validateForm(wizard.values, {
        firstName: {},
        lastName: {},
        gender: { label: 'Gender' },
        dateOfBirth: {}
      });
      if (!check.ok) {
        wizard.setError(Object.values(check.errors)[0]);
        return;
      }
      setSubmitting(true);
      try {
        await saveWizardStep({
          authUserId: user.id,
          ownerType: 'parent',
          ownerId: parent.id,
          flowId: WIZARD_FLOW.PARENT_ADD_CHILD,
          stepKey: step.key,
          payload: {
            firstName: wizard.values.firstName,
            middleName: wizard.values.middleName,
            lastName: wizard.values.lastName,
            gender: wizard.values.gender,
            dateOfBirth: wizard.values.dateOfBirth
          }
        });
        await wizard.completeStep(step.key, {
          firstName: wizard.values.firstName,
          lastName: wizard.values.lastName,
          gender: wizard.values.gender,
          dateOfBirth: wizard.values.dateOfBirth,
          middleName: wizard.values.middleName
        });
      } catch (err) {
        wizard.setError(err.message || 'Could not save this step.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (step.key === 'birth_certificate') {
      const file = wizard.files.birthCertificatePhoto;
      const check = validateForm(wizard.values, {
        birthCertificateNumber: {},
        certificateName: {}
      });
      if (!check.ok) {
        wizard.setError(Object.values(check.errors)[0]);
        return;
      }
      if (!file) {
        wizard.setError('Upload a clear photo of the birth certificate.');
        return;
      }
      if (!wizard.verifications?.birthCertificatePhoto?.ok) {
        wizard.setError('The birth certificate photo must be read and matched before this step can be saved.');
        return;
      }
      setSubmitting(true);
      try {
        await wizard.completeStep(step.key, {
          birthCertificateNumber: wizard.values.birthCertificateNumber,
          certificateName: wizard.values.certificateName,
          birthCertVerified: true
        }, []);
      } catch (err) {
        wizard.setError(err.message || 'Could not save the birth certificate step.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (step.key === 'education_level') {
      if (!allocation?.ok) {
        wizard.setError(allocation?.reason || 'Select a level of education.');
        return;
      }
      const file = wizard.files.birthCertificatePhoto;
      if (!file) {
        wizard.setError('The birth certificate photo is still needed. Return to the previous step.');
        return;
      }
      setSubmitting(true);
      try {
        const expected = {
          fullName: joinFullName(wizard.values),
          certificateName: wizard.values.certificateName || joinFullName(wizard.values),
          certificateNumber: wizard.values.birthCertificateNumber
        };
        const student = await createChildForParent({
          parentProfile: parent,
          fields: wizard.values,
          educationLevel: wizard.values.educationLevel
        });
        await persistVerifiedIdentityDocument({
          authUserId: user.id,
          ownerType: 'student',
          ownerId: student.id,
          studentProfileId: student.id,
          documentKind: DOCUMENT_KIND.BIRTH_CERTIFICATE,
          file,
          expected,
          matchResult: wizard.verifications?.birthCertificatePhoto
        });
        await saveWizardStep({
          authUserId: user.id,
          ownerType: 'parent',
          ownerId: parent.id,
          flowId: WIZARD_FLOW.PARENT_ADD_CHILD,
          stepKey: step.key,
          payload: {
            studentId: student.id,
            educationLevel: wizard.values.educationLevel,
            studentClass: allocation.studentClass
          }
        });
        await wizard.completeStep(step.key, { studentId: student.id }, ['birthCertificatePhoto']);
        navigate(`/parent/children/${student.id}`);
      } catch (err) {
        wizard.setError(err.message || 'Could not add this student.');
      } finally {
        setSubmitting(false);
      }
    }
  }

  return (
    <ParentLayout pageTitle="Add a child" parentName={parent ? joinFullName({ firstName: parent.first_name, middleName: parent.middle_name, lastName: parent.last_name }) : ''}>
      <Link className="back-link" to="/parent/dashboard">
        Back to home
      </Link>
      {wizard.loading || !parent ? (
        <p>Restoring saved progress…</p>
      ) : (
        <WizardShell
          title="Add a child"
          description="Students under 18 are registered here. Personal details, a clear birth certificate, and education level are required. Education level assigns custody or delegated — that category stays locked."
          steps={steps}
          stepIndex={wizard.stepIndex}
          error={wizard.error}
          submitting={submitting}
          nextLabel={wizard.currentStep?.key === 'education_level' ? 'Add to children list' : 'Save and continue'}
          onBack={() => wizard.setStepIndex((i) => Math.max(0, i - 1))}
          onNext={handleNext}
        >
          {wizard.currentStep?.key === 'personal_information' ? (
            <PersonalInfoFields values={wizard.values} onChange={wizard.updateField} idPrefix="child-" />
          ) : null}

          {wizard.currentStep?.key === 'birth_certificate' ? (
            <>
              <VerifiedField
                name="birthCertificateNumber"
                label="Birth certificate number"
                value={wizard.values.birthCertificateNumber}
                onChange={(v) => wizard.updateField('birthCertificateNumber', v)}
              />
              <VerifiedField
                name="certificateName"
                label="Name as printed on the birth certificate"
                value={wizard.values.certificateName}
                onChange={(v) => wizard.updateField('certificateName', v)}
              />
              <DocumentScanField
                id="birthCertificatePhoto"
                label="Clear photo of the birth certificate"
                file={wizard.files.birthCertificatePhoto}
                kind={UPLOAD_KIND.BIRTH_CERTIFICATE}
                expected={{
                  fullName: joinFullName(wizard.values),
                  certificateName: wizard.values.certificateName || joinFullName(wizard.values),
                  certificateNumber: wizard.values.birthCertificateNumber
                }}
                onFile={(file, verification) => wizard.updateFile('birthCertificatePhoto', file, verification)}
              />
            </>
          ) : null}

          {wizard.currentStep?.key === 'education_level' ? (
            <>
              <div className="field">
                <label htmlFor="educationLevel">Level of education</label>
                <select
                  id="educationLevel"
                  value={wizard.values.educationLevel || ''}
                  onChange={(e) => wizard.updateField('educationLevel', e.target.value)}
                  required
                >
                  <option value="">Select</option>
                  {educationLevelOptions().map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {allocation?.ok ? (
                <div className="notice">
                  <strong>{EDUCATION_LEVEL_LABEL[wizard.values.educationLevel]}</strong>
                  <p>{describeAllocatedClass(allocation.studentClass)}</p>
                  <p>This category will not change unless an administrator updates it.</p>
                </div>
              ) : null}
            </>
          ) : null}
        </WizardShell>
      )}
    </ParentLayout>
  );
}
