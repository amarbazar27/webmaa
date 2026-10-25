import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebase-admin';

function verifyState(stateStr) {
  try {
    const secret = process.env.FACEBOOK_APP_SECRET || 'bdretailers-fb-state-secret-2026';
    const decoded = JSON.parse(Buffer.from(stateStr, 'base64url').toString('utf-8'));
    const { payload, hmac } = decoded;
    const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
    
    if (crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expected, 'hex'))) {
      // 15-minute validity check
      if (Date.now() - payload.timestamp < 15 * 60 * 1000) {
        return payload;
      }
    }
    return null;
  } catch (err) {
    return null;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateStr = searchParams.get('state');
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const host = request.headers.get('host') || 'bdretailers.com';
  const proto = host.includes('localhost') ? 'http' : 'https';
  const dashboardBase = `${proto}://${host}/dashboard/social-hub`;

  // Verify CSRF state token
  const statePayload = stateStr ? verifyState(stateStr) : null;
  const shopId = statePayload?.shopId || '';

  if (!shopId) {
    return NextResponse.redirect(`${dashboardBase}?error=${encodeURIComponent('অবৈধ বা মেয়াদোত্তীর্ণ সেশন (Invalid CSRF State)')}`, { status: 302 });
  }

  // Handle Meta authorization cancellations or errors
  if (errorParam || !code) {
    const msg = errorDescription || 'ফেসবুক অনুমোদন বাতিল করা হয়েছে';
    return NextResponse.redirect(`${dashboardBase}?shopId=${shopId}&error=${encodeURIComponent(msg)}`, { status: 302 });
  }

  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  const redirectUri = `${proto}://${host}/api/social/facebook/oauth/callback`;

  if (!appId || !appSecret) {
    return NextResponse.redirect(`${dashboardBase}?shopId=${shopId}&error=${encodeURIComponent('Meta App ID বা Secret কনফিগার করা নেই')}`, { status: 302 });
  }

  try {
    // 1. Exchange code for short-lived User Access Token
    const tokenUrl = new URL('https://graph.facebook.com/v21.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', appId);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('client_secret', appSecret);
    tokenUrl.searchParams.set('code', code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      const errMsg = tokenData.error?.message || 'টোকেন রূপান্তর ব্যর্থ হয়েছে';
      return NextResponse.redirect(`${dashboardBase}?shopId=${shopId}&error=${encodeURIComponent(errMsg)}`, { status: 302 });
    }

    const shortLivedUserToken = tokenData.access_token;

    // 2. Exchange short-lived token for long-lived User Token (60-day token)
    let longLivedUserToken = shortLivedUserToken;
    try {
      const exchangeUrl = new URL('https://graph.facebook.com/v21.0/oauth/access_token');
      exchangeUrl.searchParams.set('grant_type', 'fb_exchange_token');
      exchangeUrl.searchParams.set('client_id', appId);
      exchangeUrl.searchParams.set('client_secret', appSecret);
      exchangeUrl.searchParams.set('fb_exchange_token', shortLivedUserToken);

      const exchangeRes = await fetch(exchangeUrl.toString());
      const exchangeData = await exchangeRes.json();
      if (exchangeData.access_token) {
        longLivedUserToken = exchangeData.access_token;
      }
    } catch (exErr) {
      console.warn('[Facebook OAuth] Long-lived token exchange warning:', exErr.message);
    }

    // 3. Fetch managed Facebook Pages with their Page Access Tokens
    // In Meta Graph API, Page Tokens obtained from a long-lived User Token NEVER expire
    const accountsUrl = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,category,tasks&access_token=${longLivedUserToken}`;
    const accountsRes = await fetch(accountsUrl);
    const accountsData = await accountsRes.json();

    if (accountsData.error || !accountsData.data || !Array.isArray(accountsData.data) || accountsData.data.length === 0) {
      return NextResponse.redirect(
        `${dashboardBase}?shopId=${shopId}&error=${encodeURIComponent('আপনার অ্যাকাউন্টে কোনো অনুমোদিত ফেসবুক পেজ পাওয়া যায়নি। দয়া করে পেজ তৈরি করে পুনরায় চেষ্টা করুন।')}`,
        { status: 302 }
      );
    }

    // 4. Retrieve shop details to match page name if possible
    let shopName = '';
    try {
      const shopSnap = await adminDb.collection('shops').doc(shopId).get();
      if (shopSnap.exists) {
        shopName = shopSnap.data()?.shopName || shopSnap.data()?.name || '';
      }
    } catch (_) {}

    // Match page by shop name or pick first page
    const matchedPage = (shopName ? accountsData.data.find(p => p.name?.toLowerCase().includes(shopName.toLowerCase())) : null) ||
      accountsData.data[0];

    const pageId = matchedPage.id;
    const pageName = matchedPage.name || 'Facebook Page';
    const pageAccessToken = matchedPage.access_token;

    if (!pageAccessToken) {
      return NextResponse.redirect(
        `${dashboardBase}?shopId=${shopId}&error=${encodeURIComponent('পেজ এক্সেস টোকেন পাওয়া যায়নি। আপনার পেজে প্রয়োজনীয় অ্যাডমিন অধিকার আছে কি না যাচাই করুন।')}`,
        { status: 302 }
      );
    }

    // 5. Automatically subscribe the Facebook Page to Webhooks
    let webhookSubscribed = false;
    let webhookWarning = null;
    try {
      const subRes = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps?subscribed_fields=messages,messaging_postbacks,feed&access_token=${pageAccessToken}`,
        { method: 'POST' }
      );
      const subData = await subRes.json();
      webhookSubscribed = Boolean(subData.success);
      if (subData.error) {
        webhookWarning = subData.error.message;
      }
    } catch (subErr) {
      webhookWarning = subErr.message;
    }

    // 6. Save connection securely in Firestore
    const connectionPayload = {
      shopId,
      pageId,
      pageName,
      pageAccessToken,
      platform: 'facebook',
      connectedVia: 'oauth',
      webhookSubscribed: Boolean(webhookSubscribed),
      webhookWarning: webhookWarning || null,
      scopesGranted: accountsData.data.map(p => p.tasks).flat().filter(Boolean),
      connectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await adminDb.collection('social_connections').doc(pageId).set(connectionPayload, { merge: true });
    await adminDb.collection('shops').doc(shopId).collection('socialConnections').doc('facebook').set(connectionPayload, { merge: true });

    return NextResponse.redirect(
      `${dashboardBase}?shopId=${shopId}&connected=facebook&pageName=${encodeURIComponent(pageName)}`,
      { status: 302 }
    );
  } catch (err) {
    console.error('[Facebook OAuth Callback Error]:', err);
    return NextResponse.redirect(
      `${dashboardBase}?shopId=${shopId}&error=${encodeURIComponent(err.message || 'কানেকশন প্রক্রিয়াকরণে সমস্যা হয়েছে')}`,
      { status: 302 }
    );
  }
}
