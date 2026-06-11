import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const domain = searchParams.get('domain');

    console.log(`[Revalidate API] Requested revalidation for slug: ${slug}, domain: ${domain}`);

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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
