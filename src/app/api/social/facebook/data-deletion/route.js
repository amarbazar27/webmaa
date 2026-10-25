import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebase-admin';

// Helper to parse Meta signed_request
function parseSignedRequest(signedRequest, appSecret) {
  if (!signedRequest || !appSecret) return null;
  try {
    const [encodedSig, payload] = signedRequest.split('.');
    if (!encodedSig || !payload) return null;

    const sig = Buffer.from(encodedSig, 'base64url').toString('hex');
    const expectedSig = crypto.createHmac('sha256', appSecret).update(payload).digest('hex');

    if (sig !== expectedSig) {
      console.warn('[Meta Data Deletion] HMAC signature mismatch');
      return null;
    }

    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    return data;
  } catch (err) {
    console.error('[Meta Data Deletion] Parse error:', err.message);
    return null;
  }
}

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let signedRequest = null;

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      signedRequest = formData.get('signed_request');
    } else {
      const body = await request.json().catch(() => ({}));
      signedRequest = body.signed_request;
    }

    const appSecret = process.env.FACEBOOK_APP_SECRET || '';
    const data = parseSignedRequest(signedRequest, appSecret);

    const userId = data?.user_id || 'anonymous';
    const confirmationCode = `del_${userId.slice(0, 8)}_${Date.now()}`;

    // Disconnect any associated social connection without purging core business orders
    try {
      if (userId && userId !== 'anonymous') {
        const snap = await adminDb.collection('social_connections').where('facebookUserId', '==', userId).get();
        for (const doc of snap.docs) {
          await doc.ref.update({
            disconnectedAt: new Date().toISOString(),
            status: 'deleted_by_user_request'
          });
        }
      }
    } catch (dbErr) {
      console.warn('[Meta Data Deletion DB update note]:', dbErr.message);
    }

    const host = request.headers.get('host') || 'bdretailers.com';
    const proto = host.includes('localhost') ? 'http' : 'https';
    const statusUrl = `${proto}://${host}/privacy-policy#data-deletion-status?code=${confirmationCode}`;

    return NextResponse.json({
      url: statusUrl,
      confirmation_code: confirmationCode
    });
  } catch (err) {
    console.error('[Meta Data Deletion Error]:', err);
    return NextResponse.json({ error: 'Data deletion callback error' }, { status: 500 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  return NextResponse.json({
    status: 'completed',
    confirmation_code: code || 'N/A',
    message: 'আপনার মেটা প্ল্যাটফর্ম ডাটা ডিলিশন প্রক্রিয়া সম্পন্ন হয়েছে।'
  });
}
