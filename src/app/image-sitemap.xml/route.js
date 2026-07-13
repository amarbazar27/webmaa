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
        const activeProducts = products.filter(p => p.stock !== 0 && p.imageUrl);

        activeProducts.forEach((prod) => {
          const prodId = prod.id;
          const imageUrl = prod.imageUrl;
          const prodName = prod.name;
          if (!prodId || !imageUrl) return;

          // For custom domains, product link is /product/[productId]
          const productUrl = `${baseUrl}/product/${prodId}`;
          const escapedUrl = escapeXml(productUrl);
          const escapedImage = escapeXml(imageUrl);
          const escapedTitle = escapeXml(prodName);

          xmlItems += `  <url>
    <loc>${escapedUrl}</loc>
    <image:image>
      <image:loc>${escapedImage}</image:loc>
      <image:title>${escapedTitle}</image:title>
    </image:image>
  </url>\n`;
        });
      }
    } else {
      // Main site image sitemap lists all products from all shops
      const products = await getAllMarketplaceProducts();
      const activeProducts = products.filter(p => p.stock !== 0 && p.imageUrl);

      activeProducts.forEach((prod) => {
        const shopSlug = prod.shopSlug || 'daripallah-store';
        const prodId = prod.id;
        const imageUrl = prod.imageUrl;
        const prodName = prod.name;
        if (!prodId || !imageUrl) return;

        const productUrl = `${baseUrl}/shop/${shopSlug}/product/${prodId}`;
        const escapedUrl = escapeXml(productUrl);
        const escapedImage = escapeXml(imageUrl);
        const escapedTitle = escapeXml(prodName);

        xmlItems += `  <url>
    <loc>${escapedUrl}</loc>
    <image:image>
      <image:loc>${escapedImage}</image:loc>
      <image:title>${escapedTitle}</image:title>
    </image:image>
  </url>\n`;
      });
    }
  } catch (error) {
    console.error("Image Sitemap Generation Error:", error);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${xmlItems}</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=18000',
    },
  });
}
