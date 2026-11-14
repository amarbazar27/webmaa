import { adminDb } from './firebase-admin';

// Tier 1: In-memory cache for warm lambda instances (0 reads)
const memoryCache = new Map();

// 7-day default cache TTL (604,800 seconds = 7 days)
export const SITEMAP_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Normalizes host to a safe Firestore document ID (e.g. "messerbazar_com" or "bdretailers_com")
 */
function toDocKey(host, type) {
  const cleanHost = (host || 'default')
    .toLowerCase()
    .trim()
    .replace(/^www\./, '')
    .replace(/[^a-z0-9_-]/g, '_');
  return `sitemap_${type}_${cleanHost}`;
}

/**
 * getCachedSitemapXml — Resilient 2-Tier Sitemap Cache:
 * Tier 1: In-memory cache (0ms, 0 reads when lambda is warm)
 * Tier 2: Persistent Firestore `system_cache` collection (1 read on serverless cold start instead of 1,564 reads!)
 * Tier 3: Builder fallback (executed only once every 7 days or after cache purge)
 */
export async function getCachedSitemapXml(host, type, builderFn) {
  const docKey = toDocKey(host, type);
  const now = Date.now();

  // Tier 1: In-memory check (0 reads)
  const mem = memoryCache.get(docKey);
  if (mem && mem.expiresAt > now && mem.xml) {
    return mem.xml;
  }

  // Tier 2: Persistent Firestore cache check (1 read)
  if (adminDb) {
    try {
      const snap = await adminDb.collection('system_cache').doc(docKey).get();
      if (snap.exists) {
        const data = snap.data();
        if (data && data.xml && data.expiresAt > now) {
          memoryCache.set(docKey, { xml: data.xml, expiresAt: data.expiresAt });
          return data.xml;
        }
      }
    } catch (err) {
      console.warn(`[sitemap-cache] Tier 2 read warning for ${docKey}:`, err.message);
    }
  }

  // Tier 3: Cache miss or expired — generate XML via builder
  const xml = await builderFn();
  const expiresAt = now + SITEMAP_CACHE_TTL_MS;

  // Save to Tier 1
  memoryCache.set(docKey, { xml, expiresAt });

  // Save to Tier 2 (1 write every 7 days)
  if (adminDb && xml) {
    adminDb.collection('system_cache').doc(docKey).set({
      xml,
      host,
      type,
      updatedAt: now,
      expiresAt,
    }).catch(err => {
      console.warn(`[sitemap-cache] Tier 2 write warning for ${docKey}:`, err.message);
    });
  }

  return xml;
}

/**
 * Purge sitemap cache for a shop or platform domain when changes occur
 */
export async function invalidateSitemapCache(host = null) {
  memoryCache.clear();
  if (!adminDb) return;
  try {
    if (host) {
      const types = ['shop', 'product', 'category', 'image', 'index'];
      await Promise.allSettled(
        types.map(t => adminDb.collection('system_cache').doc(toDocKey(host, t)).delete())
      );
    } else {
      const snap = await adminDb.collection('system_cache').get();
      const sitemapDocs = snap.docs.filter(d => d.id.startsWith('sitemap_'));
      if (sitemapDocs.length > 0) {
        const batch = adminDb.batch();
        sitemapDocs.forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    }
  } catch (e) {
    console.warn('[sitemap-cache] Invalidation warning:', e.message);
  }
}
