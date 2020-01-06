importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

const CACHE_STATIC_NAME = 'static-v22';
const CACHE_DYNAMIC_NAME = 'dynamic-v4';
const STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/utility.js',
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
