const CACHE = 'schedule-v4';

self.addEventListener('install', e => {
  // Activate immediately — don't wait for old SW to be idle
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', e => {
  // Delete every cache from previous versions
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first for everything: always try to get fresh content,
// fall back to cache only when offline.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(r => {
        if (r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone()));
        return r;
      })
      .catch(() => caches.match(e.request))
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
