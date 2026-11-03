// Bump CACHE when you update the app so installed copies refresh.
const CACHE = 'koreanroots-v31';
const ASSETS = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png',
  './icons/icon-maskable-512.png', './icons/apple-touch-icon.png',
  './favicon.ico', './favicon.svg', './icons/favicon-16.png', './icons/favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // The manifest sets the app's colors and name, so always try to get the latest one.
  if (new URL(req.url).pathname.endsWith('.webmanifest')) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put('./manifest.webmanifest', copy));
        return res;
      }).catch(() => caches.match('./manifest.webmanifest'))
    );
    return;
  }
  // Pages: try network first (fresh updates), fall back to cache when offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put('./index.html', copy));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }
  // Everything else: cache first.
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
