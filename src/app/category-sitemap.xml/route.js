import { getShopByDomainServer, getCategoriesServer, getAllShopsServer } from '@/lib/server-fetch';
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
  const xml = await getCachedSitemapXml(host, 'category', async () => {
    let xmlItems = '';
    try {
      if (isRetailer) {
        const shop = await getShopByDomainServer(host);
        if (shop) {
          // ⚡ Reads categories subcollection (5-10 docs) instead of scanning thousands of products!
          const categories = await getCategoriesServer(shop.id);
          (categories || []).forEach((cat) => {
            const catName = cat.name || cat.id;
            if (!catName) return;
            const url = `${baseUrl}/?category=${encodeURIComponent(catName)}`;
            xmlItems += `  <url>\n    <loc>${escapeXml(url)}</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
          });
        }
      } else {
        // Main platform category index: aggregate shop categories (0 product scans)
        const shops = await getAllShopsServer();
        const activeShops = (shops || []).filter(s => s.isActive !== false && s.showOnMainSite !== false);
        const allCatArrays = await Promise.all(
          activeShops.map(s => getCategoriesServer(s.id))
        );
        const uniqueNames = Array.from(new Set(allCatArrays.flat().map(c => c.name || c.id).filter(Boolean)));
        uniqueNames.forEach((name) => {
          const url = `${baseUrl}/showcase?category=${encodeURIComponent(name)}`;
          xmlItems += `  <url>\n    <loc>${escapeXml(url)}</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
        });
      }
    } catch (error) {
      console.error("Category Sitemap Generation Error:", error);
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
