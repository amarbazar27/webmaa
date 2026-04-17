import { NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

export function middleware(req) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // Define allowed domains (including localhost for testing)
  const mainDomain = 'webmaa.pro.bd';
  const vercelDomain = 'webmaa.vercel.app';
  
  // Exclude main domains and localhost from automatic subdomain routing
  if (
    hostname.includes('localhost') ||
    hostname === mainDomain ||
    hostname === `www.${mainDomain}` ||
    hostname === vercelDomain
  ) {
    return NextResponse.next();
  }

  // Extract subdomain (e.g., 'rahim' from 'rahim.webmaa.pro.bd')
  // This simplistic approach assumes subdomain is the first part for custom hosts
  const isWebmaaDomain = hostname.endsWith(`.${mainDomain}`);
  let subdomain = null;
  
  if (isWebmaaDomain) {
    subdomain = hostname.replace(`.${mainDomain}`, '');
  }

  // If a subdomain exists and we're not already on a /shop/ path, rewrite!
  if (subdomain && subdomain !== 'www' && !url.pathname.startsWith('/shop/')) {
    // Rewrite rahim.webmaa.pro.bd/products -> /shop/rahim/products
    url.pathname = `/shop/${subdomain}${url.pathname === '/' ? '' : url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}
