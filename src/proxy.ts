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
  const host = normalizeHost(rawHost);

  // ── বাইপাস: Webmaa নিজের ডোমেইন বা localhost ──────────────────────────
  if (!host || isBypassHost(host)) {
    return NextResponse.next();
  }

  // ── /shop/* পাথ আসলে আর domain lookup লাগবে না ──────────────────────
  // যেমন webmaa.vercel.app/shop/messerbazar → সরাসরি পার হয়
  const { pathname } = request.nextUrl;
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
    return NextResponse.next();
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

        return NextResponse.rewrite(rewriteUrl);
      }
    }

    // ❌ ডোমেইন পাওয়া যায়নি — কাস্টম not-found পেজ দেখাও
    const notFoundUrl = new URL('/not-found-domain', request.url);
    return NextResponse.rewrite(notFoundUrl);
  } catch (err) {
    // Network বা অন্য error — graceful fallback
    console.error('[proxy] domain lookup failed:', err);
    const notFoundUrl = new URL('/not-found-domain', request.url);
    return NextResponse.rewrite(notFoundUrl);
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
