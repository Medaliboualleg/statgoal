// StatGoal service worker: app shell cached for offline start; API is network-first
// with the last good answer as offline fallback.
const SHELL = 'statgoal-shell-v1';
const DATA = 'statgoal-data-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(['/', '/manifest.webmanifest', '/icon.svg', '/icon-192.png'])));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => ![SHELL, DATA].includes(k)).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => { if (res.ok) caches.open(DATA).then((c) => c.put(e.request, res.clone())); return res; })
        .catch(() => caches.match(e.request)),
    );
    return;
  }

  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('/')));
    return;
  }

  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      if (res.ok && /\.(js|css|png|svg|woff2?)$/.test(url.pathname)) caches.open(SHELL).then((c) => c.put(e.request, res.clone()));
      return res;
    })),
  );
});
