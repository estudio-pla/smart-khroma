// Smart Khroma — Service Worker v16
// Estúdio Plá · 2026
// A cada deploy com mudanças: incrementar CACHE_NAME (v16 → v17 → etc.)

const CACHE_NAME = 'smart-khroma-v16';

const ASSETS = [
  './',
  './index.html',
  './support.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './favicon-32.png',
  './favicon-64.png',
  // Dependências CDN — cacheadas localmente para funcionar offline
  'https://unpkg.com/react@18.3.1/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone@7.29.0/babel.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request)
      .then(cached => cached || fetch(e.request)
        .then(response => {
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return response;
        })
        .catch(() => {
          if (e.request.destination === 'document') return caches.match('./index.html');
        })
      )
  );
});
