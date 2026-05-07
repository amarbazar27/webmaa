import { adminDb } from './firebase-admin';

/**
 * Robustly converts any Firestore values (Timestamps, etc) into serializable JSON.
 */
function toPlainObject(data) {
  if (!data) return data;
  if (Array.isArray(data)) return data.map(item => toPlainObject(item));
  
  // Handle Firestore Timestamps
  if (typeof data === 'object' && data.seconds !== undefined && data.nanoseconds !== undefined) {
    return new Date(data.seconds * 1000).toISOString();
  }
  
  if (typeof data === 'object' && data.constructor.name === 'Object') {
    const plain = {};
    for (const key of Object.keys(data)) {
      plain[key] = toPlainObject(data[key]);
    }
    return plain;
  }
  return data;
}

export async function getShopServer(slug) {
  try {
    if (!adminDb) return null;
    const shopsRef = adminDb.collection('shops');
    let snap = await shopsRef.where('subdomainSlug', '==', slug).limit(1).get();
    if (snap.empty) snap = await shopsRef.where('shopSlug', '==', slug).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...toPlainObject(doc.data()) };
  } catch (err) {
    console.error(`[getShopServer] Error:`, err);
    return null;
  }
}

export async function getProductsServer(shopId) {
  try {
    if (!adminDb || !shopId) return [];
    // Fetch all and sort in memory to avoid missing index / missing field issues
    const snap = await adminDb.collection('shops').doc(shopId).collection('products').get();
    const products = snap.docs.map(doc => ({ id: doc.id, ...toPlainObject(doc.data()) }));
    return products.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  } catch (err) {
    console.error(`[getProductsServer] Error:`, err);
    return [];
  }
}

export async function getCategoriesServer(shopId) {
  try {
    if (!adminDb || !shopId) return [];
    const snap = await adminDb.collection('shops').doc(shopId).collection('categories').get();
    return snap.docs.map(doc => ({ id: doc.id, ...toPlainObject(doc.data()) }));
  } catch (err) {
    console.error(`[getCategoriesServer] Error:`, err);
    return [];
  }
}
