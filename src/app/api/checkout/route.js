export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';

// ── Strict Payload Validation using Zod ───────────────────────────
const CheckoutSchema = z.object({
  shopId: z.string().min(1, "Shop ID string is required"),
  customerName: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  customerPhone: z.string().regex(/^01[3-9]\d{8}$/, "Invalid BD Phone Number format"),
  customerEmail: z.string().email("Invalid email").optional().or(z.literal('')),
  customerAddress: z.string().min(5, "Address must be detailed").max(200, "Address too long"),
  customerNote: z.string().max(300).optional(),
  transactionId: z.string().max(50).optional(),
  honeypot: z.string().max(0, "Bot detected").optional(), // Honeypot field for bot defense
  items: z.array(z.object({
    id: z.string().min(1),
    quantity: z.number().int().positive().max(50, "Max 50 quantity per item"),
    note: z.string().max(100).optional()
  })).min(1, "Cart cannot be empty")
});

export async function POST(req) {
  try {
    const body = await req.json();

    // ── Input Validation ────────────────────────────────────────────────
    const parsed = CheckoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
    }

    const { shopId, customerName, customerPhone, customerEmail, customerAddress, customerNote, transactionId, honeypot, items } = parsed.data;

    // BOT DEFENSE: Honeypot logic
    if (honeypot && honeypot.length > 0) {
      return NextResponse.json({ error: 'Suspicious request' }, { status: 403 });
    }

    // Server-side validation only occurs if Firebase Admin is fully initialized.
    if (!adminDb) {
       console.error("Firebase Admin DB not initialized. Cannot process checkout.");
       return NextResponse.json({ error: 'System configuration error. Please contact admin.' }, { status: 500 });
    }

    // ── Server-Side Pricing Verification ─────────────────────────────────
    const shopRef = adminDb.collection('shops').doc(shopId);
    const shopSnap = await shopRef.get();

    if (!shopSnap.exists) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const shopData = shopSnap.data();
    
    // Check if shop is paused/inactive
    if (shopData.isActive === false) {
      return NextResponse.json({ error: 'Store is temporarily closed' }, { status: 400 });
    }

    const deliveryConfig = shopData.deliveryConfig || {};
    const deliveryAdvanceFee = deliveryConfig.advanceFee ? parseInt(deliveryConfig.advanceFee) : 60;
    const isCOD = deliveryConfig.isCOD !== false;

    // Fetch product details securely from DB to prevent fake/zero-price order abuse
    let computedCartTotal = 0;
    const verifiedItems = [];

    const productsRef = adminDb.collection('shops').doc(shopId).collection('products');
    
    for (const item of items) {
      const pSnap = await productsRef.doc(item.id).get();
      if (!pSnap.exists) {
        return NextResponse.json({ error: `Product not found: ${item.id}` }, { status: 404 });
      }
      const productDb = pSnap.data();
      const productActualPrice = parseFloat(productDb.price || 0);

      // Add to computed total
      computedCartTotal += (productActualPrice * item.quantity);
      
      verifiedItems.push({
        id: item.id,
        name: productDb.name,
        price: productActualPrice.toString(),
        quantity: item.quantity,
        note: item.note || ''
      });
    }

    // Determine Free Delivery based on User Streak
    let hasFreeDelivery = false;
    if (customerEmail) {
      // Calculate streak logic (simplified for server side check)
      const userOrdersSnap = await adminDb.collection('shops').doc(shopId).collection('orders')
        .where('customerEmail', '==', customerEmail.toLowerCase().trim())
        .orderBy('createdAt', 'desc')
        .get();
        
      // Count unique days
      const dateSet = new Set();
      userOrdersSnap.forEach(doc => {
        const d = doc.data();
        if (d.createdAt && d.createdAt.toDate) {
            const dt = d.createdAt.toDate();
            dateSet.add(`${dt.getDate()}${dt.getMonth()}${dt.getFullYear()}`);
        }
      });
      // Basic free delivery check. In full implementation, it should match the advanced streak algo perfectly.
      // Assuming 6 consecutive orders give free delivery on the 7th
      if (dateSet.size >= 6) {
         hasFreeDelivery = true;
      }
    }

    const effectiveDelivery = hasFreeDelivery ? 0 : deliveryAdvanceFee;
    const finalTotal = computedCartTotal + effectiveDelivery;

    // ── Generate Order Serial Number Securely ───────────────────────────
    const today = new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Dhaka' }).replace(/\//g, ''); // DDMMYY
    const counterRef = adminDb.collection('shops').doc(shopId).collection('counters').doc(`orders_${today}`);
    
    let newCount = 0;
    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(counterRef);
      const current = snap.exists ? (snap.data().count || 0) : 0;
      newCount = current + 1;
      tx.set(counterRef, { count: newCount, date: today }, { merge: true });
    });
    
    const serialStr = newCount.toString().padStart(2, '0');
    
    // Construct Visual ID
    const dateStr = new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Dhaka' }).replace(/\//g, '');
    const orderIdVisual = `${serialStr}#${dateStr}`;

    // ── Save Order Securely leveraging Admin SDK ────────────────────────
    const newOrderRef = adminDb.collection('shops').doc(shopId).collection('orders').doc();
    const orderData = {
      customerName,
      customerPhone,
      customerEmail: customerEmail || '',
      customerAddress,
      customerNote: customerNote || '',
      transactionId: transactionId || '',
      orderIdVisual,
      items: verifiedItems,
      total: finalTotal,
      isCOD,
      shopId,
      shopName: shopData.shopName,
      freeDelivery: hasFreeDelivery,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await newOrderRef.set(orderData);

    return NextResponse.json({ success: true, orderId: newOrderRef.id, total: finalTotal, orderIdVisual });
  } catch (error) {
     console.error('[CHECKOUT API ERROR]', error);
     return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
