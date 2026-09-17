import { adminDb } from './firebase-admin';

const FIRESTORE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const FIRESTORE_REST_BASE = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents`;

// ⚡ High-speed In-Memory Query Cache with TTL (Caches expensive queries & eliminates N+1 latency)
const memoryCache = new Map();

function getCached(key) {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return item.value;
}

function setCached(key, value, ttlSeconds = 60) {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
  if (memoryCache.size > 500) {
    const oldestKey = memoryCache.keys().next().value;
    memoryCache.delete(oldestKey);
  }
}

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
    const keys = Object.keys(data);
    for (const key of keys) {
      plain[key] = toPlainObject(data[key]);
      hasValidKeys = true;
    }
  } catch (e) {
    return String(data);
  }

  if (!hasValidKeys) {
    try {
      return JSON.parse(JSON.stringify(data));
    } catch {
      return String(data);
    }
  }

  return plain;
}

/**
 * Converts Firestore REST API field values to plain JS values.
 * REST API returns: { stringValue: "foo" }, { integerValue: "5" }, { booleanValue: true }, etc.
 */
function fromFirestoreRest(fields) {
  if (!fields) return {};
  const result = {};
  for (const [key, val] of Object.entries(fields)) {
    result[key] = parseRestValue(val);
  }
  return result;
}

function parseRestValue(val) {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return val.doubleValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('nullValue' in val) return null;
  if ('timestampValue' in val) return val.timestampValue; // already ISO string
  if ('arrayValue' in val) {
    const values = val.arrayValue?.values || [];
    return values.map(v => parseRestValue(v));
  }
  if ('mapValue' in val) {
    return fromFirestoreRest(val.mapValue?.fields || {});
  }
  if ('geoPointValue' in val) {
    return { latitude: val.geoPointValue.latitude, longitude: val.geoPointValue.longitude };
  }
  return null;
}

/**
 * Query Firestore via REST API (no SDK needed, works on any server).
 */
async function firestoreRestQuery(collectionId, fieldPath, operator, fieldValue) {
  const url = `${FIRESTORE_REST_BASE}:runQuery`;
  const body = {
    structuredQuery: {
      from: [{ collectionId }],
      where: {
        fieldFilter: {
          field: { fieldPath },
          op: operator,
          value: { stringValue: fieldValue },
        },
      },
      limit: 1,
    },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || !data[0]?.document) return null;
  const doc = data[0].document;
  const id = doc.name.split('/').pop();
  return { id, ...fromFirestoreRest(doc.fields) };
}

/**
 * List all documents in a subcollection via REST API.
 */
async function firestoreRestCollection(path) {
  const url = `${FIRESTORE_REST_BASE}/${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.documents) return [];
  return data.documents.map(doc => {
    const id = doc.name.split('/').pop();
    return { id, ...fromFirestoreRest(doc.fields) };
  });
}


export async function getShopServer(slug) {
  try {
    if (adminDb) {
      // Admin SDK path (preferred - when env vars are set)
      const shopsRef = adminDb.collection('shops');
      let snap = await shopsRef.where('subdomainSlug', '==', slug).limit(1).get();
      if (snap.empty) snap = await shopsRef.where('shopSlug', '==', slug).limit(1).get();
      if (snap.empty) {
        const doc = await shopsRef.doc(slug).get();
        if (doc.exists) return { id: doc.id, ...toPlainObject(doc.data()) };
        return null;
      }
      const doc = snap.docs[0];
      return { id: doc.id, ...toPlainObject(doc.data()) };
    } else {
      // REST API fallback (when admin SDK env vars are missing)
      console.log(`[getShopServer] Using REST API fallback for slug: ${slug}`);
      let shop = await firestoreRestQuery('shops', 'subdomainSlug', 'EQUAL', slug);
      if (!shop) shop = await firestoreRestQuery('shops', 'shopSlug', 'EQUAL', slug);
      return shop || null;
    }
  } catch (err) {
    console.error(`[getShopServer] Error:`, err);
    return null;
  }
}

export async function getShopByDomainServer(host) {
  try {
    if (!host) return null;
    // Normalize host
    const normalizedHost = host.toLowerCase().trim().replace(/^www\./i, '');
    const lookupHost = normalizedHost === 'messbazar.com' ? 'messerbazar.com' : normalizedHost;
    const cacheKey = `shop_domain_${lookupHost}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    let shop = null;
    if (adminDb) {
      const shopsRef = adminDb.collection('shops');
      let snap = await shopsRef.where('customDomain', '==', lookupHost).limit(1).get();
      if (snap.empty) {
        // Fallback to checking subdomain (e.g. messerbazar.daripallah.com -> messerbazar)
        const subdomain = lookupHost.split('.')[0];
        snap = await shopsRef.where('subdomainSlug', '==', subdomain).limit(1).get();
      }
      if (snap.empty) return null;
      const doc = snap.docs[0];
      shop = { id: doc.id, ...toPlainObject(doc.data()) };
    } else {
      console.log(`[getShopByDomainServer] Using REST API fallback for host: ${normalizedHost}`);
      shop = await firestoreRestQuery('shops', 'customDomain', 'EQUAL', normalizedHost);
      if (!shop) {
        const subdomain = normalizedHost.split('.')[0];
        shop = await firestoreRestQuery('shops', 'subdomainSlug', 'EQUAL', subdomain);
      }
    }

    if (shop) {
      setCached(cacheKey, shop, 60);
    }
    return shop || null;
  } catch (err) {
    console.error(`[getShopByDomainServer] Error:`, err);
    return null;
  }
}

export async function getProductsServer(shopId) {
  try {
    if (!shopId) return [];
    if (adminDb) {
      const snap = await adminDb.collection('shops').doc(shopId).collection('products').get();
      const products = snap.docs.map(doc => ({ id: doc.id, ...toPlainObject(doc.data()) }));
      return products.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    } else {
      console.log(`[getProductsServer] Using REST API fallback for shopId: ${shopId}`);
      const products = await firestoreRestCollection(`shops/${shopId}/products`);
      return products.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    }
  } catch (err) {
    console.error(`[getProductsServer] Error:`, err);
    return [];
  }
}

export async function getCategoriesServer(shopId) {
  try {
    if (!shopId) return [];
    if (adminDb) {
      const snap = await adminDb.collection('shops').doc(shopId).collection('categories').get();
      return snap.docs.map(doc => ({ id: doc.id, ...toPlainObject(doc.data()) }));
    } else {
      console.log(`[getCategoriesServer] Using REST API fallback for shopId: ${shopId}`);
      return await firestoreRestCollection(`shops/${shopId}/categories`);
    }
  } catch (err) {
    console.error(`[getCategoriesServer] Error:`, err);
    return [];
  }
}

export async function getGlobalConfigServer() {
  try {
    const cacheKey = 'global_config';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    let config = {};
    if (adminDb) {
      const snap = await adminDb.collection('config').doc('global').get();
      config = snap.exists ? toPlainObject(snap.data()) : {};
    } else {
      const url = `${FIRESTORE_REST_BASE}/config/global`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return {};
      const doc = await res.json();
      config = fromFirestoreRest(doc.fields) || {};
    }
    setCached(cacheKey, config, 60);
    return config;
  } catch (err) {
    console.error(`[getGlobalConfigServer] Error:`, err);
    return {};
  }
}

export async function getAllShopsServer() {
  try {
    const cacheKey = 'all_shops';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    let shops = [];
    if (adminDb) {
      const snap = await adminDb.collection('shops').get();
      shops = snap.docs.map(doc => ({ id: doc.id, ...toPlainObject(doc.data()) }));
    } else {
      shops = await firestoreRestCollection('shops') || [];
    }
    setCached(cacheKey, shops, 60);
    return shops;
  } catch (err) {
    console.error('[getAllShopsServer] Error:', err);
    return [];
  }
}

export async function getAllMarketplaceProductsServer() {
  try {
    const cacheKey = 'all_marketplace_products';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const shops = await getAllShopsServer();
    const activeShops = shops.filter(s => s.isActive !== false && s.showOnMainSite !== false);
    const productArrays = await Promise.all(
      activeShops.map(async (shop) => {
        const prods = await getProductsServer(shop.id);
        return prods.map(p => ({
          ...p,
          shopId: shop.id,
          shopName: shop.shopName || '',
          shopSlug: shop.subdomainSlug || shop.shopSlug || '',
          customDomain: shop.customDomain || '',
        }));
      })
    );
    const flat = productArrays.flat();
    setCached(cacheKey, flat, 120); // 120s TTL eliminates N+1 query loops
    return flat;
  } catch (err) {
    console.error('[getAllMarketplaceProductsServer] Error:', err);
    return [];
  }
}

