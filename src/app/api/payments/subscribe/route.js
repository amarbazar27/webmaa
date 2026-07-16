export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { shopId, packageType, paymentMethod, senderNumber, transactionId, couponCode } = body;

    if (!shopId || !packageType) {
      return NextResponse.json({ error: 'Missing shopId or packageType' }, { status: 400 });
    }

    if (!['monthly', 'quarterly', 'yearly'].includes(packageType)) {
      return NextResponse.json({ error: 'Invalid package type' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // 1. Fetch config and resolve package prices
    const globalSnap = await adminDb.collection('config').doc('global').get();
    const globalData = globalSnap.exists ? globalSnap.data() : {};

    const shopSnap = await adminDb.collection('shops').doc(shopId).get();
    if (!shopSnap.exists) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    const shopData = shopSnap.data();

    // Fetch owner user profile to get real email & phone number
    const userSnap = await adminDb.collection('users').doc(shopId).get();
    const userData = userSnap.exists ? userSnap.data() : {};
    const ownerEmail = userData.email || shopData.ownerEmail || '';
    const ownerPhone = userData.phone || shopData.phone || '';

    // Price mappings
    const priceMap = {
      monthly: Number(globalData.subPriceMonthly) || 500,
      quarterly: Number(globalData.subPriceQuarterly) || 1350,
      yearly: Number(globalData.subPriceYearly) || 5000
    };
    const amountToCharge = priceMap[packageType];

    // 1.5 Apply Subscription Coupon
    let finalAmount = amountToCharge;
    if (couponCode && globalData.subCouponEnabled && couponCode.trim().toUpperCase() === globalData.subCouponCode.trim().toUpperCase()) {
      const discountType = globalData.subCouponDiscountType || 'percent';
      const discountVal = Number(globalData.subCouponDiscount) || 0;
      if (discountVal > 0) {
        if (discountType === 'flat') {
          finalAmount = Math.max(0, finalAmount - discountVal);
        } else {
          const discountAmt = Math.round((finalAmount * discountVal) / 100);
          finalAmount = Math.max(0, finalAmount - discountAmt);
        }
      }
    }

    if (finalAmount <= 0) {
      // 100% off coupon -> Activate instantly!
      const durationDaysMap = {
        monthly: 30,
        quarterly: 90,
        yearly: 365
      };
      const days = durationDaysMap[packageType];
      const newExpiry = Date.now() + days * 24 * 60 * 60 * 1000;
      
      await adminDb.collection('shops').doc(shopId).update({
        subscriptionStatus: 'active',
        subscriptionPackage: packageType,
        subscriptionExpiresAt: new Date(newExpiry),
        subscriptionPendingTxn: admin.firestore.FieldValue.delete(),
        subscriptionPendingPackage: admin.firestore.FieldValue.delete()
      });
      
      return NextResponse.json({ success: true, isFree: true, message: 'Subscription activated for free using coupon code! 🎉' });
    }

    // Determine current domain
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.startsWith('localhost') ? 'http' : 'https';
    const domainUrl = `${protocol}://${host}`;

    // 2. Handle manual subscription request
    if (paymentMethod === 'manual') {
      if (!senderNumber || !transactionId) {
        return NextResponse.json({ error: 'Sender number and Transaction ID are required for manual payment' }, { status: 400 });
      }

      const cleanedNumber = senderNumber.trim();
      const numberRegex = /^01\d{9}$/;
      if (!numberRegex.test(cleanedNumber)) {
        return NextResponse.json({ error: 'আপনার প্রেরক নম্বরটি অবশ্যই ১১ ডিজিটের হতে হবে এবং শুধুমাত্র সংখ্যা (যেমন: 01xxxxxxxxx) হতে হবে।' }, { status: 400 });
      }

      await adminDb.collection('shops').doc(shopId).update({
        subscriptionStatus: 'pending',
        subscriptionPendingPackage: packageType,
        subscriptionPendingTxn: `Method: manual, Sender: ${cleanedNumber}, Txn: ${transactionId.trim()}`
      });

      return NextResponse.json({ success: true, message: 'Subscription request submitted for approval!' });
    }

    // 3. Handle automated payment via UddoktaPay
    let utUrl = globalData?.uddoktapayUrl?.trim() || globalData?.piprapayUrl?.trim() || '';
    let utApiKey = globalData?.uddoktapayApiKey?.trim() || globalData?.piprapayApiKey?.trim() || '';

    if (utUrl) {
      utUrl = utUrl.replace(/\/$/, '');
      if (utUrl.endsWith('/api')) {
        utUrl = utUrl.substring(0, utUrl.length - 4);
      }
      if (!utUrl.startsWith('http://') && !utUrl.startsWith('https://')) {
        utUrl = 'https://' + utUrl;
      }
    }

    if (!utUrl || !utApiKey) {
      return NextResponse.json({ error: 'Superadmin has not configured automated subscription payment keys yet. Please contact support or use Manual Payment.' }, { status: 400 });
    }

    // Call checkout-v2 of UddoktaPay
    console.log(`[Subscription API] Initiating checkout-v2 at ${utUrl}/api/checkout-v2 for amount ${finalAmount}`);
    const res = await fetch(`${utUrl}/api/checkout-v2`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'RT-UDDOKTAPAY-API-KEY': utApiKey
      },
      body: JSON.stringify({
        full_name: shopData.shopName || userData.name || 'Retailer',
        email: (() => {
          let email = ownerEmail || shopData.deliveryConfig?.contactEmail?.split(',')[0]?.trim() || '';
          if (!email.includes('@') || !email.includes('.')) {
            return `retailer-${shopId.toLowerCase()}@bdretailers.com`;
          }
          return email.toLowerCase();
        })(),
        phone: (() => {
          let p = ownerPhone || shopData.deliveryConfig?.contactPhone || '01700000000';
          p = p.replace(/\D/g, '');
          if (p.length !== 11 || !p.startsWith('01')) {
            return '01700000000';
          }
          return p;
        })(),
        amount: finalAmount.toString(),
        metadata: {
          type: 'subscription',
          shopId: shopId,
          packageType: packageType
        },
        redirect_url: `${domainUrl}/dashboard/billing?status=success`,
        cancel_url: `${domainUrl}/dashboard/billing?status=cancel`,
        webhook_url: `${domainUrl}/api/payments/uddoktapay-webhook`
      })
    });

    if (res.ok) {
      const utData = await res.json();
      const isSuccess = utData.status === true || utData.status === 'true';
      const payUrl = utData.payment_url;
      if (isSuccess && payUrl) {
        return NextResponse.json({ success: true, payment_url: payUrl });
      } else {
        console.error("Subscription payment initiation failed:", utData);
        return NextResponse.json({ error: `Gateway failed to initialize: ${utData.message || 'Unknown'}` }, { status: 400 });
      }
    } else {
      const errText = await res.text();
      console.error("Subscription payment status error:", res.status, errText);
      let errMsg = `Gateway returned status error: ${res.status}`;
      try {
        const parsedErr = JSON.parse(errText);
        if (parsedErr.message) {
          errMsg += ` - ${parsedErr.message}`;
        } else if (parsedErr.errors) {
          errMsg += ` - ${JSON.stringify(parsedErr.errors)}`;
        }
      } catch (e) {}
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

  } catch (err) {
    console.error('Subscription API failure:', err);
    return NextResponse.json({ error: `Internal server error during subscription: ${err.message || err}` }, { status: 500 });
  }
}
