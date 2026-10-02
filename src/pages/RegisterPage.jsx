import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ACCOUNT_ROLE,
  DOCUMENT_KIND,
  WIZARD_FLOW,
  canSelfRegisterAsIndependent,
  joinFullName,
  validateForm
} from '../lib/accountAllocation';
import { getWizardSteps } from '../lib/accountAllocation/wizardFlows';
import {
  assignUserRole,
  createIndependentStudentAccount,
  createParentAccount,
  persistIdPair,
  registerAuthUser,
  savePendingParentFromStudent,
  saveWizardStep
} from '../lib/accountQueries';
import { useWizardSession } from '../hooks/useWizardSession';
import { WizardShell } from '../components/account/WizardShell.jsx';
import { PersonalInfoFields } from '../components/account/PersonalInfoFields.jsx';
import { ParentInfoFields } from '../components/account/ParentInfoFields.jsx';
import { IdentityScanStep } from '../components/account/IdentityScanStep.jsx';
import { supabase } from '../lib/supabase';

const DRAFT_OWNERS = {
  [ACCOUNT_ROLE.STUDENT]: 'anon-student',
  [ACCOUNT_ROLE.PARENT]: 'anon-parent'
};

function stripPassword(values) {
  const { password: _password, ...safe } = values;
  return safe;
}

export function RegisterPage() {
  const { refreshRole } = useAuth();
  const [role, setRole] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);
  const [finished, setFinished] = useState(false);

  const flowId = role === ACCOUNT_ROLE.PARENT
    ? WIZARD_FLOW.REGISTER_PARENT
    : WIZARD_FLOW.REGISTER_INDEPENDENT;
  const steps = useMemo(() => (role ? getWizardSteps(flowId) : []), [role, flowId]);
  const cacheOwnerKey = created?.profileId
    ? `${role}:${created.profileId}`
    : DRAFT_OWNERS[role] || 'anon';

  const wizard = useWizardSession({
    flowId,
    ownerType: role || 'anon',
    ownerId: created?.profileId || created?.userId,
    authUserId: created?.userId,
    steps,
    cacheOwnerKey,
    enabled: Boolean(role) && !finished
  });

  async function ensureAccount() {
    if (created) return created;
    const existing = await supabase.auth.getUser();
    let user = existing.data?.user || null;
    if (!user) {
      const registered = await registerAuthUser({
        email: wizard.values.email.trim(),
        password: wizard.values.password
      });
      user = registered.user;
    }
    await assignUserRole(user.id, role);
    await refreshRole?.();
    const profile = role === ACCOUNT_ROLE.PARENT
      ? await createParentAccount({ userId: user.id, email: wizard.values.email.trim(), fields: wizard.values })
      : await createIndependentStudentAccount({ userId: user.id, email: wizard.values.email.trim(), fields: wizard.values });
    const account = { userId: user.id, profileId: profile.id, profile };
    setCreated(account);
    return account;
  }

  async function handlePersonalStep() {
    const schema = {
      firstName: {},
      lastName: {},
      gender: { label: 'Gender' },
      dateOfBirth: {},
      email: {},
      phone: {},
      nationalId: {},
      password: {}
    };
    const check = validateForm(wizard.values, schema);
    if (!check.ok) {
      wizard.setError(Object.values(check.errors)[0]);
      return;
    }
    if (!wizard.files.idPhoto || !wizard.files.idBack) {
      wizard.setError('Add a photo of the front and the back of your ID.');
      return;
    }
    if (role === ACCOUNT_ROLE.STUDENT) {
      const eligibility = canSelfRegisterAsIndependent({
        dateOfBirth: wizard.values.dateOfBirth,
        nationalId: wizard.values.nationalId
      });
      if (!eligibility.allowed) {
        wizard.setError(eligibility.reason);
        return;
      }
    }

    setSubmitting(true);
    wizard.setError('');
    try {
      const account = await ensureAccount();
      const expected = {
        fullName: joinFullName(wizard.values),
        nationalId: wizard.values.nationalId
      };
      await persistIdPair({
        authUserId: account.userId,
        ownerType: role,
        ownerId: account.profileId,
        studentProfileId: role === ACCOUNT_ROLE.STUDENT ? account.profileId : null,
        expected,
        front: wizard.files.idPhoto,
        frontResult: wizard.verifications?.idPhoto,
        back: wizard.files.idBack,
        backResult: wizard.verifications?.idBack
      });

      const payload = stripPassword(wizard.values);
      await saveWizardStep({
        authUserId: account.userId,
        ownerType: role,
        ownerId: account.profileId,
        flowId,
        stepKey: 'personal_information',
        payload,
        completed: true
      });
      if (role === ACCOUNT_ROLE.STUDENT) {
        await saveWizardStep({
          authUserId: account.userId,
          ownerType: role,
          ownerId: account.profileId,
          flowId: WIZARD_FLOW.DASHBOARD_STUDENT,
          stepKey: 'personal_information',
          payload,
          completed: true
        });
      }
      const next = await wizard.completeStep('personal_information', payload, ['idPhoto', 'idBack']);
      if (role === ACCOUNT_ROLE.PARENT || next.complete) {
        await supabase.auth.signOut();
        setFinished(true);
      }
    } catch (err) {
      wizard.setError(err.message || 'Could not create the account.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleParentStep() {
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
    if (!wizard.files.parentIdFront || !wizard.files.parentIdBack) {
      wizard.setError('Add a photo of the front and the back of the parent ID.');
      return;
    }
    if (!created?.userId || !created?.profileId) {
      wizard.setError('Finish your details first.');
      return;
    }

    setSubmitting(true);
    wizard.setError('');
    try {
      await persistIdPair({
        authUserId: created.userId,
        ownerType: role,
        ownerId: created.profileId,
        studentProfileId: created.profileId,
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
      await savePendingParentFromStudent({
        studentProfileId: created.profileId,
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
      const payload = {
        parentFirstName: wizard.values.parentFirstName,
        parentMiddleName: wizard.values.parentMiddleName,
        parentLastName: wizard.values.parentLastName,
        parentRelationship: wizard.values.parentRelationship,
        parentPhone: wizard.values.parentPhone,
        parentNationalId: wizard.values.parentNationalId
      };
      await saveWizardStep({
        authUserId: created.userId,
        ownerType: role,
        ownerId: created.profileId,
        flowId: WIZARD_FLOW.DASHBOARD_STUDENT,
        stepKey: 'parent_information',
        payload,
        completed: true
      });
      await wizard.completeStep('parent_information', payload, ['parentIdFront', 'parentIdBack']);
      await supabase.auth.signOut();
      setFinished(true);
    } catch (err) {
      wizard.setError(err.message || 'Could not save parent details.');
    } finally {
      setSubmitting(false);
    }
  }

  if (finished) {
    return (
      <AuthFrame title="Account created" lead="Sign in to open your dashboard. You will finish the rest of registration from Forms.">
        <Link className="btn btn--primary" to="/login" style={{ borderRadius: 999, display: 'inline-flex', width: 'auto' }}>
          Sign in
        </Link>
      </AuthFrame>
    );
  }

  if (!role) {
    return (
      <AuthFrame title="Create an account" lead="Choose one. You can sign in after the account is created.">
        <div className="btn-row" style={{ flexDirection: 'column' }}>
          <button type="button" className="btn btn--primary" onClick={() => setRole(ACCOUNT_ROLE.STUDENT)}>
            I am a student
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => setRole(ACCOUNT_ROLE.PARENT)}>
            I am a parent
          </button>
        </div>
        <p className="field__help" style={{ textAlign: 'center' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </AuthFrame>
    );
  }

  const isParent = role === ACCOUNT_ROLE.PARENT;
  const title = isParent ? 'Parent account' : 'Student account';
  const lead = isParent
    ? 'Your details, then photos of both sides of your ID.'
    : 'Your details and ID, then your parent’s details and ID.';

  return (
    <AuthFrame title={title} lead={lead}>
      {wizard.loading ? (
        <p className="field__help">Restoring saved progress…</p>
      ) : (
        <WizardShell
          embedded
          steps={steps}
          stepIndex={wizard.stepIndex}
          error={wizard.error}
          submitting={submitting}
          nextLabel={wizard.currentStep?.key === 'parent_information' || isParent ? 'Create account' : 'Continue'}
          extraAction={
            <button type="button" className="btn btn--secondary" onClick={() => setRole(null)} style={{ borderRadius: 999, width: 'auto' }}>
              Back
            </button>
          }
          onBack={() => wizard.setStepIndex((i) => Math.max(0, i - 1))}
          onNext={wizard.currentStep?.key === 'parent_information' ? handleParentStep : handlePersonalStep}
        >
          {wizard.currentStep?.key === 'personal_information' ? (
            <>
              <PersonalInfoFields values={wizard.values} onChange={wizard.updateField} includeAuth idPrefix="reg-" />
              <IdentityScanStep
                values={wizard.values}
                files={wizard.files}
                onFile={wizard.updateFile}
                registeredName={joinFullName(wizard.values)}
                registeredId={wizard.values.nationalId}
              />
            </>
          ) : (
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
          )}
        </WizardShell>
      )}
      <p className="field__help" style={{ textAlign: 'center' }}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthFrame>
  );
}

function AuthFrame({ title, lead, children }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--background, #0B1120)', fontFamily: 'var(--font-body, sans-serif)',
      padding: 24
    }}>
      <div style={{
        width: '100%', maxWidth: 560, background: 'var(--surface-elevated, #1E293B)',
        borderRadius: 24, padding: 32, border: '1px solid var(--glass-border)'
      }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700, color: 'var(--text, #E2E8F0)' }}>{title}</h1>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-2, #94A3B8)', lineHeight: 1.5 }}>{lead}</p>
        {children}
      </div>
    </div>
  );
}
