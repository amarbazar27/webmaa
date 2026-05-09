import { adminDb } from './src/lib/firebase-admin.js';

async function test() {
  try {
    const shops = await adminDb.collection('shops').where('subdomainSlug', '==', 'messerbazar').get();
    if (shops.empty) {
      console.log('Shop not found');
      return;
    }
    const shopId = shops.docs[0].id;
    const shopData = shops.docs[0].data();
    console.log('Shop found:', shopId);

    const product = await adminDb.collection('shops').doc(shopId).collection('products').doc('OkUmtZxgQ5y8tzwMW5dA').get();
    if (!product.exists) {
      console.log('Product not found');
      return;
    }
    const productData = product.data();
    console.log('Product found:', productData.name);
    
    // Test toPlainObject
    function toPlainObject(data) {
      if (data === null || data === undefined) return null;
      if (typeof data !== 'object') return data;
      if (data instanceof Date || (typeof data.toISOString === 'function')) {
        try { return data.toISOString(); } catch { return String(data); }
      }
      if (Array.isArray(data)) return data.map(item => toPlainObject(item));
      if ((data._seconds !== undefined && data._nanoseconds !== undefined) || 
          (data.seconds !== undefined && data.nanoseconds !== undefined)) {
        const s = data._seconds ?? data.seconds;
        return new Date(s * 1000).toISOString();
      }
      if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        return { lat: data.latitude, lng: data.longitude };
      }
      if (data.constructor && (data.constructor.name === 'Buffer' || data.constructor.name === 'Uint8Array')) {
        return '[binary]';
      }
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
        try { return JSON.parse(JSON.stringify(data)); } catch { return String(data); }
      }
      return plain;
    }

    const safeProduct = toPlainObject(productData);
    console.log(safeProduct);

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

test();
