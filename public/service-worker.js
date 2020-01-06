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
    "url": "favicon.ico",
    "revision": "2cab47d9e04d664d93c8d91aec59e812"
  },
  {
    "url": "index.html",
    "revision": "c076fbf99bc62a7a4c6daf2bf591e932"
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
  },
  {
    "url": "src/js/app.min.js",
    "revision": "a4f3c505073323c5f0127b8c0bddd6fa"
  },
  {
    "url": "src/js/feed.min.js",
    "revision": "18f9bb68f6926cd2d8279fea1e0a514c"
  },
  {
    "url": "src/js/fetch.min.js",
    "revision": "32590119a06bf9ade8026dd12baa695e"
  },
  {
    "url": "src/js/idb.min.js",
    "revision": "ea82c8cec7e6574ed535bee7878216e0"
  },
  {
    "url": "src/js/material.min.js",
    "revision": "713af0c6ce93dbbce2f00bf0a98d0541"
  },
  {
    "url": "src/js/promise.min.js",
    "revision": "7be19d2e97926f498f2668e055e26b22"
  },
  {
    "url": "src/js/utility.min.js",
    "revision": "348e6362c581f99c31844bbdbe841b99"
  }
]);

self.addEventListener('sync', event => {
  const url =
    'https://us-central1-pwagram-e7d99.cloudfunctions.net/storePostData';
  console.log(`[Service Worker] Background syncing ${JSON.stringify(event)}`);
  if (event.tag === 'sync-new-posts') {
    console.log('[Service Worker] Syncing new Posts');
    event.waitUntil(
      readAllData('sync-posts').then(data => {
        for (let datum of data) {
          let postData = new FormData();
          postData.append('id', datum.id);
          postData.append('title', datum.title);
          postData.append('location', datum.location);
          postData.append('rawLocationLat', datum.rawLocation.lat);
          postData.append('rawLocationLng', datum.rawLocation.lng);
          postData.append('file', datum.picture, datum.id + '.png');
          fetch(url, {
            method: 'POST',
            body: postData,
          })
            .then(res => {
              console.log(res);
              console.log('Sent data', JSON.stringify(res));
              if (res.ok) {
                res
                  .json()
                  .then(resData =>
                    deleteItemFromData('sync-posts', resData.id)
                  );
              }
            })
            .catch(err => {
              console.log('Error while sending data', err);
            });
        }
      })
    );
  }
});

self.addEventListener('notificationclick', event => {
  const notification = event.notification;
  const action = event.action;

  console.log(notification);

  if (action === 'confirm') {
    console.log('Confirm was chosen');
  } else {
    console.log(action);
    event.waitUntil(
      clients.matchAll().then(clis => {
        let client = clis.find(c => c.visibility === 'visible');

        if (client !== undefined) {
          client.navigate(notification.data.url);
          client.focus();
        } else {
          clients.openWindow(notification.data.url);
        }
      })
    );
  }
  notification.close();
});

self.addEventListener('notificationclose', event => {
  console.log(`Notification was close ${JSON.stringify(event)}`);
});

self.addEventListener('push', event => {
  console.log(`Push Notification received ${JSON.stringify(event)}`);

  let data = {title: 'New!', content: 'Fallback', openUrl: '/'};
  if (event.data) {
    data = JSON.parse(event.data.text());
  }

  const options = {
    body: data.content,
    icon: '/src/images/icons/app-icon-96x96.png',
    badge: '/src/images/icons/app-icon-96x96.png',
    data: {
      url: data.openUrl,
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});
