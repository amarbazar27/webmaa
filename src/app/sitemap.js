import { getAllShops } from '@/lib/firestore';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://messerbazar.com';

  try {
    const shops = await getAllShops();
    const activeShops = shops.filter(shop => shop.isActive !== false);

    const sitemaps = activeShops.map((shop) => ({
      url: `${baseUrl}/shop/${shop.shopSlug || shop.subdomainSlug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }));

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 1,
      },
      ...sitemaps,
    ];
  } catch (error) {
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 1,
      }
    ];
  }
}
