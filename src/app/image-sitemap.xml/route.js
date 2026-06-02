import { getAllMarketplaceProducts } from '@/lib/firestore';

export const dynamic = 'force-dynamic';

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

export async function GET() {
  const baseUrl = 'https://daripallah.com';
  let xmlItems = '';

  try {
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
