/**
 * Service Worker Simple - Sin problemas de runtime
 * Configuración básica para evitar errores de message port
 */

const CACHE_NAME = 'dr-group-v1.0.0';

self.addEventListener('install', (event) => {
  console.log('✅ Service Worker: Installing');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activating');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🧹 Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Manejo básico de fetch sin interferir con Firebase
self.addEventListener('fetch', (event) => {
  // Solo cachear recursos estáticos, no Firebase
  if (event.request.url.includes('firebase') || 
      event.request.url.includes('googleapis')) {
    return; // Dejar que Firebase maneje sus propias requests
  }
  
  // Cache solo recursos estáticos del proyecto
  if (event.request.destination === 'script' ||
      event.request.destination === 'style' ||
      event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});

console.log('🚀 DR Group Service Worker loaded successfully');
