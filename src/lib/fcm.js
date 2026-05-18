/**
 * FCM (Firebase Cloud Messaging) Utility — Client Side
 * Handles: token generation, permission request, token refresh, retry logic
 * Works on: webmaa.app/shop/* AND custom domains like messerbazar.com
 * SSR-safe: all browser APIs guarded with typeof window checks
 */

// ── Constants ─────────────────────────────────────────────────────────────
const FCM_TOKEN_KEY = 'fcm_token_v2';
const FCM_TOKEN_TS_KEY = 'fcm_token_ts';
const FCM_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // refresh every 7 days
const MAX_RETRY = 3;

// ── Log helpers ───────────────────────────────────────────────────────────
const log = (...args) => console.log('[FCM]', ...args);
const warn = (...args) => console.warn('[FCM]', ...args);
const err  = (...args) => console.error('[FCM]', ...args);

/**
 * Check if browser supports push notifications
 */
export function isPushSupported() {
  if (typeof window === 'undefined') return false;
  return (
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

/**
 * Get current notification permission status
 */
export function getPermissionStatus() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

/**
 * Request notification permission from the user.
 * Returns 'granted' | 'denied' | 'default' | 'unsupported'
 */
export async function requestPermission() {
  if (!isPushSupported()) {
    warn('Push not supported on this browser/device');
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    log('✅ Permission already granted');
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    warn('❌ Permission denied by user — cannot re-request');
    return 'denied';
  }

  log('🔔 Requesting notification permission...');
  const result = await Notification.requestPermission();
  log(`Permission result: ${result}`);
  return result;
}

/**
 * Register the Firebase Messaging Service Worker.
 * Multi-tenant safe: works for /shop/* paths AND custom domains.
 */
async function registerFCMServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    warn('Service Worker not supported');
    return null;
  }

  try {
    // Check if already registered at the correct path
    const existing = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (existing) {
      log('✅ FCM SW already registered:', existing.scope);
      return existing;
    }

    // Register with root scope so it covers ALL paths (custom domain + /shop/*)
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });

    log('✅ FCM SW registered, scope:', registration.scope);

    // ── Inject Firebase config into SW via postMessage ──────────────────
    // The static SW file cannot read env vars, so we send config from the client
    const config = {
      apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    const sendConfig = (sw) => {
      if (sw) sw.postMessage({ type: 'FIREBASE_CONFIG', config });
    };

    // Send to whichever SW lifecycle state is active
    if (registration.installing) sendConfig(registration.installing);
    else if (registration.waiting) sendConfig(registration.waiting);
    else if (registration.active)  sendConfig(registration.active);

    // Also send after it becomes active (race condition safety)
    registration.addEventListener('updatefound', () => {
      const newSW = registration.installing;
      if (newSW) {
        newSW.addEventListener('statechange', () => {
          if (newSW.state === 'activated') sendConfig(newSW);
        });
      }
    });

    // Wait for it to become active
    await navigator.serviceWorker.ready;
    return registration;
  } catch (e) {
    err('SW registration failed:', e.message);
    return null;
  }
}

/**
 * Get FCM token. Handles:
 * - token caching (avoids redundant requests)
 * - VAPID key requirement
 * - retry logic
 * - stale token refresh
 * @param {string} shopId - used to store token in Firestore under shop's subscribers
 * @param {string} userId - optional user ID
 * @returns {Promise<string|null>} FCM token or null on failure
 */
export async function getFCMToken(shopId = null, userId = null, retryCount = 0) {
  if (typeof window === 'undefined') return null;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    warn('⚠️ NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set. FCM will not work.');
    return null;
  }

  // Check cached token (avoid re-generating)
  const cached = localStorage.getItem(FCM_TOKEN_KEY);
  const cachedTs = parseInt(localStorage.getItem(FCM_TOKEN_TS_KEY) || '0');
  const isStale = Date.now() - cachedTs > FCM_TOKEN_TTL_MS;

  if (cached && !isStale) {
    log('✅ Using cached FCM token:', cached.substring(0, 20) + '...');
    return cached;
  }

  try {
    // Ensure permission granted
    const permission = await requestPermission();
    if (permission !== 'granted') {
      warn('Cannot get FCM token without notification permission');
      return null;
    }

    // Ensure SW is registered
    const swReg = await registerFCMServiceWorker();

    // Lazy-import Firebase Messaging (client-only)
    const { getMessaging, getToken, onMessage } = await import('firebase/messaging');
    const { app } = await import('@/lib/firebase');

    const messaging = getMessaging(app);

    // Get token
    log('🔑 Fetching FCM token...');
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swReg || undefined,
    });

    if (!token) {
      warn('FCM returned empty token');
      return null;
    }

    log('✅ FCM Token generated:', token.substring(0, 30) + '...');

    // Cache it
    localStorage.setItem(FCM_TOKEN_KEY, token);
    localStorage.setItem(FCM_TOKEN_TS_KEY, Date.now().toString());

    // Save to Firestore if shopId provided
    if (shopId) {
      await saveTokenToFirestore(token, shopId, userId);
    }

    // Setup foreground message handler
    setupForegroundHandler(messaging);

    return token;
  } catch (e) {
    err(`FCM token error (attempt ${retryCount + 1}):`, e.message);

    // Retry with exponential backoff
    if (retryCount < MAX_RETRY) {
      const delay = Math.pow(2, retryCount) * 1000;
      log(`Retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
      return getFCMToken(shopId, userId, retryCount + 1);
    }

    return null;
  }
}

/**
 * Save FCM token to Firestore for this shop's subscriber list.
 * Path: shops/{shopId}/fcmTokens/{token}
 */
async function saveTokenToFirestore(token, shopId, userId) {
  try {
    const { db } = await import('@/lib/firebase');
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');

    await setDoc(
      doc(db, 'shops', shopId, 'fcmTokens', token),
      {
        token,
        userId: userId || null,
        platform: getPlatformInfo(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        active: true,
      },
      { merge: true }
    );

    log('✅ FCM token saved to Firestore');
  } catch (e) {
    warn('Failed to save FCM token to Firestore:', e.message);
  }
}

/**
 * Remove stale FCM token from Firestore (call on logout)
 */
export async function removeFCMToken(shopId) {
  if (typeof window === 'undefined') return;

  const token = localStorage.getItem(FCM_TOKEN_KEY);
  if (!token || !shopId) return;

  try {
    const { db } = await import('@/lib/firebase');
    const { doc, deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'shops', shopId, 'fcmTokens', token));
    localStorage.removeItem(FCM_TOKEN_KEY);
    localStorage.removeItem(FCM_TOKEN_TS_KEY);
    log('✅ FCM token removed');
  } catch (e) {
    warn('Failed to remove FCM token:', e.message);
  }
}

/**
 * Setup foreground message handler — shows a toast when app is open
 */
function setupForegroundHandler(messaging) {
  // Prevent duplicate listeners
  if (window.__fcmForegroundHandlerSet) return;
  window.__fcmForegroundHandlerSet = true;

  import('firebase/messaging').then(({ onMessage }) => {
    onMessage(messaging, (payload) => {
      log('📩 Foreground message received:', payload);

      const { title = 'Webmaa', body = '' } = payload.notification || {};

      // Show browser Notification if app is in background tab
      if (document.visibilityState === 'hidden' || !document.hasFocus()) {
        if (Notification.permission === 'granted') {
          new Notification(title, {
            body,
            icon: '/logo.png',
            badge: '/logo.png',
            tag: 'webmaa-foreground',
          });
        }
        return;
      }

      // Show in-app toast for foreground
      import('react-hot-toast').then(({ default: toast }) => {
        toast(`🔔 ${title}${body ? ': ' + body : ''}`, {
          duration: 6000,
          icon: '🔔',
        });
      });
    });
  });
}

/**
 * Get platform/browser info for token metadata
 */
function getPlatformInfo() {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  return 'web';
}

/**
 * Full initialization — call once per shop page load
 * Handles permission, token, and SW in one call
 */
export async function initializeFCM(shopId, userId = null) {
  if (!isPushSupported()) {
    warn('Push not supported — skipping FCM init');
    return { status: 'unsupported', token: null };
  }

  const permission = getPermissionStatus();
  log(`Current permission: ${permission}`);

  if (permission === 'denied') {
    return { status: 'denied', token: null };
  }

  const token = await getFCMToken(shopId, userId);
  return {
    status: token ? 'active' : 'failed',
    token,
    permission: getPermissionStatus(),
  };
}
