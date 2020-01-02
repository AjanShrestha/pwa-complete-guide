importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

const CACHE_STATIC_NAME = 'static-v13';
const CACHE_DYNAMIC_NAME = 'dynamic-v3';
const STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/feed.js',
  '/src/js/promise.js',
  '/src/js/fetch.js',
  '/src/js/idb.js',
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
];

// function trimCache(cacheName, maxItems) {
//   caches.open(cacheName).then(cache => {
//     return cache.keys().then(keys => {
//       if (keys.length > maxItems) {
//         cache.delete(keys[0]).then(trimCache(cacheName, maxItems));
//       }
//     });
//   });
// }

function isInArray(string, array) {
  for (let i = 0; i < array.length; i++) {
    if (array[i] === string) {
      return true;
    }
  }
  return false;
}

self.addEventListener('install', event => {
  console.log(
    `[Service Worker] Installing Service Worker ... ${JSON.stringify(event)}`
  );
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then(cache => {
      console.log('[Servie Worker] Precaching App Shell');
      cache.addAll(STATIC_FILES);
    })
  );
});

self.addEventListener('activate', event => {
  console.log(
    `[Service Worker] Activating Service Worker ... ${JSON.stringify(event)}`
  );
  event.waitUntil(
    caches.keys().then(keyList =>
      Promise.all(
        keyList.map(key => {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            console.log(`[Service Worker] Removing old cache. ${key}`);
            return caches.delete(key);
          }
        })
      )
    )
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = 'https://pwagram-e7d99.firebaseio.com/posts';

  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(
      fetch(event.request).then(res => {
        const clonedRes = res.clone();
        clearAllData('posts')
          .then(() => {
            return clonedRes.json();
          })
          .then(data => {
            for (let key in data) {
              writeData('posts', data[key]);
            }
          });
        return res;
      })
    );
  } else if (isInArray(event.request.url, STATIC_FILES)) {
    event.respondWith(caches.match(event.request));
  } else {
    event.respondWith(
      caches.match(event.request).then(response => {
        if (response) {
          return response;
        } else {
          return fetch(event.request)
            .then(res =>
              caches.open(CACHE_DYNAMIC_NAME).then(cache => {
                // trimCache(CACHE_DYNAMIC_NAME, 3);
                cache.put(event.request.url, res.clone());
                return res;
              })
            )
            .catch(err => {
              return caches.open(CACHE_STATIC_NAME).then(cache => {
                if (event.request.headers.get('accept').includes('text/html')) {
                  return cache.match('/offline.html');
                }
              });
            });
        }
      })
    );
  }
});
