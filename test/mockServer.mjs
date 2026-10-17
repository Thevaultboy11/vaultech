// Tiny in-memory stand-in for Firestore, used only for local testing (CLOUD_MOCK=1).
// Counts writes so tests can prove the app doesn't save when nothing changed.
import http from 'node:http';

const PORT = Number(process.env.MOCK_PORT || 8787);
const docs = new Map(); // uid → { data, updatedAt, rev }
let rev = 0;
let writes = 0;

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
    if (url.pathname === '/dump') return send(res, 200, { writes, docs: Object.fromEntries(docs) });
    if (url.pathname === '/reset') {
      docs.clear();
      writes = 0;
      return send(res, 200, {});
    }
    const m = url.pathname.match(/^\/doc\/([^/]+)$/);
    if (!m) return send(res, 404, { code: 'not-found' });
    const key = decodeURIComponent(m[1]);
    if (req.method === 'GET') return send(res, 200, docs.get(key) || null);
    if (req.method === 'PUT') {
      let body = '';
      for await (const c of req) body += c;
      if (body.length >= 1_000_000) return send(res, 403, { code: 'permission-denied' });
      writes++;
      docs.set(key, { ...JSON.parse(body), rev: ++rev });
      return send(res, 200, {});
    }
    send(res, 405, {});
  })
  .listen(PORT, () => console.log(`mock firestore on :${PORT}`));
