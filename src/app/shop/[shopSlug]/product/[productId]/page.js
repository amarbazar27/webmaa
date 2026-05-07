import { getShopBySlug, getProducts } from '@/lib/firestore';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://messerbazar.com';

export async function generateMetadata({ params }) {
  const { shopSlug, productId } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) return { title: 'পণ্য পাওয়া যায়নি' };
  const products = await getProducts(shop.id);
  const product = products.find(p => p.id === productId);

  const title = product ? `${product.name} — ${shop.shopName}` : shop.shopName;
  const description = product?.description || `${shop.shopName}-এ কেনাকাটা করুন`;
  // Ensure absolute URLs for OpenGraph images
  const rawImage = product?.imageUrl || shop?.logoUrl || '';
  const absoluteImage = rawImage.startsWith('http') ? rawImage : rawImage ? `${BASE_URL}${rawImage}` : '';
  const images = absoluteImage ? [{ url: absoluteImage, width: 1200, height: 630, alt: product?.name || shop?.shopName }] : [];
  const canonicalUrl = `${BASE_URL}/shop/${shopSlug}/product/${productId}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images,
      type: 'product',
      siteName: shop?.shopName || 'MesserBazar',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: absoluteImage ? [absoluteImage] : [],
    }
  };
}

// JSON-LD Structured Data (Product + BreadcrumbList)
function ProductJsonLd({ shop, product, shopSlug }) {
  const productUrl = `${BASE_URL}/shop/${shopSlug}/product/${product.id}`;
  const imageUrl = product.imageUrl || shop.logoUrl || '';

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} — ${shop.shopName}`,
    image: imageUrl || undefined,
    url: productUrl,
    brand: { '@type': 'Brand', name: shop.shopName },
    offers: {
      '@type': 'Offer',
      price: parseFloat(product.price) || 0,
      priceCurrency: 'BDT',
      availability: product.stock === 0
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: shop.shopName },
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: shop.shopName, item: `${BASE_URL}/shop/${shopSlug}` },
      { '@type': 'ListItem', position: 2, name: product.category || 'পণ্য', item: `${BASE_URL}/shop/${shopSlug}` },
      { '@type': 'ListItem', position: 3, name: product.name, item: productUrl },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </>
  );
}

// Helper: recursively convert Firestore Timestamps & Dates to plain ISO strings
function serializeData(obj) {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (typeof obj !== 'object') return obj;
  
  // Handle Firestore Timestamps
  if (typeof obj.seconds === 'number' && typeof obj.nanoseconds === 'number') {
    try {
      return new Date(obj.seconds * 1000).toISOString();
    } catch (e) { return null; }
  }
  
  if (Array.isArray(obj)) return obj.map(serializeData);
  
  const plain = {};
  for (const key of Object.keys(obj)) {
    try {
      plain[key] = serializeData(obj[key]);
    } catch (e) {
      plain[key] = null; // Skip non-serializable properties safely
    }
  }
  return plain;
}

export default async function ProductDetailPage({ params }) {
  const { shopSlug, productId } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) notFound();

  const products = await getProducts(shop.id);
  const product = products.find(p => p.id === productId);
  if (!product) notFound();

  return (
    <>
      <ProductJsonLd shop={shop} product={product} shopSlug={shopSlug} />
      <ProductDetailClient shop={serializeData(shop)} product={serializeData(product)} />
    </>
  );
}
