import { readFileSync } from 'fs';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const envContent = readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[key] = val;
  }
});

const projectId = env.FIREBASE_PROJECT_ID || env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: projectId,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

async function countProducts() {
  const shopsSnap = await db.collection('shops').get();
  console.log(`Shops count: ${shopsSnap.docs.length}`);
  let total = 0;
  for (const shop of shopsSnap.docs) {
    const prodSnap = await shop.ref.collection('products').get();
    console.log(`Shop: ${shop.id} (${shop.data().shopName || shop.data().name}) -> ${prodSnap.docs.length} products`);
    total += prodSnap.docs.length;
  }
  console.log(`Total products across all shops: ${total}`);

  // Also check collectionGroup('products')
  const cgSnap = await db.collectionGroup('products').get();
  console.log(`collectionGroup('products').get() total docs: ${cgSnap.docs.length}`);
}

countProducts().catch(console.error);
