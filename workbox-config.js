module.exports = {
  globDirectory: 'public/',
  globPatterns: ['**/*.{html,ico,json,css,js}', 'src/images/*.{jpg,png}'],
  globIgnores: ['../workbox-config.js', 'help/**'],
  swSrc: 'public/sw-base.js',
  swDest: 'public/service-worker.js',
};
