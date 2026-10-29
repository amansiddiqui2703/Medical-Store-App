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
const MAX_SNAPSHOT_BYTES = 16 * 1024 * 1024;
const MAX_SNAPSHOT_KEYS = 500;
const ALLOWED_ORIGINS = new Set(
  (process.env.SYNC_ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);

if (!TOKEN || TOKEN.length < 24) {
  console.error('Set SYNC_TOKEN to a random secret of at least 24 characters before starting the sync server.');
  process.exit(1);
}

app.disable('x-powered-by');
app.use((req, res, next) => {
  const origin = req.get('Origin');
  // Requests from browser origins must be explicitly allowed. Non-browser clients
  // without an Origin header can still use the token-authenticated API.
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return res.status(403).json({ error: 'This browser origin is not allowed. Configure SYNC_ALLOWED_ORIGINS.' });
  }
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Sync-Token');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: MAX_BYTES, strict: true }));

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
    if (
      parsed &&
      Number.isInteger(parsed.revision) &&
      parsed.revision >= 0 &&
      parsed.snapshot &&
      typeof parsed.snapshot === 'object' &&
      !Array.isArray(parsed.snapshot)
    ) {
      return parsed;
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      console.error('Could not read sync data file:', error?.message || error);
    }
  }
  return { revision: 0, snapshot: {}, updatedAt: null };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'ms-medical-store-sync', authRequired: true });
});

app.get('/api/sync', requireAuth, async (_req, res, next) => {
  try {
    res.json(await readSnapshot());
  } catch (error) {
    next(error);
  }
});

app.post('/api/sync', requireAuth, async (req, res, next) => {
  try {
    const { expectedRevision, snapshot } = req.body || {};
    if (!Number.isInteger(expectedRevision) || expectedRevision < 0 || !snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
      return res.status(400).json({ error: 'Expected a non-negative integer expectedRevision and a snapshot object.' });
    }

    const entries = Object.entries(snapshot);
    if (entries.length > MAX_SNAPSHOT_KEYS) {
      return res.status(413).json({ error: 'Snapshot contains too many stored items.' });
    }

    let snapshotBytes;
    try {
      snapshotBytes = Buffer.byteLength(JSON.stringify(snapshot), 'utf8');
    } catch {
      return res.status(400).json({ error: 'Snapshot is not valid JSON data.' });
    }
    if (snapshotBytes > MAX_SNAPSHOT_BYTES) {
      return res.status(413).json({ error: 'Snapshot is too large.' });
    }

    for (const [key, value] of entries) {
      if (!key.startsWith('refilldesk_') || typeof value !== 'string') {
        return res.status(400).json({ error: 'Snapshot contains an unsupported key or value.' });
      }
    }

    const current = await readSnapshot();
    if (expectedRevision !== current.revision) {
      return res.status(409).json({ error: 'SYNC_CONFLICT', revision: current.revision, updatedAt: current.updatedAt });
    }

    await fs.mkdir(DATA_DIR, { recursive: true });
    if (current.revision > 0) {
      const backup = path.join(DATA_DIR, `medical-store-sync.backup-${Date.now()}.json`);
      await fs.copyFile(DATA_FILE, backup);
    }

    const next = { revision: current.revision + 1, snapshot, updatedAt: new Date().toISOString() };
    const temp = DATA_FILE + '.tmp';
    await fs.writeFile(temp, JSON.stringify(next), { mode: 0o600 });
    await fs.rename(temp, DATA_FILE);
    res.json({ ok: true, revision: next.revision, updatedAt: next.updatedAt });
  } catch (error) {
    next(error);
  }
});

app.use((err, _req, res, _next) => {
  console.error('Sync request failed:', err?.message || err);
  res.status(err?.status || 500).json({
    error: err?.status === 413 ? 'Request too large.' : err?.status === 400 ? 'Invalid JSON request.' : 'Sync server error.',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`M.S. Medical Store private sync server listening on port ${PORT}`);
  console.log('Keep this server reachable only through a trusted private network such as Tailscale.');
  console.log('Set SYNC_ALLOWED_ORIGINS to the exact browser origin(s) used by the app.');
});
