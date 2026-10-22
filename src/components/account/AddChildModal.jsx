import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWizardSession } from '../../hooks/useWizardSession';
import { WIZARD_FLOW, validateForm, joinFullName } from '../../lib/accountAllocation';
import { getWizardSteps } from '../../lib/accountAllocation/wizardFlows';
import { mergeWizardCompleted, registerChildFromParent, updateChildFormDetails } from '../../lib/accountQueries';
import { WizardShell } from './WizardShell.jsx';
import { PersonalInfoFields } from './PersonalInfoFields.jsx';
import { InstitutionFields } from './InstitutionFields.jsx';
import { VerifiedField } from './VerifiedField.jsx';
import { Icon } from '../Icon.jsx';

export function AddChildModal({ parent, child, existingChildren = [], onClose, onSaved }) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const steps = useMemo(() => getWizardSteps(WIZARD_FLOW.PARENT_ADD_CHILD), []);
  const editing = Boolean(child?.id);

  const household = parent?.wizard_completed?.household || {};
  const parentName = joinFullName({
    firstName: parent?.first_name,
    middleName: parent?.middle_name,
    lastName: parent?.last_name
  }) || 'Parent';

  const seedValues = useMemo(() => {
    if (editing) {
      return {
        firstName: child.first_name || '',
        middleName: child.middle_name || '',
        lastName: child.last_name || '',
        gender: child.gender || '',
        dateOfBirth: child.date_of_birth || '',
        birthCertificateNumber: child.birth_certificate_number || '',
        schoolName: child.school_name || '',
        schoolLevel: child.school_level || '',
        admissionNumber: child.admission_number || '',
        bankName: child.wizard_completed?.institution?.bankName || '',
        bankBranch: child.wizard_completed?.institution?.bankBranch || '',
        accountNumber: child.wizard_completed?.institution?.accountNumber || ''
      };
    }
    return parent?.wizard_completed?.addChildDraft || null;
  }, [editing, child, parent]);

  const wizard = useWizardSession({
    flowId: WIZARD_FLOW.PARENT_ADD_CHILD,
    ownerType: 'parent',
    ownerId: null,
    authUserId: user?.id,
    steps,
    cacheOwnerKey: parent?.id
      ? `parent:${parent.id}:${editing ? `child:${child.id}` : 'add-child'}`
      : 'parent-add-child',
    enabled: Boolean(parent?.id),
    seedValues
  });

  async function handleNext() {
    if (!parent || !user?.id) return;
    const step = wizard.currentStep;
    wizard.setError('');

    // STEP 1: Personal details (Specific to child)
    if (step?.key === 'personal_information') {
      if (!editing && existingChildren?.some(c => !c.school_name || (!c.admission_number && !c.birth_certificate_number))) {
        wizard.setError('You must finish adding the current child before adding another student.');
        return;
      }
      const check = validateForm(wizard.values, {
        firstName: {},
        lastName: {},
        gender: { label: 'Gender' },
        dateOfBirth: {},
        birthCertificateNumber: { label: 'Birth Certificate Number' }
      });
      if (!check.ok) {
        wizard.setError(Object.values(check.errors)[0]);
        return;
      }
      const personal = {
        firstName: wizard.values.firstName,
        middleName: wizard.values.middleName || '',
        lastName: wizard.values.lastName,
        gender: wizard.values.gender,
        dateOfBirth: wizard.values.dateOfBirth,
        birthCertificateNumber: wizard.values.birthCertificateNumber
      };
      if (!editing) {
        try {
          await mergeWizardCompleted('parent_profiles', parent.id, { addChildDraft: personal });
        } catch {}
      }
      await wizard.completeStep(step.key, personal);
      wizard.setStepIndex(1);
      return;
    }

    // STEP 2: Institution details (Specific to child)
    if (step?.key === 'institution') {
      const check = validateForm(wizard.values, {
        schoolName: { label: 'School or institution' },
        schoolLevel: { label: 'School level' },
        admissionNumber: { label: 'Admission number' }
      });
      if (!check.ok) {
        wizard.setError(Object.values(check.errors)[0]);
        return;
      }
      const institution = {
        schoolName: wizard.values.schoolName,
        schoolLevel: wizard.values.schoolLevel,
        admissionNumber: wizard.values.admissionNumber,
        bankName: wizard.values.bankName || '',
        bankBranch: wizard.values.bankBranch || '',
        accountNumber: wizard.values.accountNumber || ''
      };
      await wizard.completeStep('institution', institution);
      wizard.setStepIndex(2);
      return;
    }

    // STEP 3: Documents (Specific to child)
    if (step?.key === 'documents') {
      if (!editing && !wizard.files.birthCertificate && !child?.birth_certificate_number) {
        wizard.setError('Please upload the student Birth Certificate document or photo.');
        return;
      }

      const personal = {
        firstName: wizard.values.firstName,
        middleName: wizard.values.middleName || '',
        lastName: wizard.values.lastName,
        gender: wizard.values.gender,
        dateOfBirth: wizard.values.dateOfBirth,
        birthCertificateNumber: wizard.values.birthCertificateNumber
      };
      const institution = {
        schoolName: wizard.values.schoolName,
        schoolLevel: wizard.values.schoolLevel,
        admissionNumber: wizard.values.admissionNumber,
        bankName: wizard.values.bankName || '',
        bankBranch: wizard.values.bankBranch || '',
        accountNumber: wizard.values.accountNumber || ''
      };

      setSubmitting(true);
      try {
        if (editing) {
          await updateChildFormDetails({
            studentId: child.id,
            authUserId: user.id,
            personal,
            institution
          });
          await wizard.completeStep('documents', {
            birthCertificateUploaded: Boolean(wizard.files.birthCertificate || child?.birth_certificate_number),
            feeStructureUploaded: Boolean(wizard.files.feeStructure)
          });
          setNotice('Student details and documents saved.');
        } else {
          const result = await registerChildFromParent({
            parentProfile: parent,
            authUserId: user.id,
            personal,
            institution
          });
          await mergeWizardCompleted('parent_profiles', parent.id, { addChildDraft: null });
          await wizard.completeStep('documents', {
            birthCertificateUploaded: Boolean(wizard.files.birthCertificate),
            feeStructureUploaded: Boolean(wizard.files.feeStructure)
          });
          const applied = result.application?.ok
            ? ' The bursary application was linked and submitted.'
            : result.application?.reason
              ? ` ${result.application.reason}`
              : '';
          setNotice(`Student record created with pre-filled household info.${applied}`);
        }
        onSaved?.();
      } catch (err) {
        wizard.setError(err.message || 'Could not save this student.');
      } finally {
        setSubmitting(false);
      }
    }
  }

  return (
    <div className="modal-root modal-root--center" role="dialog" aria-modal="true" aria-labelledby="add-child-title">
      <button type="button" className="modal-root__backdrop" onClick={onClose} aria-label="Close" />
      <div className="modal-panel modal-panel--wizard">
        <div className="modal-panel__header">
          <h2 id="add-child-title" className="modal-panel__title">
            {editing ? 'Update student record' : 'Add a child'}
          </h2>
          <button type="button" className="modal-panel__close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-panel__body">
          {/* General Information pre-put summary banner */}
          <div style={{
            margin: '0 0 16px',
            padding: '12px 16px',
            borderRadius: 10,
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontSize: '0.84rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontWeight: 600, marginBottom: 4 }}>
              <Icon name="approved" size={16} />
              General Household Information (Pre-filled from your parent account)
            </div>
            <div style={{ color: 'var(--text-muted, #94a3b8)', lineHeight: 1.4 }}>
              Ward: <strong>{household.ward || parent?.ward || 'Tendeno/Sorget Ward'}</strong>
              {household.location ? <> · Location: <strong>{household.location}</strong></> : null}
              {household.subLocation ? <> · Sub-Location: <strong>{household.subLocation}</strong></> : null}
              {household.pollingStation ? <> · Polling: <strong>{household.pollingStation}</strong></> : null}
              <> · Parent: <strong>{parentName}</strong></>
            </div>
          </div>

          {notice ? (
            <>
              <p className="field__help" style={{ marginTop: 0, color: '#10b981', fontWeight: 600 }}>{notice}</p>
              <button type="button" className="btn btn--primary" onClick={onClose} style={{ borderRadius: 999, width: 'auto' }}>
                Close
              </button>
            </>
          ) : (
            <WizardShell
              embedded
              description={
                editing
                  ? 'Three student-specific steps: Personal details, Institution, and Documents. General family & home information stay pre-filled from your parent account.'
                  : 'Three steps specific to this child. Your general household, home location, and family details are already pre-filled.'
              }
              steps={steps}
              stepIndex={wizard.stepIndex}
              completedKeys={wizard.completedKeys}
              error={wizard.error}
              submitting={submitting || wizard.loading}
              nextLabel={wizard.stepIndex >= steps.length - 1 ? 'Save & submit student' : 'Continue'}
              onBack={() => wizard.setStepIndex((index) => Math.max(0, index - 1))}
              onNext={handleNext}
            >
              {/* STEP 1: Personal Details */}
              {wizard.currentStep?.key === 'personal_information' ? (
                <>
                  <PersonalInfoFields
                    values={wizard.values}
                    onChange={wizard.updateField}
                    includeContact={false}
                    idPrefix="child-personal-"
                  />
                  <VerifiedField
                    id="child-personal-birthCertificateNumber"
                    name="birthCertificateNumber"
                    label="Birth Certificate Number *"
                    value={wizard.values.birthCertificateNumber}
                    error={wizard.errors?.birthCertificateNumber}
                    onChange={(v) => wizard.updateField('birthCertificateNumber', v)}
                    placeholder="e.g. BC12345678"
                    required
                  />
                </>
              ) : null}

              {/* STEP 2: Institution */}
              {wizard.currentStep?.key === 'institution' ? (
                <InstitutionFields
                  values={wizard.values}
                  onChange={wizard.updateField}
                  idPrefix="child-inst-"
                />
              ) : null}

              {/* STEP 3: Documents */}
              {wizard.currentStep?.key === 'documents' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="field">
                    <label htmlFor="child-birth-cert-upload">
                      Student Birth Certificate or Student ID *
                    </label>
                    <input
                      id="child-birth-cert-upload"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          wizard.updateFile('birthCertificate', file);
                        }
                      }}
                    />
                    <p className="field__help">
                      {wizard.files.birthCertificate
                        ? `Selected: ${wizard.files.birthCertificate.name}`
                        : child?.birth_certificate_number
                          ? 'Birth certificate is already on file. You can attach a replacement scan here.'
                          : 'Attach a clear photo or PDF scan of the official birth certificate.'}
                    </p>
                  </div>

                  <div className="field">
                    <label htmlFor="child-fee-structure-upload">
                      Fee Structure or Admission Letter (Optional / Recommended)
                    </label>
                    <input
                      id="child-fee-structure-upload"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          wizard.updateFile('feeStructure', file);
                        }
                      }}
                    />
                    <p className="field__help">
                      {wizard.files.feeStructure
                        ? `Selected: ${wizard.files.feeStructure.name}`
                        : 'Upload latest fee statement or official school admission letter.'}
                    </p>
                  </div>
                </div>
              ) : null}
            </WizardShell>
          )}
        </div>
      </div>
    </div>
  );
}
