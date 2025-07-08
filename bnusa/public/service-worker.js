// Bnusa Platform Service Worker
const CACHE_NAME = 'bnusa-cache-v1';
const IMAGE_CACHE_NAME = 'bnusa-images-v1';
const API_CACHE_NAME = 'bnusa-api-v1';

// Assets that should be cached immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  // Add critical CSS and JS files 
  // These will depend on your Next.js build output
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME, IMAGE_CACHE_NAME, API_CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper to determine if a request is an image
const isImageRequest = (request) => {
  const url = new URL(request.url);
  return (
    request.destination === 'image' ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.gif') ||
    url.pathname.includes('/api/images/') ||
    url.pathname.includes('/images/')
  );
};

// Helper to determine if a request is an API call
const isApiRequest = (request) => {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/');
};

// Helper to determine if this is a navigation request
const isNavigationRequest = (request) => {
  return request.mode === 'navigate';
};

// Fetch event - handle requests with appropriate strategies
self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Handle different types of requests with appropriate strategies
  if (isImageRequest(request)) {
    // Cache-first strategy for images
    event.respondWith(handleImageRequest(request));
  } else if (isApiRequest(request)) {
    // Network-first strategy for API requests
    event.respondWith(handleApiRequest(request));
  } else if (isNavigationRequest(request)) {
    // Network-first for navigation requests, falling back to cached version
    event.respondWith(handleNavigationRequest(request));
  } else {
    // Cache-first for other static assets
    event.respondWith(handleStaticAssetRequest(request));
  }
});

// Image handling with cache-first strategy
async function handleImageRequest(request) {
  // Create a cache key that includes any cache-busting parameters
  const cacheKey = request.url;
  
  // Try cache first
  const cachedResponse = await caches.match(cacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, fetch from network
  try {
    const response = await fetch(request);
    
    // Cache only successful responses
    if (response.ok) {
      const clonedResponse = response.clone();
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        cache.put(cacheKey, clonedResponse);
      });
    }
    
    return response;
  } catch (error) {
    // If offline and not in cache, try to return a placeholder image
    return caches.match('/images/placeholder.png');
  }
}

// API handling with network-first strategy
async function handleApiRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache successful GET responses
    if (response.ok && request.method === 'GET') {
      const clonedResponse = response.clone();
      caches.open(API_CACHE_NAME).then((cache) => {
        cache.put(request, clonedResponse);
      });
    }
    
    return response;
  } catch (error) {
    // If offline, try to return cached version
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cached version, return a custom offline response for APIs
    return new Response(JSON.stringify({
      success: false,
      error: 'You are offline. Please check your connection.',
      isOffline: true
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Navigation request handling
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    return response;
  } catch (error) {
    // If offline, try to return cached version
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cached version, try to return the offline page
    return caches.match('/offline.html') || caches.match('/');
  }
}

// Static asset handling
async function handleStaticAssetRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, fetch from network
  try {
    const response = await fetch(request);
    
    // Cache only successful responses
    if (response.ok) {
      const clonedResponse = response.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(request, clonedResponse);
      });
    }
    
    return response;
  } catch (error) {
    // If offline and resource not cached, fallback to offline page for HTML
    if (request.headers.get('Accept').includes('text/html')) {
      return caches.match('/offline.html') || caches.match('/');
    }
    
    // No fallback for other resources
    return new Response('Resource not available offline', { 
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Background sync for deferred operations (like pending uploads)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-uploads') {
    event.waitUntil(syncPendingUploads());
  }
});

// Handle pending uploads when back online
async function syncPendingUploads() {
  try {
    // Open the IndexedDB to get pending uploads
    // This is a placeholder - you would need to implement IndexedDB storage
    const pendingUploads = await getPendingUploadsFromIndexedDB();
    
    for (const upload of pendingUploads) {
      try {
        // Attempt to upload the pending image
        const response = await fetch('/api/images/upload', {
          method: 'POST',
          headers: upload.headers,
          body: upload.formData
        });
        
        if (response.ok) {
          // If successful, remove from pending uploads
          await removePendingUploadFromIndexedDB(upload.id);
        }
      } catch (error) {
        console.error('Failed to sync upload:', error);
      }
    }
  } catch (error) {
    console.error('Error in syncPendingUploads:', error);
  }
}

// Placeholder functions for IndexedDB operations
// You would need to implement these
function getPendingUploadsFromIndexedDB() {
  return Promise.resolve([]);
}

function removePendingUploadFromIndexedDB(id) {
  return Promise.resolve();
}

// Listen for push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge.png',
    data: data.data
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
}); 