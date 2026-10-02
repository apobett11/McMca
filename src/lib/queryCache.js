const memory = new Map();
const STORAGE_PREFIX = 'mcmca.q.';

function storageKey(key) {
  return `${STORAGE_PREFIX}${key}`;
}

export function readQueryCache(key) {
  if (!key) return undefined;
  if (memory.has(key)) return memory.get(key);
  try {
    const raw = sessionStorage.getItem(storageKey(key));
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (!parsed || !Object.prototype.hasOwnProperty.call(parsed, 'v')) return undefined;
    memory.set(key, parsed.v);
    return parsed.v;
  } catch {
    return undefined;
  }
}

export function writeQueryCache(key, value) {
  if (!key) return value;
  memory.set(key, value);
  try {
    sessionStorage.setItem(storageKey(key), JSON.stringify({ v: value }));
  } catch {
    /* private mode or quota — memory cache still works for this tab */
  }
  return value;
}

export function clearQueryCache() {
  memory.clear();
  try {
    const keys = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const name = sessionStorage.key(i);
      if (name && name.startsWith(STORAGE_PREFIX)) keys.push(name);
    }
    keys.forEach((name) => sessionStorage.removeItem(name));
  } catch {
    /* ignore */
  }
}
