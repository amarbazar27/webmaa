import { NextResponse } from 'next/server';

// Simplistic Edge in-memory store for rate limiting (Note: in serverless, this drops across instances, 
// but it's effective against basic spam per immediate edge function invocation)
const rateLimitMap = new Map();

export function middleware(req) {
  const ip = req.headers.get('x-forwarded-for') || req.ip || '127.0.0.1';
  const url = req.nextUrl.pathname;
  
  // ── RATE LIMITING (APIs Only) ──
  if (url.startsWith('/api/')) {
    const windowStart = Date.now() - 60000; // 1 min window
    const requestData = rateLimitMap.get(ip) || { count: 0, startTime: Date.now() };

    if (requestData.startTime < windowStart) {
      requestData.count = 1;
      requestData.startTime = Date.now();
    } else {
      requestData.count++;
    }
    
    rateLimitMap.set(ip, requestData);

    // Block if > 30 requests per minute from same IP to API
    if (requestData.count > 30) {
      return NextResponse.json({ error: 'Too many requests, slow down.' }, { status: 429 });
    }
  }

  // ── SECURITY HEADERS ──
  // Next.js standard headers mapping
  const response = NextResponse.next();

  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Prevent indexing of API routes
  if (url.startsWith('/api/')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, nosnippet, noarchive');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
