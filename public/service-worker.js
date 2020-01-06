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

workbox.precaching.precacheAndRoute([
  {
    "url": "404.html",
    "revision": "0a27a4163254fc8fce870c8cc3a3f94f"
  },
  {
    "url": "favicon.ico",
    "revision": "2cab47d9e04d664d93c8d91aec59e812"
  },
  {
    "url": "index.html",
    "revision": "2ad3e6c6ac10185df69853aed6892b3e"
  },
  {
    "url": "manifest.json",
    "revision": "9bfb6af136bdbeaa6bfb8e2d3a83fc88"
  },
  {
    "url": "offline.html",
    "revision": "960ed3ae994ea830d28936d74588d89b"
  },
  {
    "url": "src/css/app.css",
    "revision": "59d917c544c1928dd9a9e1099b0abd71"
  },
  {
    "url": "src/css/feed.css",
    "revision": "4b61e6c5cc1607426daaffc313e6ce52"
  },
  {
    "url": "src/css/help.css",
    "revision": "1c6d81b27c9d423bece9869b07a7bd73"
  },
  {
    "url": "src/js/app.js",
    "revision": "602ae485f259dfb01156559d9b9832df"
  },
  {
    "url": "src/js/feed.js",
    "revision": "a47292e18f7b819acb9775067caa1f6d"
  },
  {
    "url": "src/js/fetch.js",
    "revision": "6b82fbb55ae19be4935964ae8c338e92"
  },
  {
    "url": "src/js/idb.js",
    "revision": "017ced36d82bea1e08b08393361e354d"
  },
  {
    "url": "src/js/material.min.js",
    "revision": "713af0c6ce93dbbce2f00bf0a98d0541"
  },
  {
    "url": "src/js/promise.js",
    "revision": "10c2238dcd105eb23f703ee53067417f"
  },
  {
    "url": "src/js/utility.js",
    "revision": "33ba310ae6b5e18f6e7e8b23eb6f1a58"
  },
  {
    "url": "sw-base.js",
    "revision": "abbe31ee3d2135e0c2c2ed8cbbe9c348"
  },
  {
    "url": "sw.js",
    "revision": "bd829b7248df27837ba23ddfb524742f"
  },
  {
    "url": "src/images/main-image-lg.jpg",
    "revision": "31b19bffae4ea13ca0f2178ddb639403"
  },
  {
    "url": "src/images/main-image-sm.jpg",
    "revision": "c6bb733c2f39c60e3c139f814d2d14bb"
  },
  {
    "url": "src/images/main-image.jpg",
    "revision": "5c66d091b0dc200e8e89e56c589821fb"
  },
  {
    "url": "src/images/sf-boat.jpg",
    "revision": "0f282d64b0fb306daf12050e812d6a19"
  }
]);
