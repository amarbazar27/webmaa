import { adminDb } from './firebase-admin';

/**
 * Server-only fetcher for Shop data using Firebase Admin SDK.
 * Prevents serialization errors by manually mapping fields.
 */
export async function getShopServer(slug) {
  if (!adminDb) return null;
  
  // Check both subdomainSlug and shopSlug for compatibility
  const shopsRef = adminDb.collection('shops');
  
  let snap = await shopsRef.where('subdomainSlug', '==', slug).limit(1).get();
  if (snap.empty) {
    snap = await shopsRef.where('shopSlug', '==', slug).limit(1).get();
  }
  
  if (snap.empty) return null;
  
  const doc = snap.docs[0];
  const data = doc.data();
  
  return {
    id: doc.id,
    shopName: data.shopName || '',
    shopSlug: data.shopSlug || data.subdomainSlug || '',
    logoUrl: data.logoUrl || '',
    coverImg: data.coverImg || '',
    isActive: data.isActive !== false,
    settings: data.settings || {},
    aiConfig: data.aiConfig || {},
    serviceAreas: data.serviceAreas || [],
    customAreas: data.customAreas || [],
    isStrictLocation: !!data.isStrictLocation,
    showLocationSelector: data.showLocationSelector !== false
  };
}

/**
 * Server-only fetcher for Products using Firebase Admin SDK.
 */
export async function getProductsServer(shopId) {
  if (!adminDb) return [];
  
  const snap = await adminDb
    .collection('shops')
    .doc(shopId)
    .collection('products')
    .orderBy('createdAt', 'desc')
    .get();
    
  return snap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || '',
      price: data.price || 0,
      description: data.description || '',
      imageUrl: data.imageUrl || '',
      category: data.category || '',
      unit: data.unit || '',
      stock: data.stock || 0,
      allowNote: !!data.allowNote,
      allowCustomize: !!data.allowCustomize,
      variants: data.variants || [],
      sizes: data.sizes || []
    };
  });
}

/**
 * Server-only fetcher for Categories using Firebase Admin SDK.
 */
export async function getCategoriesServer(shopId) {
  if (!adminDb) return [];
  
  const snap = await adminDb
    .collection('shops')
    .doc(shopId)
    .collection('categories')
    .get();
    
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

