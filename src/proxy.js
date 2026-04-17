import { NextResponse } from 'next/server';

export function proxy(request) {
  const response = NextResponse.next();
  const url = request.nextUrl;

  // Basic API Security (CSRF / Bot check)
  if (url.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host') || '';
    const userAgent = request.headers.get('user-agent') || '';

    // Block completely empty User-Agents (often simple bots/scrapers)
    if (!userAgent) {
      return new NextResponse('Forbidden: Invalid User-Agent', { status: 403 });
    }

    // Origin checking: In production, ensure it comes from your platform domains.
    // We allow localhost for development.
    if (origin) {
      const allowedOrigins = ['localhost', 'webmaa.vercel.app', process.env.NEXT_PUBLIC_SITE_URL || ''];
      const isAllowed = allowedOrigins.some(allowed => origin.includes(allowed));
      
      if (!isAllowed) {
         // Return basic 403 but structured as JSON since it's an API
         return NextResponse.json({ error: "Forbidden: Cross-Origin Request Blocked" }, { status: 403 });
      }
    }
  }

  // Add extra security headers dynamically
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  
  // ── Custom Domain Routing ────────────────────────────────────────────────
  // Note: *.vercel.app wildcard is NOT supported on Vercel's shared domain.
  // Free stores use /shop/[slug] paths which work without any subdomain magic.
  // This block ONLY handles external custom domains like rahimshop.com.
  const hostname = request.headers.get('host') || '';
  const mainDomain = 'webmaa.pro.bd';
  const vercelDomain = 'webmaa.vercel.app';

  const isKnownPlatformHost =
    hostname.includes('localhost') ||
    hostname === mainDomain ||
    hostname === `www.${mainDomain}` ||
    hostname === vercelDomain ||
    hostname.endsWith(`.vercel.app`); // covers preview deployments like xxx.vercel.app

  if (!isKnownPlatformHost) {
    // Must be a retailer's own custom domain — rewrite to our /domain/[host] handler
    if (!url.pathname.startsWith('/domain/') && !url.pathname.startsWith('/_next')) {
      const encodedHost = encodeURIComponent(hostname);
      url.pathname = `/domain/${encodedHost}${url.pathname === '/' ? '' : url.pathname}`;
      const rewriteResponse = NextResponse.rewrite(url);
      rewriteResponse.headers.set('X-XSS-Protection', '1; mode=block');
      rewriteResponse.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
      return rewriteResponse;
    }
  }

  return response;
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (public images)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
