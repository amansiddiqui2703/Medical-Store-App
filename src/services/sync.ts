const PREFIX = 'refilldesk_';
const CONFIG_KEY = 'refilldesk_sync_config_v1';
const REVISION_KEY = 'refilldesk_sync_revision_v1';
const BASE_KEY = 'refilldesk_sync_base_v1';
const LAST_SYNC_KEY = 'refilldesk_sync_last_success_v1';

export type SyncResult =
  | { status: 'synced'; message: string; revision: number }
  | { status: 'offline'; message: string }
  | { status: 'conflict'; message: string; revision?: number }
  | { status: 'setup'; message: string };

type SyncConfig = { serverUrl: string; token: string };
type ServerSnapshot = { revision: number; snapshot: Record<string, string>; updatedAt: string | null };

export function getSyncConfig(): SyncConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SyncConfig;
    return parsed.serverUrl && parsed.token ? parsed : null;
  } catch {
    return null;
  }
}

export function saveSyncConfig(serverUrl: string, token: string): void {
  const normalized = serverUrl.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(normalized)) throw new Error('Server URL must start with http:// or https://');
  if (token.trim().length < 24) throw new Error('Sync token must be at least 24 characters.');
  localStorage.setItem(CONFIG_KEY, JSON.stringify({ serverUrl: normalized, token: token.trim() }));
}

function getLocalSnapshot(): Record<string, string> {
  const snapshot: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(PREFIX) || key.startsWith('refilldesk_sync_')) continue;
    const value = localStorage.getItem(key);
    if (value !== null) snapshot[key] = value;
  }
  return snapshot;
}

function snapshotEquals(a: Record<string, string>, b: Record<string, string>): boolean {
  const aKeys = Object.keys(a).sort();
  const bKeys = Object.keys(b).sort();
  return aKeys.length === bKeys.length && aKeys.every((key, i) => key === bKeys[i] && a[key] === b[key]);
}

async function request<T>(config: SyncConfig, path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${config.serverUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'X-Sync-Token': config.token, ...(init.headers || {}) },
    });
    const body = await response.json().catch(() => ({}));
    if (response.status === 409) throw Object.assign(new Error('SYNC_CONFLICT'), { revision: body.revision });
    if (!response.ok) throw new Error(body.error || `Sync server returned ${response.status}`);
    return body as T;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function syncNow(): Promise<SyncResult> {
  const config = getSyncConfig();
  if (!config) return { status: 'setup', message: 'Set the private sync server URL and token first.' };
  if (!navigator.onLine) return { status: 'offline', message: 'Internet is unavailable. Changes remain saved on this device.' };

  let remote: ServerSnapshot;
  try {
    remote = await request<ServerSnapshot>(config, '/api/sync');
  } catch (error) {
    if (error instanceof Error && error.message === 'SYNC_CONFLICT') {
      return { status: 'conflict', message: 'Another device updated the server. No data was overwritten.' };
    }
    return { status: 'offline', message: 'Sync server is unreachable. Your local data is still saved on this device.' };
  }

  const local = getLocalSnapshot();
  const baseRaw = localStorage.getItem(BASE_KEY);
  const lastRevisionRaw = localStorage.getItem(REVISION_KEY);
  const base = baseRaw ? JSON.parse(baseRaw) as Record<string, string> : null;
  const lastRevision = lastRevisionRaw === null ? null : Number(lastRevisionRaw);

  // First pairing: only automatically seed an empty server. Never silently replace existing records.
  if (lastRevision === null) {
    if (remote.revision === 0) {
      try {
        const saved = await request<{ revision: number; updatedAt: string }>(config, '/api/sync', {
          method: 'POST',
          body: JSON.stringify({ expectedRevision: 0, snapshot: local }),
        });
        localStorage.setItem(REVISION_KEY, String(saved.revision));
        localStorage.setItem(BASE_KEY, JSON.stringify(local));
        localStorage.setItem(LAST_SYNC_KEY, saved.updatedAt);
        return { status: 'synced', message: 'This device initialized the empty sync server.', revision: saved.revision };
      } catch {
        return { status: 'conflict', message: 'Initial sync conflicted. No data was overwritten.' };
      }
    }
    if (Object.keys(local).length === 0) {
      applySnapshot(remote.snapshot);
      localStorage.setItem(REVISION_KEY, String(remote.revision));
      localStorage.setItem(BASE_KEY, JSON.stringify(remote.snapshot));
      localStorage.setItem(LAST_SYNC_KEY, remote.updatedAt || new Date().toISOString());
      return { status: 'synced', message: 'Downloaded the existing store data to this device.', revision: remote.revision };
    }
    return { status: 'conflict', revision: remote.revision, message: 'Both this device and the server already contain data. Export a backup and choose a primary device before pairing; nothing was overwritten.' };
  }

  const localChanged = !base || !snapshotEquals(local, base);
  const remoteChanged = remote.revision !== lastRevision;
  if (remoteChanged && localChanged) {
    return { status: 'conflict', revision: remote.revision, message: 'Both devices changed since the last sync. Nothing was overwritten; export backups before resolving the conflict.' };
  }
  if (remoteChanged && !localChanged) {
    applySnapshot(remote.snapshot);
    localStorage.setItem(REVISION_KEY, String(remote.revision));
    localStorage.setItem(BASE_KEY, JSON.stringify(remote.snapshot));
    localStorage.setItem(LAST_SYNC_KEY, remote.updatedAt || new Date().toISOString());
    return { status: 'synced', message: 'Downloaded changes from the other device.', revision: remote.revision };
  }
  if (!localChanged) {
    return { status: 'synced', message: 'Already up to date.', revision: remote.revision };
  }
  try {
    const saved = await request<{ revision: number; updatedAt: string }>(config, '/api/sync', {
      method: 'POST',
      body: JSON.stringify({ expectedRevision: remote.revision, snapshot: local }),
    });
    localStorage.setItem(REVISION_KEY, String(saved.revision));
    localStorage.setItem(BASE_KEY, JSON.stringify(local));
    localStorage.setItem(LAST_SYNC_KEY, saved.updatedAt);
    return { status: 'synced', message: 'Uploaded this device’s changes.', revision: saved.revision };
  } catch (error) {
    return { status: 'conflict', message: 'Sync conflict detected. No data was overwritten.' };
  }
}

function applySnapshot(snapshot: Record<string, string>): void {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(PREFIX) && !key.startsWith('refilldesk_sync_')) localStorage.removeItem(key);
  }
  for (const [key, value] of Object.entries(snapshot)) {
    if (key.startsWith(PREFIX) && !key.startsWith('refilldesk_sync_')) localStorage.setItem(key, value);
  }
  window.dispatchEvent(new CustomEvent('medical-store-sync-applied'));
}

export function getLastSyncTime(): string | null {
  return localStorage.getItem(LAST_SYNC_KEY);
}
