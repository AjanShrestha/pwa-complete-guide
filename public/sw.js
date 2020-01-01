self.addEventListener('install', event => {
  console.log(
    `[Service Worker] Installing Service Worker ... ${JSON.stringify(event)}`
  );
  event.waitUntil(
    caches.open('static').then(cache => {
      console.log('[Servie Worker] Precaching App Shell');
      cache.add('/src/js/app.js');
    })
  );
});

self.addEventListener('activate', event => {
  console.log(
    `[Service Worker] Activating Service Worker ... ${JSON.stringify(event)}`
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});
