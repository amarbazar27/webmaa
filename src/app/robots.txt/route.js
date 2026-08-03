export const dynamic = 'force-dynamic';

export async function GET(request) {
  const host = request.headers.get('host') || 'bdretailers.com';
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  const sitemapUrl = `${protocol}://${host}/sitemap.xml`;

  const txt = `User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /api/
Disallow: /superadmin/

# Explicitly Allow AI Search Engines for Generative Engine Optimization (GEO)
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: GoogleOther
Allow: /

User-agent: Applebot-Extended
Allow: /

Sitemap: ${sitemapUrl}
`;

  return new Response(txt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=18000',
    },
  });
}
