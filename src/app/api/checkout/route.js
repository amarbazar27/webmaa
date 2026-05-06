export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import { sendOrderConfirmationEmail, sendRetailerNotificationEmail } from '@/lib/ruflo';
import { sendTelegramAlert } from '@/lib/telegram';

// ── Strict Payload Validation ───────────────────────────
const CheckoutSchema = z.object({
  shopId: z.string().min(1),
  customerName: z.string().min(2).max(100),
  customerPhone: z.string().regex(/^01[3-9]\d{8}$/),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerAddress: z.string().min(5).max(200),
  customerNote: z.string().max(300).optional(),
  transactionId: z.string().max(50).optional(),
  paymentNumber: z.string().max(15).optional(),
  honeypot: z.string().max(0).optional(),
  localId: z.string().max(100).optional(), // Idempotency key from client
  items: z.array(z.object({
    id: z.string().min(1),
    quantity: z.number().int().positive().max(50),
    note: z.string().max(200).optional(),
    variantsText: z.string().max(200).optional(),
    customizedText: z.string().max(200).optional(),
    baseUnit: z.string().max(50).optional(),
    clientPrice: z.number().positive().optional()
  })).min(1),
  customerId: z.string().min(1)
});

// ── Simple Rate Limit (in-memory, basic protection) ─────
const rateLimitMap = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 min
  const maxReq = 20;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, time: now });
    return false;
  }

  const data = rateLimitMap.get(ip);

  if (now - data.time > windowMs) {
    rateLimitMap.set(ip, { count: 1, time: now });
    return false;
  }

  if (data.count >= maxReq) return true;

  data.count++;
  return false;
}

export async function POST(req) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';

    // 🚨 Rate limit check
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();

    // ── Input Validation ────────────────────────────────
    const parsed = CheckoutSchema.safeParse(body);
    if (!parsed.success) {
      console.error('Validation Error:', parsed.error.errors);
      return NextResponse.json({ error: 'Validation failed: ' + parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') }, { status: 400 });
    }

    const {
      shopId,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      customerNote,
      transactionId,
      paymentNumber,
      honeypot,
      localId,
      items,
      customerId
    } = parsed.data;

    if (!adminDb) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 });
    }

    // ── Fetch shop ─────────────────────────────────────
    const shopRef = adminDb.collection('shops').doc(shopId);
    const shopSnap = await shopRef.get();

    if (!shopSnap.exists) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const shopData = shopSnap.data();

    if (shopData.isActive === false) {
      return NextResponse.json({ error: 'Shop closed' }, { status: 400 });
    }

    const requireLogin = shopData.authSettings?.requireLoginBeforeOrder ?? true;

    // 🚨 Auth Check
    const authHeader = req.headers.get('authorization');
    let decodedToken = null;
    
    if (requireLogin) {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
      }
      const idToken = authHeader.split('Bearer ')[1];
      try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
      } catch (err) {
        return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
      }
      
      // 🛑 Verify user ID matches token
      if (customerId !== decodedToken.uid) {
        return NextResponse.json({ error: 'Unauthorized: User ID mismatch' }, { status: 403 });
      }
    } else {
      // Guest allowed, but if token provided, verify it
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const idToken = authHeader.split('Bearer ')[1];
          decodedToken = await admin.auth().verifyIdToken(idToken);
        } catch (err) {
          // ignore error for guests
        }
      }
    }



    // 🛑 Idempotency Check: Prevent duplicate processing if localId exists
    if (localId) {
      const existingOrderSnap = await adminDb
        .collection('shops')
        .doc(shopId)
        .collection('orders')
        .where('localId', '==', localId)
        .limit(1)
        .get();

      if (!existingOrderSnap.empty) {
        const existingData = existingOrderSnap.docs[0].data();
        return NextResponse.json({
          success: true,
          orderId: existingOrderSnap.docs[0].id,
          total: existingData.total,
          orderIdVisual: existingData.orderIdVisual,
          isDuplicate: true
        });
      }
    }

    // 🛑 Honeypot bot defense
    if (honeypot && honeypot.length > 0) {
      return NextResponse.json({ error: 'Bot detected' }, { status: 403 });
    }



    const deliveryConfig = shopData.deliveryConfig || {};
    const deliveryFee = deliveryConfig.advanceFee ? parseInt(deliveryConfig.advanceFee) : 60;
    const isCOD = deliveryConfig.isCOD !== false;

    // ── Secure product fetch & pricing ──────────────────
    let total = 0;
    const verifiedItems = [];

    const productsRef = adminDb.collection('shops').doc(shopId).collection('products');

    for (const item of items) {
      const pSnap = await productsRef.doc(item.id).get();

      if (!pSnap.exists) {
        return NextResponse.json({ error: 'Invalid product' }, { status: 404 });
      }
      const product = pSnap.data();

      let price = parseFloat(product.price) || 0;

      // Calculate dynamic price based on variants from DB
      if (item.variantsText) {
        if (product.variants?.length > 0) {
          // Parse "Size: M, Color: Red"
          const selectedPairs = item.variantsText.split(', ').map(s => s.split(': '));
          let hasVariantPrice = false;
          let maxVariantPrice = 0;
          
          for (const [vName, vLabel] of selectedPairs) {
             const variantGroup = product.variants.find(v => v.name === vName);
             if (variantGroup) {
                const opt = variantGroup.options?.find(o => o.label === vLabel);
                if (opt) {
                   const p = parseFloat(opt.price);
                   if (p > 0) {
                      hasVariantPrice = true;
                      if (p > maxVariantPrice) maxVariantPrice = p;
                   }
                }
             }
          }
          if (hasVariantPrice) {
             price = maxVariantPrice;
          }
        } else if (product.sizes?.length > 0) {
          // Legacy sizes
          const selectedSize = product.sizes.find(s => s.label === item.variantsText);
          if (selectedSize) {
             price = parseFloat(selectedSize.price) || price;
          }
        }
      }

      // If product allows AI customization, trust the clientPrice (beta feature)
      if (product.allowCustomize && item.clientPrice && item.clientPrice > 0) {
         price = item.clientPrice;
      }

      // 🚨 Price validation
      if (!price || price <= 0) {
        return NextResponse.json({ error: 'Invalid product price' }, { status: 400 });
      }

      // 🚨 Stock validation (if exists)
      if (product.stock && item.quantity > product.stock) {
        return NextResponse.json({ error: 'Out of stock' }, { status: 400 });
      }

      total += price * item.quantity;

      verifiedItems.push({
        id: item.id,
        name: product.name + (item.variantsText ? ` (${item.variantsText})` : ''),
        price: price.toString(),
        quantity: item.quantity,
        note: item.note || '',
        imageUrl: product.imageUrl || '',
        customizedText: item.customizedText || '',
        baseUnit: item.baseUnit || ''
      });
    }

    // 🚨 Minimum Order Amount enforcement
    const minOrder = parseInt(deliveryConfig.minOrderAmount) || 0;
    if (minOrder > 0 && total < minOrder) {
      return NextResponse.json({ error: `Minimum order amount is ৳${minOrder}` }, { status: 400 });
    }

    // ── Delivery logic ─────────────────────────────────
    let freeDelivery = false;

    if (customerPhone) {
      const ordersSnap = await adminDb
        .collection('shops')
        .doc(shopId)
        .collection('orders')
        .where('customerPhone', '==', customerPhone)
        .get();

      if (ordersSnap.size >= 6) {
        freeDelivery = true;
      }
    }

    const finalTotal = total + (freeDelivery ? 0 : deliveryFee);

    // ── Order counter & Atomic Stock Reduction ──────────
    const today = new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Dhaka' }).replace(/\//g, '');
    const counterRef = adminDb.collection('shops').doc(shopId).collection('counters').doc(`orders_${today}`);

    let newCount = 0;

    try {
      await adminDb.runTransaction(async (tx) => {
        // 1. Check stocks first
        const productSnaps = {};
        for (const item of verifiedItems) {
          const pRef = productsRef.doc(item.id);
          const pSnap = await tx.get(pRef);
          if (!pSnap.exists) throw new Error(`Product not found: ${item.name}`);
          productSnaps[item.id] = pSnap;
        }

        for (const item of verifiedItems) {
          const pData = productSnaps[item.id].data();
          if (pData.stock !== undefined && pData.stock !== null) {
            if (pData.stock < item.quantity) {
              throw new Error(`Out of stock: ${item.name}`);
            }
          }
        }

        // 2. Perform updates
        for (const item of verifiedItems) {
          const pRef = productsRef.doc(item.id);
          const pData = productSnaps[item.id].data();
          if (pData.stock !== undefined && pData.stock !== null) {
            tx.update(pRef, { stock: pData.stock - item.quantity });
          }
        }

        // 3. Update counter
        const snap = await tx.get(counterRef);
        const current = snap.exists ? (snap.data().count || 0) : 0;
        newCount = current + 1;
        tx.set(counterRef, { count: newCount }, { merge: true });
      });
    } catch (txError) {
      if (txError.message.startsWith('Out of stock') || txError.message.startsWith('Product not found')) {
        return NextResponse.json({ error: txError.message }, { status: 400 });
      }
      throw txError;
    }

    const serial = newCount.toString().padStart(2, '0');
    const orderIdVisual = `${serial}#${today}`;

    // ── Save order ─────────────────────────────────────
    const newOrderRef = adminDb
      .collection('shops')
      .doc(shopId)
      .collection('orders')
      .doc();

    await newOrderRef.set({
      customerName,
      customerPhone,
      customerEmail: customerEmail || '',
      customerAddress,
      customerNote: customerNote || '',
      transactionId: transactionId || '',
      paymentNumber: paymentNumber || '',
      orderIdVisual,
      items: verifiedItems,
      total: finalTotal,
      isCOD,
      shopId,
      shopName: shopData.shopName,
      freeDelivery,
      status: 'pending',
      localId: localId || null,
      customerId: customerId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 🔔 RUFLO: Fire-and-forget emails (non-blocking — never slows checkout)
    const rufloPayload = { shopName: shopData.shopName, orderId: orderIdVisual, items: verifiedItems, total: finalTotal };

    if (customerEmail) {
      void sendOrderConfirmationEmail({
        to: customerEmail,
        customerName,
        ...rufloPayload
      }).catch(e => {
        console.warn('[Ruflo] Customer email error:', e.message);
        adminDb.collection('system_logs').add({
          type: 'email_failure',
          context: 'customer_order_confirmation',
          email: customerEmail,
          shopId,
          orderId: orderIdVisual,
          error: e.message,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
    }

    if (shopData.deliveryConfig?.contactEmail) {
      void sendRetailerNotificationEmail({
        to: shopData.deliveryConfig.contactEmail,
        customerName,
        customerPhone,
        ...rufloPayload
      }).catch(e => {
        console.warn('[Ruflo] Retailer email error:', e.message);
        adminDb.collection('system_logs').add({
          type: 'email_failure',
          context: 'retailer_order_notification',
          email: shopData.deliveryConfig.contactEmail,
          shopId,
          orderId: orderIdVisual,
          error: e.message,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
    }

    return NextResponse.json({
      success: true,
      orderId: newOrderRef.id,
      total: finalTotal,
      orderIdVisual
    });


  } catch (err) {
    console.error('CHECKOUT ERROR:', err);
    
    // Send critical alert to Telegram on checkout failure
    void sendTelegramAlert({
      level: 'critical',
      message: `Checkout API Failed: ${err.message}`,
      context: { shopId: req.url || 'unknown', errorStack: err.stack }
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}