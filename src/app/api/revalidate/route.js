import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { invalidateShopCache } from '@/lib/server-fetch';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const domain = searchParams.get('domain');
    const shopId = searchParams.get('shopId');
    const secret = searchParams.get('secret');

    // RED-4: Require revalidation secret to prevent DoS via cache purge abuse
    const expectedSecret = process.env.REVALIDATION_SECRET || '';
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }

    if (slug || shopId) {
      await invalidateShopCache(shopId, slug);
    }

    if (slug) {
      revalidatePath(`/shop/${slug}`);
      revalidatePath(`/shop/${slug}/order/[orderId]`, 'layout');
    }
    if (domain) {
      revalidatePath(`/domain/${domain}`);
      revalidatePath(`/domain/${domain}/order/[orderId]`, 'layout');
    }

    return NextResponse.json({ 
      revalidated: true, 
      slug, 
      domain, 
      timestamp: Date.now() 
    });
  } catch (err) {
    console.error('[Revalidate API] Error:', err);
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 });
  }
}
