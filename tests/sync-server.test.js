import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const TOKEN = 'test-only-sync-token-with-at-least-24-chars';
let port;
let dataDir;
let child;
let baseUrl;

async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => server.listen(0, '127.0.0.1', resolve).once('error', reject));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Could not allocate a test port');
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return address.port;
}

before(async () => {
  port = await freePort();
  dataDir = await mkdtemp(path.join(tmpdir(), 'medical-store-sync-test-'));
  baseUrl = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, ['server.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      SYNC_PORT: String(port),
      SYNC_TOKEN: TOKEN,
      SYNC_DATA_DIR: dataDir,
      SYNC_ALLOWED_ORIGINS: 'http://localhost:3000',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk.toString(); });
  child.stderr.on('data', chunk => { output += chunk.toString(); });
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Sync server exited early: ${output}`);
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  child.kill('SIGTERM');
  throw new Error(`Sync server did not start in time: ${output}`);
});

after(async () => {
  if (child && child.exitCode === null) {
    child.kill('SIGTERM');
    await new Promise(resolve => child.once('exit', resolve));
  }
  if (dataDir) await rm(dataDir, { recursive: true, force: true });
});

test('health endpoint exposes service status but no store data', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, service: 'ms-medical-store-sync', authRequired: true });
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('sync data requires a valid token', async () => {
  const response = await fetch(`${baseUrl}/api/sync`);
  assert.equal(response.status, 401);
});

test('rejects an incorrect sync token', async () => {
  const response = await fetch(`${baseUrl}/api/sync`, {
    headers: { 'X-Sync-Token': 'incorrect-token-that-is-long-enough-to-test' },
  });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error, 'Invalid sync token.');
});

test('rejects browser origins not on the allowlist', async () => {
  const response = await fetch(`${baseUrl}/api/sync`, { headers: { Origin: 'https://untrusted.example' } });
  assert.equal(response.status, 403);
});

test('accepts a valid snapshot and increments revision', async () => {
  const response = await fetch(`${baseUrl}/api/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Sync-Token': TOKEN },
    body: JSON.stringify({ expectedRevision: 0, snapshot: { refilldesk_customers_v1: '[]', refilldesk_stock_v1: '[]' } }),
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.revision, 1);
});

test('rejects malformed JSON with a controlled client error', async () => {
  const response = await fetch(`${baseUrl}/api/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Sync-Token': TOKEN },
    body: '{"expectedRevision":',
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, 'Invalid JSON request.');
});

test('rejects stale revisions instead of overwriting newer data', async () => {
  const response = await fetch(`${baseUrl}/api/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Sync-Token': TOKEN },
    body: JSON.stringify({ expectedRevision: 0, snapshot: { refilldesk_customers_v1: '[]' } }),
  });
  assert.equal(response.status, 409);
  assert.equal((await response.json()).error, 'SYNC_CONFLICT');
});

test('rejects unsupported snapshot keys and non-string values', async () => {
  for (const snapshot of [
    { customers: '[]' },
    { refilldesk_stock_v1: { qty: 5 } },
  ]) {
    const response = await fetch(`${baseUrl}/api/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Sync-Token': TOKEN },
      body: JSON.stringify({ expectedRevision: 1, snapshot }),
    });
    assert.equal(response.status, 400);
  }
});

test('rejects snapshots with too many keys', async () => {
  const snapshot = Object.fromEntries(Array.from({ length: 501 }, (_, index) => [`refilldesk_test_${index}`, 'x']));
  const response = await fetch(`${baseUrl}/api/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Sync-Token': TOKEN },
    body: JSON.stringify({ expectedRevision: 1, snapshot }),
  });
  assert.equal(response.status, 413);
});
