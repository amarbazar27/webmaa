const fs = require('fs');
const path = require('path');

// Load environment variables
try {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/(^['"]|['"]$)/g, '');
        process.env[key] = val;
      }
    });
  }
} catch (e) {
  console.log("Could not load env file manually:", e);
}

const { initializeApp } = require('firebase/app');
const { getFirestore, getDocs, collection, query, where, getDoc, doc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "webmaa-app.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Simulate server fetches
async function getShopServer(slug) {
  const shopsRef = collection(db, 'shops');
  const q1 = query(shopsRef, where('subdomainSlug', '==', slug));
  const snap1 = await getDocs(q1);
  if (!snap1.empty) return { id: snap1.docs[0].id, ...snap1.docs[0].data() };

  const q2 = query(shopsRef, where('shopSlug', '==', slug));
  const snap2 = await getDocs(q2);
  if (!snap2.empty) return { id: snap2.docs[0].id, ...snap2.docs[0].data() };
  
  return null;
}

async function getProductsServer(shopId) {
  const snap = await getDocs(collection(db, 'shops', shopId, 'products'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function getCategoriesServer(shopId) {
  const snap = await getDocs(collection(db, 'shops', shopId, 'categories'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function run() {
  const shopSlug = 'messerbazar';
  console.log(`Simulating SSR render for slug: ${shopSlug}`);
  try {
    const shop = await getShopServer(shopSlug);
    if (!shop) {
      console.log("Shop not found in Firestore!");
      return;
    }
    console.log("Shop found:", shop.shopName, "ID:", shop.id);
    console.log("shop.altNames:", shop.altNames);
    console.log("shop.domains:", shop.domains);

    // Test alternate names spread logic
    const alternateNames = [
      ...(shop?.altNames || []),
      shop?.shopName,
      shop?.slogan,
    ].filter(Boolean);
    console.log("alternateNames successfully evaluated:", alternateNames);

    console.log("Fetching products and categories...");
    const products = await getProductsServer(shop.id);
    const categories = await getCategoriesServer(shop.id);
    console.log(`Fetched ${products.length} products and ${categories.length} categories.`);

    // Test JSON serialization
    const safeShop = JSON.parse(JSON.stringify(shop));
    const safeProducts = JSON.parse(JSON.stringify(products));
    const safeCategories = JSON.parse(JSON.stringify(categories));
    console.log("JSON serialization successful.");

    console.log("SSR Simulation completed with SUCCESS! No crashes on server-side data fetching/serialization.");
  } catch (err) {
    console.error("CRASH ENCOUNTERED:", err);
  }
}

run();
