/**
 * Firebase Cloud Messaging Service Worker — Webmaa
 * ─────────────────────────────────────────────────
 * Pattern: Config injected via postMessage from main thread (fcm.js)
 * This is the only SSR-safe approach for static SW files.
 *
 * Covers: background messages, notification click, push fallback
 * Multi-tenant: /shop/* paths AND custom domains (scope: '/')
 */

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Static production Firebase configuration
// MED-5 Note: Service workers cannot access process.env — these MUST be hardcoded.
// ⚠️ IMPORTANT: Keep these values in sync with .env.local NEXT_PUBLIC_FIREBASE_* vars.
// Last verified: 2026-07-08 — all values match .env.local
const firebaseConfig = {
  apiKey: "AIzaSyAMMzATvPWghOT8islcllFz9hXlCJ6HdFk",
  authDomain: "webmaa-app.firebaseapp.com",
  projectId: "webmaa-app",
  storageBucket: "webmaa-app.firebasestorage.app",
  messagingSenderId: "156216219253",
  appId: "1:156216219253:web:8fec080019c45244d0ca3c",
  measurementId: "G-ZNTHE383S2"
};

// ── State ────────────────────────────────────────────────────────────────
let _initialized = false;
let _messaging   = null;

// Initialize statically on load to ensure instant background wakeups
try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  _messaging = firebase.messaging();
  _initialized = true;
  _messaging.onBackgroundMessage(handleBackgroundMessage);
  console.log('[FCM-SW] ✅ Static initialization successful, background listener active.');
} catch (err) {
  console.error('[FCM-SW] ⚠️ Static initialization error:', err.message);
}

// ── Initialize Firebase Fallback ─────────────────────────────────────────
function tryInitFirebase(config) {
  if (_initialized || !config) return;
  _initialized = true;

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }
    _messaging = firebase.messaging();
    console.log('[FCM-SW] ✅ Firebase initialized via postMessage, scope:', self.registration.scope);

    // Register background message handler now that messaging is ready
    _messaging.onBackgroundMessage(handleBackgroundMessage);
  } catch (err) {
    console.error('[FCM-SW] ❌ Init error:', err.message);
  }
}

// ── Background Message Handler ────────────────────────────────────────────
function handleBackgroundMessage(payload) {
  console.log('[FCM-SW] 📩 Background message:', JSON.stringify(payload).substring(0, 200));

  const notif = payload.notification || {};
  const data  = payload.data         || {};

  const title = notif.title || data.title || 'Webmaa';
  const body  = notif.body  || data.body  || '';
  const icon  = notif.icon  || '/logo.png';
  const tag   = notif.tag   || data.tag   || 'webmaa-msg';

  const clickUrl = notif.click_action || data.click_action || data.url || '/';

  return self.registration.showNotification(title, {
    body,
    icon,
    badge:  '/logo.png',
    tag,
    image:  notif.image || data.image,
    vibrate: [200, 100, 200],
    requireInteraction: false,
    data:   { url: clickUrl, ...data },
    actions: [
      { action: 'open',    title: 'খুলুন' },
      { action: 'dismiss', title: 'বাতিল' },
    ],
  });
}

// ── Native Push Event Fallback ────────────────────────────────────────────
// Handles browsers that bypass FCM onBackgroundMessage
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {};
  try { payload = event.data.json(); } catch { payload = { notification: { body: event.data.text() } }; }

  console.log('[FCM-SW] 📬 Push event received');

  const notif = payload.notification || payload.data || {};
  const title = notif.title || 'Webmaa';
  const options = {
    body:    notif.body || '',
    icon:    notif.icon || '/logo.png',
    badge:   '/logo.png',
    tag:     notif.tag  || 'webmaa-push',
    vibrate: [200, 100, 200],
    data:    { url: notif.click_action || payload.data?.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification Click Handler ────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';
  console.log('[FCM-SW] 👆 Clicked, opening:', url);

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if (client.url.includes(url) && 'focus' in client) return client.focus();
        }
        return clients.openWindow(url);
      })
  );
});

// ── Offline & PWA Caching Strategy ────────────────────────────────────────
const CACHE_NAME = 'webmaa-offline-v5';
const STATIC_ASSETS = ['/', '/logo.png', '/manifest.json'];

self.addEventListener('install', (event) => {
  console.log('[FCM-SW] Installing and pre-caching static assets');
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

self.addEventListener('activate', (event) => {
  console.log('[FCM-SW] Activated, claiming clients');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and non-http(s) requests
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) return;

  // Skip API routes — always network
  if (url.pathname.startsWith('/api/')) return;

  // Skip Firebase requests
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis')) return;

  // HTML page navigation: Network-first, fallback to cache
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
          const rootFallback = await caches.match('/');
          if (rootFallback) return rootFallback;
          return new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Offline Preview</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:sans-serif;text-align:center;padding:50px 20px;background:#F8FAFC;color:#0F172A;"><h2>⚡ আপনি অফলাইনে আছেন</h2><p>ইন্টারনেট সংযোগ চালু হলে পেজটি রিফ্রেশ করুন।</p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // Assets (JS, CSS, images, fonts): Stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => cached);

      return cached || networkFetch;
    })
  );
});

// ── Config Injection via postMessage ─────────────────────────────────────
self.addEventListener('message', (event) => {
  const { type, config } = event.data || {};

  if (type === 'FIREBASE_CONFIG' && config) {
    console.log('[FCM-SW] Received Firebase config, initializing...');
    tryInitFirebase(config);
  }

  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
