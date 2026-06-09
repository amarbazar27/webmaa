export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req) {
  try {
    const { orderId, shopId, amount, senderNumber, gateway } = await req.json();

    if (!orderId || !shopId || !amount) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Only allow sandbox helper if in development OR PIPRAPAY_API_KEY is not defined
    const apiKey = process.env.PIPRAPAY_API_KEY;
    const isDev = process.env.NODE_ENV === 'development';
    if (apiKey && !isDev) {
      return NextResponse.json({ error: 'Sandbox is disabled in production with an active API key' }, { status: 403 });
    }

    const secret = process.env.PIPRAPAY_WEBHOOK_SECRET;
    
    // Generate a simulated transaction ID based on gateway selection
    const prefix = gateway === 'bkash' ? 'BK' : gateway === 'nagad' ? 'NG' : 'RC';
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const txnId = `${prefix}${randomHex}MOCK`;

    const payload = {
      order_id: `${shopId}_${orderId}`,
      transaction_id: txnId,
      sender_number: senderNumber || '01700000000',
      amount: parseFloat(amount) || 0,
      status: 'success'
    };

    const rawBody = JSON.stringify(payload);
    const headers = {
      'Content-Type': 'application/json'
    };

    if (secret) {
      const computedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');
      headers['x-piprapay-signature'] = computedSignature;
    }

    // Send mock request to actual webhook endpoint
    const webhookUrl = `${req.nextUrl.origin}/api/payment/webhook`;
    console.log(`[Sandbox Webhook] Dispatching mock payload to ${webhookUrl}`);

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: headers,
      body: rawBody
    });

    const textResult = await res.text();
    let jsonResult = {};
    try {
      jsonResult = JSON.parse(textResult);
    } catch (e) {
      jsonResult = { raw: textResult };
    }

    if (!res.ok) {
      return NextResponse.json({
        success: false,
        error: jsonResult.error || 'Webhook call failed',
        details: jsonResult
      }, { status: res.status });
    }

    return NextResponse.json({
      success: true,
      txnId,
      webhookResult: jsonResult
    });

  } catch (error) {
    console.error('[Sandbox Webhook Helper Error]', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
