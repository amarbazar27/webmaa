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

  // ── বাইপাস: Webmaa নিজের ডোমেইন বা localhost ──────────────────────────
  if (!host || isBypassHost(host)) {
    return applySecurityHeaders(NextResponse.next(), pathname);
  }

  // ── এই পাথগুলো সরাসরি পার হবে — domain lookup লাগবে না ──────────────
  if (
    pathname.startsWith('/shop/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots') ||
    pathname.startsWith('/sitemap') ||
    pathname.startsWith('/sw.') ||
    pathname.startsWith('/manifest') ||
    pathname.startsWith('/not-found-domain') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/__/')
  ) {
    return applySecurityHeaders(NextResponse.next(), pathname);
  }

  // ── কাস্টম ডোমেইন: Firestore থেকে slug খোঁজা ──────────────────────────
  try {
    // Internal API call — domain → shop slug রেজোলিউশন
    // Use the primary platform domain to avoid edge routing loopback issues on custom domains
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://webmaa.vercel.app';
    const lookupUrl = new URL('/api/domain-lookup', baseUrl);
    lookupUrl.searchParams.set('host', host);

    console.log(`[Proxy] Calling domain-lookup for host=${host}`);

    const lookupResponse = await fetch(lookupUrl.toString(), {
      method: 'GET',
      headers: {
        // Internal security token
        'x-internal-token': process.env.INTERNAL_PROXY_SECRET ?? '',
      },
      next: { revalidate: 60 }, // 60 সেকেন্ড cache
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

        console.log(`[Proxy] Rewriting to ${rewriteUrl.toString()}`);
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
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|icons/).*)',
  ],
};
