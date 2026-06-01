import { getAllShops, getAllMarketplaceProducts } from '@/lib/firestore';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://daripallah.com';

  try {
    const [shops, products] = await Promise.all([
      getAllShops(),
      getAllMarketplaceProducts()
    ]);

    const activeShops = shops.filter(shop => shop.isActive !== false);

    // 1. Merchant Shopfront Sitemaps
    const shopSitemaps = activeShops.map((shop) => ({
      url: `${baseUrl}/shop/${shop.subdomainSlug || shop.shopSlug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }));

    // 2. Individual Product Sitemaps
    const productSitemaps = products.map((prod) => ({
      url: `${baseUrl}/shop/${prod.shopSlug || 'daripallah-store'}/product/${prod.id}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    }));

    // 3. Dynamic Category Sitemaps
    const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    const categorySitemaps = uniqueCategories.map((cat) => ({
      url: `${baseUrl}/?category=${encodeURIComponent(cat)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    // 4. Dynamic Subcategory Sitemaps
    const uniqueSubcategories = Array.from(
      new Set(
        products.map(p => p.category && p.subcategory ? `${p.category}|||${p.subcategory}` : null).filter(Boolean)
      )
    );
    const subcategorySitemaps = uniqueSubcategories.map((subCombo) => {
      const [cat, subcat] = subCombo.split('|||');
      return {
        url: `${baseUrl}/?category=${encodeURIComponent(cat)}&subcategory=${encodeURIComponent(subcat)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.5,
      };
    });

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 1.0,
      },
      ...shopSitemaps,
      ...productSitemaps,
      ...categorySitemaps,
      ...subcategorySitemaps
    ];
  } catch (error) {
    console.error("Dynamic Sitemap Generation Error:", error);
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 1.0,
      }
    ];
  }
}
