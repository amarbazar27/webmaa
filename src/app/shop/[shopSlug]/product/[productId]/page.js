import { getShopBySlug, getProducts } from '@/lib/firestore';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://webmaa.vercel.app';

/**
 * Robust JSON serialization for Next.js Server-to-Client props.
 * Specifically handles Firestore Timestamps and prevents circular/non-serializable errors.
 */
function safeSerialize(data) {
  try {
    return JSON.parse(JSON.stringify(data, (key, value) => {
      // Handle Firestore Timestamps
      if (value && typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
        return new Date(value.seconds * 1000).toISOString();
      }
      // Handle potential Functions or undefined
      if (typeof value === 'function' || typeof value === 'undefined') {
        return null;
      }
      return value;
    }));
  } catch (err) {
    console.error('[Serialization Error]', err);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { shopSlug, productId } = await params;
  console.log(`[ProductPage] Metadata check: shop=${shopSlug} product=${productId}`);
  
  const shop = await getShopBySlug(shopSlug);
  if (!shop) return { title: 'পণ্য পাওয়া যায়নি' };
  
  const products = await getProducts(shop.id);
  const product = products.find(p => p.id === productId);

  const title = product ? `${product.name} — ${shop.shopName}` : (shop?.shopName || 'পণ্য');
  const description = product?.description || `${shop?.shopName || 'Shop'}-এ কেনাকাটা করুন`;
  
  const rawImage = product?.imageUrl || shop?.logoUrl || '';
  const absoluteImage = (typeof rawImage === 'string' && rawImage.startsWith('http')) 
    ? rawImage 
    : rawImage ? `${BASE_URL}${rawImage}` : '';
    
  const images = absoluteImage ? [{ url: absoluteImage, width: 1200, height: 630, alt: product?.name || shop?.shopName || 'Product' }] : [];
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
      siteName: shop?.shopName || 'Webmaa',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: absoluteImage ? [absoluteImage] : [],
    }
  };
}

export default async function ProductDetailPage({ params }) {
  const { shopSlug, productId } = await params;
  console.log(`[ProductPage] Rendering: shop=${shopSlug} product=${productId}`);

  const shop = await getShopBySlug(shopSlug);
  if (!shop) {
    console.error(`[ProductPage] Shop not found: ${shopSlug}`);
    notFound();
  }

  const products = await getProducts(shop.id);
  const product = products.find(p => p.id === productId);
  if (!product) {
    console.error(`[ProductPage] Product not found: ${productId} in shop ${shop.id}`);
    notFound();
  }

  const serializedShop = safeSerialize(shop);
  const serializedProduct = safeSerialize(product);

  if (!serializedShop || !serializedProduct) {
    console.error(`[ProductPage] Serialization failed for shop or product`);
    throw new Error('Data serialization failed');
  }

  return (
    <ProductDetailClient 
      shop={serializedShop} 
      product={serializedProduct} 
    />
  );
}
