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
const rateLimitMap = new Map<{ count: number, startTime: number }>();

function applySecurityHeaders(response: NextResponse, pathname: string): NextResponse {
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  if (pathname.startsWith('/api/')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, nosnippet, noarchive');
  }
  return response;
}

// এই হোস্টগুলো কাস্টম ডোমেইন হিসেবে ধরা হবে না — সরাসরি পার হয়ে যাবে
const BYPASS_HOSTS = [
  'webmaa.vercel.app',
  'localhost',
  '127.0.0.1',
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
    (bypass) => host === bypass || host.endsWith('.' + bypass)
  );
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || request.ip || '127.0.0.1';
  const { pathname } = request.nextUrl;

  const rawHost = request.headers.get('host') ?? '';
  const host = normalizeHost(rawHost);

  // ---------------------------------------------------------
  // 1. ORIGIN PROTECTION (Block malicious Vercel direct hits)
  // ---------------------------------------------------------
  const isVercelDomain = rawHost.includes('vercel.app');
  const isSecondaryVercel = isVercelDomain && rawHost !== 'webmaa.vercel.app' && rawHost !== 'webmaa-backup.vercel.app';

  // If it's a direct Vercel deployment URL (other than our official platform nodes), block it.
  if (isSecondaryVercel && !pathname.startsWith('/_next/') && !pathname.includes('.')) {
     return applySecurityHeaders(new NextResponse(
       JSON.stringify({ error: '403 Forbidden', message: 'Direct Vercel access blocked.' }),
       { status: 403, headers: { 'content-type': 'application/json' } }
     ), pathname);
  }

  // ---------------------------------------------------------
  // 2. RATE LIMITING (APIs Only)
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
    
    // In-memory update
    rateLimitMap.set(ip, countData);

    // Block if > 50 requests per minute from same IP to API
    if (countData.count > 50) {
      return applySecurityHeaders(NextResponse.json({ error: 'Too many requests. Rate limit exceeded.' }, { status: 429 }), pathname);
    }
  }

  // ── বাইপাস: Webmaa নিজের ডোমেইন বা localhost ──────────────────────────
  if (!host || isBypassHost(host)) {
    return applySecurityHeaders(NextResponse.next(), pathname);
  }

  // ── /shop/* পাথ আসলে আর domain lookup লাগবে না ──────────────────────
  // যেমন webmaa.vercel.app/shop/messerbazar → সরাসরি পার হয়
  if (
    pathname.startsWith('/shop/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots') ||
    pathname.startsWith('/sitemap') ||
    pathname.startsWith('/sw.') ||
    pathname.startsWith('/manifest') ||
    pathname.startsWith('/not-found-domain') ||
    pathname.startsWith('/icons/')
  ) {
    return applySecurityHeaders(NextResponse.next(), pathname);
  }

  // ── কাস্টম ডোমেইন: Firestore থেকে slug খোঁজা ──────────────────────────
  try {
    // Internal API call — domain → shop slug রেজোলিউশন
    const lookupUrl = new URL('/api/domain-lookup', request.url);
    lookupUrl.searchParams.set('host', host);

    const lookupResponse = await fetch(lookupUrl.toString(), {
      method: 'GET',
      headers: {
        // Internal security token — বাইরে থেকে এই API call করা যাবে না
        'x-internal-token': process.env.INTERNAL_PROXY_SECRET ?? '',
      },
      // Edge-এ cache করা যাবে — একই domain বারবার hit করলে fast হবে
      next: { revalidate: 60 }, // 60 সেকেন্ড cache
    });

    if (lookupResponse.ok) {
      const data = await lookupResponse.json();

      if (data.slug) {
        // ✅ ডোমেইন পাওয়া গেছে — /shop/[slug] এ rewrite করো
        const rewriteUrl = new URL(
          `/shop/${data.slug}${pathname === '/' ? '' : pathname}`,
          request.url
        );

        // query string ঠিক রাখো (যদি থাকে)
        rewriteUrl.search = request.nextUrl.search;

        return applySecurityHeaders(NextResponse.rewrite(rewriteUrl), pathname);
      }
    }

    // ❌ ডোমেইন পাওয়া যায়নি — কাস্টম not-found পেজ দেখাও
    const notFoundUrl = new URL('/not-found-domain', request.url);
    return applySecurityHeaders(NextResponse.rewrite(notFoundUrl), pathname);
  } catch (err) {
    // Network বা অন্য error — graceful fallback
    console.error('[proxy] domain lookup failed:', err);
    const notFoundUrl = new URL('/not-found-domain', request.url);
    return applySecurityHeaders(NextResponse.rewrite(notFoundUrl), pathname);
  }
}

// ── Matcher Config ──────────────────────────────────────────────────────────
// এই pattern-এর বাইরের path-এ proxy একদম চলবে না (performance)
export const config = {
  matcher: [
    /*
     * সব path-এ চলবে, শুধু বাদ দেওয়া হবে:
     * - _next/static  (static assets)
     * - _next/image   (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml
     */
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|icons/).*)',
  ],
};
