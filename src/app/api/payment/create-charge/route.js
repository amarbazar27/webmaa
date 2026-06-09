export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req) {
  try {
    const { orderId, shopId, shopSlug } = await req.json();

    if (!orderId || !shopId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Fetch order details
    const orderRef = adminDb.collection('shops').doc(shopId).collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderData = orderSnap.data();
    const amount = parseFloat(orderData.total) || 0;

    const serverUrl = process.env.PIPRAPAY_SERVER_URL || 'https://api.piprapay.com';
    const apiKey = process.env.PIPRAPAY_API_KEY;

    // If PipraPay is not fully configured, return a mock checkout sandbox page URL
    if (!apiKey) {
      console.warn('[PipraPay] API key missing. Falling back to sandbox checkout simulation.');
      const slug = shopSlug || orderData.shopSlug;
      if (!slug) {
        return NextResponse.json({ error: 'Shop slug not found. Cannot build payment URL.' }, { status: 400 });
      }
      const sandboxUrl = `${req.nextUrl.origin}/shop/${slug}/payment-sandbox?orderId=${orderId}&shopId=${shopId}&amount=${amount}`;
      return NextResponse.json({ success: true, paymentUrl: sandboxUrl, sandbox: true });
    }

    // Call PipraPay self-hosted server
    const response = await fetch(`${serverUrl}/api/v1/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        amount: amount,
        currency: 'BDT',
        order_id: `${shopId}_${orderId}`,
        customer_name: orderData.customerName || 'Customer',
        customer_phone: orderData.customerPhone || '',
        customer_email: orderData.customerEmail || '',
        callback_url: `${req.nextUrl.origin}/shop/${shopSlug || orderData.shopSlug}/payment-callback?orderId=${orderId}&shopId=${shopId}`,
        webhook_url: `${req.nextUrl.origin}/api/payment/webhook`
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to initiate charge on PipraPay server');
    }

    // Save charge reference in order
    await orderRef.update({
      piprapayChargeId: data.charge_id || data.id || '',
      status: 'pending_payment'
    });

    return NextResponse.json({
      success: true,
      paymentUrl: data.payment_url || data.url,
      chargeId: data.charge_id || data.id
    });

  } catch (error) {
    console.error('Create charge API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
