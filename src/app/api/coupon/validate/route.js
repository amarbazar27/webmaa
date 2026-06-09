export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req) {
  try {
    const { code, shopId, customerId, customerPhone, orderSubtotal } = await req.json();

    if (!code || !shopId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    const subtotal = parseFloat(orderSubtotal) || 0;

    if (!adminDb) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    let couponDoc = null;
    let isGlobal = false;

    // 1. Search in shop-specific coupons
    const shopCouponRef = adminDb.collection('shops').doc(shopId).collection('coupons').doc(cleanCode);
    const shopCouponSnap = await shopCouponRef.get();

    if (shopCouponSnap.exists) {
      couponDoc = shopCouponSnap.data();
    } else {
      // 2. Search in global coupons
      const globalCouponRef = adminDb.collection('global_coupons').doc(cleanCode);
      const globalCouponSnap = await globalCouponRef.get();
      if (globalCouponSnap.exists) {
        couponDoc = globalCouponSnap.data();
        isGlobal = true;
      }
    }

    if (!couponDoc) {
      return NextResponse.json({ error: 'কুপন কোডটি সঠিক নয়!' }, { status: 400 });
    }

    // 3. Validation checks
    if (couponDoc.isActive === false) {
      return NextResponse.json({ error: 'এই কুপনটি বর্তমানে নিষ্ক্রিয় আছে!' }, { status: 400 });
    }

    // Expiry Date check
    if (couponDoc.expiryDate) {
      const expiry = couponDoc.expiryDate.toDate ? couponDoc.expiryDate.toDate() : new Date(couponDoc.expiryDate);
      if (expiry < new Date()) {
        return NextResponse.json({ error: 'কুপনটির মেয়াদ শেষ হয়ে গেছে!' }, { status: 400 });
      }
    }

    // Usage limits check
    const usageCount = parseInt(couponDoc.usageCount) || 0;
    const usageLimit = parseInt(couponDoc.usageLimit) || 0;
    if (usageLimit > 0 && usageCount >= usageLimit) {
      return NextResponse.json({ error: 'কুপনটির ব্যবহারের সর্বোচ্চ সীমা অতিক্রম হয়েছে!' }, { status: 400 });
    }

    // Minimum order check
    const minOrder = parseFloat(couponDoc.minOrderAmount) || 0;
    if (subtotal < minOrder) {
      return NextResponse.json({ error: `এই কুপনটি ব্যবহার করতে নূন্যতম ৳${minOrder} অর্ডার করতে হবে!` }, { status: 400 });
    }

    // First order limit check
    if (couponDoc.firstOrderOnly === true) {
      // Search for any completed order by this customer
      let ordersQuery = null;
      if (customerId) {
        ordersQuery = await adminDb.collection('shops').doc(shopId).collection('orders')
          .where('customerId', '==', customerId)
          .where('status', 'in', ['confirmed', 'shipped', 'completed'])
          .limit(1)
          .get();
      }

      if ((!ordersQuery || ordersQuery.empty) && customerPhone) {
        ordersQuery = await adminDb.collection('shops').doc(shopId).collection('orders')
          .where('customerPhone', '==', customerPhone)
          .where('status', 'in', ['confirmed', 'shipped', 'completed'])
          .limit(1)
          .get();
      }

      if (ordersQuery && !ordersQuery.empty) {
        return NextResponse.json({ error: 'এই কুপনটি শুধুমাত্র আপনার প্রথম অর্ডারের জন্য প্রযোজ্য!' }, { status: 400 });
      }
    }

    // 4. Calculate discount
    let discountAmount = 0;
    let freeShipping = false;
    const value = parseFloat(couponDoc.value) || 0;

    if (couponDoc.type === 'percentage') {
      discountAmount = Math.round((subtotal * value) / 100);
      const maxDiscount = parseFloat(couponDoc.maxDiscountAmount) || 0;
      if (maxDiscount > 0 && discountAmount > maxDiscount) {
        discountAmount = maxDiscount;
      }
    } else if (couponDoc.type === 'fixed') {
      discountAmount = Math.min(subtotal, value);
    } else if (couponDoc.type === 'free_shipping') {
      freeShipping = true;
    }

    return NextResponse.json({
      success: true,
      code: cleanCode,
      type: couponDoc.type,
      value: value,
      discountAmount,
      freeShipping,
      isGlobal
    });

  } catch (error) {
    console.error('Coupon validation error:', error);
    return NextResponse.json({ error: 'সার্ভার ত্রুটি, অনুগ্রহ করে আবার চেষ্টা করুন।' }, { status: 500 });
  }
}
