import { 
  collection, getDocs, query, where
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * getShopByDomain — Resolve a hostname to a shop document
 * HIGH-6 Fix: Removed blanket getDocs() that loaded ALL shops into memory
 * HIGH-7 Fix: Removed excessive debug console.log statements
 */
export const getShopByDomain = async (rawDomain) => {
  if (!rawDomain) return null;

  // 1. Normalize Host (strip port, lowercase)
  const host = rawDomain.toLowerCase().trim().split(':')[0].split('/')[0];

  // 2. Generate Variants for exact match checking
  const naked = host.replace(/^www\./i, '');
  const www = `www.${naked}`;
  
  const variants = [...new Set([host, naked, www])];

  try {
    const shopsRef = collection(db, 'shops');

    // 3. Query each variant using indexed 'domains' array-contains
    for (const variant of variants) {
      const q = query(shopsRef, where('domains', 'array-contains', variant));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        return { id: snap.docs[0].id, ...snap.docs[0].data() };
      }
    }

    // 4. Fallback to legacy field check
    const legacyQ = query(shopsRef, where('customDomain', '==', naked));
    const legacySnap = await getDocs(legacyQ);
    
    if (!legacySnap.empty) {
      return { id: legacySnap.docs[0].id, ...legacySnap.docs[0].data() };
    }

    // 5. If client SDK returns nothing, try Admin SDK as final fallback
    try {
      const { adminDb } = await import('./firebase-admin');
      if (adminDb) {
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
        // Admin SDK legacy fallback
        const adminLegacy = await adminDb.collection('shops')
          .where('customDomain', '==', naked)
          .limit(1)
          .get();
        if (!adminLegacy.empty) {
          const d = adminLegacy.docs[0];
          return { id: d.id, ...d.data() };
        }
      }
    } catch {
      // Admin SDK not available, silently continue
    }

    return null;
  } catch (error) {
    console.error(`[Firestore] getShopByDomain error for "${rawDomain}":`, error.message);
    return null;
  }
};
