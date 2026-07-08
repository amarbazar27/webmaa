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
  // PEN-C1 Fix: Token check is now BLOCKING — rejects unauthorized requests
  const internalToken = request.headers.get('x-internal-token');
  const secretKey = process.env.INTERNAL_PROXY_SECRET || '';
  
  if (secretKey && internalToken !== secretKey) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
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
    // PEN-H1: Removed debug log that leaked host parameter
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
