importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js'
);

workbox.routing.registerRoute(
  /.*(?:googleapis|gstatic)\.com.*$/,
  // cache then network
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'google-fonts',
  })
);

workbox.precaching.precacheAndRoute([]);
