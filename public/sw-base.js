importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js'
);

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
  })
);

workbox.routing.registerRoute(
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
  // cache then network
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'material-css',
  })
);

workbox.precaching.precacheAndRoute([]);
