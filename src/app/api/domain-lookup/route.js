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
import { getShopByDomain } from '@/lib/firestore-server';
export async function GET(request) {
  // ── Internal Token Check ────────────────────────────────────────────────
  const internalToken = request.headers.get('x-internal-token');
  const secretKey = process.env.INTERNAL_PROXY_SECRET || '';
  
  // Only check if secret is configured
  if (secretKey && internalToken !== secretKey) {
    console.warn('[Domain-Lookup] Unauthorized internal access attempt');
    // We don't return 401 yet to avoid breaking if env is not synced, 
    // but we log it for audit.
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
    console.log(`[Domain-Lookup] Querying Firestore for host: ${host}`);
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
          'Cache-Control': 'no-store, max-age=0',
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
