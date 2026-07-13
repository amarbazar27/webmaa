import { getAllMarketplaceProducts } from '@/lib/firestore';
import { getShopByDomainServer, getProductsServer } from '@/lib/server-fetch';

export const dynamic = 'force-dynamic';

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
  let xmlItems = '';

  const isRetailer = !isMainSiteHost(host);

  try {
    if (isRetailer) {
      const shop = await getShopByDomainServer(host);
      if (shop) {
        // Query products for this retailer shop only
        const products = await getProductsServer(shop.id);
        const activeProducts = products.filter(p => p.stock !== 0);

        activeProducts.forEach((prod) => {
          const prodId = prod.id;
          if (!prodId) return;

          // For custom domains, product link is /product/[productId]
          const productUrl = `${baseUrl}/product/${prodId}`;
          const escapedUrl = escapeXml(productUrl);

          xmlItems += `  <url>
    <loc>${escapedUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>\n`;
        });
      }
    } else {
      // Main site product sitemap lists all products from all shops
      const products = await getAllMarketplaceProducts();
      const activeProducts = products.filter(p => p.stock !== 0);

      activeProducts.forEach((prod) => {
        const shopSlug = prod.shopSlug || 'daripallah-store';
        const prodId = prod.id;
        if (!prodId) return;

        const productUrl = `${baseUrl}/shop/${shopSlug}/product/${prodId}`;
        const escapedUrl = escapeXml(productUrl);

        xmlItems += `  <url>
    <loc>${escapedUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>\n`;
      });
    }
  } catch (error) {
    console.error("Product Sitemap Generation Error:", error);
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
