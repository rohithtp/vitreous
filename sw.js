const CACHE_NAME = 'glass-timer-v4';

// Local app shell + vendored CDN fallbacks — precached on install so the app
// boots and renders fully styled offline even on the very first load.
const APP_SHELL = [
  'timer.html',
  'manifest.json',
  'icon.svg',
  'vendor/tailwind.css',
  'vendor/fonts.css',
  'vendor/fonts/inter-latin-300-normal.woff2',
  'vendor/fonts/inter-latin-400-normal.woff2',
  'vendor/fonts/inter-latin-600-normal.woff2',
  'vendor/fonts/jetbrains-mono-latin-400-normal.woff2',
  'vendor/fonts/jetbrains-mono-latin-700-normal.woff2'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;

  // Only handle GET; let the browser deal with the rest.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isDocument =
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    url.pathname.endsWith('timer.html');

  // Network-first for the HTML shell so code updates ship without a manual
  // cache-version bump. Falls back to cache when offline.
  if (url.origin === self.location.origin && isDocument) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then(cached => cached || caches.match('timer.html'))
        )
    );
    return;
  }

  // Cache-first with runtime caching for everything else: same-origin assets
  // AND cross-origin dependencies (Tailwind CDN, Google Fonts) so the app is
  // fully styled offline after the first online visit.
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request)
        .then(response => {
          // Cache successful (ok) or opaque (no-cors cross-origin) responses.
          if (response && (response.ok || response.type === 'opaque')) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
