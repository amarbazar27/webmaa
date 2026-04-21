import { 
  collection, getDocs, query, where
} from 'firebase/firestore';
import { db } from './firebase';

export const getShopByDomain = async (rawDomain) => {
  if (!rawDomain) return null;

  console.log("=========================================");
  console.log("DEBUG: PROD DATABASE CHECK");
  console.log("PROJECT ID (Server):", process.env.FIREBASE_PROJECT_ID);
  console.log("PROJECT ID (Public):", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  console.log("COLLECTION USED:", "shops");
  console.log("HOST RAW:", rawDomain);

  // 1. Normalize Host (strip port, lowercase)
  const host = rawDomain.toLowerCase().trim().split(':')[0].split('/')[0];
  console.log("FINAL HOST:", host);

  // 2. Generate Variants for exact match checking
  const naked = host.replace(/^www\./i, '');
  const www = `www.${naked}`;
  
  const variants = [
    host,   // exact match as received
    naked,  // stripped version
    www     // prefixed version
  ];

  // Remove duplicates
  const uniqueVariants = [...new Set(variants)];
  console.log("CHECKING VARIANTS:", uniqueVariants);

  try {
    const shopsRef = collection(db, 'shops');

    // ── HARD TEST QUERY: Check if DB has ANY shops ──
    let allSnapshot = await getDocs(shopsRef);
    console.log("CLIENT SDK: TOTAL SHOPS IN DB:", allSnapshot.size);

    // If client SDK fails (0 shops), try Admin SDK as a fallback
    if (allSnapshot.size === 0) {
      const { adminDb } = await import('./firebase-admin');
      if (adminDb) {
        console.log("[Firestore] Falling back to Admin SDK for lookup...");
        const adminSnap = await adminDb.collection('shops').get();
        console.log("ADMIN SDK: TOTAL SHOPS IN DB:", adminSnap.size);
        if (adminSnap.size > 0) {
          // If admin SDK works, use those docs for the fallback loop below
          allSnapshot = { 
            size: adminSnap.size, 
            docs: adminSnap.docs.map(d => ({ id: d.id, data: () => d.data() })) 
          };
        }
      } else {
        console.warn("[Firestore] Admin SDK not initialized (missing env vars).");
      }
    }
    // ────────────────────────────────────────────────

    // 3. Loop and query each variant
    for (const variant of uniqueVariants) {
      console.log(`[Firestore] Probing variant: "${variant}"`);
      
      const q = query(shopsRef, where('domains', 'array-contains', variant));
      const snap = await getDocs(q);
      
      console.log(`QUERY HOST: ${variant} | RESULT SIZE: ${snap.size}`);

      if (!snap.empty) {
        const shopData = { id: snap.docs[0].id, ...snap.docs[0].data() };
        console.log("SHOP FOUND (Query Array Match):", { id: shopData.id, shopName: shopData.shopName, slug: shopData.subdomainSlug });
        return shopData;
      }
    }

    // 4. Fallback to legacy field check (if variant loop failed)
    const legacyQ = query(shopsRef, where('customDomain', '==', naked));
    const legacySnap = await getDocs(legacyQ);
    console.log(`QUERY LEGACY HOST: ${naked} | RESULT SIZE: ${legacySnap.size}`);
    
    if (!legacySnap.empty) {
      const shopData = { id: legacySnap.docs[0].id, ...legacySnap.docs[0].data() };
      console.log("SHOP FOUND (Legacy Query Match):", { id: shopData.id, shopName: shopData.shopName, slug: shopData.subdomainSlug });
      return shopData;
    }

    // 5. FORCE FALLBACK: Manual loop over all shops
    console.log("[Firestore] FORCE FALLBACK: Manual loop over all shops checking domains array and customDomain string directly...");
    const shopsData = allSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    
    for (const s of shopsData) {
        if (s.domains && Array.isArray(s.domains)) {
            for (const v of uniqueVariants) {
                if (s.domains.includes(v)) {
                   console.log("SHOP FOUND (Manual Loop Array Match):", { id: s.id, shopName: s.shopName, slug: s.subdomainSlug });
                   return s;
                }
            }
        }
        if (s.customDomain) {
            for (const v of uniqueVariants) {
                if (s.customDomain === v) {
                   console.log("SHOP FOUND (Manual Loop String Match):", { id: s.id, shopName: s.shopName, slug: s.subdomainSlug });
                   return s;
                }
            }
        }
    }

    console.log("SHOP FOUND:", null);
    console.log("=========================================");
    return null;
  } catch (error) {
    console.error(`[Firestore] getShopByDomain error:`, error);
    return null;
  }
};
