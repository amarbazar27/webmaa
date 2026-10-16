import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuth, AuthError } from '@/lib/verifyAuth';

function isShopOwner(shopData, uid) {
  return (
    shopData.ownerId === uid ||
    shopData.ownerUid === uid ||
    shopData.createdBy === uid ||
    shopData.userId === uid
  );
}

export async function POST(request) {
  try {
    const authResult = await verifyAuth(request);

    const body = await request.json();
    let { pageId, pageAccessToken, pageName, shopId } = body;

    if (!pageAccessToken || !shopId) {
      return NextResponse.json({ error: 'Page Access Token এবং Shop ID প্রয়োজন' }, { status: 400 });
    }

    // Verify retailer owns the shop (or superadmin for main)
    let shopData = {};
    if (shopId !== 'main') {
      const shopDoc = await adminDb.collection('shops').doc(shopId).get();
      if (!shopDoc.exists) {
        return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
      }
      shopData = shopDoc.data() || {};
      if (!isShopOwner(shopData, authResult.uid) && authResult.role !== 'superadmin') {
        return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস' }, { status: 403 });
      }
    } else if (authResult.role !== 'superadmin') {
      return NextResponse.json({ error: 'অননুমোদিত অ্যাক্সেস' }, { status: 403 });
    }

    // ── WhatsApp Cloud API Connect Handler ─────────────────────
    if (body.platform === 'whatsapp') {
      const { phoneNumberId, wabaId, accessToken } = body;
      if (!phoneNumberId?.trim() || !accessToken?.trim()) {
        return NextResponse.json({ error: 'Phone Number ID এবং Access Token প্রয়োজন' }, { status: 400 });
      }

      const cleanPhoneId = phoneNumberId.trim();
      const cleanToken = accessToken.trim();
      const cleanWabaId = wabaId?.trim() || null;

      // Verify token with Meta Graph API
      let displayPhoneNumber = cleanPhoneId;
      try {
        const waTestRes = await fetch(`https://graph.facebook.com/v21.0/${cleanPhoneId}?access_token=${cleanToken}`);
        const waTestData = await waTestRes.json();
        if (waTestData.display_phone_number) {
          displayPhoneNumber = waTestData.display_phone_number;
        } else if (waTestData.error) {
          console.warn('[WhatsApp Connect] Meta verification note:', waTestData.error.message);
        }
      } catch (err) {
        console.warn('[WhatsApp Connect] Lookup note:', err.message);
      }

      const waPayload = {
        shopId,
        platform: 'whatsapp',
        phoneNumberId: cleanPhoneId,
        displayPhoneNumber,
        wabaId: cleanWabaId,
        accessToken: cleanToken,
        connectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await adminDb.collection('social_connections').doc(cleanPhoneId).set(waPayload, { merge: true });
      await adminDb.collection('shops').doc(shopId).collection('socialConnections').doc('whatsapp').set(waPayload, { merge: true });

      return NextResponse.json({
        success: true,
        platform: 'whatsapp',
        phoneNumberId: cleanPhoneId,
        displayPhoneNumber,
        message: 'WhatsApp Business Cloud API সফলভাবে যুক্ত হয়েছে! 🎉'
      });
    }

    // ── Facebook Page Connect Handler ──────────────────────────
    if (!pageAccessToken || !shopId) {
      return NextResponse.json({ error: 'Page Access Token এবং Shop ID প্রয়োজন' }, { status: 400 });
    }

    // Intelligent Page Token Resolution:
    // If user accidentally copied a User Access Token, exchange it via /me/accounts for the actual Page Token!
    let resolvedToken = pageAccessToken.trim();

    try {
      // 1. Verify token validity with basic fields supported on BOTH User and Page nodes (never ask for category on /me as it fails on User nodes)
      const meRes = await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${resolvedToken}`);
      const meData = await meRes.json();

      if (meData.error) {
        return NextResponse.json({
          error: `মেটা এক্সেস টোকেনটি অকার্যকর বা মেয়াদোত্তীর্ণ (${meData.error.message})। দয়া করে Graph API Explorer থেকে সচল টোকেন সংগ্রহ করুন।`
        }, { status: 400 });
      }

      // 2. Check if this is a User Access Token by querying /me/accounts with explicit fields
      // In Graph API v21+, fields must be explicitly requested to include access_token
      const accountsRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,category,tasks&access_token=${resolvedToken}`);
      const accountsData = await accountsRes.json();

      if (accountsData.data && Array.isArray(accountsData.data) && accountsData.data.length > 0) {
        // User Token detected! Automatically extract the actual Page Access Token
        const matchedPage = (pageId ? accountsData.data.find(p => p.id === pageId) : null) ||
          (pageName ? accountsData.data.find(p => p.name?.toLowerCase().includes(pageName.toLowerCase())) : null) ||
          (shopData.shopName ? accountsData.data.find(p => p.name?.toLowerCase().includes(shopData.shopName.toLowerCase())) : null) ||
          accountsData.data[0];

        if (matchedPage) {
          pageId = matchedPage.id;
          pageName = matchedPage.name || pageName;
          if (matchedPage.access_token) {
            resolvedToken = matchedPage.access_token;
            console.log('[Social Connect] Successfully resolved Page Access Token from User Token for page:', pageName, pageId);
          }
        }
      } else {
        // Direct Page Access Token or Page Node
        pageId = pageId || meData.id;
        pageName = pageName || meData.name || shopData.shopName || 'Facebook Page';
      }
    } catch (graphErr) {
      console.warn('[Social Connect] Meta lookup warning:', graphErr.message);
    }

    if (!pageId) {
      return NextResponse.json({ error: 'ফেসবুক পেজের ID শনাক্ত করা যায়নি। সঠিক Page Token দিন।' }, { status: 400 });
    }
    if (!pageName) {
      pageName = shopData.shopName || 'Facebook Page';
    }

    // Subscribe the Facebook Page to Webhooks via Graph API
    let webhookSubscribed = false;
    let webhookWarning = null;
    try {
      const subscribeRes = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps?subscribed_fields=messages,messaging_postbacks,feed&access_token=${resolvedToken}`,
        { method: 'POST' }
      );
      const subscribeData = await subscribeRes.json();
      webhookSubscribed = Boolean(subscribeData.success);

      if (subscribeData.error) {
        console.warn('[Social Connect] Page subscribed_apps failed:', subscribeData.error);
        const errMsg = subscribeData.error.message || '';
        if (errMsg.includes('Object with ID') && errMsg.includes('does not exist')) {
          return NextResponse.json({
            error: `মেটা এক্সেস টোকেনটি একটি User Token হিসেবে শনাক্ত হয়েছে (পেজের জন্য নয়)। অনুগ্রহ করে Graph API Explorer-এ 'User or Page' ড্রপডাউন থেকে 'User Token' পরিবর্তন করে আপনার পেজ (${pageName || 'Messer Bazar'}) সিলেক্ট করুন এবং 'Generate Access Token' চেপে পেজ টোকেনটি কপি করে পেস্ট করুন।`
          }, { status: 400 });
        }
        webhookWarning = errMsg;
      }
    } catch (subErr) {
      console.warn('[Social Connect] Webhook subscription warning:', subErr.message);
      webhookWarning = subErr.message;
    }

    // Save connection to Firestore
    const connectionPayload = {
      shopId,
      pageId,
      pageAccessToken: resolvedToken,
      pageName,
      platform: 'facebook',
      webhookSubscribed: Boolean(webhookSubscribed),
      webhookWarning: webhookWarning || null,
      connectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection('social_connections').doc(pageId).set(connectionPayload, { merge: true });
    await adminDb.collection('shops').doc(shopId).collection('socialConnections').doc('facebook').set(connectionPayload, { merge: true });

    return NextResponse.json({
      success: true,
      pageId,
      pageName,
      webhookSubscribed: Boolean(webhookSubscribed),
      message: webhookSubscribed
        ? 'Facebook পেজ সফলভাবে যুক্ত এবং ওয়েববুকে সাবস্ক্রাইব হয়েছে! 🎉'
        : `Facebook পেজ (${pageName}) যুক্ত হয়েছে! (মেটা নোটিশ: ${webhookWarning || 'ম্যানুয়াল কনফিগারেশন'})`,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Social connect error:', error);
    if (error.message?.includes('RESOURCE_EXHAUSTED') || error.code === 8) {
      return NextResponse.json({ 
        error: 'ফায়ারবেস ক্লাউড ডাটাবেজের দৈনিক ফ্রি লিমিট (Spark Plan 50,000 reads/writes) সাময়িকভাবে শেষ হয়েছে। Firebase Console থেকে Blaze প্ল্যানে আপগ্রেড করুন বা কোটা রিসেট হওয়া পর্যন্ত অপেক্ষা করুন।' 
      }, { status: 429 });
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const authResult = await verifyAuth(request);

    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    if (!shopId) {
      return NextResponse.json({ error: 'Missing shopId' }, { status: 400 });
    }

    // Verify retailer owns the shop (or superadmin for main)
    if (shopId !== 'main') {
      const shopDoc = await adminDb.collection('shops').doc(shopId).get();
      if (!shopDoc.exists) {
        return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
      }
      const shopData = shopDoc.data() || {};
      if (!isShopOwner(shopData, authResult.uid) && authResult.role !== 'superadmin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (authResult.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const snapshot = await adminDb.collection('social_connections').where('shopId', '==', shopId).get();
    const connections = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      connections.push({
        id: doc.id,
        pageId: data.pageId || doc.id,
        pageName: data.pageName,
        platform: data.platform || 'facebook',
        phoneNumberId: data.phoneNumberId || null,
        displayPhoneNumber: data.displayPhoneNumber || null,
        wabaId: data.wabaId || null,
        webhookSubscribed: data.webhookSubscribed || false,
        connectedAt: data.connectedAt,
      });
    });

    return NextResponse.json({ connections });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Social fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const authResult = await verifyAuth(request);

    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');
    const pageId = searchParams.get('pageId');

    if (!shopId || !pageId) {
      return NextResponse.json({ error: 'Missing shopId or pageId' }, { status: 400 });
    }

    // Verify retailer owns the shop (or superadmin for main)
    if (shopId !== 'main') {
      const shopDoc = await adminDb.collection('shops').doc(shopId).get();
      if (!shopDoc.exists) {
        return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
      }
      const shopData = shopDoc.data() || {};
      if (!isShopOwner(shopData, authResult.uid) && authResult.role !== 'superadmin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (authResult.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await adminDb.collection('social_connections').doc(pageId).delete();
    await adminDb.collection('shops').doc(shopId).collection('socialConnections').doc('facebook').delete().catch(() => {});
    await adminDb.collection('shops').doc(shopId).collection('socialConnections').doc('whatsapp').delete().catch(() => {});

    return NextResponse.json({ success: true, message: 'ডিসকানেক্ট সম্পন্ন হয়েছে' });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Social disconnect error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
