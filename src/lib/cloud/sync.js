// Cloud sync without sign-in.
//
// Each browser holds a private "vault key" (a long random string). Data is stored in
// Firestore at  vaultech/{vaultKey}/sections/{section}  as { json, updatedAt, device }.
// Anyone with the key can read/write that vault, so the key works like a password:
// copy it to your other devices, don't post it anywhere.
//
// Conflict rule: per section, the most recent change wins.
import { useCallback, useEffect, useRef, useState } from 'react';
import * as backend from '@cloud-backend';

export const SECTIONS = {
  meta: ['profile', 'settings', 'top3', 'notifRead', 'tutorialDone', 'weeklyGoals'],
  courses: ['courses'],
  tasks: ['tasks'],
  habits: ['habits'],
  books: ['books'],
  workouts: ['workouts'],
  deals: ['deals'],
  jobLeads: ['jobLeads'],
  focusSessions: ['focusSessions'],
  screenTimeLogs: ['screenTimeLogs'],
  timeBlocks: ['timeBlocks'],
};
const NAMES = Object.keys(SECTIONS);
const SYNC_STORAGE = 'vault-tech-industries:sync';
const MAX_BYTES = 900_000; // Firestore's limit is 1 MiB per document

export const cloudConfigured = backend.configured;

function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `${s.length}:${h >>> 0}`;
}

export function sectionJson(snapshot, name) {
  const o = {};
  for (const k of SECTIONS[name]) o[k] = snapshot[k];
  return JSON.stringify(o);
}

const isEmptyJson = (name, json) => {
  if (name === 'meta') return false;
  return JSON.parse(json)[SECTIONS[name][0]].length === 0;
};

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
    if (m && typeof m === 'object') return { synced: {}, changedAt: {}, ...m };
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
    return 'Firestore refused access. Add the vaultech rules in Firebase → Firestore → Rules (see README).';
  if (code.includes('unavailable')) return 'Can’t reach Firestore right now. Changes are kept and will sync later.';
  if (code.includes('not-found') || code.includes('failed-precondition'))
    return 'No Firestore database found in the project. Create one in Firebase → Firestore.';
  if (code.includes('resource-exhausted')) return 'Firestore free quota reached for today.';
  return err?.message || 'Sync error';
}

/**
 * snapshot: the full app data object (from the store)
 * applyPartial(obj): replaces the given top-level keys in the store
 */
export function useCloudSync({ snapshot, applyPartial }) {
  const [meta, setMetaState] = useState(() => {
    const m = loadMeta();
    if (m) return m;
    // First run: create a fresh, empty vault and turn sync on.
    const fresh = { vault: backend.configured ? newVaultKey() : null, synced: {}, changedAt: {}, device: newVaultKey().slice(3, 11) };
    saveMeta(fresh);
    return fresh;
  });
  const metaRef = useRef(meta);
  const setMeta = (m) => {
    metaRef.current = m;
    saveMeta(m);
    setMetaState(m);
  };

  const [status, setStatus] = useState(meta.vault ? 'connecting' : 'off');
  const [error, setError] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);

  const snapRef = useRef(snapshot);
  snapRef.current = snapshot;
  const applyRef = useRef(applyPartial);
  applyRef.current = applyPartial;
  const ready = useRef(new Set());
  const lastJson = useRef({});
  const timer = useRef(null);
  const inflight = useRef(0);

  const markSynced = (name, h) => {
    const m = metaRef.current;
    if (m.synced[name] === h) return;
    metaRef.current = { ...m, synced: { ...m.synced, [name]: h } };
    saveMeta(metaRef.current);
  };

  const flush = useCallback(async () => {
    const m = metaRef.current;
    if (!m.vault) return;
    const vault = m.vault;
    const jobs = [];
    for (const name of NAMES) {
      if (!ready.current.has(name)) continue;
      const json = sectionJson(snapRef.current, name);
      const h = hash(json);
      if (metaRef.current.synced[name] === h) continue;
      if (json.length > MAX_BYTES) {
        setStatus('error');
        setError(`“${name}” is too big to sync (over 900 KB). Export a backup and remove old entries.`);
        continue;
      }
      jobs.push(
        backend.write(vault, name, { json, updatedAt: Date.now(), device: m.device }).then(() => {
          if (metaRef.current.vault === vault) markSynced(name, h);
        })
      );
    }
    if (!jobs.length) return;
    inflight.current++;
    setStatus('syncing');
    try {
      await Promise.all(jobs);
      setError(null);
      setLastSyncedAt(new Date());
      setStatus('synced');
    } catch (err) {
      setError(friendlyError(err));
      setStatus('error');
      // try again in a bit
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, 15000);
    } finally {
      inflight.current--;
    }
  }, []);

  const schedule = useCallback(
    (ms = 800) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, ms);
    },
    [flush]
  );

  // Listen to every section of the vault
  useEffect(() => {
    const vault = meta.vault;
    ready.current = new Set();
    if (!vault || !backend.configured) {
      setStatus('off');
      return;
    }
    setStatus('connecting');
    setError(null);
    for (const name of NAMES) lastJson.current[name] = sectionJson(snapRef.current, name);

    const unsubs = NAMES.map((name) =>
      backend.subscribe(
        vault,
        name,
        (data) => {
          if (metaRef.current.vault !== vault) return;
          const local = sectionJson(snapRef.current, name);
          const lh = hash(local);
          const m = metaRef.current;
          if (!data) {
            // Nothing in the cloud yet → upload what we have (if anything)
            if (isEmptyJson(name, local)) markSynced(name, lh);
          } else {
            const rh = hash(data.json);
            if (rh === lh) markSynced(name, rh);
            else {
              const dirty = m.synced[name] !== lh;
              const localNewer = (m.changedAt[name] || 0) > (data.updatedAt || 0);
              if (!(dirty && localNewer)) {
                // Remote wins: take it
                markSynced(name, rh);
                lastJson.current[name] = data.json;
                try {
                  applyRef.current(JSON.parse(data.json));
                } catch {
                  /* ignore malformed */
                }
                setLastSyncedAt(new Date());
              }
            }
          }
          const first = !ready.current.has(name);
          ready.current.add(name);
          if (ready.current.size === NAMES.length) {
            if (first) setStatus((s) => (s === 'connecting' ? 'synced' : s));
            schedule(first ? 50 : 800);
          }
        },
        (err) => {
          setError(friendlyError(err));
          setStatus('error');
        }
      )
    );
    return () => {
      unsubs.forEach((u) => u && u());
      clearTimeout(timer.current);
    };
  }, [meta.vault, schedule]);

  // Local changes → note the time and queue an upload
  useEffect(() => {
    let changed = false;
    const m = metaRef.current;
    let changedAt = m.changedAt;
    for (const name of NAMES) {
      const json = sectionJson(snapshot, name);
      if (lastJson.current[name] === undefined) {
        lastJson.current[name] = json;
        continue;
      }
      if (json !== lastJson.current[name]) {
        lastJson.current[name] = json;
        changedAt = { ...changedAt, [name]: Date.now() };
        changed = true;
      }
    }
    if (changed) {
      metaRef.current = { ...m, changedAt };
      saveMeta(metaRef.current);
      if (m.vault && ready.current.size === NAMES.length) schedule();
    }
  }, [snapshot, schedule]);

  // Online/offline indicator + flush when coming back
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
    // Joining an existing vault: whatever is in the cloud wins.
    setMeta({ ...metaRef.current, vault, synced: {}, changedAt: {} });
    return true;
  };

  // Delete the current vault's cloud copy and start a new empty one.
  // Local data is kept and uploaded to the new vault (erase locally first for a blank slate).
  const freshVault = async () => {
    const old = metaRef.current.vault;
    setMeta({ ...metaRef.current, vault: null });
    if (old) await Promise.allSettled(NAMES.map((n) => backend.remove(old, n)));
    setMeta({ ...metaRef.current, vault: newVaultKey(), synced: {}, changedAt: {} });
  };

  const disconnect = () => setMeta({ ...metaRef.current, vault: null, synced: {}, changedAt: {} });
  const enable = () => setMeta({ ...metaRef.current, vault: newVaultKey(), synced: {}, changedAt: {} });
  const syncNow = () => schedule(0);

  return {
    configured: backend.configured,
    backendName: backend.backendName,
    vault: meta.vault,
    status: meta.vault && !online && status !== 'error' ? 'offline' : status,
    error,
    lastSyncedAt,
    connect,
    freshVault,
    disconnect,
    enable,
    syncNow,
  };
}
