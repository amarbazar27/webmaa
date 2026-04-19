/**
 * /api/domain-lookup/route.js
 *
 * Internal API — proxy.ts এই route কে call করে কাস্টম ডোমেইন resolve করতে।
 * এটা public API না। x-internal-token দিয়ে protect করা আছে।
 *
 * Request:  GET /api/domain-lookup?host=messerbazar.com
 * Response: { slug: "messerbazar" } অথবা { error: "not_found" }
 */

import { NextResponse } from 'next/server';
import { getShopByDomain } from '@/lib/firestore';

export const dynamic = 'force-dynamic'; // cache করব না, সবসময় fresh data

export async function GET(request) {
  // ── Security Check ──────────────────────────────────────────────────────
  // শুধু proxy.ts থেকে আসা request গ্রহণ করব
  const internalToken = request.headers.get('x-internal-token');
  const expectedToken = process.env.INTERNAL_PROXY_SECRET;

  if (!expectedToken || internalToken !== expectedToken) {
    return NextResponse.json(
      { error: 'unauthorized' },
      { status: 401 }
    );
  }

  // ── Host Parameter ──────────────────────────────────────────────────────
  const { searchParams } = new URL(request.url);
  const host = searchParams.get('host');

  if (!host) {
    return NextResponse.json(
      { error: 'host parameter required' },
      { status: 400 }
    );
  }

  // ── Firestore Lookup ────────────────────────────────────────────────────
  try {
    // getShopByDomain ইতিমধ্যে lowercase + trim করে — src/lib/firestore.js থেকে
    const shop = await getShopByDomain(host);

    if (!shop) {
      return NextResponse.json(
        { error: 'not_found' },
        { status: 404 }
      );
    }

    // shop.subdomainSlug হলো /shop/[shopSlug] এর slug
    const slug = shop.subdomainSlug || shop.shopSlug || shop.id;

    return NextResponse.json(
      { slug },
      {
        status: 200,
        headers: {
          // proxy layer-এ 60 সেকেন্ড cache — বারবার Firestore hit কমাবে
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
      }
    );
  } catch (error) {
    console.error('[domain-lookup] Firestore error:', error);
    return NextResponse.json(
      { error: 'internal_error' },
      { status: 500 }
    );
  }
}
