import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ParentLayout } from '../components/ParentLayout.jsx';
import { WizardShell } from '../../../components/account/WizardShell.jsx';
import { VerifiedField } from '../../../components/account/VerifiedField.jsx';
import { useAuth } from '../../../context/AuthContext';
import { useWizardSession } from '../../../hooks/useWizardSession';
import {
  STUDENT_CLASS,
  WIZARD_FLOW,
  describeAllocatedClass,
  describeParentControl,
  getParentControlMode
} from '../../../lib/accountAllocation';
import { getWizardSteps } from '../../../lib/accountAllocation/wizardFlows';
import { fetchParentChildren, updateChildProfile } from '../../../lib/accountQueries';

export function ParentChildWizardPage() {
  const { childId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [child, setChild] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const steps = useMemo(
    () => getWizardSteps(WIZARD_FLOW.CHILD_PROFILE, { studentClass: child?.account_class }),
    [child?.account_class]
  );

  const wizard = useWizardSession({
    flowId: WIZARD_FLOW.CHILD_PROFILE,
    ownerType: 'student',
    ownerId: childId,
    authUserId: user?.id,
    steps,
    cacheOwnerKey: `child:${childId}`,
    enabled: Boolean(childId && user?.id)
  });

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user?.id) return;
      const children = await fetchParentChildren(user.id);
      const found = children.find((row) => row.id === childId);
      if (!active) return;
      if (!found) {
        navigate('/parent/dashboard');
        return;
      }
      setChild(found);
    }
    load();
    return () => { active = false; };
  }, [user?.id, childId, navigate]);

  async function handleNext() {
    if (!child) return;
    const step = wizard.currentStep;
    setSubmitting(true);
    wizard.setError('');
    try {
      if (step.key === 'school') {
        await updateChildProfile(child.id, {
          school_name: wizard.values.schoolName,
          admission_number: wizard.values.admissionNumber,
          institution_code: wizard.values.grade
        });
        await wizard.completeStep('school', {
          schoolName: wizard.values.schoolName,
          grade: wizard.values.grade,
          admissionNumber: wizard.values.admissionNumber
        });
      } else if (step.key === 'contacts') {
        await updateChildProfile(child.id, {
          email: wizard.values.email || null,
          phone_number: wizard.values.phone || null
        });
        await wizard.completeStep('contacts', {
          email: wizard.values.email,
          phone: wizard.values.phone
        });
      } else if (step.key === 'delegated_login') {
        await updateChildProfile(child.id, { email: wizard.values.email || child.email });
        await wizard.completeStep('delegated_login', { email: wizard.values.email, loginRequested: true });
      }
    } catch (err) {
      wizard.setError(err.message || 'Could not save this step.');
    } finally {
      setSubmitting(false);
    }
  }

  const control = child ? getParentControlMode(child.account_class) : null;
  const name = child ? [child.first_name, child.middle_name, child.last_name].filter(Boolean).join(' ') : 'Student';

  return (
    <ParentLayout pageTitle={name}>
      <Link className="back-link" to="/parent/dashboard">Back to children</Link>
      {child ? (
        <div className="notice" style={{ marginBottom: 16 }}>
          <strong>{describeAllocatedClass(child.account_class)}</strong>
          <p>{describeParentControl(control)}</p>
          {child.account_class === STUDENT_CLASS.CUSTODY
            ? <p>You apply and update documents for this student. They do not have a student login.</p>
            : <p>This student can use their own dashboard. You can still view the full account and keep control.</p>}
        </div>
      ) : null}

      {wizard.loading || !child ? (
        <p>Restoring saved progress…</p>
      ) : wizard.allComplete ? (
        <div className="wizard-panel">
          <h2>Student record is up to date</h2>
          <p className="field__help">Completed steps stay saved. Open applications or documents from the parent dashboard to continue.</p>
          <Link className="btn btn--primary" to="/parent/applications" style={{ borderRadius: 999, width: 'auto' }}>View applications</Link>
        </div>
      ) : (
        <WizardShell
          title={`Update ${name}`}
          description="Each finished step is stored on the account. An interrupted step is restored from cache so you never start over."
          steps={steps}
          stepIndex={wizard.stepIndex}
          error={wizard.error}
          submitting={submitting}
          onBack={() => wizard.setStepIndex((i) => Math.max(0, i - 1))}
          onNext={handleNext}
        >
          {wizard.currentStep?.key === 'school' ? (
            <>
              <VerifiedField name="schoolName" label="School / institution" value={wizard.values.schoolName || child.school_name || ''} onChange={(v) => wizard.updateField('schoolName', v)} />
              <VerifiedField name="grade" label="Grade / form / year" value={wizard.values.grade || child.institution_code || ''} onChange={(v) => wizard.updateField('grade', v)} />
              <VerifiedField name="admissionNumber" label="Admission number" value={wizard.values.admissionNumber || child.admission_number || ''} onChange={(v) => wizard.updateField('admissionNumber', v)} />
            </>
          ) : null}
          {wizard.currentStep?.key === 'contacts' ? (
            <>
              <VerifiedField name="email" label="Email" required={child.account_class === STUDENT_CLASS.DELEGATED} type="email" value={wizard.values.email || child.email || ''} onChange={(v) => wizard.updateField('email', v)} />
              <VerifiedField name="phone" label="Phone number" required={false} value={wizard.values.phone || child.phone_number || ''} onChange={(v) => wizard.updateField('phone', v)} />
            </>
          ) : null}
          {wizard.currentStep?.key === 'delegated_login' ? (
            <>
              <p className="field__help">Delegated students receive their own dashboard login. Save the email they will use. Password provisioning is completed by the account service; this step is stored so it is not asked again.</p>
              <VerifiedField name="email" label="Student login email" type="email" value={wizard.values.email} onChange={(v) => wizard.updateField('email', v)} />
              <VerifiedField name="password" label="Temporary password" type="password" value={wizard.values.password} onChange={(v) => wizard.updateField('password', v)} />
            </>
          ) : null}
        </WizardShell>
      )}
    </ParentLayout>
  );
}
