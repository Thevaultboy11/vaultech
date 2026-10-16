// Tiny in-memory stand-in for Firestore, used only for local testing (CLOUD_MOCK=1).
// Mimics the security rule: vault keys shorter than 24 chars are refused.
import http from 'node:http';

const PORT = Number(process.env.MOCK_PORT || 8787);
const docs = new Map(); // vault → { json, updatedAt, device, rev }
let rev = 0;

const send = (res, code, body) => {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body === undefined ? '' : JSON.stringify(body));
};

http
  .createServer(async (req, res) => {
    if (req.method === 'OPTIONS') return send(res, 204);
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/dump') return send(res, 200, Object.fromEntries(docs));
    const m = url.pathname.match(/^\/doc\/([^/]+)$/);
    if (!m) return send(res, 404, { code: 'not-found' });
    const vault = decodeURIComponent(m[1]);
    if (vault.length < 24) return send(res, 403, { code: 'permission-denied' });
    const key = vault;
    if (req.method === 'GET') return send(res, 200, docs.get(key) || null);
    if (req.method === 'DELETE') {
      docs.delete(key);
      rev++;
      return send(res, 200, {});
    }
    if (req.method === 'PUT') {
      let body = '';
      for await (const c of req) body += c;
      const data = JSON.parse(body);
      if (typeof data.json !== 'string' || data.json.length >= 1_000_000) return send(res, 403, { code: 'permission-denied' });
      docs.set(key, { ...data, rev: ++rev });
      return send(res, 200, {});
    }
    send(res, 405, {});
  })
  .listen(PORT, () => console.log(`mock firestore on :${PORT}`));
