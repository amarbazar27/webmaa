import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const shopSlug = searchParams.get('shopSlug');
    const orderId = searchParams.get('orderId');

    if (!shopSlug || !orderId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Find the shop
    let shopId = null;
    let shopData = null;
    
    // Check subdomainSlug
    const shopQuery1 = await adminDb.collection('shops').where('subdomainSlug', '==', shopSlug).limit(1).get();
    if (!shopQuery1.empty) {
      shopId = shopQuery1.docs[0].id;
      shopData = shopQuery1.docs[0].data();
    } else {
      // Check shopSlug (legacy)
      const shopQuery2 = await adminDb.collection('shops').where('shopSlug', '==', shopSlug).limit(1).get();
      if (!shopQuery2.empty) {
        shopId = shopQuery2.docs[0].id;
        shopData = shopQuery2.docs[0].data();
      }
    }

    if (!shopId) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Find the order
    const orderSnap = await adminDb.collection('shops').doc(shopId).collection('orders').doc(orderId).get();
    if (!orderSnap.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    const orderData = orderSnap.data();

    // Since we are not doing a full session validation here for public order viewing, 
    // it's a bit open, but typically order URLs are private (unguessable IDs).
    // For a fully secure app, you'd verify a session cookie or token.
    // In this context, we'll allow reading if they have the EXACT order ID.
    // Convert Firestore timestamps to standard format for JSON serialization
    const formatData = (data) => {
      const formatted = { ...data };
      for (const [key, value] of Object.entries(formatted)) {
         if (value && typeof value === 'object' && value.toDate) {
            formatted[key] = value.toDate().toISOString();
         }
      }
      return formatted;
    };

    return NextResponse.json({ 
      shop: { id: shopId, ...formatData(shopData) }, 
      order: { id: orderSnap.id, ...formatData(orderData) } 
    });

  } catch (error) {
    console.error('Order API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
