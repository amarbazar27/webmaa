/**
 * Main Service Worker — Webmaa
 * Handles: offline caching, fetch strategy, FCM hand-off
 * The actual FCM push handling is in /firebase-messaging-sw.js
 */

const CACHE_NAME = 'webmaa-v3';
const STATIC_ASSETS = [
  '/',
  '/logo.png',
  '/manifest.json',
];

// ── Install: pre-cache static assets ────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Webmaa Service Worker v3');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ──────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: network-first for API, cache-first for assets ────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and non-http(s) requests
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) return;

  // Skip API routes — always network
  if (url.pathname.startsWith('/api/')) return;

  // Skip Firebase requests
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis')) return;

  // Network-first for HTML pages
  if (request.destination === 'document') {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for static assets (images, fonts, scripts)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      });
    })
  );
});

// ── Message handler ──────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
