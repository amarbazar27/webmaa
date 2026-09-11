import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 });
    }

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (e) {
      return NextResponse.json({ error: 'Unauthorized: invalid token' }, { status: 401 });
    }

    const { shopId, draftId, customerNote } = await req.json();

    if (!shopId || !draftId) {
      return NextResponse.json({ error: 'Missing shopId or draftId' }, { status: 400 });
    }

    // Verify user permissions for shop
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    const isSuperAdmin = userData?.role === 'superadmin';
    const isOwner = userData?.shopId === shopId;

    if (!isSuperAdmin && !isOwner) {
      // Check if user is retailer of this shop
      const shopDoc = await adminDb.collection('shops').doc(shopId).get();
      if (!shopDoc.exists || shopDoc.data()?.retailerId !== decodedToken.uid) {
        return NextResponse.json({ error: 'Forbidden: you do not own this shop' }, { status: 403 });
      }
    }

    // Get the draft document
    const draftRef = adminDb.collection('shops').doc(shopId).collection('incomplete_orders').doc(draftId);
    const draftSnap = await draftRef.get();

    if (!draftSnap.exists) {
      return NextResponse.json({ error: 'Lead/Draft session not found' }, { status: 404 });
    }

    const draft = draftSnap.data();

    if (draft.status === 'recovered' && draft.orderId) {
      return NextResponse.json({ 
        success: true, 
        message: 'This lead was already converted into an order', 
        orderId: draft.orderId 
      });
    }

    const customerPhone = draft.customerPhone || '';
    const customerName = draft.customerName || 'Customer';
    const customerAddress = draft.customerAddress || 'Address not specified (Lead Conversion)';
    const items = Array.isArray(draft.items) && draft.items.length > 0 ? draft.items : [];
    const total = Number(draft.total) || items.reduce((acc, i) => acc + (Number(i.price) * Number(i.quantity || 1)), 0);

    if (items.length === 0) {
      return NextResponse.json({ error: 'Cannot convert empty cart to order' }, { status: 400 });
    }

    // Generate Visual Order ID (e.g. #ORD-1234)
    const now = new Date();
    const orderIdVisual = `#LD-${now.getFullYear().toString().slice(-2)}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Create real order in shops/{shopId}/orders
    const ordersCol = adminDb.collection('shops').doc(shopId).collection('orders');
    const newOrderRef = ordersCol.doc();

    const orderData = {
      orderIdVisual,
      customerName,
      customerPhone,
      customerEmail: draft.customerEmail || '',
      customerAddress,
      customerNote: customerNote || draft.customerNote || 'Converted from Abandoned Checkout Lead',
      items: items.map(item => ({
        id: item.id || '',
        name: item.name || 'Product',
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0
      })),
      total,
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      status: 'pending',
      isRecoveredLead: true,
      recoveredLeadId: draftId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await newOrderRef.set(orderData);

    // Update draft to recovered
    await draftRef.update({
      status: 'recovered',
      orderId: newOrderRef.id,
      orderIdVisual,
      recoveredAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update shop stats
    await adminDb.collection('shops').doc(shopId).update({
      orderCount: admin.firestore.FieldValue.increment(1),
      totalRevenue: admin.firestore.FieldValue.increment(total)
    }).catch(err => console.warn('[Recover Draft] Shop stats increment failed:', err));

    return NextResponse.json({
      success: true,
      message: 'Lead successfully converted into order!',
      orderId: newOrderRef.id,
      orderIdVisual
    });

  } catch (error) {
    console.error('[Recover Draft Error]:', error);
    return NextResponse.json({ error: 'Failed to convert lead into order', details: error.message }, { status: 500 });
  }
}
