/**
 * Service Worker para Cache Persistente - FASE 2
 * Cache avanzado que persiste entre sesiones y reduce consultas Firebase
 */

const CACHE_NAME = 'dr-group-firebase-v1';
const FIREBASE_CACHE_KEY = 'firebase-data-cache';

// 🎯 Estrategia de cache para datos Firebase
const CACHE_STRATEGIES = {
  commitments: {
    ttl: 5 * 60 * 1000, // 5 minutos
    staleWhileRevalidate: true
  },
  companies: {
    ttl: 30 * 60 * 1000, // 30 minutos (datos más estáticos)
    staleWhileRevalidate: true
  },
  counts: {
    ttl: 2 * 60 * 1000, // 2 minutos
    staleWhileRevalidate: false
  }
};

self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker: Installing Firebase Cache SW');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating Firebase Cache SW');
  event.waitUntil(self.clients.claim());
});

// 🎯 Interceptar requests y aplicar cache strategy
self.addEventListener('fetch', (event) => {
  // Solo cachear requests específicos de Firebase
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('firebase')) {
    
    event.respondWith(handleFirebaseRequest(event.request));
  }
});

/**
 * Maneja requests de Firebase con cache inteligente
 */
async function handleFirebaseRequest(request) {
  const url = new URL(request.url);
  const cacheKey = generateCacheKey(request);
  
  try {
    // 📊 Intentar obtener del cache primero
    const cachedResponse = await getCachedData(cacheKey);
    
    if (cachedResponse && !isExpired(cachedResponse)) {
      console.log('🚀 SW Cache Hit:', cacheKey);
      return new Response(cachedResponse.data, {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 🔥 Si no hay cache o expiró, hacer request real
    const response = await fetch(request);
    const data = await response.text();
    
    // 💾 Guardar en cache para futuras requests
    await setCachedData(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: determineTTL(request)
    });
    
    console.log('🔥 SW Firebase Request:', cacheKey);
    return new Response(data, {
      status: response.status,
      headers: response.headers
    });

  } catch (error) {
    console.error('❌ SW Error:', error);
    
    // 🔄 Fallback al cache si hay error de red
    const fallbackCache = await getCachedData(cacheKey);
    if (fallbackCache) {
      return new Response(fallbackCache.data, {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

/**
 * Genera clave única para cache basada en request
 */
function generateCacheKey(request) {
  const url = new URL(request.url);
  
  // Extraer parámetros importantes para la clave
  const pathSegments = url.pathname.split('/');
  const collection = pathSegments.find(segment => 
    ['commitments', 'companies', 'users'].includes(segment)
  ) || 'unknown';
  
  const queryParams = url.searchParams.toString();
  return `${collection}-${btoa(queryParams)}`;
}

/**
 * Determina TTL basado en el tipo de request
 */
function determineTTL(request) {
  const url = request.url;
  
  if (url.includes('commitments')) return CACHE_STRATEGIES.commitments.ttl;
  if (url.includes('companies')) return CACHE_STRATEGIES.companies.ttl;
  if (url.includes(':count')) return CACHE_STRATEGIES.counts.ttl;
  
  return 2 * 60 * 1000; // Default 2 minutos
}

/**
 * Obtiene datos del cache persistente
 */
async function getCachedData(key) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(key);
  
  if (cachedResponse) {
    return await cachedResponse.json();
  }
  
  return null;
}

/**
 * Guarda datos en cache persistente
 */
async function setCachedData(key, data) {
  const cache = await caches.open(CACHE_NAME);
  const response = new Response(JSON.stringify(data));
  
  await cache.put(key, response);
}

/**
 * Verifica si los datos en cache han expirado
 */
function isExpired(cachedData) {
  if (!cachedData.timestamp || !cachedData.ttl) return true;
  
  return (Date.now() - cachedData.timestamp) > cachedData.ttl;
}

// 🧹 Limpieza periódica del cache
setInterval(async () => {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  
  for (const request of keys) {
    const response = await cache.match(request);
    if (response) {
      const data = await response.json();
      if (isExpired(data)) {
        await cache.delete(request);
        console.log('🧹 SW: Cleaned expired cache entry');
      }
    }
  }
}, 5 * 60 * 1000); // Cada 5 minutos
