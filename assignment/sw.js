const CACHE_STATIC_NAME = 'static-v1';
const CACHE_DYNAMIC_NAME = 'dynamic-v1';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then(cache => {
      cache.addAll([
        '/',
        '/index.html',
        '/src/css/app.css',
        '/src/css/main.css',
        '/src/js/main.js',
        '/src/js/material.min.js',
        'https://fonts.googleapis.com/css?family=Roboto:400,700',
        'https://fonts.googleapis.com/icon?family=Material+Icons',
        'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
      ]);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keyList =>
      Promise.all(
        keyList.map(key => {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      } else {
        return fetch(event.request)
          .then(res => {
            return caches.open(CACHE_DYNAMIC_NAME).then(cache => {
              cache.put(event.request.url, res.clone());
              return res;
            });
          })
          .catch(err => {});
      }
    })
  );
});
