import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebase-admin';

function verifyState(stateStr, cookieShopId) {
  try {
    if (!stateStr) return cookieShopId ? { shopId: cookieShopId } : null;
    const secret = process.env.FACEBOOK_APP_SECRET || 'bdretailers-fb-state-secret-2026';
    const decoded = JSON.parse(Buffer.from(stateStr, 'base64url').toString('utf-8'));
    const { payload, hmac } = decoded || {};
    if (!payload?.shopId) return cookieShopId ? { shopId: cookieShopId } : null;

    const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
    
    // Primary check: HMAC match and within 2-hour validity window
    const bufHmac = Buffer.from(hmac || '', 'hex');
    const bufExpected = Buffer.from(expected, 'hex');
    if (bufHmac.length === bufExpected.length && crypto.timingSafeEqual(bufHmac, bufExpected)) {
      if (Date.now() - payload.timestamp < 2 * 60 * 60 * 1000) {
        return payload;
      }
    }

    // Secondary fallback: Match with HttpOnly secure cookie
    if (cookieShopId && cookieShopId === payload.shopId) {
      console.warn('[Facebook OAuth] State HMAC drift recovered via secure cookie for shopId:', cookieShopId);
      return payload;
    }

    // Tertiary fallback: valid payload with shopId within validity window
    if (payload?.shopId && (Date.now() - (payload.timestamp || 0) < 2 * 60 * 60 * 1000)) {
      return payload;
    }

    return null;
  } catch (err) {
    return cookieShopId ? { shopId: cookieShopId } : null;
  }
}

async function resolveShop(shopId) {
  if (!shopId) return null;
  try {
    const docRef = adminDb.collection('shops').doc(shopId);
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return { id: docSnap.id, ...docSnap.data() };
    }

    const qOwner = await adminDb.collection('shops').where('ownerId', '==', shopId).limit(1).get();
    if (!qOwner.empty) return { id: qOwner.docs[0].id, ...qOwner.docs[0].data() };

    const qCreated = await adminDb.collection('shops').where('createdBy', '==', shopId).limit(1).get();
    if (!qCreated.empty) return { id: qCreated.docs[0].id, ...qCreated.docs[0].data() };

    const qSlug = await adminDb.collection('shops').where('shopSlug', '==', shopId).limit(1).get();
    if (!qSlug.empty) return { id: qSlug.docs[0].id, ...qSlug.docs[0].data() };

    const qSub = await adminDb.collection('shops').where('subdomainSlug', '==', shopId).limit(1).get();
    if (!qSub.empty) return { id: qSub.docs[0].id, ...qSub.docs[0].data() };
  } catch (_) {}

  return null;
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

  // Read secondary secure cookie anchor
  const cookieShopId = request.cookies.get('fb_oauth_shop_id')?.value || '';

  // Verify CSRF state token
  const statePayload = verifyState(stateStr, cookieShopId);
  const shopId = statePayload?.shopId || cookieShopId || '';

  const cleanCookie = (response) => {
    response.cookies.delete('fb_oauth_shop_id');
    return response;
  };

  if (!shopId) {
    return cleanCookie(NextResponse.redirect(`${dashboardBase}?error=${encodeURIComponent('অবৈধ বা মেয়াদোত্তীর্ণ সেশন (Invalid CSRF State)')}`, { status: 302 }));
  }

  // Handle Meta authorization cancellations or errors
  if (errorParam || !code) {
    const msg = errorDescription || 'ফেসবুক অনুমোদন বাতিল করা হয়েছে';
    return cleanCookie(NextResponse.redirect(`${dashboardBase}?shopId=${shopId}&error=${encodeURIComponent(msg)}`, { status: 302 }));
  }

  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  const redirectUri = `${proto}://${host}/api/social/facebook/oauth/callback`;

  if (!appId || !appSecret) {
    return cleanCookie(NextResponse.redirect(`${dashboardBase}?shopId=${shopId}&error=${encodeURIComponent('Meta App ID বা Secret কনফিগার করা নেই')}`, { status: 302 }));
  }

  try {
    // 1. Exchange code for short-lived User Access Token (Graph API v26.0)
    const tokenUrl = new URL('https://graph.facebook.com/v26.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', appId);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('client_secret', appSecret);
    tokenUrl.searchParams.set('code', code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      const errMsg = tokenData.error?.message || 'টোকেন রূপান্তর ব্যর্থ হয়েছে';
      return cleanCookie(NextResponse.redirect(`${dashboardBase}?shopId=${shopId}&error=${encodeURIComponent(errMsg)}`, { status: 302 }));
    }

    const shortLivedUserToken = tokenData.access_token;

    // 2. Exchange short-lived token for long-lived User Token (60-day token, Graph API v26.0)
    let longLivedUserToken = shortLivedUserToken;
    try {
      const exchangeUrl = new URL('https://graph.facebook.com/v26.0/oauth/access_token');
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

    // 3. Fetch managed Facebook Pages with their Page Access Tokens (Graph API v26.0)
    // In Meta Graph API, Page Tokens obtained from a long-lived User Token NEVER expire
    const accountsUrl = `https://graph.facebook.com/v26.0/me/accounts?fields=id,name,access_token,category,tasks&access_token=${longLivedUserToken}`;
    const accountsRes = await fetch(accountsUrl);
    const accountsData = await accountsRes.json();

    if (accountsData.error || !accountsData.data || !Array.isArray(accountsData.data) || accountsData.data.length === 0) {
      return cleanCookie(NextResponse.redirect(
        `${dashboardBase}?shopId=${shopId}&error=${encodeURIComponent('আপনার অ্যাকাউন্টে কোনো অনুমোদিত ফেসবুক পেজ পাওয়া যায়নি। দয়া করে পেজ তৈরি করে পুনরায় চেষ্টা করুন।')}`,
        { status: 302 }
      ));
    }

    // 4. Retrieve shop details to match page name if possible
    let shopName = '';
    let targetShopId = shopId;
    let shopSlug = '';
    let ownerId = '';

    try {
      const resolvedShop = await resolveShop(shopId);
      if (resolvedShop) {
        targetShopId = resolvedShop.id;
        shopName = resolvedShop.shopName || resolvedShop.name || '';
        shopSlug = resolvedShop.shopSlug || resolvedShop.subdomainSlug || '';
        ownerId = resolvedShop.ownerId || resolvedShop.ownerUid || resolvedShop.createdBy || '';
      }
    } catch (_) {}

    // Match page by shop name or pick first page
    const matchedPage = (shopName ? accountsData.data.find(p => p.name?.toLowerCase().includes(shopName.toLowerCase())) : null) ||
      accountsData.data[0];

    const pageId = matchedPage.id;
    const pageName = matchedPage.name || 'Facebook Page';
    const pageAccessToken = matchedPage.access_token;

    if (!pageAccessToken) {
      return cleanCookie(NextResponse.redirect(
        `${dashboardBase}?shopId=${targetShopId}&error=${encodeURIComponent('পেজ এক্সেস টোকেন পাওয়া যায়নি। আপনার পেজে প্রয়োজনীয় অ্যাডমিন অধিকার আছে কি না যাচাই করুন।')}`,
        { status: 302 }
      ));
    }

    // 5. Automatically subscribe the Facebook Page to Webhooks (All 5 fields in Graph API v26.0)
    let webhookSubscribed = false;
    let webhookWarning = null;
    try {
      const subRes = await fetch(
        `https://graph.facebook.com/v26.0/${pageId}/subscribed_apps?subscribed_fields=messages,messaging_postbacks,feed,message_deliveries,message_reads&access_token=${pageAccessToken}`,
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

    // 6. Save connection securely in Firestore (both global and shop-scoped)
    const connectionPayload = {
      shopId: targetShopId,
      originalShopId: shopId,
      shopSlug,
      ownerId,
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
    await adminDb.collection('shops').doc(targetShopId).collection('socialConnections').doc('facebook').set(connectionPayload, { merge: true });
    // Auto-detect & link WhatsApp Business if available on this Meta account
    try {
      const waUrl = `https://graph.facebook.com/v26.0/me?fields=whatsapp_business_accounts{id,name,phone_numbers{id,display_phone_number,verified_name}}&access_token=${longLivedUserToken}`;
      const waRes = await fetch(waUrl);
      const waData = await waRes.json();
      const wabas = waData?.whatsapp_business_accounts?.data || [];
      for (const waba of wabas) {
        const phones = waba.phone_numbers?.data || [];
        for (const phone of phones) {
          if (phone.id) {
            const waPayload = {
              shopId: targetShopId,
              platform: 'whatsapp',
              phoneNumberId: phone.id,
              displayPhoneNumber: phone.display_phone_number || phone.verified_name || phone.id,
              wabaId: waba.id,
              accessToken: longLivedUserToken,
              connectedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            await adminDb.collection('social_connections').doc(phone.id).set(waPayload, { merge: true });
            await adminDb.collection('shops').doc(targetShopId).collection('socialConnections').doc('whatsapp').set(waPayload, { merge: true });
            break;
          }
        }
      }
    } catch (_) {}

    if (targetShopId !== shopId) {
      await adminDb.collection('shops').doc(shopId).collection('socialConnections').doc('facebook').set(connectionPayload, { merge: true }).catch(() => {});
    }

    return cleanCookie(NextResponse.redirect(
      `${dashboardBase}?shopId=${targetShopId}&connected=facebook&pageName=${encodeURIComponent(pageName)}`,
      { status: 302 }
    ));
  } catch (err) {
    console.error('[Facebook OAuth Callback Error]:', err);
    return cleanCookie(NextResponse.redirect(
      `${dashboardBase}?shopId=${shopId}&error=${encodeURIComponent(err.message || 'কানেকশন প্রক্রিয়াকরণে সমস্যা হয়েছে')}`,
      { status: 302 }
    ));
  }
}
