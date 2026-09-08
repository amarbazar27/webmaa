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

    // 1. Try shop's specific Steadfast credentials
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

    // 2. Fallback to platform-wide Steadfast credentials in global_config
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

    // 3. Fallback to process.env
    if (!apiKey || !secretKey) {
      apiKey = process.env.STEADFAST_API_KEY || '';
      secretKey = process.env.STEADFAST_SECRET_KEY || '';
    }

    // Try live Steadfast API if keys exist
    if (apiKey && secretKey) {
      try {
        const fraudData = await checkSteadfastFraud({ apiKey, secretKey }, cleanedPhone);
        return NextResponse.json({
          success: true,
          source: 'steadfast',
          ...fraudData
        });
      } catch (steadfastErr) {
        console.warn('[FraudCheck] Steadfast API call failed, falling back to internal platform data:', steadfastErr.message);
      }
    }

    // 4. Zero-failure fallback: Platform Database Courier & Order Analysis
    let platformTotal = 0;
    let platformDelivered = 0;
    let platformCancelled = 0;
    let fraudReportsCount = 0;

    if (adminDb) {
      try {
        // Query fraud_profiles
        const profileSnap = await adminDb.collection('fraud_profiles').doc(cleanedPhone).get();
        if (profileSnap.exists) {
          const p = profileSnap.data();
          platformTotal += Number(p.totalOrders || 0);
          platformDelivered += Number(p.successOrders || 0);
          platformCancelled += Number((p.cancelOrders || 0) + (p.returnOrders || 0));
          fraudReportsCount += Array.isArray(p.reports) ? p.reports.length : 0;
        }

        // Query orders across all stores for this customer phone
        const ordersQuery = await adminDb.collectionGroup('orders')
          .where('customerPhone', 'in', [cleanedPhone, `+88${cleanedPhone}`, `88${cleanedPhone}`])
          .limit(50)
          .get();

        ordersQuery.forEach(doc => {
          const o = doc.data();
          platformTotal++;
          if (o.status === 'completed') platformDelivered++;
          else if (o.status === 'cancelled' || o.status === 'returned') platformCancelled++;
        });
      } catch (err) {
        console.warn('[FraudCheck] Platform DB query error:', err.message);
      }
    }

    const deliveryRate = platformTotal > 0 ? Math.round((platformDelivered / platformTotal) * 100) : null;
    const cancellationRate = platformTotal > 0 ? Math.round((platformCancelled / platformTotal) * 100) : null;

    let riskLevel = 'new';
    let riskLabel = 'নতুন কাস্টমার (পূর্ববর্তী কোনো বিরূপ রেকর্ড নেই)';
    let riskColor = 'slate';

    if (fraudReportsCount > 0) {
      riskLevel = 'danger';
      riskLabel = `⚠️ ফ্রড রিপোর্ট রয়েছে (${fraudReportsCount} টি দোকানে অভিযোগ)`;
      riskColor = 'red';
    } else if (platformTotal > 0) {
      if (deliveryRate >= 80) {
        riskLevel = 'safe';
        riskLabel = `নির্ভরযোগ্য কাস্টমার (${deliveryRate}% প্ল্যাটফর্ম ডেলিভারি)`;
        riskColor = 'emerald';
      } else if (deliveryRate >= 60) {
        riskLevel = 'medium';
        riskLabel = `মাঝারি ঝুঁকি (${deliveryRate}% প্ল্যাটফর্ম ডেলিভারি)`;
        riskColor = 'amber';
      } else {
        riskLevel = 'danger';
        riskLabel = `উচ্চ ঝুঁকিপূর্ণ (${deliveryRate}% ডেলিভারি, ${cancellationRate}% রিটার্ন)`;
        riskColor = 'red';
      }
    }

    return NextResponse.json({
      success: true,
      phone: cleanedPhone,
      source: 'platform',
      hasPlatformSteadfastKey: Boolean(apiKey && secretKey),
      totalParcels: platformTotal,
      totalDelivered: platformDelivered,
      totalCancelled: platformCancelled,
      deliveryRate,
      cancellationRate,
      riskLevel,
      riskLabel,
      riskColor,
      note: apiKey && secretKey 
        ? 'স্টিভফাস্ট এপিআই রেসপন্স না করায় প্ল্যাটফর্মের অভ্যন্তরীণ অর্ডার রেকর্ড দেখানো হচ্ছে।'
        : 'বিডি রিটেইলার্স প্ল্যাটফর্মের অভ্যন্তরীণ অর্ডার রেকর্ড। সুপারএডমিন সেটিংসে গ্লোবাল স্টিডফাস্ট কী দিলে স্টিডফাস্টের জাতীয় ডেটাবেস যুক্ত হবে।'
    });

  } catch (error) {
    console.error('[API fraud-check] Error:', error);
    return NextResponse.json({
      success: true,
      phone,
      totalParcels: 0,
      totalDelivered: 0,
      totalCancelled: 0,
      deliveryRate: null,
      cancellationRate: null,
      riskLevel: 'new',
      riskLabel: 'নতুন কাস্টমার (কোনো রেকর্ড নেই)',
      riskColor: 'slate'
    });
  }
}
