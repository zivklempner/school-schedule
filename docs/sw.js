const CACHE = 'schedule-v3';
const STATIC_FILES = [
  './', './index.html', './style.css', './app.js',
  './manifest.json', './favicon.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(STATIC_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Network-first for JSON (schedule + links change weekly)
  if (url.pathname.endsWith('.json')) {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          caches.open(CACHE).then(c => c.put(e.request, r.clone()));
          return r;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for static assets
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

// Show notification triggered from main thread
self.addEventListener('message', e => {
  if (e.data?.type === 'NOTIFY') {
    self.registration.showNotification(e.data.title, {
      body: e.data.body,
      icon: './favicon.svg',
      badge: './favicon.svg',
      tag: e.data.tag,
      renotify: false,
    });
  }
});
