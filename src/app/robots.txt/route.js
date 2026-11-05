export const dynamic = 'force-dynamic';

export async function GET(request) {
  const host = request.headers.get('host') || 'bdretailers.com';
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  const sitemapUrl = `${protocol}://${host}/sitemap.xml`;

  const txt = `User-agent: *
Allow: /
Allow: /api/manifest
Disallow: /dashboard/
Disallow: /api/
Disallow: /superadmin/
Disallow: /admin/
Disallow: /login
Disallow: /register
Disallow: /checkout
Disallow: /cart
Disallow: /profile
Disallow: /orders
Disallow: /account-delete
Disallow: /test-auth
Disallow: /store
Crawl-delay: 5

# Explicitly Allow AI Search Engines for Generative Engine Optimization (GEO)
User-agent: GPTBot
Allow: /
Crawl-delay: 10

User-agent: ChatGPT-User
Allow: /
Crawl-delay: 10

User-agent: ClaudeBot
Allow: /
Crawl-delay: 10

User-agent: Claude-Web
Allow: /
Crawl-delay: 10

User-agent: PerplexityBot
Allow: /
Crawl-delay: 10

User-agent: Google-Extended
Allow: /

User-agent: GoogleOther
Allow: /
Crawl-delay: 10

User-agent: Applebot-Extended
Allow: /

# Block SEO scrapers & aggressive bots — protect Firestore read budget
User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: DotBot
Disallow: /

User-agent: BLEXBot
Disallow: /

User-agent: DataForSeoBot
Disallow: /

User-agent: serpstatbot
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: PetalBot
Disallow: /

User-agent: YandexBot
Disallow: /

User-agent: BaiduSpider
Disallow: /

User-agent: Sogou
Disallow: /

User-agent: zoominfobot
Disallow: /

Sitemap: ${sitemapUrl}
`;

  return new Response(txt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800',
    },
  });
}
