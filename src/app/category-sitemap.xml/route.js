// ⚡ In-memory sitemap cache (eliminates thousands of Firestore reads per day from search engine crawlers)
const sitemapCacheMap = new Map();
import { getAllMarketplaceProducts } from '@/lib/firestore';
import { getShopByDomainServer, getProductsServer, getAllMarketplaceProductsServer } from '@/lib/server-fetch';

export const revalidate = 2592000;

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
  const cachedSitemap = sitemapCacheMap.get(host);
  if (cachedSitemap && Date.now() < cachedSitemap.expiresAt) {
    return new Response(cachedSitemap.xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=2592000',
      },
    });
  }

  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;
  let xmlItems = '';

  const isRetailer = !isMainSiteHost(host);

  try {
    let products = [];
    if (isRetailer) {
      const shop = await getShopByDomainServer(host);
      if (shop) {
        products = await getProductsServer(shop.id);
      }
    } else {
      products = await getAllMarketplaceProductsServer();
      if (!products || products.length === 0) {
        products = await getAllMarketplaceProducts();
      }
    }

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

  sitemapCacheMap.set(host, { xml, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 });
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=2592000',
    },
  });
}
