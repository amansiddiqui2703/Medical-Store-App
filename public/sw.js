// Cache only the static app shell and same-origin static assets.
// Business records remain in browser storage; API/data responses are never cached.
const CACHE_NAME = 'ms-medical-app-shell-v2';
const APP_SHELL_URL = '/';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll([
        APP_SHELL_URL,
        '/manifest.webmanifest',
        '/medical-store-icon.svg',
      ]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('ms-medical-app-shell-') && key !== CACHE_NAME)
          .map(key => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(APP_SHELL_URL, copy));
          }
          return response;
        })
        .catch(async () => {
          const shell = await caches.match(APP_SHELL_URL);
          return shell || new Response(
            'The app has not been opened online on this device yet. Connect once and reload to enable offline app-shell access.',
            { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
          );
        }),
    );
    return;
  }

  // Cache-first only for same-origin static assets. Never cache API/data requests.
  if (['script', 'style', 'worker', 'image', 'font'].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then(async cached => {
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      }),
    );
  }
});
