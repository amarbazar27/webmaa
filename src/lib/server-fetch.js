import { adminDb } from './firebase-admin';

/**
 * Robustly converts any Firestore values (Timestamps, etc) into serializable JSON.
 */
function toPlainObject(data) {
  if (data === null || data === undefined) return null;
  
  // Handle primitives
  if (typeof data !== 'object') return data;

  // Handle Dates
  if (data instanceof Date || (typeof data.toISOString === 'function')) {
    try { return data.toISOString(); } catch { return String(data); }
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    return data.map(item => toPlainObject(item));
  }

  // Handle Firestore Timestamps (_seconds, _nanoseconds)
  if ((data._seconds !== undefined && data._nanoseconds !== undefined) || 
      (data.seconds !== undefined && data.nanoseconds !== undefined)) {
    const s = data._seconds ?? data.seconds;
    return new Date(s * 1000).toISOString();
  }

  // Handle Firestore GeoPoint
  if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
    return { latitude: data.latitude, longitude: data.longitude };
  }

  // Handle Firestore References or other objects with path
  if (data.path && typeof data.path === 'string') {
    return data.path;
  }

  // Handle potential Buffer/Binary without direct Buffer reference
  if (data.constructor && (data.constructor.name === 'Buffer' || data.constructor.name === 'Uint8Array')) {
    return '[binary]';
  }

  // Handle Plain Objects - Recursively
  const plain = {};
  let hasValidKeys = false;
  
  try {
    // We only iterate over own properties to avoid prototype pollution or complex class instances
    const keys = Object.keys(data);
    for (const key of keys) {
      plain[key] = toPlainObject(data[key]);
      hasValidKeys = true;
    }
  } catch (e) {
    return String(data);
  }

  // If it's an object but had no keys and isn't one of our handled types, 
  // it might be a complex instance. Try JSON fallback.
  if (!hasValidKeys) {
    try {
      return JSON.parse(JSON.stringify(data));
    } catch {
      return String(data);
    }
  }

  return plain;
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
