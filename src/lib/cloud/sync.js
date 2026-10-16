// Cloud sync without sign-in — kept deliberately small.
//
// The whole app is ONE Firestore document:  vaultech/{vaultKey}  →  { json, updatedAt, device }
// `json` is the same JSON object you get from Settings → Export (usually a few KB).
// The vault key is a long random string that works like a password.
//
// Writes only happen when something actually changed, at most once every 2 seconds.
// If two devices edit at once, the most recent change wins.
import { useCallback, useEffect, useRef, useState } from 'react';
import * as backend from '@cloud-backend';

const SYNC_STORAGE = 'vault-tech-industries:sync';
const DEBOUNCE_MS = 2000;
const MAX_BYTES = 900_000; // Firestore's limit is 1 MiB per document

export const cloudConfigured = backend.configured;

function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `${s.length}:${h >>> 0}`;
}

export function newVaultKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = new Uint8Array(28);
  crypto.getRandomValues(bytes);
  return 'vt-' + Array.from(bytes, (b) => chars[b % chars.length]).join('');
}
export const normalizeKey = (k) => (k || '').trim().replace(/\s+/g, '');
export const validKey = (k) => /^[A-Za-z0-9_-]{24,100}$/.test(normalizeKey(k));

function loadMeta() {
  try {
    const m = JSON.parse(localStorage.getItem(SYNC_STORAGE) || 'null');
    if (m && typeof m === 'object' && 'vault' in m) return { synced: null, changedAt: 0, ...m };
  } catch {
    /* ignore */
  }
  return null;
}
function saveMeta(m) {
  try {
    localStorage.setItem(SYNC_STORAGE, JSON.stringify(m));
  } catch {
    /* ignore */
  }
}

function friendlyError(err) {
  const code = err?.code || '';
  if (code.includes('permission-denied'))
    return 'Firestore refused access. Add the vaultech rule in Firebase → Firestore → Rules (see README).';
  if (code.includes('unavailable')) return 'Can’t reach Firestore right now. Changes are kept and will sync later.';
  if (code.includes('not-found') || code.includes('failed-precondition'))
    return 'No Firestore database found in the project. Create one in Firebase → Firestore.';
  if (code.includes('resource-exhausted')) return 'Firestore free quota reached for today.';
  return err?.message || 'Sync error';
}

/**
 * snapshot: the full app data object (from the store)
 * applyAll(obj): replaces the app data with obj
 */
export function useCloudSync({ snapshot, applyAll }) {
  const [meta, setMetaState] = useState(() => {
    const m = loadMeta();
    if (m) return m;
    // First run: new, empty vault with sync on.
    const fresh = { vault: backend.configured ? newVaultKey() : null, synced: null, changedAt: 0, device: newVaultKey().slice(3, 11) };
    saveMeta(fresh);
    return fresh;
  });
  const metaRef = useRef(meta);
  const setMeta = (m) => {
    metaRef.current = m;
    saveMeta(m);
    setMetaState(m);
  };
  const patchMeta = (p) => {
    metaRef.current = { ...metaRef.current, ...p };
    saveMeta(metaRef.current);
  };

  const [status, setStatus] = useState(meta.vault ? 'connecting' : 'off');
  const [error, setError] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);

  const json = JSON.stringify(snapshot);
  const jsonRef = useRef(json);
  jsonRef.current = json;
  const applyRef = useRef(applyAll);
  applyRef.current = applyAll;
  const ready = useRef(false);
  const lastJson = useRef(json);
  const timer = useRef(null);

  const flush = useCallback(async () => {
    const m = metaRef.current;
    if (!m.vault || !ready.current) return;
    const vault = m.vault;
    const body = jsonRef.current;
    const h = hash(body);
    if (m.synced === h) return; // nothing new
    if (body.length > MAX_BYTES) {
      setStatus('error');
      setError('Your data is over 900 KB, too big for one Firestore document. Export a backup and remove old entries.');
      return;
    }
    setStatus('syncing');
    try {
      await backend.write(vault, { json: body, updatedAt: Date.now(), device: m.device });
      if (metaRef.current.vault === vault) patchMeta({ synced: h });
      setError(null);
      setLastSyncedAt(new Date());
      setStatus('synced');
    } catch (err) {
      setError(friendlyError(err));
      setStatus('error');
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, 30000); // retry later
    }
  }, []);

  const schedule = useCallback(
    (ms = DEBOUNCE_MS) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, ms);
    },
    [flush]
  );

  // Listen to the vault document (fires once on load, then on every change from any device)
  useEffect(() => {
    const vault = meta.vault;
    ready.current = false;
    if (!vault || !backend.configured) {
      setStatus('off');
      return;
    }
    setStatus('connecting');
    setError(null);
    lastJson.current = jsonRef.current;

    const unsub = backend.subscribe(
      vault,
      (data) => {
        if (metaRef.current.vault !== vault) return;
        const local = jsonRef.current;
        const lh = hash(local);
        const m = metaRef.current;
        if (data && typeof data.json === 'string') {
          const rh = hash(data.json);
          if (rh === lh) patchMeta({ synced: rh });
          else {
            const localDirty = m.synced !== lh;
            const localNewer = (m.changedAt || 0) > (data.updatedAt || 0);
            if (!(localDirty && localNewer)) {
              // Cloud copy wins
              patchMeta({ synced: rh });
              lastJson.current = data.json;
              try {
                applyRef.current(JSON.parse(data.json));
              } catch {
                /* ignore malformed */
              }
              setLastSyncedAt(new Date());
            }
          }
        }
        const first = !ready.current;
        ready.current = true;
        if (first) setStatus((s) => (s === 'connecting' ? 'synced' : s));
        schedule(first ? 100 : DEBOUNCE_MS); // uploads only if local differs
      },
      (err) => {
        setError(friendlyError(err));
        setStatus('error');
      }
    );
    return () => {
      if (unsub) unsub();
      clearTimeout(timer.current);
    };
  }, [meta.vault, schedule]);

  // Local change → remember when, queue one upload
  useEffect(() => {
    if (json === lastJson.current) return;
    lastJson.current = json;
    patchMeta({ changedAt: Date.now() });
    if (metaRef.current.vault && ready.current) schedule();
  }, [json, schedule]);

  // Online/offline
  useEffect(() => {
    const on = () => {
      setOnline(true);
      schedule(300);
    };
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, [schedule]);

  // ── Actions for Settings ──
  const connect = (key) => {
    const vault = normalizeKey(key);
    if (!validKey(vault)) return false;
    setMeta({ ...metaRef.current, vault, synced: null, changedAt: 0 }); // cloud copy wins
    return true;
  };
  const freshVault = async () => {
    const old = metaRef.current.vault;
    setMeta({ ...metaRef.current, vault: null });
    if (old) await backend.remove(old).catch(() => {});
    setMeta({ ...metaRef.current, vault: newVaultKey(), synced: null, changedAt: 0 });
  };
  const disconnect = () => setMeta({ ...metaRef.current, vault: null, synced: null, changedAt: 0 });
  const enable = () => setMeta({ ...metaRef.current, vault: newVaultKey(), synced: null, changedAt: 0 });
  const syncNow = () => schedule(0);

  return {
    configured: backend.configured,
    backendName: backend.backendName,
    vault: meta.vault,
    status: meta.vault && !online && status !== 'error' ? 'offline' : status,
    error,
    lastSyncedAt,
    sizeKb: Math.max(1, Math.round(json.length / 1024)),
    connect,
    freshVault,
    disconnect,
    enable,
    syncNow,
  };
}
