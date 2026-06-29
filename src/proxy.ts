/**
 * proxy.ts — Webmaa Multi-Tenant Custom Domain Router
 *
 * Next.js 16+ এ middleware.ts বাতিল হয়েছে। এই ফাইলের নাম proxy.ts এবং
 * exported function-এর নাম অবশ্যই proxy হতে হবে।
 *
 * কাজ:
 * - কাস্টম ডোমেইন (যেমন messerbazar.com) detect করে
 * - Firestore থেকে slug খুঁজে /shop/[slug] এ rewrite করে
 * - webmaa.vercel.app/shop/[store] আগের মতোই কাজ করে
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── Rate Limiting Store ──
const rateLimitMap = new Map<string, { count: number, startTime: number }>();

function applySecurityHeaders(response: NextResponse, pathname: string): NextResponse {
  // Disabled security headers temporarily to debug Auth conflict
  return response;
}

// এই হোস্টগুলো কাস্টম ডোমেইন হিসেবে ধরা হবে না — সরাসরি পার হয়ে যাবে
const BYPASS_HOSTS = [
  'webmaa.vercel.app',
  'daripallah.com',
  'bdretailers.com',
  'www.bdretailers.com',
  'localhost',
  '127.0.0.1',
];

const RESERVED_KEYWORDS = [
  'dashboard', 'superadmin', 'login', 'register', 'showcase', 'api', 
  'reviews', 'become-retailer',
  '_next', 'robots.txt', 'sitemap.xml', 'sw.js', 'manifest.json', 'demo', 'icons', 'test-auth', 'logo.png', 'favicon.ico', 'shop', 'domain'
];

/**
 * hostname normalize করে:
 *  - www. সরায়
 *  - lowercase করে
 *  - port number সরায় (localhost:3001 → localhost)
 */
function normalizeHost(host: string): string {
  return host
    .replace(/^www\./i, '')
    .toLowerCase()
    .split(':')[0];
}

/**
 * চেক করে যে হোস্টটি বাইপাস করতে হবে কিনা।
 * যেমন webmaa.vercel.app, localhost, ইত্যাদি।
 */
function isBypassHost(host: string): boolean {
  return BYPASS_HOSTS.some(
    (bypass) => host === bypass || host === 'www.' + bypass
  );
}

/**
 * হোস্টনেম থেকে টেন্যান্ট স্লাগ এক্সট্র্যাক্ট করে (যেমন: messerbazar.daripallah.com -> messerbazar)
 */
function getTenantSlug(host: string): string | null {
  const parts = host.split('.');
  
  if (host.endsWith('.localhost')) {
    if (parts.length >= 2 && parts[0] !== 'www') {
      return parts[0];
    }
    return null;
  }
  
  const isPlatformDomain = 
    host.endsWith('.daripallah.com') || 
    host.endsWith('.bdretailers.com') || 
    host.endsWith('.webmaa.vercel.app');
  
  if (isPlatformDomain) {
    if (parts.length === 3) {
      return parts[0] === 'www' ? null : parts[0];
    }
    if (parts.length > 3) {
      const nonWwwParts = parts.filter(p => p !== 'www');
      return nonWwwParts[0] || null;
    }
  }
  
  return null;
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const rawHost = request.headers.get('host') ?? '';
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';
  const { pathname } = request.nextUrl;

  const host = normalizeHost(rawHost);

  console.log(`[Proxy] host=${host} pathname=${pathname}`);

  // ---------------------------------------------------------
  // 1. RATE LIMITING (all requests, basic DDoS protection)
  // ---------------------------------------------------------
  if (pathname.startsWith('/api/')) {
    const windowStart = Date.now() - 60000;
    const countData = rateLimitMap.get(ip) || { count: 0, startTime: Date.now() };

    if (countData.startTime < windowStart) {
      countData.count = 1;
      countData.startTime = Date.now();
    } else {
      countData.count++;
    }

    rateLimitMap.set(ip, countData);

    if (countData.count > 100) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Too many requests. Rate limit exceeded.' }, { status: 429 }),
        pathname
      );
    }

    // API routes handle their own auth — let them through
    return applySecurityHeaders(NextResponse.next(), pathname);
  }

  // ── Custom favicon.ico and logo.png rewrite for custom domains & subdomains ──
  const isFaviconOrLogo = pathname === '/favicon.ico' || pathname === '/logo.png';
  if (isFaviconOrLogo && !isBypassHost(host)) {
    let slug = getTenantSlug(rawHost);
    if (slug) {
      const targetPath = `/shop/${slug}${pathname}`;
      const rewriteUrl = new URL(targetPath, request.url);
      console.log(`[Proxy] Subdomain favicon/logo rewrite: ${targetPath}`);
      return applySecurityHeaders(NextResponse.rewrite(rewriteUrl), pathname);
    }
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bdretailers.com';
      const lookupUrl = new URL('/api/domain-lookup', baseUrl);
      lookupUrl.searchParams.set('host', host);
      const lookupResponse = await fetch(lookupUrl.toString(), {
        method: 'GET',
        headers: { 'x-internal-token': process.env.INTERNAL_PROXY_SECRET ?? '' },
        cache: 'no-store',
      });
      if (lookupResponse.ok) {
        const data = await lookupResponse.json();
        if (data.slug) {
          const targetPath = `/shop/${data.slug}${pathname}`;
          const rewriteUrl = new URL(targetPath, request.url);
          console.log(`[Proxy] Custom domain favicon/logo rewrite: ${targetPath}`);
          return applySecurityHeaders(NextResponse.rewrite(rewriteUrl), pathname);
        }
      }
    } catch (err) {
      console.error('[Proxy] Favicon lookup failed:', err);
    }
  }

  // ── Common static bypass paths for all hosts ──────────────────────────
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/robots') ||
    pathname.startsWith('/sitemap') ||
    pathname.startsWith('/sw.') ||
    pathname.startsWith('/manifest') ||
    pathname.startsWith('/not-found-domain') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/__/') ||
    pathname.startsWith('/logo.png') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return applySecurityHeaders(NextResponse.next(), pathname);
  }

  const pathParts = pathname.split('/').filter(Boolean);
  const firstSegment = pathParts[0] || '';

  // ── কেস ১: বাইপাস হোস্ট (যেমন main site `daripallah.com` বা `localhost`) ──────────────────────────
  if (!host || isBypassHost(host)) {
    if (pathParts.length >= 1) {
      if (!RESERVED_KEYWORDS.includes(firstSegment)) {
        // Rewrite /[shopSlug]/... to /shop/[shopSlug]/...
        const remainingPath = pathParts.slice(1).join('/');
        const targetPath = `/shop/${firstSegment}${remainingPath ? '/' + remainingPath : ''}`;
        const rewriteUrl = new URL(targetPath, request.url);
        rewriteUrl.search = request.nextUrl.search;
        console.log(`[Proxy] Short path detected. Rewriting ${pathname} to ${targetPath}`);
        return applySecurityHeaders(NextResponse.rewrite(rewriteUrl), pathname);
      }
    }
    return applySecurityHeaders(NextResponse.next(), pathname);
  }

  // ── কেস ২: টেন্যান্ট সাবডোমেন (যেমন `messerbazar.daripallah.com`) ──────────────────────────
  const tenantSlug = getTenantSlug(rawHost); // Use rawHost to split subdomains correctly
  if (tenantSlug) {
    if (RESERVED_KEYWORDS.includes(firstSegment)) {
      return applySecurityHeaders(NextResponse.next(), pathname);
    }
    // Rewrite /[path] to /shop/[tenantSlug]/[path]
    const targetPath = `/shop/${tenantSlug}${pathname === '/' ? '' : pathname}`;
    const rewriteUrl = new URL(targetPath, request.url);
    rewriteUrl.search = request.nextUrl.search;
    console.log(`[Proxy] Subdomain tenant rewrite: ${rawHost}${pathname} to ${targetPath}`);
    return applySecurityHeaders(NextResponse.rewrite(rewriteUrl), pathname);
  }

  // ── কেস ৩: কাস্টম ডোমেইন (যেমন `messerbazar.com`) ──────────────────────────
  if (pathname.startsWith('/shop/')) {
    return applySecurityHeaders(NextResponse.next(), pathname);
  }

  if (RESERVED_KEYWORDS.includes(firstSegment)) {
    return applySecurityHeaders(NextResponse.next(), pathname);
  }

  try {
    // Internal API call — domain → shop slug রেজোলিউশন
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bdretailers.com';
    const lookupUrl = new URL('/api/domain-lookup', baseUrl);
    lookupUrl.searchParams.set('host', host);

    console.log(`[Proxy] Calling domain-lookup for host=${host}`);

    const lookupResponse = await fetch(lookupUrl.toString(), {
      method: 'GET',
      headers: {
        'x-internal-token': process.env.INTERNAL_PROXY_SECRET ?? '',
      },
      cache: 'no-store',
    });

    console.log(`[Proxy] domain-lookup status=${lookupResponse.status}`);

    if (lookupResponse.ok) {
      const data = await lookupResponse.json();
      console.log(`[Proxy] domain-lookup data=`, data);

      if (data.slug) {
        // ✅ ডোমেইন পাওয়া গেছে — /shop/[slug] এ rewrite করো
        const rewriteUrl = new URL(
          `/shop/${data.slug}${pathname === '/' ? '' : pathname}`,
          request.url
        );
        rewriteUrl.search = request.nextUrl.search;

        console.log(`[Proxy] Rewriting custom domain path to ${rewriteUrl.toString()}`);
        return applySecurityHeaders(NextResponse.rewrite(rewriteUrl), pathname);
      }
    }

    // ❌ ডোমেইন পাওয়া যায়নি — কাস্টম not-found পেজ দেখাও
    console.warn(`[Proxy] Domain not found for host=${host}`);
    const notFoundUrl = new URL('/not-found-domain', request.url);
    return applySecurityHeaders(NextResponse.rewrite(notFoundUrl), pathname);
  } catch (err) {
    console.error('[proxy] domain lookup failed:', err);
    const notFoundUrl = new URL('/not-found-domain', request.url);
    return applySecurityHeaders(NextResponse.rewrite(notFoundUrl), pathname);
  }
}

// ── Matcher Config ──────────────────────────────────────────────────────────
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|robots\\.txt|sitemap\\.xml|icons/).*)',
  ],
};
