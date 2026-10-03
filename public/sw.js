/**
 * Service Worker - Free Fire Sensitivity Calculator OB54
 * Workbox-style caching for offline-first PWA
 */

const CACHE_NAME = 'ff-ob54-v8.0.0';
const STATIC_CACHE = 'static-v8.0.0';
const DYNAMIC_CACHE = 'dynamic-v8.0.0';
const API_CACHE = 'api-v8.0.0';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/admin.html',
  '/manifest.json',
  '/src/main.ts',
  '/src/assets/styles/main.css'
];

const CACHE_STRATEGIES = {
  // Cache first for static assets
  static: ['/icons/', '/src/assets/styles/', '/src/assets/data/'],
  // Network first for API calls
  api: ['/api/'],
  // Stale while revalidate for HTML
  html: ['/index.html', '/admin.html']
};

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== API_CACHE)
            .map((key) => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch - handle requests with appropriate strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension, data: urls
  if (!url.protocol.startsWith('http')) return;

  // API calls - Network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Static assets - Cache first
  if (CACHE_STRATEGIES.static.some(path => url.pathname.startsWith(path))) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // HTML pages - Stale while revalidate
  if (CACHE_STRATEGIES.html.some(path => url.pathname === path || url.pathname === '/')) {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
    return;
  }

  // Default - Network first
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

/**
 * Cache First Strategy
 * Good for static assets that don't change often
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Return offline page or error
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Network First Strategy
 * Good for API calls and dynamic content
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Stale While Revalidate Strategy
 * Good for HTML pages - show cached immediately, update in background
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

// Background Sync for offline actions (future use)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-history') {
    event.waitUntil(syncHistory());
  }
});

async function syncHistory() {
  // Implement history sync when online
  console.log('[SW] Syncing history...');
}

// Push notifications (future use)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Mở ứng dụng' },
      { action: 'close', title: 'Đóng' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Message from client
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }

  if (event.data === 'getVersion') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('[SW] Service Worker loaded:', CACHE_NAME);