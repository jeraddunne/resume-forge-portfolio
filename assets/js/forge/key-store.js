/**
 * key-store.js — the visitor's API key, held as briefly as possible.
 *
 * Rules this file exists to enforce:
 *
 *   1. sessionStorage, never localStorage. The key dies when the tab closes.
 *      localStorage would survive reboots on a shared or lab machine.
 *   2. Every access is wrapped. Private windows and "block site data" settings
 *      make even reading storage throw, and a thrown storage call must not
 *      take the page down with it.
 *   3. Nothing here logs a key, and nothing here sends a key anywhere. The
 *      only consumer is the provider adapter the visitor selected.
 *   4. purge() clears every trace, including anything a previous version of
 *      this page might have written to localStorage.
 */

const PREFIX = 'forge.key.';
const namespaced = (providerId) => `${PREFIX}${providerId}`;

/** sessionStorage can throw on access, not just on write. */
function session() {
  try {
    const store = window.sessionStorage;
    const probe = '__forge_probe__';
    store.setItem(probe, '1');
    store.removeItem(probe);
    return store;
  } catch {
    return null;
  }
}

export const storageAvailable = () => session() !== null;

export function saveKey(providerId, key) {
  const store = session();
  if (!store) return false;
  try {
    store.setItem(namespaced(providerId), key);
    return true;
  } catch {
    return false;
  }
}

export function loadKey(providerId) {
  const store = session();
  if (!store) return '';
  try {
    return store.getItem(namespaced(providerId)) || '';
  } catch {
    return '';
  }
}

export function clearKey(providerId) {
  const store = session();
  if (!store) return;
  try {
    store.removeItem(namespaced(providerId));
  } catch {
    /* nothing to clear */
  }
}

/**
 * Remove every key this page could have stored, in both storages.
 * localStorage is swept defensively: this page never writes there, but a
 * cached older build on the same origin might have.
 */
export function purge() {
  for (const storeName of ['sessionStorage', 'localStorage']) {
    try {
      const store = window[storeName];
      const doomed = [];
      for (let i = 0; i < store.length; i += 1) {
        const k = store.key(i);
        if (k && k.startsWith(PREFIX)) doomed.push(k);
      }
      doomed.forEach((k) => store.removeItem(k));
    } catch {
      /* storage unavailable — nothing to purge */
    }
  }
}

/** True if anything key-shaped is sitting in localStorage, which it never should be. */
export function leakedToLocalStorage() {
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(PREFIX)) return true;
    }
  } catch {
    return false;
  }
  return false;
}
