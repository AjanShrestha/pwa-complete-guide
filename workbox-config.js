module.exports = {
  globDirectory: 'public/',
  globPatterns: [
    '**/*.{html,ico,json,css}',
    'src/images/*.{jpg,png}',
    'src/js/*.min.js',
  ],
  globIgnores: ['../workbox-config.js', 'help/**', '404.html'],
  swSrc: 'public/sw-base.js',
  swDest: 'public/service-worker.js',
};
