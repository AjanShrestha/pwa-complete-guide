module.exports = {
  globDirectory: 'public/',
  globPatterns: ['**/*.{html,ico,json,css,js}', 'src/images/*.{jpg,png}'],
  globIgnores: ['../workbox-config.js', 'help/**'],
  swDest: 'public/service-worker.js',
};
