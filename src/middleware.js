import { NextResponse } from 'next/server';

// Simple in-memory rate limiter for Edge. 
// Note: This provides per-isolate rate limiting which mitigates basic flooding.
const rateLimitMap = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 min window
  const maxReq = 50; // Max 50 requests per minute per IP to APIs

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, time: now });
    return false;
  }
  
  const data = rateLimitMap.get(ip);
  if (now - data.time > windowMs) {
    rateLimitMap.set(ip, { count: 1, time: now });
    return false;
  }
  
  if (data.count >= maxReq) return true;
  data.count++;
  return false;
}

export function middleware(req) {
  const url = req.nextUrl.clone();
  const response = NextResponse.next();
  // Ensure we get the real IP if routed via Cloudflare
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'unknown';

  // ---------------------------------------------------------
  // 1. FREE-TIER ORIGIN PROTECTION (Block Direct Vercel Traffic)
  // ---------------------------------------------------------
  const rawHost = req.headers.get('host') || '';
  // Normalize: remove www., ports, and protocol-like strings
  const host = rawHost.toLowerCase().trim().replace(/^www\./i, '').split(':')[0];
  
  const isVercelDomain = host.includes('vercel.app');
  const isBackupDomain = host === 'webmaa-backup.vercel.app';

  // We explicitly block requests that bypass the custom domain and try to 
  // hit the raw .vercel.app domain directly.
  // Exception: Allow the primary platform domain and the designated backup domain.
  if (isVercelDomain && host !== 'webmaa.vercel.app' && !isBackupDomain && !url.pathname.startsWith('/_next/') && !url.pathname.includes('.')) {
    console.warn(`[Security] Blocked direct Vercel access attempt for host: ${host}`);
    return new NextResponse(
      JSON.stringify({ 
        error: '403 Forbidden', 
        message: 'Direct Vercel access is disabled. Please use the official domain (messerbazar.com or webmaa-backup.vercel.app).' 
      }),
      { status: 403, headers: { 'content-type': 'application/json' } }
    );
  }

  // ---------------------------------------------------------
  // 2. ADMIN PANEL PROTECTION & CLOAKING
  // ---------------------------------------------------------
  if (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/superadmin')) {
    // Hide from search engines to prevent discovering private admin interfaces
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, nosnippet, noarchive');
    
    // Strict IP Whitelisting for Root Superadmin (Optional)
    const whitelistVar = process.env.ADMIN_IP_WHITELIST;
    if (url.pathname.startsWith('/superadmin') && whitelistVar) {
      const allowedIps = whitelistVar.split(',').map(allowedIp => allowedIp.trim());
      if (!allowedIps.includes(ip)) {
        console.warn(`Unauthorized Admin IP Attempt: ${ip}`);
        return new NextResponse("403 Forbidden: Administrator access restricted by IP.", { status: 403 });
      }
    }
  }

  // ---------------------------------------------------------
  // 3. SECURE API ROUTING & RATE LIMITING
  // ---------------------------------------------------------
  if (url.pathname.startsWith('/api/')) {
    // Exclude healthcheck from limits to ensure monitoring bots don't fail
    if (url.pathname !== '/api/health') {
      if (isRateLimited(ip)) {
        return NextResponse.json({ error: 'Too many requests. Rate limit exceeded.' }, { status: 429 });
      }
    }
    
    // Origin Verification (Ensure API isn't called from third-party websites maliciously)
    const origin = req.headers.get('origin') || req.headers.get('referer') || '';
    const apiToken = req.headers.get('x-api-key');
    const isServerAuth = apiToken && apiToken === process.env.API_SECRET_KEY;
    
    // If not authenticated via server token, check origin strictly for sensitive routes
    if (!isServerAuth && origin && !origin.includes('messerbazar.com') && !origin.includes('localhost') && !origin.includes('webmaa')) {
       console.warn(`Suspicious cross-origin API call blocked from ${origin} to ${url.pathname}`);
       return NextResponse.json({ error: 'Invalid Origin Identifier' }, { status: 403 });
    }
    
    // Security Headers on API Responses
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images in public etc
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
