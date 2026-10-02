import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWizardSession } from '../../hooks/useWizardSession';
import { WIZARD_FLOW, validateForm } from '../../lib/accountAllocation';
import { getWizardSteps } from '../../lib/accountAllocation/wizardFlows';
import { mergeWizardCompleted, registerChildFromParent, updateChildFormDetails } from '../../lib/accountQueries';
import { WizardShell } from './WizardShell.jsx';
import { PersonalInfoFields } from './PersonalInfoFields.jsx';
import { InstitutionFields } from './InstitutionFields.jsx';

export function AddChildModal({ parent, child, onClose, onSaved }) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const steps = useMemo(() => getWizardSteps(WIZARD_FLOW.PARENT_ADD_CHILD), []);
  const editing = Boolean(child?.id);
  const seedValues = useMemo(() => {
    if (editing) {
      return {
        firstName: child.first_name || '',
        middleName: child.middle_name || '',
        lastName: child.last_name || '',
        gender: child.gender || '',
        dateOfBirth: child.date_of_birth || '',
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
    if (step?.key === 'personal_information') {
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
        const personal = {
          firstName: wizard.values.firstName,
          middleName: wizard.values.middleName,
          lastName: wizard.values.lastName,
          gender: wizard.values.gender,
          dateOfBirth: wizard.values.dateOfBirth
        };
        if (!editing) {
          await mergeWizardCompleted('parent_profiles', parent.id, { addChildDraft: personal });
        }
        await wizard.completeStep(step.key, personal);
      } catch (err) {
        wizard.setError(err.message || 'Could not save personal details.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const check = validateForm(wizard.values, {
      schoolName: { label: 'School or institution' },
      schoolLevel: { label: 'School level' },
      admissionNumber: { label: 'Admission number' }
    });
    if (!check.ok) {
      wizard.setError(Object.values(check.errors)[0]);
      return;
    }
    const personal = {
      firstName: wizard.values.firstName,
      middleName: wizard.values.middleName,
      lastName: wizard.values.lastName,
      gender: wizard.values.gender,
      dateOfBirth: wizard.values.dateOfBirth
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
        await wizard.completeStep('institution', institution);
        setNotice('Student details saved.');
      } else {
        const result = await registerChildFromParent({
          parentProfile: parent,
          authUserId: user.id,
          personal,
          institution
        });
        await mergeWizardCompleted('parent_profiles', parent.id, { addChildDraft: null });
        await wizard.completeStep('institution', institution);
        const applied = result.application?.ok
          ? ' The first bursary application was sent.'
          : result.application?.reason
            ? ` ${result.application.reason}`
            : '';
        setNotice(`Student record saved.${applied}`);
      }
      onSaved?.();
    } catch (err) {
      wizard.setError(err.message || 'Could not save this student.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-root modal-root--center" role="dialog" aria-modal="true" aria-labelledby="add-child-title">
      <button type="button" className="modal-root__backdrop" onClick={onClose} aria-label="Close" />
      <div className="modal-panel modal-panel--wizard">
        <div className="modal-panel__header">
          <h2 id="add-child-title" className="modal-panel__title">
            {editing ? 'Update student' : 'Add a child'}
          </h2>
          <button type="button" className="modal-panel__close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-panel__body">
          {notice ? (
            <>
              <p className="field__help" style={{ marginTop: 0 }}>{notice}</p>
              <button type="button" className="btn btn--primary" onClick={onClose} style={{ borderRadius: 999, width: 'auto' }}>
                Close
              </button>
            </>
          ) : (
            <WizardShell
              embedded
              description={editing
                ? 'Personal and institution details for this student. Home, family, and parent details stay on your account.'
                : 'Two steps. Home, family, and your details are copied onto this student, and the first application is sent.'}
              steps={steps}
              stepIndex={wizard.stepIndex}
              completedKeys={wizard.completedKeys}
              error={wizard.error}
              submitting={submitting || wizard.loading}
              nextLabel={wizard.stepIndex >= steps.length - 1 ? 'Save student' : 'Continue'}
              onBack={() => wizard.setStepIndex((index) => Math.max(0, index - 1))}
              onNext={handleNext}
            >
              {wizard.currentStep?.key === 'institution' ? (
                <InstitutionFields values={wizard.values} onChange={wizard.updateField} idPrefix="child-inst-" />
              ) : (
                <PersonalInfoFields values={wizard.values} onChange={wizard.updateField} includeContact={false} idPrefix="child-personal-" />
              )}
            </WizardShell>
          )}
        </div>
      </div>
    </div>
  );
}
