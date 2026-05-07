import { adminDb } from './firebase-admin';

/**
 * Robustly converts any Firestore values (Timestamps, etc) into serializable JSON.
 */
function toPlainObject(data) {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(item => toPlainObject(item));
  
  // Handle Firestore Timestamps (both Admin SDK and Client SDK formats)
  if (data._seconds !== undefined && data._nanoseconds !== undefined) {
    return new Date(data._seconds * 1000).toISOString();
  }
  if (data.seconds !== undefined && data.nanoseconds !== undefined) {
    return new Date(data.seconds * 1000).toISOString();
  }
  
  // Handle Date objects
  if (data instanceof Date) {
    return data.toISOString();
  }

  // Handle Buffer/Uint8Array (e.g. from Firestore Bytes)
  if (Buffer.isBuffer(data) || data instanceof Uint8Array) {
    return '[binary data]';
  }

  // Handle Firestore DocumentReference
  if (data.firestore && data.path) {
    return data.path;
  }

  // Handle Firestore GeoPoint
  if (typeof data.latitude === 'number' && typeof data.longitude === 'number' && Object.keys(data).length === 2) {
    return { latitude: data.latitude, longitude: data.longitude };
  }

  // Safe plain object check (handles Object.create(null) and prototype-less objects)
  try {
    const proto = Object.getPrototypeOf(data);
    if (proto === null || proto === Object.prototype) {
      const plain = {};
      for (const key of Object.keys(data)) {
        try {
          plain[key] = toPlainObject(data[key]);
        } catch (e) {
          plain[key] = String(data[key]);
        }
      }
      return plain;
    }
  } catch (e) {
    // If getPrototypeOf fails, try to convert to string
    return String(data);
  }

  // Fallback: convert unknown types to string
  try {
    return JSON.parse(JSON.stringify(data));
  } catch {
    return String(data);
  }
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
