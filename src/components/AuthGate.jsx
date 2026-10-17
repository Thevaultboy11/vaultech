import { motion } from 'framer-motion';
import { Loader2, LogOut, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import * as backend from '@cloud-backend';
import { emptyData } from '../data/defaults';
import { friendlyError } from '../lib/cloud/sync';
import { Button } from './ui';

const LEGACY_KEY = 'vault-tech-industries:data'; // data saved before sign-in existed
export const cacheKey = (uid) => `vault-tech-industries:cache:${uid}`;

function hasContent(d) {
  return d && ['tasks', 'courses', 'habits', 'books', 'workouts', 'deals', 'jobLeads', 'timeBlocks'].some((k) => Array.isArray(d[k]) && d[k].length);
}
function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

function Mark({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 18h18" stroke="#3F3F4A" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 15l5-5 4 3 7-7" stroke="rgb(var(--accent))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="6" r="1.8" fill="rgb(var(--accent))" />
    </svg>
  );
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function Shell({ children }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-4">
      <div className="pointer-events-none absolute left-1/2 top-[18%] h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-accent/[0.07] blur-3xl" />
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-sm text-center">
        {children}
      </motion.div>
    </div>
  );
}

function Brand() {
  return (
    <>
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-surface shadow-soft">
        <Mark size={34} />
      </div>
      <div className="text-[15px] font-semibold tracking-[0.3em] text-ink">VAULT TECH</div>
      <div className="mt-1 text-[10px] font-medium tracking-[0.5em] text-ink3">INDUSTRIES</div>
    </>
  );
}

export default function AuthGate({ children }) {
  const [user, setUser] = useState(undefined); // undefined = checking
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => backend.onAuth(setUser), []);

  // After sign-in: open this account's single document
  useEffect(() => {
    setSession(null);
    if (!user) return;
    let cancelled = false;
    setError(null);
    (async () => {
      try {
        const doc = await backend.load(user.uid);
        if (cancelled) return;
        let data = doc?.data;
        let needsUpload = false;
        if (!data) {
          // First sign-in for this account: bring over data saved on this device before sign-in, if any
          const legacy = readJson(LEGACY_KEY);
          data = hasContent(legacy) ? legacy : emptyData();
          needsUpload = hasContent(legacy);
        }
        if (!data.profile?.name && user.name) data = { ...data, profile: { ...(data.profile || {}), name: user.name } };
        setSession({ user, data, updatedAt: doc?.updatedAt || 0, needsUpload });
      } catch (err) {
        if (cancelled) return;
        const cached = readJson(cacheKey(user.uid));
        if (cached && (err?.code || '').includes('unavailable')) {
          setSession({ user, data: cached, updatedAt: 0, needsUpload: false, offline: true });
        } else setError(friendlyError(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, attempt]); // eslint-disable-line react-hooks/exhaustive-deps

  const signIn = async () => {
    setBusy(true);
    setError(null);
    try {
      await backend.signIn();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  if (user === undefined || (user && !session && !error))
    return (
      <Shell>
        <Brand />
        <Loader2 size={18} className="mx-auto mt-8 animate-spin text-ink3" />
      </Shell>
    );

  if (!user || error)
    return (
      <Shell>
        <Brand />
        <p className="mx-auto mt-6 max-w-[280px] text-sm text-ink2">Your courses, tasks, habits and week, in one place.</p>
        {user && error ? (
          <div className="mt-8 space-y-3">
            <p className="rounded-xl border border-danger/25 bg-danger/[0.07] px-4 py-3 text-left text-xs leading-relaxed text-ink2">{error}</p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" icon={RefreshCw} onClick={() => setAttempt((a) => a + 1)}>
                Try again
              </Button>
              <Button variant="ghost" icon={LogOut} onClick={() => backend.signOut()}>
                Sign out
              </Button>
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={signIn}
              disabled={busy}
              className="mt-8 inline-flex h-11 w-full items-center justify-center gap-3 rounded-full border border-line bg-surface text-sm font-medium text-ink shadow-soft transition hover:border-accent/40 hover:bg-surface2 disabled:opacity-60"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <GoogleG />}
              Continue with Google
            </button>
            {error && <p className="mt-3 text-xs text-danger">{error}</p>}
            <p className="mt-6 text-[11px] text-ink3">Everything is saved to your account, so it’s the same on every device.</p>
          </>
        )}
      </Shell>
    );

  return children({ ...session, signOut: () => backend.signOut() });
}
