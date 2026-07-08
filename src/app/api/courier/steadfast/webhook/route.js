import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json({ error: 'Missing shopId in URL search parameters' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');

    const body = await req.json();
    const {
      consignment_id,
      invoice,
      status,
      cod_amount,
      delivery_charge,
      tracking_message
    } = body;

    if (!consignment_id) {
      return NextResponse.json({ error: 'Missing consignment_id in payload' }, { status: 400 });
    }

    // Fetch shop courier configs for webhook token validation
    const shopRef = adminDb.collection('shops').doc(shopId);
    const shopSnap = await shopRef.get();
    if (!shopSnap.exists) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const shopData = shopSnap.data();
    const configToken = shopData.courierConfig?.steadfastWebhookToken;

    // RED-6: Webhook token check is now MANDATORY
    // Previously: if configToken was empty, ALL requests were accepted
    if (!configToken) {
      console.error(`[Steadfast Webhook] Shop ${shopId} has no webhook token configured`);
      return NextResponse.json({ error: 'Webhook not configured for this shop' }, { status: 403 });
    }
    if (token !== configToken) {
      return NextResponse.json({ error: 'Unauthorized webhook access' }, { status: 401 });
    }

    // Lookup order in this shop
    const ordersRef = shopRef.collection('orders');
    let orderDoc = null;
    let orderId = null;

    // 1. Try by document ID (invoice might be the raw orderId)
    if (invoice && invoice.length === 20) {
      const docSnap = await ordersRef.doc(invoice).get();
      if (docSnap.exists) {
        orderDoc = docSnap;
        orderId = docSnap.id;
      }
    }

    // 2. Try by visual order ID
    if (!orderDoc && invoice) {
      const qSnap = await ordersRef.where('orderIdVisual', '==', invoice).limit(1).get();
      if (!qSnap.empty) {
        orderDoc = qSnap.docs[0];
        orderId = qSnap.docs[0].id;
      }
    }

    // 3. Try by consignment ID
    if (!orderDoc) {
      const qSnap = await ordersRef.where('consignmentId', '==', consignment_id.toString()).limit(1).get();
      if (!qSnap.empty) {
        orderDoc = qSnap.docs[0];
        orderId = qSnap.docs[0].id;
      }
    }

    if (!orderDoc) {
      console.warn(`[Steadfast Webhook] Order not found for invoice: ${invoice}, consignment: ${consignment_id}`);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderData = orderDoc.data();
    const currentStatus = orderData.status;

    // Map Steadfast status to e-commerce statuses
    const updates = {
      courierStatus: status,
      courierUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (delivery_charge) {
      updates.courierCharge = Number(delivery_charge);
    }
    if (cod_amount) {
      updates.courierCOD = Number(cod_amount);
    }

    // Status mapping:
    // 'delivered', 'partial_delivered' -> 'completed'
    // 'cancelled' -> 'cancelled'
    let newSystemStatus = currentStatus;
    if (status === 'delivered' || status === 'partial_delivered') {
      newSystemStatus = 'completed';
      updates.paymentStatus = 'paid';
      updates.deliveredAt = admin.firestore.FieldValue.serverTimestamp();
    } else if (status === 'cancelled') {
      newSystemStatus = 'cancelled';
      updates.rejectedAt = admin.firestore.FieldValue.serverTimestamp();
      
      // Stock Auto Release Logic
      // If we mark the order cancelled, we can increment product stocks back
      try {
        const productsRef = shopRef.collection('products');
        for (const item of orderData.items || []) {
          const pSnap = await productsRef.doc(item.id).get();
          if (pSnap.exists) {
            const pData = pSnap.data();
            if (pData.stock !== undefined && pData.stock !== null) {
              await productsRef.doc(item.id).update({
                stock: admin.firestore.FieldValue.increment(item.quantity)
              });
            }
          }
        }
      } catch (stockErr) {
        console.error('[Steadfast Webhook] Failed to release stock:', stockErr);
      }
    }

    updates.status = newSystemStatus;
    await ordersRef.doc(orderId).update(updates);

    // Save to courier log
    await ordersRef.doc(orderId).collection('courier_logs').add({
      action: 'status_webhook_received',
      status: status,
      trackingMessage: tracking_message || '',
      rawPayload: body,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Loyalty Point Logic if transitioned to completed
    if (newSystemStatus === 'completed' && currentStatus !== 'completed' && orderData.customerId) {
      try {
        const userRef = adminDb.collection('users').doc(orderData.customerId);
        const userSnap = await userRef.get();
        if (userSnap.exists) {
          const userData = userSnap.data();
          const todayStr = new Date().toISOString().split('T')[0];
          if (userData.lastLoyaltyDate !== todayStr) {
            await userRef.update({
              loyaltyPoints: admin.firestore.FieldValue.increment(1),
              lastLoyaltyDate: todayStr
            });
          }
        }
      } catch (loyaltyErr) {
        console.warn('[Webhook] Loyalty Points update failed:', loyaltyErr.message);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Steadfast Webhook Error]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
