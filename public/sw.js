self.addEventListener('install', event => {
  console.log(
    `[Service Worker] Installing Service Worker ... ${JSON.stringify(event)}`
  );
});

self.addEventListener('activate', event => {
  console.log(
    `[Service Worker] Activating Service Worker ... ${JSON.stringify(event)}`
  );
});

self.addEventListener('fetch', event => {
  console.log(
    `[Service Workder] Fetching something ... ${JSON.stringify(event)}`
  );
  event.respondWith(fetch(event.request));
});
