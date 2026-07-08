export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';

// ═══════════════════════════════════════════════════════════════
// 🛒 CART API — Server-side cart with stock validation
// GET  ?shopId=xxx (+ auth header) → Get user's saved cart
// POST { shopId, items }           → Save/update cart with stock check
// ═══════════════════════════════════════════════════════════════

export async function GET(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ items: [] });
    }

    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
    } catch {
      return NextResponse.json({ items: [] });
    }

    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');
    if (!shopId) return NextResponse.json({ items: [] });

    const cartDoc = await adminDb.collection('users').doc(decoded.uid).collection('carts').doc(shopId).get();
    return NextResponse.json({
      items: cartDoc.exists ? (cartDoc.data().items || []) : [],
    });
  } catch (err) {
    console.error('[Cart GET]', err);
    return NextResponse.json({ items: [] });
  }
}

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(authHeader.split('Bearer ')[1]);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    const { shopId, items } = body;

    if (!shopId || !Array.isArray(items)) {
      return NextResponse.json({ error: 'shopId and items required' }, { status: 400 });
    }

    // PEN-H2: Cap items array to prevent payload abuse
    if (items.length > 50) {
      return NextResponse.json({ error: 'Too many items (max 50)' }, { status: 400 });
    }

    // ── Stock Validation ────────────────────────────────────
    const productsRef = adminDb.collection('shops').doc(shopId).collection('products');
    const validatedItems = [];
    const stockWarnings = [];

    for (const item of items) {
      if (!item.id) continue;

      const pSnap = await productsRef.doc(item.id).get();
      if (!pSnap.exists) {
        stockWarnings.push({ id: item.id, name: item.name, reason: 'not_found' });
        continue;
      }

      const product = pSnap.data();

      // ── Stock=0 rejection ──
      if (product.stock !== undefined && product.stock !== null && product.stock <= 0) {
        stockWarnings.push({
          id: item.id,
          name: product.name,
          reason: 'out_of_stock',
          message: `${product.name} স্টকে নেই`,
        });
        continue; // Remove from cart
      }

      // ── Quantity > stock cap ──
      let validQty = item.quantity || 1;
      if (product.stock !== undefined && product.stock !== null && validQty > product.stock) {
        validQty = product.stock;
        stockWarnings.push({
          id: item.id,
          name: product.name,
          reason: 'quantity_capped',
          message: `${product.name} এর সর্বোচ্চ ${product.stock}টি পাওয়া যাবে`,
          cappedTo: product.stock,
        });
      }

      // PEN-H2 Fix: Whitelist safe fields only — prevents mass assignment
      // Previously used `...item` spread which copied arbitrary attacker fields
      validatedItems.push({
        id: item.id,
        name: String(item.name || product.name || '').slice(0, 200),
        quantity: validQty,
        price: product.price,
        imageUrl: String(item.imageUrl || product.imageUrl || '').slice(0, 500),
        selectedSize: item.selectedSize ? String(item.selectedSize).slice(0, 50) : undefined,
        selectedVariant: item.selectedVariant ? String(item.selectedVariant).slice(0, 50) : undefined,
        customizedText: item.customizedText ? String(item.customizedText).slice(0, 200) : undefined,
      });
    }

    // ── Save validated cart ──────────────────────────────────
    await adminDb.collection('users').doc(decoded.uid).collection('carts').doc(shopId).set({
      items: validatedItems,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({
      success: true,
      items: validatedItems,
      warnings: stockWarnings,
    });
  } catch (err) {
    console.error('[Cart POST]', err);
    return NextResponse.json({ error: 'Cart update failed' }, { status: 500 });
  }
}
