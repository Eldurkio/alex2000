const CACHE_NAME = 'michelle-birthday-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/images/memory-1.jpg',
  './assets/images/memory-2.jpg',
  './assets/images/memory-3.jpg',
  './assets/images/memory-4.jpg',
  './assets/images/finale.jpg',
  './assets/images/hero-bg.jpg',
  './assets/audio/song.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // cache each asset individually so one missing/optional file
      // (like a not-yet-added story.mp4) never breaks the whole install
      await Promise.all(ASSETS.map((url) => cache.add(url).catch(() => {})));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
