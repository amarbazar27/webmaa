import { getAllShops } from '@/lib/firestore';
import { getShopByDomainServer } from '@/lib/server-fetch';

export const dynamic = 'force-dynamic';

const BYPASS_HOSTS = ['webmaa.vercel.app', 'daripallah.com', 'bdretailers.com', 'localhost', '127.0.0.1'];

function isMainSiteHost(host) {
  if (!host) return true;
  const h = host.toLowerCase().trim().replace(/^www\./i, '').split(':')[0];
  return BYPASS_HOSTS.includes(h);
}

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe.toString().replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export async function GET(request) {
  const host = request.headers.get('host') || 'bdretailers.com';
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;
  let xmlItems = '';

  const isRetailer = !isMainSiteHost(host);

  try {
    if (isRetailer) {
      const shop = await getShopByDomainServer(host);
      if (shop && shop.isActive !== false) {
        // Retailer's own sitemap only contains their home URL
        xmlItems += `  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>\n`;
      }
    } else {
      // Main site sitemap lists main site home and all active shops
      const shops = await getAllShops();
      const activeShops = shops.filter(shop => shop.isActive !== false && shop.showOnMainSite !== false);

      xmlItems += `  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>\n`;

      activeShops.forEach((shop) => {
        const slug = shop.subdomainSlug || shop.shopSlug;
        if (!slug) return;
        const shopUrl = `${baseUrl}/shop/${slug}`;
        const escapedUrl = escapeXml(shopUrl);
        xmlItems += `  <url>
    <loc>${escapedUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>\n`;
      });
    }
  } catch (error) {
    console.error("Shop Sitemap Generation Error:", error);
    xmlItems += `  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>\n`;
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlItems}</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=18000',
    },
  });
}
