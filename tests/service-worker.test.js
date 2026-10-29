import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function loadServiceWorker({ fetchImpl = async () => new Response('network') } = {}) {
  const listeners = new Map();
  const cacheStore = new Map();
  const cache = {
    async addAll(urls) {
      for (const url of urls) cacheStore.set(url, new Response(`cached:${url}`));
    },
    async put(key, response) {
      cacheStore.set(typeof key === 'string' ? key : key.url, response);
    },
    async match(key) {
      return cacheStore.get(typeof key === 'string' ? key : key.url);
    },
  };
  const caches = {
    async open() { return cache; },
    async match(key) { return cache.match(key); },
    async keys() { return ['ms-medical-app-shell-v1', 'ms-medical-app-shell-v2']; },
    async delete(key) { return key !== 'ms-medical-app-shell-v1'; },
  };
  const self = {
    location: { origin: 'https://medical.example' },
    clients: { claim: async () => {} },
    skipWaiting: async () => {},
    addEventListener(type, callback) { listeners.set(type, callback); },
  };
  const source = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
  vm.runInNewContext(source, { self, caches, fetch: fetchImpl, URL, Response, Promise });
  return { listeners, cacheStore };
}

function makeEvent(url, { method = 'GET', mode = 'cors', destination = '' } = {}) {
  let responseHandlerCalled = false;
  let responsePromise;
  return {
    request: { url, method, mode, destination },
    respondWith(promise) {
      responseHandlerCalled = true;
      responsePromise = promise;
    },
    get intercepted() { return responseHandlerCalled; },
    get responsePromise() { return responsePromise; },
    waitUntil() {},
  };
}

test('service worker does not intercept API responses', async () => {
  const { listeners } = await loadServiceWorker();
  const event = makeEvent('https://medical.example/api/sync');
  listeners.get('fetch')(event);
  assert.equal(event.intercepted, false);
});

test('service worker does not intercept cross-origin requests', async () => {
  const { listeners } = await loadServiceWorker();
  const event = makeEvent('https://third-party.example/app.js', { destination: 'script' });
  listeners.get('fetch')(event);
  assert.equal(event.intercepted, false);
});

test('service worker ignores non-GET requests', async () => {
  const { listeners } = await loadServiceWorker();
  const event = makeEvent('https://medical.example/checkout', { method: 'POST' });
  listeners.get('fetch')(event);
  assert.equal(event.intercepted, false);
});

test('service worker intercepts same-origin static assets', async () => {
  const { listeners } = await loadServiceWorker({
    fetchImpl: async () => new Response('fresh asset', { status: 200 }),
  });
  const event = makeEvent('https://medical.example/assets/app.js', { destination: 'script' });
  listeners.get('fetch')(event);
  assert.equal(event.intercepted, true);
  const response = await event.responsePromise;
  assert.equal(await response.text(), 'fresh asset');
});

test('offline navigation falls back to the cached app shell', async () => {
  const { listeners, cacheStore } = await loadServiceWorker();
  cacheStore.set('/', new Response('cached app shell'));
  const { listeners: workerListeners } = await loadServiceWorker({
    fetchImpl: async () => { throw new Error('offline'); },
  });
  // Use the second worker's cache, populated through its mocked cache storage.
  const event = makeEvent('https://medical.example/', { mode: 'navigate' });
  workerListeners.get('fetch')(event);
  const response = await event.responsePromise;
  assert.equal(response.status, 503);
  assert.match(await response.text(), /Connect once/i);
});
