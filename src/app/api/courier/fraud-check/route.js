export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { checkSteadfastFraud } from '@/lib/steadfast';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone') || '';
    const shopId = searchParams.get('shopId') || '';

    if (!phone) {
      return NextResponse.json({ error: 'ফোন নম্বর আবশ্যক' }, { status: 400 });
    }

    const cleanedPhone = phone.replace(/[^0-9]/g, '').replace(/^88/, '');
    if (!/^01[3-9]\d{8}$/.test(cleanedPhone)) {
      return NextResponse.json({ error: 'সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন' }, { status: 400 });
    }

    let apiKey = '';
    let secretKey = '';

    // 1. Try fetching shop's specific Steadfast credentials
    if (shopId && adminDb) {
      try {
        const shopSnap = await adminDb.collection('shops').doc(shopId).get();
        if (shopSnap.exists) {
          const shopData = shopSnap.data();
          const courier = shopData.courier || {};
          apiKey = courier.steadfastApiKey || shopData.steadfastApiKey || '';
          secretKey = courier.steadfastSecretKey || shopData.steadfastSecretKey || '';
        }
      } catch (err) {
        console.warn('[FraudCheck] Error fetching shop courier keys:', err.message);
      }
    }

    // 2. Fallback to platform-wide Steadfast credentials if merchant hasn't configured
    if (!apiKey || !secretKey) {
      apiKey = process.env.STEADFAST_API_KEY || '';
      secretKey = process.env.STEADFAST_SECRET_KEY || '';
    }

    // 3. Fallback to global_config in Firestore if available
    if ((!apiKey || !secretKey) && adminDb) {
      try {
        const configSnap = await adminDb.collection('global_config').doc('main').get();
        if (configSnap.exists) {
          const cfg = configSnap.data();
          apiKey = apiKey || cfg.steadfastApiKey || '';
          secretKey = secretKey || cfg.steadfastSecretKey || '';
        }
      } catch (_) {}
    }

    if (!apiKey || !secretKey) {
      return NextResponse.json({
        error: 'Steadfast API Key পাওয়া যায়নি। আপনার শপ সেটিংস (Settings → Courier) থেকে Steadfast credentials সক্রিয় করুন অথবা সুপারএডমিনকে জানান।',
        needsSetup: true
      }, { status: 400 });
    }

    const fraudData = await checkSteadfastFraud({ apiKey, secretKey }, cleanedPhone);

    return NextResponse.json({
      success: true,
      ...fraudData
    });

  } catch (error) {
    console.error('[API fraud-check] Error:', error);
    return NextResponse.json({ error: error.message || 'ফ্রড চেক ব্যর্থ হয়েছে' }, { status: 500 });
  }
}
