import { 
  collection, getDocs, query, where
} from 'firebase/firestore';
import { db } from './firebase';
import { adminDb } from '@/lib/firebase-admin';

/**
 * getShopByDomain — Resolve a hostname to a shop document on server
 * ⚡ Prioritizes Firebase Admin SDK (server-side service account)
 * which is 100% immune to client API key domain/referer restrictions.
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
          return { id: d.id, ...d.data() };
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
          return { id: d.id, ...d.data() };
        }
      }
    }
  } catch (adminErr) {
    console.warn(`[FirestoreServer] Admin SDK lookup error for "${rawDomain}":`, adminErr.message);
  }

  // ── 4. FALLBACK: Client SDK (Used only if Admin SDK is unavailable) ──
  try {
    if (db) {
      const shopsRef = collection(db, 'shops');

      for (const variant of variants) {
        const q = query(shopsRef, where('domains', 'array-contains', variant));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return { id: snap.docs[0].id, ...snap.docs[0].data() };
        }
      }

      for (const variant of variants) {
        const legacyQ = query(shopsRef, where('customDomain', '==', variant));
        const legacySnap = await getDocs(legacyQ);
        if (!legacySnap.empty) {
          return { id: legacySnap.docs[0].id, ...legacySnap.docs[0].data() };
        }
      }
    }
  } catch (clientErr) {
    console.warn(`[FirestoreServer] Client SDK lookup fallback error for "${rawDomain}":`, clientErr.message);
  }

  return null;
};
