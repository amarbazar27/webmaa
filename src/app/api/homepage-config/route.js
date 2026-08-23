import { NextResponse } from 'next/server';
import { adminDb as db, adminAuth } from '@/lib/firebase-admin';

// Default homepage config template
const DEFAULT_SECTIONS = [
  { id: 'basic_storefront', type: 'basic_storefront', enabled: true, order: 0, isPinned: true, data: { showDesc: true, showSearch: true, showCategories: true, showProducts: true } },
  { id: 'hero', type: 'hero_carousel', enabled: true, order: 1, data: { slides: [] } },
  { id: 'trust_strip', type: 'trust_strip', enabled: true, order: 1, data: {} },
  { id: 'categories', type: 'category_scroller', enabled: true, order: 2, data: { items: [] } },
  { id: 'split_showcase', type: 'split_showcase', enabled: true, order: 3, data: {} },
  { id: 'flash_sale', type: 'flash_sale', enabled: true, order: 4, data: { endTime: null, productIds: [] } },
  { id: 'product_grid', type: 'product_grid', enabled: true, order: 5, data: { title: 'আমাদের জনপ্রিয় পণ্যসমূহ', tabs: ['all', 'trending', 'bestseller'], maxProducts: 12 } },
  { id: 'shop_the_look', type: 'shop_the_look', enabled: false, order: 6, data: {} },
  { id: 'bento_mosaic', type: 'bento_mosaic', enabled: false, order: 7, data: {} },
  { id: 'banner_row', type: 'banner_row', enabled: false, order: 8, data: { banners: [] } },
  { id: 'product_spotlight', type: 'product_spotlight', enabled: false, order: 9, data: {} },
  { id: 'mood_board', type: 'mood_board', enabled: false, order: 10, data: {} },
  { id: 'deal_of_the_day', type: 'deal_of_the_day', enabled: false, order: 11, data: {} },
  { id: 'video_reels', type: 'video_reels', enabled: false, order: 12, data: { urls: [] } },
  { id: 'shoppable_video', type: 'shoppable_video', enabled: false, order: 13, data: {} },
  { id: 'bundle_section', type: 'bundle_section', enabled: false, order: 14, data: { bundles: [] } },
  { id: 'before_after', type: 'before_after', enabled: false, order: 15, data: {} },
  { id: 'photo_reviews', type: 'photo_reviews', enabled: true, order: 16, data: { reviews: [] } },
  { id: 'customer_ugc', type: 'customer_ugc', enabled: false, order: 17, data: {} },
  { id: 'brand_marquee', type: 'brand_marquee', enabled: false, order: 18, data: { brands: [] } },
  { id: 'price_ladder', type: 'price_ladder', enabled: false, order: 19, data: {} },
  { id: 'price_tier_store', type: 'price_tier_store', enabled: false, order: 20, data: { tiers: [299, 599, 999] } },
  { id: 'editorial_story', type: 'editorial_story', enabled: false, order: 21, data: {} },
  { id: 'lookbook', type: 'lookbook', enabled: false, order: 22, data: {} },
  { id: 'scroll_story', type: 'scroll_story', enabled: false, order: 23, data: {} },
  { id: 'tabbed_collection', type: 'tabbed_collection', enabled: false, order: 24, data: {} },
  { id: 'concern_grid', type: 'concern_grid', enabled: false, order: 25, data: { items: [] } },
  { id: 'instagram_feed', type: 'instagram_feed', enabled: false, order: 26, data: { embedUrl: '' } },
  { id: 'popup_banner', type: 'popup_banner', enabled: false, order: 27, data: { imageUrl: '', linkUrl: '', buttonText: '', delay: 2 } },
];

const DEFAULT_THEME = {
  primaryColor: '#6D28D9',
  font: 'Hind Siliguri',
  language: 'bn',
};

const DEFAULT_HEADER = {
  style: 'classic',
  showSearch: true,
  showNotifications: true,
  showThemeToggle: true,
  showDashboardBtn: true,
  showFaqBtn: true,
  buttonStyle: 'contrast_pill',
};

const DEFAULT_FOOTER = {
  style: 'modern_columns',
  showCategories: true,
  showContact: true,
  showSocials: true,
  showCopyright: true,
  showPrivacy: true,
  customTagline: '',
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
        header: DEFAULT_HEADER,
        footer: DEFAULT_FOOTER,
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

    if (!data.header) data.header = DEFAULT_HEADER;
    if (!data.footer) data.footer = DEFAULT_FOOTER;

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
    const { shopId, sections, theme, header, footer } = body;

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
      header: header || DEFAULT_HEADER,
      footer: footer || DEFAULT_FOOTER,
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
    const { shopId, sections, theme, header, footer } = body;

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
      header: header || DEFAULT_HEADER,
      footer: footer || DEFAULT_FOOTER,
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
