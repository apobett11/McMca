import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ACCOUNT_ROLE,
  ACCOUNT_STATUS,
  DOCUMENT_KIND,
  WIZARD_FLOW,
  joinFullName,
  readAccountStatus
} from '../lib/accountAllocation';
import {
  activateOwnerAccount,
  fetchIdentityDocuments,
  fetchParentAccount,
  fetchStudentAccount,
  linkIndependentParentsOnActivation,
  persistVerifiedIdentityDocument,
  saveWizardStep
} from '../lib/accountQueries';
import { IdentityScanStep } from '../components/account/IdentityScanStep.jsx';
import { WizardShell } from '../components/account/WizardShell.jsx';
import { getWizardSteps } from '../lib/accountAllocation/wizardFlows';

export function OnboardingPage() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [values, setValues] = useState({});
  const [files, setFiles] = useState({});
  const [verifications, setVerifications] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user?.id) return;
      const data = role === 'parent'
        ? await fetchParentAccount(user.id)
        : await fetchStudentAccount(user.id);
      if (!active || !data) return;
      setProfile(data);
      setValues({
        firstName: data.first_name,
        middleName: data.middle_name,
        lastName: data.last_name,
        nationalId: data.national_id,
        scannedName: joinFullName({
          firstName: data.first_name,
          middleName: data.middle_name,
          lastName: data.last_name
        }),
        scannedIdNumber: data.national_id || ''
      });
    }
    load();
    return () => { active = false; };
  }, [user?.id, role]);

  const status = readAccountStatus(profile || {});

  useEffect(() => {
    if (profile && status === ACCOUNT_STATUS.ACTIVE) {
      navigate(role === 'parent' ? '/parent/dashboard' : '/student/dashboard', { replace: true });
    }
  }, [profile, status, role, navigate]);

  const steps = getWizardSteps(
    role === 'parent' ? WIZARD_FLOW.REGISTER_PARENT : WIZARD_FLOW.REGISTER_INDEPENDENT
  );

  async function handleVerify() {
    if (!profile || !user?.id) return;
    const file = files.idPhoto;
    if (!file) {
      setError('Upload a clear photo of the identification card.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const expected = { fullName: joinFullName(values), nationalId: profile.national_id };
      const ownerType = role === 'parent' ? ACCOUNT_ROLE.PARENT : ACCOUNT_ROLE.STUDENT;
      await persistVerifiedIdentityDocument({
        authUserId: user.id,
        ownerType,
        ownerId: profile.id,
        studentProfileId: role === 'student' ? profile.id : null,
        documentKind: DOCUMENT_KIND.NATIONAL_ID_PHOTO,
        file,
        expected,
        matchResult: verifications.idPhoto
      });
      const documents = await fetchIdentityDocuments(ownerType, profile.id);
      const activation = await activateOwnerAccount({
        role: ownerType,
        profile,
        documents,
        identityMatchOk: true
      });
      if (!activation.ok) {
        setError(activation.reason);
        return;
      }
      await saveWizardStep({
        authUserId: user.id,
        ownerType,
        ownerId: profile.id,
        flowId: role === 'parent' ? WIZARD_FLOW.REGISTER_PARENT : WIZARD_FLOW.REGISTER_INDEPENDENT,
        stepKey: 'identity_scan',
        payload: { verified: true },
        completed: true
      });
      if (role === 'parent' && activation.profile) {
        await linkIndependentParentsOnActivation(activation.profile);
      }
      navigate(role === 'parent' ? '/parent/dashboard' : '/student/dashboard');
    } catch (err) {
      setError(err.message || 'Verification failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--background, #0B1120)', padding: 24
    }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <WizardShell
          title="Activate your account"
          description="Your personal information is already saved. Upload a clear photo of your national ID. The name and number must match what you registered with. When they match, the account becomes active."
          steps={steps}
          stepIndex={1}
          error={error}
          submitting={submitting}
          nextLabel="Verify ID and activate"
          onNext={handleVerify}
        >
          <IdentityScanStep
            values={values}
            files={files}
            onFile={(name, file, verification) => {
              setFiles((prev) => ({ ...prev, [name]: file }));
              setVerifications((prev) => {
                const next = { ...prev };
                if (verification) next[name] = verification;
                else delete next[name];
                return next;
              });
            }}
            registeredName={joinFullName(values)}
            registeredId={profile?.national_id}
          />
        </WizardShell>
      </div>
    </div>
  );
}
