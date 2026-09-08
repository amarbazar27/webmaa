/**
 * Main Service Worker — Webmaa
 * Handles: offline caching, fetch strategy, FCM hand-off
 * The actual FCM push handling is in /firebase-messaging-sw.js
 */

const CACHE_NAME = 'webmaa-v7';
const STATIC_ASSETS = [
  '/',
  '/logo.png',
  '/manifest.json',
];

// ── Install: pre-cache static assets ────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Webmaa Service Worker v7');
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          fetch(url).then((res) => {
            if (res && res.status === 200) return cache.put(url, res);
          }).catch(() => {})
        )
      );
    })
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ──────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Webmaa Service Worker v7');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: network-first for API, cache-first for same-origin assets ──
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and non-http(s) requests
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) return;

  // CRITICAL: NEVER intercept cross-origin third-party requests (Cloudinary, Google, Gstatic, Unsplash, etc.)
  // Let the browser handle external media natively without SW or connect-src restrictions!
  if (url.origin !== self.location.origin) return;

  // Skip API routes — always network
  if (url.pathname.startsWith('/api/')) return;

  // Skip Next.js dev websocket / hot-reload
  if (url.pathname.startsWith('/_next/webpack-hmr')) return;

  // HTML page navigation: Network-first with automatic caching
  if (request.destination === 'document' || request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallback = await caches.match('/');
          return fallback || new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline Preview</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:sans-serif;text-align:center;padding:50px 20px;background:#F8FAFC;color:#0F172A;"><h2>⚡ আপনি অফলাইনে আছেন</h2><p>ইন্টারনেট সংযোগ চালু হলে পেজটি রিফ্রেশ করুন।</p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // Same-origin static assets: Stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => cached || new Response('', { status: 408, statusText: 'Network request failed' }));

      return cached || networkFetch;
    })
  );
});

// ── Message handler ──────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
