self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Required by PWA specs, but we do nothing here to let standard fetch run
});
