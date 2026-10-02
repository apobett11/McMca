import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { StudentLayout } from '../components/StudentLayout.jsx';
import { WizardShell } from '../../../components/account/WizardShell.jsx';
import { VerifiedField } from '../../../components/account/VerifiedField.jsx';
import { IdentityScanStep } from '../../../components/account/IdentityScanStep.jsx';
import { useAuth } from '../../../context/AuthContext';
import { useWizardSession } from '../../../hooks/useWizardSession';
import {
  DOCUMENT_KIND,
  WIZARD_FLOW,
  evaluateParentLinkSlots,
  joinFullName,
  validateForm
} from '../../../lib/accountAllocation';
import { getWizardSteps } from '../../../lib/accountAllocation/wizardFlows';
import {
  fetchLinkedParents,
  fetchStudentAccount,
  persistVerifiedIdentityDocument,
  savePendingParentFromStudent
} from '../../../lib/accountQueries';

export function StudentLinkParentsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [links, setLinks] = useState([]);
  const steps = useMemo(() => getWizardSteps(WIZARD_FLOW.STUDENT_LINK_PARENTS), []);
  const wizard = useWizardSession({
    flowId: WIZARD_FLOW.STUDENT_LINK_PARENTS,
    ownerType: 'student',
    ownerId: profile?.id,
    authUserId: user?.id,
    steps,
    cacheOwnerKey: profile?.id ? `student:${profile.id}:parents` : 'student-parents-draft',
    enabled: Boolean(profile?.id)
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user?.id) return;
      const student = await fetchStudentAccount(user.id);
      if (!active || !student) return;
      setProfile(student);
      const existing = await fetchLinkedParents(student.id);
      if (active) setLinks(existing);
    }
    load();
    return () => { active = false; };
  }, [user?.id]);

  const slots = evaluateParentLinkSlots(links);

  async function saveCurrentParent() {
    if (!profile || !user?.id) return;
    const schema = {
      firstName: {},
      lastName: {},
      relationship: { label: 'Relationship' },
      nationalId: {},
      phone: { required: false }
    };
    const check = validateForm(wizard.values, schema);
    if (!check.ok) {
      wizard.setError(Object.values(check.errors)[0]);
      return;
    }
    const front = wizard.files.idFront || wizard.files.idPhoto;
    const back = wizard.files.idBack;
    if (!front || !back) {
      wizard.setError('Upload a clear photo of the front and the back of the parent ID.');
      return;
    }
    setSubmitting(true);
    wizard.setError('');
    try {
      const parentName = joinFullName(wizard.values);
      const expected = { fullName: parentName, nationalId: wizard.values.nationalId };
      await persistVerifiedIdentityDocument({
        authUserId: user.id,
        ownerType: 'student',
        ownerId: profile.id,
        studentProfileId: profile.id,
        documentKind: DOCUMENT_KIND.PARENT_ID_FRONT,
        file: front,
        expected,
        matchResult: wizard.verifications?.idFront || wizard.verifications?.idPhoto
      });
      await persistVerifiedIdentityDocument({
        authUserId: user.id,
        ownerType: 'student',
        ownerId: profile.id,
        studentProfileId: profile.id,
        documentKind: DOCUMENT_KIND.PARENT_ID_BACK,
        file: back,
        expected,
        matchResult: wizard.verifications?.idBack
      });

      await savePendingParentFromStudent({
        studentProfileId: profile.id,
        parent: wizard.values,
        documentsVerified: true
      });

      const stepKey = wizard.currentStep?.key;
      await wizard.completeStep(stepKey, {
        firstName: wizard.values.firstName,
        lastName: wizard.values.lastName,
        nationalId: wizard.values.nationalId,
        relationship: wizard.values.relationship
      }, ['idFront', 'idBack', 'idPhoto']);

      const existing = await fetchLinkedParents(profile.id);
      setLinks(existing);
    } catch (err) {
      wizard.setError(err.message || 'Could not link this parent.');
    } finally {
      setSubmitting(false);
    }
  }

  async function skipSecondParent() {
    await wizard.completeStep('parent_two', { skipped: true });
  }

  return (
    <StudentLayout pageTitle="Link parents">
      <Link className="back-link" to="/student/dashboard">Back to dashboard</Link>
      <div className="stitch-support-hero">
        <h1 className="stitch-support-hero__title" style={{ fontSize: 32 }}>Link parents</h1>
        <p className="stitch-support-hero__desc">
          Independent students must verify one or two parents. Fill in their details and upload the front and back of their national ID. If that parent later registers with the same ID, they are linked automatically and you appear on their children page.
        </p>
      </div>

      <p className="field__help">{slots.linked} of {2} parents linked. {slots.complete ? 'At least one parent is linked.' : 'Link at least one parent before submitting an application.'}</p>

      {links.length > 0 ? (
        <ul className="doc-checklist" style={{ marginBottom: 24 }}>
          {links.map((row) => (
            <li key={row.id} className="doc-checklist__item">
              {row.parent_first_name} {row.parent_last_name} · ID {row.parent_national_id} · {row.verification_status}
            </li>
          ))}
        </ul>
      ) : null}

      {slots.maxed ? (
        <div className="notice">Both parent slots are filled. Student category stays independent unless an administrator changes it.</div>
      ) : wizard.loading ? (
        <p>Restoring saved progress…</p>
      ) : (
        <WizardShell
          steps={steps}
          stepIndex={wizard.stepIndex}
          error={wizard.error}
          submitting={submitting}
          nextLabel={wizard.currentStep?.optional ? 'Save this parent' : 'Verify and save parent'}
          onBack={() => wizard.setStepIndex((i) => Math.max(0, i - 1))}
          extraAction={
            wizard.currentStep?.optional ? (
              <button type="button" className="btn btn--secondary" onClick={skipSecondParent} style={{ borderRadius: 999, width: 'auto' }}>
                Skip second parent
              </button>
            ) : null
          }
          onNext={saveCurrentParent}
        >
          <VerifiedField name="firstName" label="Parent first name" value={wizard.values.firstName} onChange={(v) => wizard.updateField('firstName', v)} />
          <VerifiedField name="middleName" label="Parent middle name" required={false} value={wizard.values.middleName} onChange={(v) => wizard.updateField('middleName', v)} />
          <VerifiedField name="lastName" label="Parent last name" value={wizard.values.lastName} onChange={(v) => wizard.updateField('lastName', v)} />
          <div className="field">
            <label htmlFor="relationship">Relationship</label>
            <select id="relationship" value={wizard.values.relationship || ''} onChange={(e) => wizard.updateField('relationship', e.target.value)} required>
              <option value="">Select</option>
              <option value="mother">Mother</option>
              <option value="father">Father</option>
              <option value="guardian">Guardian</option>
            </select>
          </div>
          <VerifiedField name="phone" label="Phone number" required={false} value={wizard.values.phone} onChange={(v) => wizard.updateField('phone', v)} />
          <VerifiedField name="nationalId" label="Parent national ID number" value={wizard.values.nationalId} onChange={(v) => wizard.updateField('nationalId', v)} />
          <IdentityScanStep
            values={wizard.values}
            files={wizard.files}
            onFile={wizard.updateFile}
            registeredName={joinFullName(wizard.values)}
            registeredId={wizard.values.nationalId}
            fileField="idFront"
            requireBothSides
          />
        </WizardShell>
      )}
    </StudentLayout>
  );
}
