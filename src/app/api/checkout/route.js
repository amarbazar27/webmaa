export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { z } from 'zod';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';

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
  items: z.array(z.object({
    id: z.string().min(1),
    quantity: z.number().int().positive().max(50),
    note: z.string().max(100).optional()
  })).min(1)
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
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
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
      items
    } = parsed.data;

    // 🛑 Honeypot bot defense
    if (honeypot && honeypot.length > 0) {
      return NextResponse.json({ error: 'Bot detected' }, { status: 403 });
    }

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
      const price = parseFloat(product.price);

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
        name: product.name,
        price: price.toString(),
        quantity: item.quantity,
        note: item.note || ''
      });
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

    // ── Order counter (atomic) ─────────────────────────
    const today = new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Dhaka' }).replace(/\//g, '');
    const counterRef = adminDb.collection('shops').doc(shopId).collection('counters').doc(`orders_${today}`);

    let newCount = 0;

    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(counterRef);
      const current = snap.exists ? (snap.data().count || 0) : 0;
      newCount = current + 1;
      tx.set(counterRef, { count: newCount }, { merge: true });
    });

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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      orderId: newOrderRef.id,
      total: finalTotal
    });

  } catch (err) {
    console.error('CHECKOUT ERROR:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}