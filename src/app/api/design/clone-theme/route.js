import { NextResponse } from 'next/server';
import { adminDb, adminAuth, FieldValue } from '@/lib/firebase-admin';

// Helper: Normalize URL to absolute path
function toAbsoluteUrl(url, base) {
  if (!url || typeof url !== 'string') return '';
  const clean = url.trim();
  if (clean.startsWith('//')) return `https:${clean}`;
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
  try {
    return new URL(clean, base).href;
  } catch {
    return '';
  }
}

// Helper: Clean extracted string
function cleanText(str) {
  return (str || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper: Extract valid hex color from CSS or string
function extractHexColors(cssText) {
  const hexMatches = cssText.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/g) || [];
  // Exclude common extreme b/w
  return hexMatches
    .map(c => {
      let h = c.toLowerCase();
      if (h.length === 4) h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
      return h;
    })
    .filter(h => h !== '#ffffff' && h !== '#000000' && h !== '#0a0a0a' && h !== '#f8fafc' && h !== '#e2e8f0');
}

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    const { shopId, targetUrl } = body;

    if (!shopId || !targetUrl) {
      return NextResponse.json({ error: 'Shop ID এবং ওয়েবসাইটের URL প্রয়োজন' }, { status: 400 });
    }

    // Verify shop ownership or superadmin role
    const shopDoc = await adminDb.collection('shops').doc(shopId).get();
    if (!shopDoc.exists) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }
    const shopData = shopDoc.data();
    if (shopData.ownerId !== decoded.uid && shopData.ownerUid !== decoded.uid && shopData.userId !== decoded.uid) {
      const userDoc = await adminDb.collection('users').doc(decoded.uid).get();
      if (!userDoc.exists || userDoc.data()?.role !== 'superadmin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Normalize target URL
    let formattedUrl = targetUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const parsedUrl = new URL(formattedUrl);
    const origin = parsedUrl.origin;

    // Fetch competitor website HTML
    const pageRes = await fetch(formattedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,bn;q=0.8',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!pageRes.ok) {
      return NextResponse.json({ error: `ওয়েবসাইট লোড করতে ব্যর্থ হয়েছে (HTTP ${pageRes.status})` }, { status: 400 });
    }

    const html = await pageRes.text();

    // ── 1. Extract Brand & Identity ──────────────────────────────
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const siteTitle = cleanText(titleMatch ? titleMatch[1].split(/[|\-–]/)[0] : '');

    const ogSiteName = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i)?.[1];
    const brandName = ogSiteName || siteTitle || parsedUrl.hostname.replace('www.', '').split('.')[0];

    // Logo detection
    let logoUrl = '';
    const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1];
    const logoImgMatch = html.match(/<img[^>]+(?:class|id|alt)=["'][^"']*(?:logo|brand)[^"']*["'][^>]+src=["']([^"']+)["']/i) ||
      html.match(/<img[^>]+src=["']([^"']*(?:logo|brand)[^"']*)["']/i);

    if (logoImgMatch && logoImgMatch[1]) {
      logoUrl = toAbsoluteUrl(logoImgMatch[1], origin);
    } else if (ogImage) {
      logoUrl = toAbsoluteUrl(ogImage, origin);
    } else {
      const iconMatch = html.match(/<link[^>]+rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]+href=["']([^"']+)["']/i);
      if (iconMatch && iconMatch[1]) {
        logoUrl = toAbsoluteUrl(iconMatch[1], origin);
      }
    }

    // ── 2. Extract Color Palette & Theme Tokens ──────────────────
    let primaryColor = '#18181b';
    let secondaryColor = '#059669';
    let accentColor = '#f59e0b';
    let headerBg = '#ffffff';
    let bgColor = '#ffffff';

    // Check CSS custom properties
    const primaryVar = html.match(/--(?:primary|main|brand|theme)(?:-color)?:\s*(#[0-9a-fA-F]{3,6}|rgb\([^)]+\))/i);
    if (primaryVar && primaryVar[1]?.startsWith('#')) {
      primaryColor = primaryVar[1].toLowerCase();
    } else {
      const colors = extractHexColors(html.slice(0, 50000));
      if (colors.length > 0) {
        primaryColor = colors[0];
        if (colors.length > 1) secondaryColor = colors[1];
        if (colors.length > 2) accentColor = colors[2];
      }
    }

    // Header background detection
    const headerTagMatch = html.match(/<header[\s\S]*?>([\s\S]*?)<\/header>/i);
    const headerHtml = headerTagMatch ? headerTagMatch[0] : '';
    const headerColorMatch = headerHtml.match(/background(?:-color)?:\s*(#[0-9a-fA-F]{3,6})/i);
    if (headerColorMatch && headerColorMatch[1]) {
      headerBg = headerColorMatch[1].toLowerCase();
    } else {
      headerBg = primaryColor;
    }

    // ── 3. Extract Banner / Hero Media ───────────────────────────
    const bannerImages = [];
    const bannerMatches = [
      ...html.matchAll(/<img[^>]+(?:class|id|alt)=["'][^"']*(?:banner|hero|slider|carousel)[^"']*["'][^>]+src=["']([^"']+)["']/gi),
      ...html.matchAll(/<img[^>]+src=["']([^"']*(?:banner|slider|hero)[^"']*)["']/gi)
    ];

    for (const match of bannerMatches) {
      const full = toAbsoluteUrl(match[1], origin);
      if (full && !bannerImages.includes(full) && !full.endsWith('.svg') && !full.includes('logo')) {
        bannerImages.push(full);
        if (bannerImages.length >= 3) break;
      }
    }

    if (bannerImages.length === 0 && ogImage) {
      bannerImages.push(toAbsoluteUrl(ogImage, origin));
    }

    // ── 4. Extract Category Pills / Menu Structure ───────────────
    const categories = [];
    const navMatch = html.match(/<nav[\s\S]*?>([\s\S]*?)<\/nav>/i) ||
      html.match(/<ul[^>]+class=["'][^"']*(?:category|categories|menu)[^"']*["'][\s\S]*?>([\s\S]*?)<\/ul>/i);

    if (navMatch) {
      const linkMatches = [...navMatch[1].matchAll(/<a[^>]*>([^<]+)<\/a>/gi)];
      for (const m of linkMatches) {
        const cat = cleanText(m[1]);
        if (cat.length > 2 && cat.length < 30 && !['home', 'contact', 'about', 'login', 'cart', 'terms', 'হোম', 'লগইন'].includes(cat.toLowerCase())) {
          if (!categories.includes(cat)) {
            categories.push(cat);
            if (categories.length >= 8) break;
          }
        }
      }
    }

    // ── 5. Intelligent Layout / Preset Classification ────────────
    const lowerHtml = (html.slice(0, 30000) + ' ' + formattedUrl).toLowerCase();
    let designPreset = 'classic';

    if (lowerHtml.includes('grocery') || lowerHtml.includes('farm') || lowerHtml.includes('vegetable') || lowerHtml.includes('organic') || lowerHtml.includes('bazaar') || lowerHtml.includes('চাল') || lowerHtml.includes('ডাল')) {
      designPreset = 'forest';
    } else if (lowerHtml.includes('beauty') || lowerHtml.includes('cosmetic') || lowerHtml.includes('skin') || lowerHtml.includes('makeup') || lowerHtml.includes('glow') || lowerHtml.includes('perfume')) {
      designPreset = 'rose';
    } else if (lowerHtml.includes('gadget') || lowerHtml.includes('tech') || lowerHtml.includes('mobile') || lowerHtml.includes('electronics') || lowerHtml.includes('laptop')) {
      designPreset = 'neon';
    } else if (lowerHtml.includes('fashion') || lowerHtml.includes('clothing') || lowerHtml.includes('wear') || lowerHtml.includes('boutique') || lowerHtml.includes('dress')) {
      designPreset = 'sunset';
    } else if (lowerHtml.includes('luxury') || lowerHtml.includes('jewel') || lowerHtml.includes('watch') || lowerHtml.includes('gold')) {
      designPreset = 'royal';
    } else if (primaryColor === '#18181b' || primaryColor === '#000000') {
      designPreset = 'minimal';
    }

    // ── 6. Save Extracted Theme to Shop Profile ──────────────────
    const designOverrides = {
      primaryColor,
      secondaryColor,
      accentColor,
      headerBg,
      bgColor,
      buttonRadius: '16px',
      clonedFromUrl: formattedUrl,
      clonedBrandName: brandName,
      clonedAt: new Date().toISOString()
    };

    const updateData = {
      designPreset,
      designOverrides,
      updatedAt: FieldValue.serverTimestamp()
    };

    if (logoUrl) {
      updateData.logo = logoUrl;
      designOverrides.logo = logoUrl;
    }

    if (bannerImages.length > 0) {
      updateData.bannerImages = bannerImages;
      designOverrides.bannerImages = bannerImages;
    }

    await adminDb.collection('shops').doc(shopId).update(updateData);

    return NextResponse.json({
      success: true,
      brandName,
      logoUrl,
      bannerImages,
      categories,
      designPreset,
      theme: designOverrides,
      message: `প্রতিদ্বন্দ্বীর ওয়েবসাইট (${brandName}) থেকে ব্যানার, লোগো এবং কালার থিম সফলভাবে ক্লোন করা হয়েছে! 🎉`
    });
  } catch (error) {
    console.error('[Clone Theme API Error]:', error);
    return NextResponse.json({ error: error.message || 'থিম ক্লোন করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
