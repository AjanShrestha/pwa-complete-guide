importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js'
);
importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

workbox.routing.registerRoute(
  /.*(?:firebasestorage\.googleapis)\.com.*$/,
  // cache then network
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'post-images',
  })
);

workbox.routing.registerRoute(
  /.*(?:googleapis|gstatic)\.com.*$/,
  // cache then network
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'google-fonts',
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 3,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  })
);

https: workbox.routing.registerRoute(
  'https://pwagram-e7d99.firebaseio.com/posts.json',
  ({url, event}) => {
    return fetch(event.request).then(res => {
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
    });
  }
);

https: workbox.routing.registerRoute(
  ({event}) => event.request.headers.get('accept').includes('text/html'),
  ({url, event}) => {
    return caches.match(event.request).then(function(response) {
      if (response) {
        return response;
      } else {
        return fetch(event.request)
          .then(function(res) {
            return caches.open('dynamic').then(function(cache) {
              cache.put(event.request.url, res.clone());
              return res;
            });
          })
          .catch(function(err) {
            return caches
              .match(workbox.precaching.getCacheKeyForURL('/offline.html'))
              .then(res => {
                return res;
              });
          });
      }
    });
  }
);

workbox.routing.registerRoute(
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
  // cache then network
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'material-css',
  })
);

workbox.precaching.precacheAndRoute([]);
