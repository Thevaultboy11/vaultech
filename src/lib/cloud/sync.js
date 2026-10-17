// Saves the whole app to ONE Firestore document per account (vaultech/{uid}).
//
// - Writes only when your data actually changed, at most once every 2 seconds.
// - Opening the app, reloading or switching devices never writes on its own.
// - Changes made on another device arrive live; if both changed, the newest wins.
import { useCallback, useEffect, useRef, useState } from 'react';
import * as backend from '@cloud-backend';

const DEBOUNCE_MS = 2000;
const MAX_BYTES = 900_000; // Firestore limit is 1 MiB per document

export function friendlyError(err) {
  const code = err?.code || '';
  if (code.includes('permission-denied'))
    return 'Firestore refused access. Update the rules in Firebase → Firestore → Rules (see README).';
  if (code.includes('unavailable')) return 'You’re offline. Changes are kept and will save when you’re back.';
  if (code.includes('not-found') || code.includes('failed-precondition')) return 'No Firestore database found. Create one in Firebase → Firestore.';
  if (code.includes('resource-exhausted')) return 'Firestore free quota reached for today.';
  if (code.includes('unauthorized-domain')) return 'This address isn’t allowed to sign in. Add it in Firebase → Authentication → Settings → Authorized domains.';
  if (code.includes('operation-not-allowed')) return 'Google sign-in is turned off. Enable it in Firebase → Authentication → Sign-in method.';
  if (code.includes('popup-closed') || code.includes('cancelled-popup')) return null;
  if (code.includes('popup-blocked')) return 'Your browser blocked the sign-in pop-up. Allow pop-ups for this site and try again.';
  return err?.message || 'Something went wrong';
}

export function useProfileSync({ uid, snapshot, applyAll, initialUpdatedAt, needsUpload }) {
  const [status, setStatus] = useState('synced'); // synced | saving | offline | error
  const [error, setError] = useState(null);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const json = JSON.stringify(snapshot);
  const jsonRef = useRef(json);
  jsonRef.current = json;
  const savedJson = useRef(needsUpload ? null : json); // what the cloud has
  const lastUpdatedAt = useRef(initialUpdatedAt || 0);
  const changedAt = useRef(0);
  const applyingRemote = useRef(false);
  const applyRef = useRef(applyAll);
  applyRef.current = applyAll;
  const timer = useRef(null);
  const saving = useRef(false);

  const flush = useCallback(async () => {
    const body = jsonRef.current;
    if (body === savedJson.current || saving.current) return;
    if (body.length > MAX_BYTES) {
      setStatus('error');
      setError('Your data is over 900 KB, too big for one document. Export a backup and delete old entries.');
      return;
    }
    saving.current = true;
    setStatus('saving');
    const updatedAt = Date.now();
    try {
      await backend.save(uid, { data: JSON.parse(body), updatedAt });
      savedJson.current = body;
      lastUpdatedAt.current = updatedAt;
      setLastSavedAt(new Date());
      setError(null);
      setStatus('synced');
    } catch (err) {
      setError(friendlyError(err));
      setStatus(err?.code?.includes('unavailable') ? 'offline' : 'error');
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, 30000);
    } finally {
      saving.current = false;
      if (jsonRef.current !== savedJson.current && !timer.current) schedule();
    }
  }, [uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const schedule = useCallback(
    (ms = DEBOUNCE_MS) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = null;
        flush();
      }, ms);
    },
    [flush]
  );

  // Local change → save (debounced). Remote-applied changes are not saved back.
  useEffect(() => {
    if (applyingRemote.current) {
      applyingRemote.current = false;
      savedJson.current = json;
      return;
    }
    if (json === savedJson.current) return;
    changedAt.current = Date.now();
    schedule();
  }, [json, schedule]);

  // Live updates from your other devices
  useEffect(() => {
    const unsub = backend.watch(
      uid,
      (doc, pending) => {
        if (pending || !doc || !doc.data) return;
        if ((doc.updatedAt || 0) <= lastUpdatedAt.current) return; // our own save, or old
        const localDirty = jsonRef.current !== savedJson.current;
        if (localDirty && changedAt.current > doc.updatedAt) return; // ours is newer; it will save
        lastUpdatedAt.current = doc.updatedAt;
        applyingRemote.current = true;
        applyRef.current(doc.data);
      },
      (err) => {
        setError(friendlyError(err));
        setStatus('error');
      }
    );
    return () => unsub && unsub();
  }, [uid]);

  useEffect(() => {
    const on = () => {
      setStatus((s) => (s === 'offline' ? 'saving' : s));
      schedule(300);
    };
    const off = () => setStatus('offline');
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    // save right away if the tab is being closed with unsaved changes
    const hide = () => {
      if (document.visibilityState === 'hidden' && jsonRef.current !== savedJson.current) flush();
    };
    document.addEventListener('visibilitychange', hide);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      document.removeEventListener('visibilitychange', hide);
    };
  }, [schedule, flush]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return { status, error, lastSavedAt, saveNow: () => schedule(0) };
}
