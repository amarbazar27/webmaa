import { 
  collection, getDocs, query, where
} from 'firebase/firestore';
import { db } from './firebase';
import { adminDb } from '@/lib/firebase-admin';

const domainCache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days active TTL
const STALE_TTL_MS = 1000 * 60 * 60 * 24 * 45; // 45 days stale fallback

/**
 * getShopByDomain — Resolve a hostname to a shop document on server
 * ⚡ Prioritizes Firebase Admin SDK (server-side service account)
 * with in-memory caching and resilient stale fallback to prevent 404s
 * during Firebase quota exhaustion or network transient errors.
 */
export const getShopByDomain = async (rawDomain) => {
  if (!rawDomain) return null;

  // 1. Normalize Host (strip port, lowercase)
  const host = rawDomain.toLowerCase().trim().split(':')[0].split('/')[0];

  // 2. Generate Variants for exact match checking
  const naked = host.replace(/^www\./i, '');
  const www = `www.${naked}`;
  
  const variants = [...new Set([host, naked, www])];
  if (naked === 'messbazar.com') {
    variants.push('messerbazar.com', 'www.messerbazar.com');
  }

  // Check active in-memory cache
  const cached = domainCache.get(naked) || domainCache.get(host);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  // ── 3. PRIMARY: Firebase Admin SDK (High-speed server-to-server) ──
  try {
    if (adminDb) {
      // 3a. Check 'domains' array-contains for all variants
      for (const variant of variants) {
        const adminSnap = await adminDb.collection('shops')
          .where('domains', 'array-contains', variant)
          .limit(1)
          .get();
        if (!adminSnap.empty) {
          const d = adminSnap.docs[0];
          const shop = { id: d.id, ...d.data() };
          domainCache.set(naked, { data: shop, timestamp: Date.now() });
          domainCache.set(host, { data: shop, timestamp: Date.now() });
          return shop;
        }
      }

      // 3b. Check 'customDomain' field for all variants
      for (const variant of variants) {
        const adminLegacy = await adminDb.collection('shops')
          .where('customDomain', '==', variant)
          .limit(1)
          .get();
        if (!adminLegacy.empty) {
          const d = adminLegacy.docs[0];
          const shop = { id: d.id, ...d.data() };
          domainCache.set(naked, { data: shop, timestamp: Date.now() });
          domainCache.set(host, { data: shop, timestamp: Date.now() });
          return shop;
        }
      }

      // 3c. Fallback: Check subdomainSlug (e.g. camerakini.bdretailers.com -> camerakini)
      const sub = naked.split('.')[0];
      if (sub && sub !== 'www' && sub !== 'localhost') {
        const subSnap = await adminDb.collection('shops')
          .where('subdomainSlug', '==', sub)
          .limit(1)
          .get();
        if (!subSnap.empty) {
          const d = subSnap.docs[0];
          const shop = { id: d.id, ...d.data() };
          domainCache.set(naked, { data: shop, timestamp: Date.now() });
          domainCache.set(host, { data: shop, timestamp: Date.now() });
          return shop;
        }
      }
    }
  } catch (adminErr) {
    console.warn(`[FirestoreServer] Admin SDK lookup error for "${rawDomain}":`, adminErr.message);
    // If quota exhausted or Firestore down, return stale cache if available
    if (cached && (Date.now() - cached.timestamp < STALE_TTL_MS)) {
      console.warn(`[FirestoreServer] Serving stale shop for "${rawDomain}" from cache`);
      return cached.data;
    }
  }

  // ── 4. FALLBACK: Client SDK (Used only if Admin SDK is unavailable) ──
  try {
    if (db) {
      const shopsRef = collection(db, 'shops');

      for (const variant of variants) {
        const q = query(shopsRef, where('domains', 'array-contains', variant));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const shop = { id: snap.docs[0].id, ...snap.docs[0].data() };
          domainCache.set(naked, { data: shop, timestamp: Date.now() });
          domainCache.set(host, { data: shop, timestamp: Date.now() });
          return shop;
        }
      }

      for (const variant of variants) {
        const legacyQ = query(shopsRef, where('customDomain', '==', variant));
        const legacySnap = await getDocs(legacyQ);
        if (!legacySnap.empty) {
          const shop = { id: legacySnap.docs[0].id, ...legacySnap.docs[0].data() };
          domainCache.set(naked, { data: shop, timestamp: Date.now() });
          domainCache.set(host, { data: shop, timestamp: Date.now() });
          return shop;
        }
      }
    }
  } catch (clientErr) {
    console.warn(`[FirestoreServer] Client SDK lookup fallback error for "${rawDomain}":`, clientErr.message);
  }

  // Final check: if stale entry exists, return it instead of null (prevents 404!)
  if (cached && (Date.now() - cached.timestamp < STALE_TTL_MS)) {
    return cached.data;
  }

  return null;
};
