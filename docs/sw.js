// No caching — always serve fresh from network (GitHub Pages CDN is fast enough).
// This SW exists only to enable push notifications.

self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  // Delete any old caches left from previous versions
  caches.keys()
    .then(keys => Promise.all(keys.map(k => caches.delete(k))))
    .then(() => self.clients.claim())
));

// Show notification triggered from main thread
self.addEventListener('message', e => {
  if (e.data?.type === 'NOTIFY') {
    self.registration.showNotification(e.data.title, {
      body:     e.data.body,
      icon:     './icon-192.png',
      badge:    './icon-192.png',
      tag:      e.data.tag,
      renotify: false,
    });
  }
});
