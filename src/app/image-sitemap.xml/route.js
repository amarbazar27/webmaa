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
  const xml = await getCachedSitemapXml(host, 'image', async () => {
    let xmlItems = '';
    try {
      if (isRetailer) {
        const shop = await getShopByDomainServer(host);
        if (shop) {
          const products = await getProductsServer(shop.id);
          const activeProducts = (products || []).filter(p => p.stock !== 0 && p.imageUrl);

          activeProducts.forEach((prod) => {
            const prodId = prod.id;
            const imageUrl = prod.imageUrl;
            const prodName = prod.name;
            if (!prodId || !imageUrl) return;

            const productUrl = `${baseUrl}/product/${prodId}`;
            xmlItems += `  <url>\n    <loc>${escapeXml(productUrl)}</loc>\n    <image:image>\n      <image:loc>${escapeXml(imageUrl)}</image:loc>\n      <image:title>${escapeXml(prodName || '')}</image:title>\n    </image:image>\n  </url>\n`;
          });
        }
      } else {
        const products = await getAllMarketplaceProductsServer() || [];
        const activeProducts = (products || []).filter(p => p.stock !== 0 && p.imageUrl && !p.customDomain);

        activeProducts.forEach((prod) => {
          const shopSlug = prod.shopSlug || 'daripallah-store';
          const prodId = prod.id;
          const imageUrl = prod.imageUrl;
          const prodName = prod.name;
          if (!prodId || !imageUrl) return;

          const productUrl = `${baseUrl}/shop/${shopSlug}/product/${prodId}`;
          xmlItems += `  <url>\n    <loc>${escapeXml(productUrl)}</loc>\n    <image:image>\n      <image:loc>${escapeXml(imageUrl)}</image:loc>\n      <image:title>${escapeXml(prodName || '')}</image:title>\n    </image:image>\n  </url>\n`;
        });
      }
    } catch (error) {
      console.error("Image Sitemap Generation Error:", error);
    }

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${xmlItems}</urlset>`;
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
