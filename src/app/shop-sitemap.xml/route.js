import { getShopByDomainServer, getAllShopsServer } from '@/lib/server-fetch';
import { getCachedSitemapXml } from '@/lib/sitemap-cache';

export const revalidate = 604800; // 7 days

const BYPASS_HOSTS = ['webmaa.vercel.app', 'daripallah.com', 'bdretailers.com', 'freeappweb.com', 'localhost', '127.0.0.1'];

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
  const isRetailer = !isMainSiteHost(host);

  // ⚡ 2-Tier Persistent Sitemap Cache: 0 reads on warm lambda, 1 read on serverless cold start!
  const xml = await getCachedSitemapXml(host, 'shop', async () => {
    let xmlItems = '';
    try {
      if (isRetailer) {
        const shop = await getShopByDomainServer(host);
        if (shop && shop.isActive !== false) {
          xmlItems += `  <url>\n    <loc>${baseUrl}</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
        }
      } else {
        const shops = await getAllShopsServer() || [];
        const activeShops = (shops || []).filter(shop => {
          const isTest = shop.shopSlug === 'test' || shop.subdomainSlug === 'test' || shop.shopName?.toLowerCase() === 'test';
          return shop.isActive !== false && shop.showOnMainSite !== false && (!isTest || shop.showOnMainSite === true);
        });

        xmlItems += `  <url>\n    <loc>${baseUrl}</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

        const staticPages = ['/showcase', '/become-retailer', '/privacy-policy', '/terms'];
        staticPages.forEach((p) => {
          xmlItems += `  <url>\n    <loc>${baseUrl}${p}</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
        });

        activeShops.forEach((shop) => {
          const slug = shop.subdomainSlug || shop.shopSlug;
          if (!slug) return;
          const shopUrl = `${baseUrl}/shop/${slug}`;
          xmlItems += `  <url>\n    <loc>${escapeXml(shopUrl)}</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
        });
      }
    } catch (error) {
      console.error("Shop Sitemap Generation Error:", error);
    }

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlItems}</urlset>`;
  });

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=604800, s-maxage=604800, stale-while-revalidate=2592000',
      'CDN-Cache-Control': 'public, max-age=604800',
      'Vercel-CDN-Cache-Control': 'public, max-age=604800',
      'Cloudflare-CDN-Cache-Control': 'public, max-age=604800',
    },
  });
}
