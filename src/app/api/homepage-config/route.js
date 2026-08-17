import { NextResponse } from 'next/server';
import { adminDb as db, adminAuth } from '@/lib/firebase-admin';

// Default homepage config template
const DEFAULT_SECTIONS = [
  { id: 'hero', type: 'hero_carousel', enabled: true, order: 0, data: { slides: [] } },
  { id: 'categories', type: 'category_scroller', enabled: true, order: 1, data: { items: [] } },
  { id: 'banner_row', type: 'banner_row', enabled: false, order: 2, data: { banners: [] } },
  { id: 'flash_sale', type: 'flash_sale', enabled: false, order: 3, data: { endTime: null, productIds: [] } },
  { id: 'product_grid', type: 'product_grid', enabled: true, order: 4, data: { title: 'আমাদের পণ্যসমূহ', tabs: ['all'], maxProducts: 12 } },
  { id: 'concern_grid', type: 'concern_grid', enabled: false, order: 5, data: { items: [] } },
  { id: 'video_reels', type: 'video_reels', enabled: false, order: 6, data: { urls: [] } },
  { id: 'brand_marquee', type: 'brand_marquee', enabled: false, order: 7, data: { brands: [] } },
  { id: 'bundle_section', type: 'bundle_section', enabled: false, order: 8, data: { bundles: [] } },
  { id: 'photo_reviews', type: 'photo_reviews', enabled: false, order: 9, data: { reviews: [] } },
  { id: 'instagram_feed', type: 'instagram_feed', enabled: false, order: 10, data: { embedUrl: '' } },
  { id: 'price_tier_store', type: 'price_tier_store', enabled: false, order: 11, data: { tiers: [299, 599, 999] } },
];

const DEFAULT_THEME = {
  primaryColor: '#6D28D9',
  font: 'Hind Siliguri',
  language: 'bn',
};

async function verifyAuth(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.split('Bearer ')[1];
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded;
  } catch {
    return null;
  }
}

// GET /api/homepage-config?shopId=xxx
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get('shopId');
  const draft = searchParams.get('draft') === 'true';

  if (!shopId) {
    return NextResponse.json({ error: 'shopId required' }, { status: 400 });
  }

  try {
    const docName = draft ? 'homepageConfigDraft' : 'homepageConfig';
    const ref = db.collection('shops').doc(shopId).collection('config').doc(docName);
    const snap = await ref.get();

    if (!snap.exists) {
      // Return defaults if no config yet
      return NextResponse.json({
        sections: DEFAULT_SECTIONS,
        theme: DEFAULT_THEME,
        publishedAt: null,
      });
    }

    const data = snap.data();

    // ── Sanitize: strip sort-only filter tabs from product_grid (backward compat) ──
    // Shops that had ['trending','new','bestseller'] auto-get reset to ['all']
    // so filter tabs don't appear without explicit retailer configuration.
    if (Array.isArray(data.sections)) {
      const SORT_ONLY_TABS = new Set(['trending', 'new', 'bestseller']);
      data.sections = data.sections.map(s => {
        if (s.type === 'product_grid' && Array.isArray(s.data?.tabs)) {
          const hasMeaningfulTab = s.data.tabs.some(t => !SORT_ONLY_TABS.has(t));
          if (!hasMeaningfulTab) {
            return { ...s, data: { ...s.data, tabs: ['all'] } };
          }
        }
        return s;
      });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[homepage-config GET]', err);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

// POST /api/homepage-config — Save draft
export async function POST(request) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { shopId, sections, theme } = body;

    if (!shopId) return NextResponse.json({ error: 'shopId required' }, { status: 400 });

    // Verify ownership or superadmin
    const shopSnap = await db.collection('shops').doc(shopId).get();
    if (!shopSnap.exists) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const shopData = shopSnap.data();
    const userSnap = await db.collection('users').doc(user.uid).get();
    const userRole = userSnap.data()?.role;

    if (shopData.ownerId !== user.uid && userRole !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const draftRef = db.collection('shops').doc(shopId).collection('config').doc('homepageConfigDraft');
    await draftRef.set({
      sections: sections || DEFAULT_SECTIONS,
      theme: theme || DEFAULT_THEME,
      updatedAt: new Date().toISOString(),
      updatedBy: user.uid,
    }, { merge: false });

    return NextResponse.json({ success: true, message: 'Draft saved' });
  } catch (err) {
    console.error('[homepage-config POST]', err);
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 });
  }
}

// PUT /api/homepage-config — Publish (copy draft → live)
export async function PUT(request) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { shopId, sections, theme } = body;

    if (!shopId) return NextResponse.json({ error: 'shopId required' }, { status: 400 });

    const shopSnap = await db.collection('shops').doc(shopId).get();
    if (!shopSnap.exists) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const shopData = shopSnap.data();
    const userSnap = await db.collection('users').doc(user.uid).get();
    const userRole = userSnap.data()?.role;

    if (shopData.ownerId !== user.uid && userRole !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const configData = {
      sections: sections || DEFAULT_SECTIONS,
      theme: theme || DEFAULT_THEME,
      publishedAt: new Date().toISOString(),
      publishedBy: user.uid,
    };

    const batch = db.batch();
    // Write live config
    const liveRef = db.collection('shops').doc(shopId).collection('config').doc('homepageConfig');
    batch.set(liveRef, configData, { merge: false });
    // Also save as draft
    const draftRef = db.collection('shops').doc(shopId).collection('config').doc('homepageConfigDraft');
    batch.set(draftRef, { ...configData, updatedAt: configData.publishedAt, updatedBy: user.uid }, { merge: false });

    await batch.commit();

    return NextResponse.json({ success: true, message: 'Published successfully' });
  } catch (err) {
    console.error('[homepage-config PUT]', err);
    return NextResponse.json({ error: 'Failed to publish' }, { status: 500 });
  }
}
