import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ACCOUNT_ROLE,
  DOCUMENT_KIND,
  STUDENT_CLASS,
  WIZARD_FLOW,
  canSelfRegisterAsIndependent,
  joinFullName,
  validateForm
} from '../lib/accountAllocation';
import { getWizardSteps } from '../lib/accountAllocation/wizardFlows';
import {
  activateOwnerAccount,
  assignUserRole,
  createIndependentStudentAccount,
  createParentAccount,
  fetchIdentityDocuments,
  linkIndependentParentsOnActivation,
  registerAuthUser,
  persistVerifiedIdentityDocument,
  saveWizardStep
} from '../lib/accountQueries';
import { useWizardSession } from '../hooks/useWizardSession';
import { WizardShell } from '../components/account/WizardShell.jsx';
import { PersonalInfoFields } from '../components/account/PersonalInfoFields.jsx';
import { IdentityScanStep } from '../components/account/IdentityScanStep.jsx';
import { supabase } from '../lib/supabase';

const DRAFT_OWNERS = {
  [ACCOUNT_ROLE.STUDENT]: 'anon-independent',
  [ACCOUNT_ROLE.PARENT]: 'anon-parent'
};

export function RegisterPage() {
  const navigate = useNavigate();
  const { refreshRole } = useAuth();
  const [role, setRole] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);

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
    enabled: Boolean(role)
  });

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
      let account = created;
      if (!account) {
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
        account = { userId: user.id, profileId: profile.id, profile };
      }

      const { password: _pw, ...safePayload } = wizard.values;
      await saveWizardStep({
        authUserId: account.userId,
        ownerType: role,
        ownerId: account.profileId,
        flowId,
        stepKey: 'personal_information',
        payload: safePayload,
        completed: true
      });
      setCreated(account);
      await wizard.completeStep('personal_information', safePayload);
    } catch (err) {
      wizard.setError(err.message || 'Could not create the account.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleIdentityStep() {
    const file = wizard.files.idPhoto;
    if (!file) {
      wizard.setError('Upload a clear photo of the identification card.');
      return;
    }
    const registeredName = joinFullName(wizard.values);
    setSubmitting(true);
    wizard.setError('');
    try {
      const expected = { fullName: registeredName, nationalId: wizard.values.nationalId };
      if (!created?.userId || !created?.profileId) {
        wizard.setError('Finish personal information first. Your progress is saved.');
        return;
      }

      await persistVerifiedIdentityDocument({
        authUserId: created.userId,
        ownerType: role,
        ownerId: created.profileId,
        studentProfileId: role === ACCOUNT_ROLE.STUDENT ? created.profileId : null,
        documentKind: DOCUMENT_KIND.NATIONAL_ID_PHOTO,
        file,
        expected,
        matchResult: wizard.verifications?.idPhoto
      });

      const documents = await fetchIdentityDocuments(role, created.profileId);
      const profile = created.profile;
      const activation = await activateOwnerAccount({
        role,
        profile,
        documents,
        identityMatchOk: true
      });
      if (!activation.ok) {
        wizard.setError(activation.reason);
        return;
      }

      if (role === ACCOUNT_ROLE.PARENT && activation.profile) {
        await linkIndependentParentsOnActivation(activation.profile);
      }

      await wizard.completeStep('identity_scan', {
        scannedName: wizard.values.scannedName,
        scannedIdNumber: wizard.values.scannedIdNumber,
        verified: true
      }, ['idPhoto']);

      navigate(role === ACCOUNT_ROLE.PARENT ? '/parent/dashboard' : '/student/dashboard');
    } catch (err) {
      wizard.setError(err.message || 'Identity verification failed.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!role) {
    return (
      <AuthFrame title="Create an account" lead="Choose how you are registering. This choice sets the student category and cannot be changed later except by an administrator.">
        <div className="role-pick">
          <button type="button" className="role-pick__card" onClick={() => setRole(ACCOUNT_ROLE.STUDENT)}>
            <strong>Independent student</strong>
            <span>You are 18 or older, have a national ID, and are registering for yourself.</span>
          </button>
          <button type="button" className="role-pick__card" onClick={() => setRole(ACCOUNT_ROLE.PARENT)}>
            <strong>Parent or guardian</strong>
            <span>Register with your national ID. You can add children under 18 and see linked independent students.</span>
          </button>
        </div>
        <p className="field__help" style={{ textAlign: 'center' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </AuthFrame>
    );
  }

  const title = role === ACCOUNT_ROLE.PARENT ? 'Parent registration' : 'Independent student registration';
  const description = role === ACCOUNT_ROLE.PARENT
    ? 'Fill in your details, then upload a clear photo of your national ID. The account becomes active only after the ID matches.'
    : 'You must be 18 or older and have a national ID. Students without an ID cannot self-register — a parent must add them.';

  return (
    <AuthFrame title={title} lead={description}>
      {wizard.loading ? (
        <p className="field__help">Restoring saved progress…</p>
      ) : (
        <WizardShell
          steps={steps}
          stepIndex={wizard.stepIndex}
          error={wizard.error}
          submitting={submitting}
          nextDisabled={false}
          nextLabel={wizard.stepIndex === 0 ? 'Save and continue' : 'Verify ID and activate'}
          onBack={() => wizard.setStepIndex((i) => Math.max(0, i - 1))}
          extraAction={
            <button type="button" className="btn btn--secondary" onClick={() => setRole(null)} style={{ borderRadius: 999, width: 'auto' }}>
              Back
            </button>
          }
          onNext={wizard.stepIndex === 0 ? handlePersonalStep : handleIdentityStep}
        >
          {wizard.currentStep?.key === 'personal_information' ? (
            <PersonalInfoFields values={wizard.values} onChange={wizard.updateField} includeAuth idPrefix="reg-" />
          ) : (
            <IdentityScanStep
              values={wizard.values}
              files={wizard.files}
              onChange={wizard.updateField}
              onFile={wizard.updateFile}
              registeredName={joinFullName(wizard.values)}
              registeredId={wizard.values.nationalId}
            />
          )}
        </WizardShell>
      )}
      <p className="field__help" style={{ textAlign: 'center' }}>
        {role === ACCOUNT_ROLE.STUDENT
          ? `Category assigned: ${STUDENT_CLASS.INDEPENDENT}. It stays locked after activation.`
          : 'After activation, independent students who already listed your ID appear on your children list.'}
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
        width: '100%', maxWidth: 520, background: 'var(--surface-elevated, #1E293B)',
        borderRadius: 24, padding: 32, border: '1px solid var(--glass-border)'
      }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700, color: 'var(--text, #E2E8F0)' }}>{title}</h1>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--text-2, #94A3B8)', lineHeight: 1.5 }}>{lead}</p>
        {children}
      </div>
    </div>
  );
}
