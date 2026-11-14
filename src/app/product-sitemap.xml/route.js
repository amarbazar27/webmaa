import { getShopByDomainServer, getProductsServer, getAllMarketplaceProductsServer } from '@/lib/server-fetch';
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
  const xml = await getCachedSitemapXml(host, 'product', async () => {
    let xmlItems = '';
    try {
      if (isRetailer) {
        const shop = await getShopByDomainServer(host);
        if (shop) {
          const products = await getProductsServer(shop.id);
          const activeProducts = (products || []).filter(p => p.stock !== 0);

          activeProducts.forEach((prod) => {
            const prodId = prod.id;
            if (!prodId) return;

            const productUrl = `${baseUrl}/product/${prodId}`;
            xmlItems += `  <url>\n    <loc>${escapeXml(productUrl)}</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
          });
        }
      } else {
        // Main site sitemap: only index active marketplace products (excluding custom domains to prevent canonical conflicts)
        const products = await getAllMarketplaceProductsServer() || [];
        const activeProducts = (products || []).filter(p => p.stock !== 0 && !p.customDomain);

        activeProducts.forEach((prod) => {
          const shopSlug = prod.shopSlug || 'daripallah-store';
          const prodId = prod.id;
          if (!prodId) return;

          const productUrl = `${baseUrl}/shop/${shopSlug}/product/${prodId}`;
          xmlItems += `  <url>\n    <loc>${escapeXml(productUrl)}</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
        });
      }
    } catch (error) {
      console.error("Product Sitemap Generation Error:", error);
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
