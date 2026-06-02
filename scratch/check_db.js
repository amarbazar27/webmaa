const fs = require('fs');
const path = require('path');

// Manually load .env.local
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
const { getFirestore, getDocs, collection } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "webmaa-app.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  try {
    console.log("Checking Firestore shops...");
    const snap = await getDocs(collection(db, 'shops'));
    console.log(`Found ${snap.size} shops total:`);
    snap.docs.forEach(doc => {
      const d = doc.data();
      console.log(`- ID: ${doc.id}`);
      console.log(`  Name: ${d.shopName}`);
      console.log(`  SubdomainSlug: ${d.subdomainSlug}`);
      console.log(`  ShopSlug: ${d.shopSlug}`);
      console.log(`  Banners count: ${d.banners?.length || 0}`);
      console.log(`  LogoUrl: ${d.logoUrl}`);
    });
  } catch (err) {
    console.error("Error:", err);
  }
}

check();
