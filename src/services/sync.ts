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

function isServerSnapshot(value: unknown): value is ServerSnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  if (!Number.isInteger(candidate.revision) || (candidate.revision as number) < 0) return false;
  if (!candidate.snapshot || typeof candidate.snapshot !== 'object' || Array.isArray(candidate.snapshot)) return false;
  if (candidate.updatedAt !== null && typeof candidate.updatedAt !== 'string') return false;
  return Object.entries(candidate.snapshot as Record<string, unknown>).every(
    ([key, item]) => key.startsWith(PREFIX) && typeof item === 'string',
  );
}

function isValidSyncConfig(value: unknown): value is SyncConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.serverUrl !== 'string' || typeof candidate.token !== 'string') return false;

  const serverUrl = candidate.serverUrl.trim().replace(/\/+$/, '');
  const token = candidate.token.trim();
  if (!serverUrl || token.length < 24) return false;

  try {
    const parsed = new URL(serverUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const localHttpHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
    if (parsed.protocol === 'http:' && !localHttpHosts.has(parsed.hostname)) return false;
    if (parsed.username || parsed.password || parsed.search || parsed.hash) return false;
    return true;
  } catch {
    return false;
  }
}

function preserveInvalidSyncConfig(raw: string): void {
  // Keep malformed settings available for manual recovery, outside the syncable app-data namespace.
  try {
    localStorage.setItem(`medical_store_recovery_sync_config_${Date.now()}`, raw);
  } catch {
    // Recovery storage can fail when browser storage is full or disabled; do not block app startup.
  }
}

export function getSyncConfig(): SyncConfig | null {
  const raw = localStorage.getItem(CONFIG_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isValidSyncConfig(parsed)) {
      preserveInvalidSyncConfig(raw);
      return null;
    }
    return {
      serverUrl: parsed.serverUrl.trim().replace(/\/+$/, ''),
      token: parsed.token.trim(),
    };
  } catch {
    preserveInvalidSyncConfig(raw);
    return null;
  }
}

export function saveSyncConfig(serverUrl: string, token: string): void {
  const normalized = serverUrl.trim().replace(/\/+$/, '');
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error('Enter a valid sync server URL.');
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Sync server URL must use HTTPS.');
  }
  const localHttpHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
  if (parsed.protocol === 'http:' && !localHttpHosts.has(parsed.hostname)) {
    throw new Error('For remote devices, use an HTTPS sync URL. HTTP is allowed only for localhost testing.');
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('Do not put credentials, query parameters, or fragments in the sync server URL.');
  }
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
    const response = await request<unknown>(config, '/api/sync');
    if (!isServerSnapshot(response)) {
      return { status: 'conflict', message: 'The sync server returned invalid data. No local data was changed; export a backup before troubleshooting.' };
    }
    remote = response;
  } catch (error) {
    if (error instanceof Error && error.message === 'SYNC_CONFLICT') {
      return { status: 'conflict', message: 'Another device updated the server. No data was overwritten.' };
    }
    if (error instanceof Error && /Invalid sync token/i.test(error.message)) {
      return { status: 'setup', message: 'The sync token was rejected. Check the token on the Windows PC and reconnect.' };
    }
    return { status: 'offline', message: 'Sync server is unreachable. Your local data is still saved on this device.' };
  }

  const local = getLocalSnapshot();
  const baseRaw = localStorage.getItem(BASE_KEY);
  const lastRevisionRaw = localStorage.getItem(REVISION_KEY);
  let base: Record<string, string> | null = null;
  if (baseRaw) {
    try {
      const parsed: unknown = JSON.parse(baseRaw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) ||
          !Object.entries(parsed as Record<string, unknown>).every(([key, value]) => key.startsWith(PREFIX) && typeof value === 'string')) {
        return { status: 'conflict', message: 'Local sync metadata is invalid. Export a backup before reconnecting; no remote data was applied.' };
      }
      base = parsed as Record<string, string>;
    } catch {
      return { status: 'conflict', message: 'Local sync metadata cannot be read. Export a backup before reconnecting; no remote data was applied.' };
    }
  }
  const lastRevision = lastRevisionRaw === null ? null : Number(lastRevisionRaw);
  if (lastRevision !== null && (!Number.isInteger(lastRevision) || lastRevision < 0)) {
    return { status: 'conflict', message: 'Local sync revision is invalid. Export a backup before reconnecting; no remote data was applied.' };
  }

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
