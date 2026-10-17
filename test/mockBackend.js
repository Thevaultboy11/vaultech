// Same API as src/lib/cloud/firebaseBackend.js, backed by test/mockServer.mjs.
// Only used when the app is built/run with CLOUD_MOCK=1. "Sign in" picks a fake account.
const BASE = 'http://localhost:8787';
const USER_KEY = 'mock-auth-user';

export const backendName = 'Mock Firestore';

const listeners = new Set();
const current = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
};

export function onAuth(cb) {
  listeners.add(cb);
  setTimeout(() => cb(current()), 50);
  return () => listeners.delete(cb);
}

export async function signIn() {
  const email = window.prompt('Mock sign-in — email', 'dzemal@example.com');
  if (!email) throw Object.assign(new Error('cancelled'), { code: 'auth/popup-closed-by-user' });
  const user = { uid: 'uid-' + email.replace(/[^a-z0-9]/gi, ''), email, name: 'Dzemal Dzananovic', photo: '' };
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  listeners.forEach((cb) => cb(user));
}

export async function signOut() {
  localStorage.removeItem(USER_KEY);
  listeners.forEach((cb) => cb(null));
}

const url = (uid) => `${BASE}/doc/${encodeURIComponent(uid)}`;
async function call(method, u, body) {
  const r = await fetch(u, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
  const data = await r.json().catch(() => null);
  if (!r.ok) throw Object.assign(new Error(data?.code || 'error'), { code: data?.code || 'unknown' });
  return data;
}

export const load = (uid) => call('GET', url(uid)).then((d) => d && { data: d.data, updatedAt: d.updatedAt });
export const save = (uid, payload) => call('PUT', url(uid), payload);

export function watch(uid, onData, onError) {
  let last;
  let stopped = false;
  const tick = async () => {
    if (stopped) return;
    try {
      const d = await call('GET', url(uid));
      const sig = d ? d.rev : 0;
      if (sig !== last) {
        last = sig;
        onData(d ? { data: d.data, updatedAt: d.updatedAt } : null, false);
      }
    } catch (e) {
      onError(e);
    }
    if (!stopped) setTimeout(tick, 300);
  };
  tick();
  return () => {
    stopped = true;
  };
}
