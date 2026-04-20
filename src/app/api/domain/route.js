import { NextResponse } from 'next/server';
import { getShopByDomain } from '@/lib/firestore';
import { verifyAuth, AuthError } from '@/lib/verifyAuth';

// Validate that a string looks like a real domain (basic but effective)
function isValidDomain(domain) {
  return /^(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(\.[a-zA-Z]{2,})+$/.test(domain);
}

// ── POST /api/domain ─────────────────────────────────────────────────────────
// 🔐 Auth Required — শুধু শপের মালিক নিজের domain সেট করতে পারবে
export async function POST(req) {
  try {
    // ── Auth Verification ──────────────────────────────────────────────
    let authUser;
    try {
      authUser = await verifyAuth(req);
    } catch (err) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const body = await req.json();
    const { domain, shopId } = body;

    if (!domain || !shopId) {
      return NextResponse.json({ error: 'Domain and shopId are required.' }, { status: 400 });
    }

    // 🔐 Ownership check — শুধু নিজের শপে domain সেট করতে পারবে
    if (authUser.uid !== shopId) {
      return NextResponse.json({ error: 'You can only set domain for your own shop.' }, { status: 403 });
    }

    // 1. Format validation
    const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!isValidDomain(cleanDomain)) {
      return NextResponse.json({ error: 'Invalid domain format. Use something like: rahimshop.com' }, { status: 400 });
    }

    // 2. Duplicate check — ensure no other shop already has this domain
    const existingShop = await getShopByDomain(cleanDomain);
    if (existingShop && existingShop.id !== shopId) {
      return NextResponse.json({
        error: 'This domain is already linked to another store. Please choose a different domain.'
      }, { status: 409 });
    }

    // 3. Vercel API — register domain in the project (server-side only, token never exposed)
    const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
    const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
    const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

    if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
      // Token not configured yet — still succeed for DB save, just note it
      return NextResponse.json({
        success: true,
        status: 'pending_manual',
        message: 'Domain saved. Vercel API token not configured — please add the domain manually from your Vercel dashboard.',
        domain: cleanDomain
      });
    }

    let apiUrl = `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`;
    if (VERCEL_TEAM_ID) apiUrl += `?teamId=${VERCEL_TEAM_ID}`;

    const vercelRes = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: cleanDomain }),
    });

    const vercelData = await vercelRes.json();

    // Domain already exists in Vercel project — that's fine
    if (!vercelRes.ok && vercelData?.error?.code !== 'domain_already_in_use') {
      return NextResponse.json({
        success: false,
        error: vercelData?.error?.message || 'Vercel could not register the domain.',
        domain: cleanDomain
      }, { status: vercelRes.status });
    }

    return NextResponse.json({
      success: true,
      status: 'pending_dns', // Waiting for user to configure DNS records
      domain: cleanDomain,
      dnsRecords: [
        { type: 'A',     name: '@',   value: '76.76.21.21' },
        { type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com' },
      ]
    });

  } catch (error) {
    console.error('Domain API Error:', error);
    return NextResponse.json({ error: 'Server error registering domain.' }, { status: 500 });
  }
}

// ── GET /api/domain?domain=rahimshop.com ──────────────────────────────────────
// Called periodically from the retailer dashboard to check verification status.
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json({ error: 'domain query param required' }, { status: 400 });
    }

    const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
    const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
    const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

    if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
      return NextResponse.json({ status: 'unknown', message: 'Vercel API not configured.' });
    }

    let apiUrl = `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains/${encodeURIComponent(domain)}`;
    if (VERCEL_TEAM_ID) apiUrl += `?teamId=${VERCEL_TEAM_ID}`;

    const vercelRes = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${VERCEL_API_TOKEN}` },
      cache: 'no-store'
    });

    const data = await vercelRes.json();

    if (!vercelRes.ok) {
      return NextResponse.json({ status: 'not_registered' });
    }

    // Vercel returns verification[] array when DNS is not yet valid
    const isVerified = data.verified === true;
    return NextResponse.json({
      status: isVerified ? 'connected' : 'pending_dns',
      domain: data.name,
      verified: isVerified,
    });

  } catch (error) {
    console.error('Domain status check error:', error);
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
  }
}
