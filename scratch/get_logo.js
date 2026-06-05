import { adminDb } from '../src/lib/firebase-admin.js';

async function fetchLogos() {
  try {
    const shopsRef = adminDb.collection('shops');
    
    console.log('Fetching daripallah-store...');
    const dpQuery = await shopsRef.where('shopSlug', '==', 'daripallah-store').get();
    if (!dpQuery.empty) {
      console.log('daripallah-store logoUrl:', dpQuery.docs[0].data().logoUrl);
    } else {
      console.log('daripallah-store not found');
    }

    console.log('Fetching webmaa-store...');
    const wmQuery = await shopsRef.where('shopSlug', '==', 'webmaa-store').get();
    if (!wmQuery.empty) {
      console.log('webmaa-store logoUrl:', wmQuery.docs[0].data().logoUrl);
    } else {
      console.log('webmaa-store not found');
    }
  } catch (e) {
    console.error('Error fetching logos:', e);
  }
}

fetchLogos();
