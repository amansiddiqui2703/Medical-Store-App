import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

const app = express();
const PORT = Number(process.env.SYNC_PORT || 8787);
const TOKEN = process.env.SYNC_TOKEN;
const DATA_DIR = path.resolve(process.env.SYNC_DATA_DIR || './data');
const DATA_FILE = path.join(DATA_DIR, 'medical-store-sync.json');
const MAX_BYTES = 20 * 1024 * 1024;

if (!TOKEN || TOKEN.length < 24) {
  console.error('Set SYNC_TOKEN to a random secret of at least 24 characters before starting the sync server.');
  process.exit(1);
}

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Sync-Token');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: MAX_BYTES }));

function authorized(req) {
  const supplied = req.get('X-Sync-Token') || '';
  const a = Buffer.from(supplied);
  const b = Buffer.from(TOKEN);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function requireAuth(req, res, next) {
  if (!authorized(req)) return res.status(401).json({ error: 'Invalid sync token.' });
  next();
}
async function readSnapshot() {
  try {
    const parsed = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
    if (Number.isInteger(parsed.revision) && parsed.snapshot && typeof parsed.snapshot === 'object') return parsed;
  } catch {}
  return { revision: 0, snapshot: {}, updatedAt: null };
}
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'ms-medical-store-sync', authRequired: true }));
app.get('/api/sync', requireAuth, async (_req, res) => {
  res.json(await readSnapshot());
});
app.post('/api/sync', requireAuth, async (req, res) => {
  const { expectedRevision, snapshot } = req.body || {};
  if (!Number.isInteger(expectedRevision) || !snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
    return res.status(400).json({ error: 'Expected an integer expectedRevision and a snapshot object.' });
  }
  const current = await readSnapshot();
  if (expectedRevision !== current.revision) {
    return res.status(409).json({ error: 'SYNC_CONFLICT', revision: current.revision, updatedAt: current.updatedAt });
  }
  for (const [key, value] of Object.entries(snapshot)) {
    if (!key.startsWith('refilldesk_') || typeof value !== 'string') {
      return res.status(400).json({ error: 'Snapshot contains an unsupported key or value.' });
    }
    if (value.length > 8 * 1024 * 1024) return res.status(413).json({ error: 'A stored item is too large.' });
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  if (current.revision > 0) {
    const backup = path.join(DATA_DIR, `medical-store-sync.backup-${Date.now()}.json`);
    await fs.copyFile(DATA_FILE, backup).catch(() => {});
  }
  const next = { revision: current.revision + 1, snapshot, updatedAt: new Date().toISOString() };
  const temp = DATA_FILE + '.tmp';
  await fs.writeFile(temp, JSON.stringify(next), { mode: 0o600 });
  await fs.rename(temp, DATA_FILE);
  res.json({ ok: true, revision: next.revision, updatedAt: next.updatedAt });
});
app.use((err, _req, res, _next) => {
  console.error('Sync request failed:', err?.message || err);
  res.status(err?.status || 500).json({ error: err?.status === 413 ? 'Request too large.' : 'Sync server error.' });
});
app.listen(PORT, '0.0.0.0', () => {
  console.log(`M.S. Medical Store private sync server listening on port ${PORT}`);
  console.log('Keep this server reachable only through a trusted private network such as Tailscale.');
});
