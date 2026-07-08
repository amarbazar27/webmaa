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

    // 🔒 CRIT-4 Fix: Sanitize shop data — never expose internal config/secrets
    const safeShopData = {
      id: shopId,
      shopName: shopData.shopName,
      shopSlug: shopData.shopSlug || shopData.subdomainSlug,
      subdomainSlug: shopData.subdomainSlug,
      logo: shopData.logo || '',
      deliveryConfig: shopData.deliveryConfig ? {
        contactPhone: shopData.deliveryConfig.contactPhone,
        advanceFee: shopData.deliveryConfig.advanceFee,
        isCOD: shopData.deliveryConfig.isCOD,
      } : {},
    };

    // 🔒 CRIT-4 Fix: Sanitize order data — remove internal/sensitive fields
    const rawOrder = formatData(orderData);
    const {
      clientIp, fraudScore, fraudRiskLevel, fraudReasons,
      localId: _localId, piprapayPpId, piprapayCheckoutUrl,
      paymentCommission, paymentNetEarning, paymentCommissionPercent,
      ...safeOrderData
    } = rawOrder;

    return NextResponse.json({ 
      shop: safeShopData, 
      order: { id: orderSnap.id, ...safeOrderData } 
    });

  } catch (error) {
    console.error('Order API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
