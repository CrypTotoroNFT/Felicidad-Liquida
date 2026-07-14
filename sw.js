const CACHE_NAME = 'felicidad-liquida-cache-v22';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './support.js',
  './manifest.json',
  './assets/felicidad_liquida_icon.png',
  './assets/felicidad_liquida_logo.png',
  './assets/mari_milena_avatar.png',
  './assets/zumba_elite.jpeg',
  './assets/natacion_cruce.jpeg',
  './assets/caminata_charla.jpeg',
  './assets/caminata_sola.jpeg',
  './assets/dique_rio_ceballos.jpeg',
  './assets/dique_seco.jpeg',
  './assets/dique_bajo.jpeg',
  './assets/dique_medio.jpeg'
];

// Install Event - Pre-cache all static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching offline assets');
        const cachePromises = ASSETS_TO_CACHE.map((asset) => {
          return cache.add(asset).catch((err) => {
            console.warn(`[Service Worker] Failed to cache: ${asset}`, err);
          });
        });
        return Promise.all(cachePromises);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Cache-First / Network-Fallback Strategy
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch((error) => {
          console.error('[Service Worker] Fetch failed:', error);
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
