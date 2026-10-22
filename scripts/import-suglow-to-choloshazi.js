const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    })
  });
}

const db = getFirestore();
const SHOP_ID = 'DK1MqkOuzpanI8vYxzFI5O9GnhQ2';

async function run() {
  console.log(`[Import] Starting REA & API-Anything import from Suglow into shop: ${SHOP_ID}...`);

  // 1. Fetch high-res images from sitemap.xml
  console.log('[Import] Fetching sitemap image index...');
  const sitemapImageMap = new Map();
  try {
    const smRes = await fetch('https://suglow.com/sitemap.xml', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10000)
    });
    if (smRes.ok) {
      const smText = await smRes.text();
      const smBlocks = smText.match(/<url>[\s\S]*?<\/url>/g) || [];
      for (const b of smBlocks) {
        const loc = b.match(/<loc>([^<]+)<\/loc>/)?.[1];
        const img = b.match(/<image:loc>([^<]+)<\/image:loc>/)?.[1];
        if (loc && img) {
          const slug = loc.replace('https://suglow.com/product/', '').trim();
          sitemapImageMap.set(slug, img);
        }
      }
    }
  } catch (err) {
    console.warn('[Import] Sitemap fetch failed (using API covers):', err.message);
  }
  console.log(`[Import] Sitemap image index loaded: ${sitemapImageMap.size} images mapped.`);

  // 2. Fetch all products via direct REA API
  console.log('[Import] Calling Suglow Direct JSON API...');
  const apiRes = await fetch('https://suglow.com/api/frontend/product', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'x-api-key': 'i7a05ls4-r0i2-22h9-7161-f046d16528q495522',
    },
    signal: AbortSignal.timeout(15000)
  });

  if (!apiRes.ok) {
    throw new Error(`Suglow API returned HTTP ${apiRes.status}`);
  }

  const json = await apiRes.json();
  const rawProducts = json.data || [];
  console.log(`[Import] Retrieved ${rawProducts.length} authentic products from Suglow!`);

  // 3. Category grouping
  const categoriesSet = new Set(['Skin Care', 'Hair Care', 'Body Care', 'Cosmetics', 'Baby Care', 'Personal Care']);
  const defaultCategory = 'Skin Care';

  // 4. Batch save into Firestore in chunks of 250
  const BATCH_SIZE = 250;
  let totalSaved = 0;

  for (let i = 0; i < rawProducts.length; i += BATCH_SIZE) {
    const chunk = rawProducts.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (const p of chunk) {
      if (!p.name) continue;

      const pRef = db.collection('shops').doc(SHOP_ID).collection('products').doc();
      const price = parseFloat(p.flat_price || p.convert_price || 0);
      if (price <= 0) continue;

      const costPrice = Math.round(price * 0.7);

      // Best image: custom cover > sitemap high-res image > fallback
      let img = p.cover;
      if (!img || img.includes('default/product/cover')) {
        img = sitemapImageMap.get(p.slug) || 'https://suglow.com/images/required/og-suglow.jpg';
      }

      // Infer category from product title
      let cat = defaultCategory;
      const lowerName = p.name.toLowerCase();
      if (lowerName.includes('shampoo') || lowerName.includes('hair') || lowerName.includes('conditioner') || lowerName.includes('serum for hair')) {
        cat = 'Hair Care';
      } else if (lowerName.includes('lotion') || lowerName.includes('body milk') || lowerName.includes('body wash') || lowerName.includes('soap') || lowerName.includes('shower')) {
        cat = 'Body Care';
      } else if (lowerName.includes('baby') || lowerName.includes('puff') || lowerName.includes('diaper')) {
        cat = 'Baby Care';
      } else if (lowerName.includes('lipstick') || lowerName.includes('mascara') || lowerName.includes('powder') || lowerName.includes('foundation') || lowerName.includes('make up') || lowerName.includes('makeup')) {
        cat = 'Cosmetics';
      } else if (lowerName.includes('toothpaste') || lowerName.includes('toothbrush') || lowerName.includes('deodorant') || lowerName.includes('roll on')) {
        cat = 'Personal Care';
      }

      categoriesSet.add(cat);

      batch.set(pRef, {
        name: p.name.trim(),
        price,
        costPrice,
        stock: parseInt(p.stock, 10) || 40,
        category: cat,
        description: `${p.name}. Authentic imported cosmetic item from Suglow. Original packaging with guaranteed quality.`,
        imageUrl: img,
        images: [img],
        sourceUrl: `https://suglow.com/product/${p.slug || ''}`,
        extractionSource: 'rea_suglow_direct_api',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      totalSaved++;
    }

    await batch.commit();
    console.log(`[Import] Committed batch ${Math.floor(i / BATCH_SIZE) + 1} (${totalSaved} products saved so far)...`);
  }

  // 5. Ensure categories exist in shop categories subcollection
  console.log('[Import] Creating category documents...');
  const catBatch = db.batch();
  for (const catName of categoriesSet) {
    const catRef = db.collection('shops').doc(SHOP_ID).collection('categories').doc();
    catBatch.set(catRef, {
      name: catName,
      slug: catName.toLowerCase().replace(/\s+/g, '-'),
      createdAt: new Date().toISOString()
    });
  }
  await catBatch.commit();

  console.log(`[Import] SUCCESS! Fully imported ${totalSaved} products and ${categoriesSet.size} categories into Cholo Shazi's Premium Store!`);
}

run().catch(err => {
  console.error('[Import Error]', err);
  process.exit(1);
});
