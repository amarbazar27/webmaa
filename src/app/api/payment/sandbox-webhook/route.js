export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req) {
  try {
    const { orderId, shopId, amount, senderNumber, gateway } = await req.json();

    if (!orderId || !shopId || !amount) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Only allow sandbox helper if PIPRAPAY_API_KEY is not set (sandbox/dev mode)
    const apiKey = process.env.PIPRAPAY_API_KEY;
    const isDev = process.env.NODE_ENV === 'development';
    if (apiKey && !isDev) {
      return NextResponse.json(
        { error: 'Sandbox is disabled in production when PIPRAPAY_API_KEY is configured.' },
        { status: 403 }
      );
    }

    // Generate a simulated transaction ID
    const prefix = gateway === 'bkash' ? 'BK' : gateway === 'nagad' ? 'NG' : 'RC';
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const txnId = `${prefix}${randomHex}MOCK`;

    const payload = {
      order_id: `${shopId}_${orderId}`,
      transaction_id: txnId,
      pp_id: txnId,
      sender_number: senderNumber || '01700000000',
      amount: parseFloat(amount) || 0,
      status: 'success'
    };

    const rawBody = JSON.stringify(payload);

    // PipraPay sends `mh-piprapay-api-key` header for webhook verification.
    // In sandbox mode (no real API key), we skip the header so the webhook
    // endpoint also skips verification (it only verifies when ourApiKey is set).
    const headers = { 'Content-Type': 'application/json' };

    const webhookUrl = `${req.nextUrl.origin}/api/payment/webhook`;
    console.log(`[Sandbox Webhook] Dispatching mock payload to ${webhookUrl}`);

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: rawBody
    });

    const textResult = await res.text();
    let jsonResult = {};
    try {
      jsonResult = JSON.parse(textResult);
    } catch {
      jsonResult = { raw: textResult };
    }

    if (!res.ok) {
      return NextResponse.json({
        success: false,
        error: jsonResult.error || 'Webhook call failed',
        details: jsonResult
      }, { status: res.status });
    }

    return NextResponse.json({ success: true, txnId, webhookResult: jsonResult });

  } catch (error) {
    console.error('[Sandbox Webhook Helper Error]', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
