// Same API as src/lib/cloud/firebaseBackend.js, backed by test/mockServer.mjs.
// Only used when the app is built/run with CLOUD_MOCK=1.
const BASE = 'http://localhost:8787';

export const backendName = 'Mock Firestore';
export const configured = true;

const url = (vault, section) => `${BASE}/doc/${encodeURIComponent(vault)}/${encodeURIComponent(section)}`;

async function call(method, u, body) {
  const r = await fetch(u, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
  const data = await r.json().catch(() => null);
  if (!r.ok) {
    const e = new Error(data?.code || 'error');
    e.code = data?.code || 'unknown';
    throw e;
  }
  return data;
}

export function subscribe(vault, section, onData, onError) {
  let last = undefined;
  let stopped = false;
  const tick = async () => {
    if (stopped) return;
    try {
      const d = await call('GET', url(vault, section));
      const sig = d ? d.rev : 0;
      if (sig !== last) {
        last = sig;
        onData(d ? { json: d.json, updatedAt: d.updatedAt, device: d.device } : null);
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

export const write = (vault, section, payload) => call('PUT', url(vault, section), payload);
export const remove = (vault, section) => call('DELETE', url(vault, section));
