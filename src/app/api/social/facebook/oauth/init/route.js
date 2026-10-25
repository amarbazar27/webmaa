import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebase-admin';

// Supported Meta scopes for Facebook Login for Business
const FACEBOOK_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_messaging',
  'pages_manage_posts',
  'pages_manage_engagement'
].join(',');

function signState(payload) {
  const secret = process.env.FACEBOOK_APP_SECRET || 'bdretailers-fb-state-secret-2026';
  const str = JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', secret).update(str).digest('hex');
  return Buffer.from(JSON.stringify({ payload, hmac })).toString('base64url');
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID প্রয়োজন' }, { status: 400 });
    }

    const appId = process.env.FACEBOOK_APP_ID;
    if (!appId) {
      return NextResponse.json({
        error: 'Meta App ID কনফিগার করা হয়নি। দয়া করে Vercel বা .env.local-এ FACEBOOK_APP_ID যুক্ত করুন।'
      }, { status: 400 });
    }

    const host = request.headers.get('host') || 'bdretailers.com';
    const proto = host.includes('localhost') ? 'http' : 'https';
    const redirectUri = `${proto}://${host}/api/social/facebook/oauth/callback`;

    // CSRF-protected state with shopId, timestamp, and random nonce
    const state = signState({
      shopId,
      timestamp: Date.now(),
      nonce: crypto.randomBytes(16).toString('hex')
    });

    const metaAuthUrl = new URL('https://www.facebook.com/v21.0/dialog/oauth');
    metaAuthUrl.searchParams.set('client_id', appId);
    metaAuthUrl.searchParams.set('redirect_uri', redirectUri);
    metaAuthUrl.searchParams.set('scope', FACEBOOK_SCOPES);
    metaAuthUrl.searchParams.set('state', state);
    metaAuthUrl.searchParams.set('response_type', 'code');

    // Return URL for client redirect or direct 302 redirect
    const mode = searchParams.get('mode');
    if (mode === 'json') {
      return NextResponse.json({ authUrl: metaAuthUrl.toString() });
    }

    return NextResponse.redirect(metaAuthUrl.toString(), { status: 302 });
  } catch (error) {
    console.error('[Facebook OAuth Init Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
