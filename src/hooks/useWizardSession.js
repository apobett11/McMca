import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  cacheWizardDraft,
  cacheWizardFile,
  clearWizardDraft,
  clearWizardFiles,
  readWizardDraft,
  readWizardFile,
  resolveWizardPosition
} from '../lib/accountAllocation';
import { fetchWizardSteps, saveWizardStep } from '../lib/accountQueries';

export function useWizardSession({
  flowId,
  ownerType,
  ownerId,
  authUserId,
  steps,
  cacheOwnerKey,
  enabled = true,
  seedValues = null,
  initialStepKey = null
}) {
  const [values, setValues] = useState({});
  const [files, setFiles] = useState({});
  const [verifications, setVerifications] = useState({});
  const [completedKeys, setCompletedKeys] = useState([]);
  const [stepPayloads, setStepPayloads] = useState({});
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pinnedStep = useRef('');

  const position = useMemo(
    () => resolveWizardPosition({ steps, completedKeys }),
    [steps, completedKeys]
  );

  useEffect(() => {
    if (!loading && !position.complete && !initialStepKey) {
      setStepIndex(position.index);
    }
  }, [loading, position.index, position.complete, initialStepKey]);

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      if (!enabled) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const draft = readWizardDraft(cacheOwnerKey, flowId) || { values: {} };
        const restoredFiles = {};
        const fileFields = new Set();
        steps.forEach((step) => {
          (step.fields || []).forEach((field) => {
            if (/photo|front|back|file|idPhoto|idFront|idBack|birthCertificatePhoto/i.test(field)) {
              fileFields.add(field);
            }
          });
        });
        await Promise.all(
          [...fileFields].map(async (field) => {
            const file = await readWizardFile(cacheOwnerKey, flowId, field);
            if (file) restoredFiles[field] = file;
          })
        );

        let dbSteps = [];
        if (ownerId && authUserId) {
          dbSteps = await fetchWizardSteps(ownerType, ownerId, flowId);
        }
        const completed = dbSteps.filter((s) => s.completed).map((s) => s.step_key);
        const payloads = {};
        const mergedValues = { ...(seedValues || {}), ...(draft.values || {}) };
        dbSteps.forEach((s) => {
          payloads[s.step_key] = s.payload || {};
          Object.assign(mergedValues, s.payload || {});
        });

        if (cancelled) return;
        setValues(mergedValues);
        setFiles(restoredFiles);
        setCompletedKeys(completed);
        setStepPayloads(payloads);
        const next = resolveWizardPosition({ steps, completedKeys: completed });
        const pinToken = initialStepKey ? `${ownerId || ''}:${initialStepKey}` : '';
        if (pinToken && pinnedStep.current !== pinToken) {
          const preferIndex = steps.findIndex((step) => step.key === initialStepKey);
          setStepIndex(preferIndex >= 0 ? preferIndex : next.index);
          pinnedStep.current = pinToken;
        } else if (!pinToken) {
          setStepIndex(next.index);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not restore saved progress.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, [enabled, flowId, ownerType, ownerId, authUserId, cacheOwnerKey, steps, seedValues, initialStepKey]);

  const persistDraft = useCallback(
    (nextValues, nextIndex) => {
      const serializable = { ...nextValues };
      Object.keys(serializable).forEach((key) => {
        if (serializable[key] instanceof File) delete serializable[key];
      });
      cacheWizardDraft(cacheOwnerKey, flowId, {
        values: serializable,
        stepIndex: nextIndex
      });
    },
    [cacheOwnerKey, flowId]
  );

  const updateField = useCallback(
    (name, value) => {
      setValues((prev) => {
        const next = { ...prev, [name]: value };
        persistDraft(next, stepIndex);
        return next;
      });
    },
    [persistDraft, stepIndex]
  );

  const updateFile = useCallback(
    async (name, file, verification) => {
      setFiles((prev) => ({ ...prev, [name]: file }));
      setVerifications((prev) => {
        const next = { ...prev };
        if (verification) next[name] = verification;
        else delete next[name];
        return next;
      });
      if (file) await cacheWizardFile(cacheOwnerKey, flowId, name, file);
    },
    [cacheOwnerKey, flowId]
  );

  const completeStep = useCallback(
    async (stepKey, payload, fileFields = []) => {
      if (authUserId && ownerId) {
        await saveWizardStep({
          authUserId,
          ownerType,
          ownerId,
          flowId,
          stepKey,
          payload,
          completed: true
        });
      }
      const nextCompleted = completedKeys.includes(stepKey)
        ? completedKeys
        : [...completedKeys, stepKey];
      setCompletedKeys(nextCompleted);
      setStepPayloads((prev) => ({ ...prev, [stepKey]: payload }));
      await clearWizardFiles(cacheOwnerKey, flowId, fileFields);

      const nextPos = resolveWizardPosition({ steps, completedKeys: nextCompleted });
      if (nextPos.complete) {
        clearWizardDraft(cacheOwnerKey, flowId);
      } else {
        const upcoming = steps[nextPos.index];
        const keep = new Set(upcoming?.fields || []);
        const slim = {};
        Object.entries(values).forEach(([key, value]) => {
          if (keep.has(key)) slim[key] = value;
        });
        persistDraft(slim, nextPos.index);
        setStepIndex(nextPos.index);
      }
      return nextPos;
    },
    [authUserId, ownerId, ownerType, flowId, completedKeys, cacheOwnerKey, steps, persistDraft, values]
  );

  return {
    values,
    files,
    verifications,
    completedKeys,
    stepPayloads,
    stepIndex,
    setStepIndex,
    currentStep: steps[stepIndex],
    loading,
    error,
    setError,
    updateField,
    updateFile,
    completeStep,
    allComplete: position.complete,
    persistDraft
  };
}
