import { adminDb } from './firebase-admin';

const FIRESTORE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const FIRESTORE_REST_BASE = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents`;

// ⚡ High-speed In-Memory Query Cache with TTL (Caches expensive queries & eliminates N+1 latency)
const memoryCache = new Map();

let redisClient = null;
let redisChecked = false;

async function getRedis() {
  if (redisChecked) return redisClient;
  redisChecked = true;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  try {
    const { Redis } = await import(/* webpackIgnore: true */ '@upstash/redis');
    redisClient = new Redis({ url, token });
    return redisClient;
  } catch {
    return null;
  }
}

function getCached(key, allowStale = false) {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    if (allowStale) return item.value;
    return null;
  }
  return item.value;
}

function setCached(key, value, ttlSeconds = 300) {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
  if (memoryCache.size > 1000) {
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
  const cacheKey = `shop_slug_${slug}`;
  try {
    const cached = getCached(cacheKey);
    if (cached) return cached;

    let shop = null;
    if (adminDb) {
      // Admin SDK path (preferred - when env vars are set)
      const shopsRef = adminDb.collection('shops');
      let snap = await shopsRef.where('subdomainSlug', '==', slug).limit(1).get();
      if (snap.empty) snap = await shopsRef.where('shopSlug', '==', slug).limit(1).get();
      if (snap.empty) {
        const doc = await shopsRef.doc(slug).get();
        if (doc.exists) shop = { id: doc.id, ...toPlainObject(doc.data()) };
      } else {
        const doc = snap.docs[0];
        shop = { id: doc.id, ...toPlainObject(doc.data()) };
      }
    } else {
      // REST API fallback (when admin SDK env vars are missing)
      console.log(`[getShopServer] Using REST API fallback for slug: ${slug}`);
      shop = await firestoreRestQuery('shops', 'subdomainSlug', 'EQUAL', slug);
      if (!shop) shop = await firestoreRestQuery('shops', 'shopSlug', 'EQUAL', slug);
    }

    if (shop) setCached(cacheKey, shop, 600); // 10 minutes cache
    return shop || null;
  } catch (err) {
    console.error(`[getShopServer] Error:`, err);
    // Return stale cache if available to prevent 404 during quota exhaustion
    const stale = getCached(cacheKey, true);
    if (stale) {
      console.warn(`[getShopServer] Serving stale shop for slug "${slug}"`);
      return stale;
    }
    return null;
  }
}

export async function getShopByDomainServer(host) {
  if (!host) return null;
  // Normalize host
  const normalizedHost = host.toLowerCase().trim().replace(/^www\./i, '');
  const lookupHost = normalizedHost === 'messbazar.com' ? 'messerbazar.com' : normalizedHost;
  const cacheKey = `shop_domain_${lookupHost}`;

  try {
    const cached = getCached(cacheKey);
    if (cached) return cached;

    let shop = null;
    if (adminDb) {
      const shopsRef = adminDb.collection('shops');
      let snap = await shopsRef.where('customDomain', '==', lookupHost).limit(1).get();
      if (snap.empty) {
        snap = await shopsRef.where('domains', 'array-contains', lookupHost).limit(1).get();
      }
      if (snap.empty) {
        snap = await shopsRef.where('domains', 'array-contains', `www.${lookupHost}`).limit(1).get();
      }
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
      setCached(cacheKey, shop, 600); // 10 minutes cache
    }
    return shop || null;
  } catch (err) {
    console.error(`[getShopByDomainServer] Error:`, err);
    // Return stale cache if available to prevent 404 during quota exhaustion
    const stale = getCached(cacheKey, true);
    if (stale) {
      console.warn(`[getShopByDomainServer] Serving stale shop for host "${host}"`);
      return stale;
    }
    return null;
  }
}

export async function getProductServer(shopId, productId) {
  if (!shopId || !productId) return null;
  const cacheKey = `product_${shopId}_${productId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const shopProducts = getCached(`products_${shopId}`);
  if (Array.isArray(shopProducts)) {
    const found = shopProducts.find(p => p.id === productId);
    if (found) {
      setCached(cacheKey, found, 86400);
      return found;
    }
  }

  try {
    let product = null;
    if (adminDb) {
      const docSnap = await adminDb.collection('shops').doc(shopId).collection('products').doc(productId).get();
      if (docSnap.exists) {
        product = { id: docSnap.id, ...toPlainObject(docSnap.data()) };
      }
    } else {
      const allProds = await firestoreRestCollection(`shops/${shopId}/products`);
      product = (allProds || []).find(p => p.id === productId) || null;
    }

    if (product) {
      setCached(cacheKey, product, 86400);
    }
    return product;
  } catch (err) {
    console.error('[getProductServer] Error:', err);
    return getCached(cacheKey, true) || null;
  }
}

export async function getProductsServer(shopId) {
  if (!shopId) return [];
  const cacheKey = `products_${shopId}`;
  try {
    const cached = getCached(cacheKey);
    if (cached) return cached;

    let products;
    if (adminDb) {
      const snap = await adminDb.collection('shops').doc(shopId).collection('products').get();
      products = snap.docs.map(doc => ({ id: doc.id, ...toPlainObject(doc.data()) }));
    } else {
      console.log(`[getProductsServer] Using REST API fallback for shopId: ${shopId}`);
      products = await firestoreRestCollection(`shops/${shopId}/products`);
    }
    products.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
    setCached(cacheKey, products, 86400); // 24 hour cache
    products.forEach(p => { if (p?.id) setCached(`product_${shopId}_${p.id}`, p, 86400); });
    return products;
  } catch (err) {
    console.error(`[getProductsServer] Error:`, err);
    const stale = getCached(cacheKey, true);
    if (stale) {
      console.warn(`[getProductsServer] Serving stale products for shopId "${shopId}"`);
      return stale;
    }
    return [];
  }
}

export async function getCategoriesServer(shopId) {
  try {
    if (!shopId) return [];
    const cacheKey = `categories_${shopId}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    let categories;
    if (adminDb) {
      const snap = await adminDb.collection('shops').doc(shopId).collection('categories').get();
      categories = snap.docs.map(doc => ({ id: doc.id, ...toPlainObject(doc.data()) }));
    } else {
      console.log(`[getCategoriesServer] Using REST API fallback for shopId: ${shopId}`);
      categories = await firestoreRestCollection(`shops/${shopId}/categories`);
    }
    setCached(cacheKey, categories, 60);
    return categories;
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
    setCached(cacheKey, config, 600);
    return config;
  } catch (err) {
    console.error(`[getGlobalConfigServer] Error:`, err);
    return {};
  }
}

export async function getAllShopsServer() {
  const cacheKey = 'all_shops';
  try {
    const cached = getCached(cacheKey);
    if (cached) return cached;

    // ⚡ Check Upstash Redis serverless cache first (0 reads across all lambdas)
    const redis = await getRedis();
    if (redis) {
      try {
        const redisShops = await redis.get('cache:all_shops');
        if (redisShops) {
          const parsed = typeof redisShops === 'string' ? JSON.parse(redisShops) : redisShops;
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCached(cacheKey, parsed, 86400);
            return parsed;
          }
        }
      } catch (_) {}
    }

    let shops = [];
    if (adminDb) {
      const snap = await adminDb.collection('shops').get();
      shops = snap.docs.map(doc => ({ id: doc.id, ...toPlainObject(doc.data()) }));
    } else {
      shops = await firestoreRestCollection('shops') || [];
    }
    setCached(cacheKey, shops, 86400);

    // Save to Redis (TTL 86400s = 24 hours)
    if (redis && shops.length > 0) {
      try {
        await redis.set('cache:all_shops', JSON.stringify(shops), { ex: 86400 });
      } catch (_) {}
    }

    return shops;
  } catch (err) {
    console.error('[getAllShopsServer] Error:', err);
    const stale = getCached(cacheKey, true);
    if (stale) return stale;
    return [];
  }
}

export async function getAllMarketplaceProductsServer() {
  const cacheKey = 'all_marketplace_products';
  try {
    const cached = getCached(cacheKey);
    if (cached) return cached;

    // ⚡ Check Upstash Redis serverless cache first (0 reads across all lambdas)
    const redis = await getRedis();
    if (redis) {
      try {
        const redisProducts = await redis.get('cache:marketplace_products');
        if (redisProducts) {
          const parsed = typeof redisProducts === 'string' ? JSON.parse(redisProducts) : redisProducts;
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCached(cacheKey, parsed, 86400);
            return parsed;
          }
        }
      } catch (_) {}
    }

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
    setCached(cacheKey, flat, 86400); // 24 hour in-memory cache

    // Save to Redis (TTL 1800s = 30 minutes)
    if (redis && flat.length > 0) {
      try {
        await redis.set('cache:marketplace_products', JSON.stringify(flat), { ex: 86400 });
      } catch (_) {}
    }

    return flat;
  } catch (err) {
    console.error('[getAllMarketplaceProductsServer] Error:', err);
    const stale = getCached(cacheKey, true);
    if (stale) return stale;
    return [];
  }
}

