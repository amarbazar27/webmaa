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

    // Unique Categories
    const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    uniqueCategories.forEach((cat) => {
      const url = `${baseUrl}/?category=${encodeURIComponent(cat)}`;
      const escapedUrl = escapeXml(url);
      xmlItems += `  <url>
    <loc>${escapedUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>\n`;
    });

    // Unique Subcategories
    const uniqueSubcombo = Array.from(
      new Set(
        products.map(p => p.category && p.subcategory ? `${p.category}|||${p.subcategory}` : null).filter(Boolean)
      )
    );

    uniqueSubcombo.forEach((combo) => {
      const [cat, subcat] = combo.split('|||');
      // Crucial: escape literal '&' in xml to '&amp;'
      const url = `${baseUrl}/?category=${encodeURIComponent(cat)}&subcategory=${encodeURIComponent(subcat)}`;
      const escapedUrl = escapeXml(url);
      xmlItems += `  <url>
    <loc>${escapedUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>\n`;
    });
  } catch (error) {
    console.error("Category Sitemap Generation Error:", error);
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
