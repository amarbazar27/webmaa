/**
 * /api/domain-lookup/route.js
 *
 * Domain-to-Store Slug Resolution API
 * Used by proxy.ts (Edge Middleware) and client recovery in not-found-domain.
 *
 * Public routing lookup — resolves a domain (e.g. camerakini.com) to its store slug (e.g. camerakini1-600).
 * High reliability: Prioritizes Firebase Admin SDK and never blocks valid shop traffic.
 */

import { NextResponse } from 'next/server';
import { getShopByDomain } from '@/lib/firestore-server';

export async function GET(request) {
  // ── Host Parameter ──────────────────────────────────────────────────────
  const { searchParams } = new URL(request.url);
  const host = searchParams.get('host');

  if (!host) {
    return NextResponse.json(
      { error: 'host parameter required' },
      { status: 400 }
    );
  }

  // ── Host Sanitization ───────────────────────────────────────────────────
  const cleanHost = String(host).toLowerCase().trim().replace(/[^a-z0-9.\-_:]/g, '').slice(0, 100);

  // ── Firestore Lookup (Admin SDK first) ───────────────────────────────────
  try {
    const shop = await getShopByDomain(cleanHost);

    if (!shop) {
      return NextResponse.json(
        { error: 'not_found' },
        { status: 404 }
      );
    }

    // shop.subdomainSlug or shopSlug or document id
    const slug = shop.subdomainSlug || shop.shopSlug || shop.id;

    return NextResponse.json(
      { slug },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
        },
      }
    );
  } catch (error) {
    console.error('[domain-lookup] Error resolving host:', error);
    return NextResponse.json(
      { error: 'internal_error' },
      { status: 500 }
    );
  }
}
