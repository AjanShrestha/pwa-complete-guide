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
