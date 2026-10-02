import { CACHE_PREFIX, FILE_CACHE_DB, FILE_CACHE_STORE } from './constants.js';

function storageKey(ownerKey, flowId) {
  return `${CACHE_PREFIX}.${ownerKey}.${flowId}`;
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — cache is best-effort */
  }
}

function openFileDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(FILE_CACHE_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FILE_CACHE_STORE)) {
        db.createObjectStore(FILE_CACHE_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function idbRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Autonomous: persist an in-progress wizard step locally. Completed steps must not stay here. */
export function cacheWizardDraft(ownerKey, flowId, draft) {
  writeJson(storageKey(ownerKey, flowId), {
    ...draft,
    updatedAt: new Date().toISOString()
  });
}

export function readWizardDraft(ownerKey, flowId) {
  return readJson(storageKey(ownerKey, flowId));
}

export function clearWizardDraft(ownerKey, flowId) {
  try {
    localStorage.removeItem(storageKey(ownerKey, flowId));
  } catch {
    /* ignore */
  }
}

export function migrateWizardDraft(fromOwnerKey, toOwnerKey, flowId) {
  const draft = readWizardDraft(fromOwnerKey, flowId);
  if (!draft) return;
  cacheWizardDraft(toOwnerKey, flowId, draft);
  clearWizardDraft(fromOwnerKey, flowId);
}

export async function cacheWizardFile(ownerKey, flowId, field, file) {
  try {
    const db = await openFileDb();
    const tx = db.transaction(FILE_CACHE_STORE, 'readwrite');
    tx.objectStore(FILE_CACHE_STORE).put(file, `${ownerKey}:${flowId}:${field}`);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* best-effort */
  }
}

export async function readWizardFile(ownerKey, flowId, field) {
  try {
    const db = await openFileDb();
    const tx = db.transaction(FILE_CACHE_STORE, 'readonly');
    const value = await idbRequest(tx.objectStore(FILE_CACHE_STORE).get(`${ownerKey}:${flowId}:${field}`));
    db.close();
    return value || null;
  } catch {
    return null;
  }
}

export async function clearWizardFile(ownerKey, flowId, field) {
  try {
    const db = await openFileDb();
    const tx = db.transaction(FILE_CACHE_STORE, 'readwrite');
    tx.objectStore(FILE_CACHE_STORE).delete(`${ownerKey}:${flowId}:${field}`);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* ignore */
  }
}

export async function clearWizardFiles(ownerKey, flowId, fields = []) {
  await Promise.all(fields.map((field) => clearWizardFile(ownerKey, flowId, field)));
}
