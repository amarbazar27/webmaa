import { getShopServer, getProductsServer } from '@/lib/server-fetch';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://webmaa.vercel.app';

export async function generateMetadata({ params }) {
  try {
    const { shopSlug, productId } = await params;
    const shop = await getShopServer(shopSlug);
    if (!shop) return { title: 'পণ্য পাওয়া যায়নি' };
    
    const products = await getProductsServer(shop.id);
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
        siteName: 'Webmaa',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: absoluteImage ? [absoluteImage] : [],
      }
    };
  } catch (err) {
    console.error('[ProductPage] Metadata Error:', err);
    return { title: 'পণ্য' };
  }
}

export default async function ProductDetailPage({ params }) {
  const { shopSlug, productId } = await params;
  console.log(`[ProductPage] Server Render Request: shop=${shopSlug} product=${productId}`);

  try {
    const shop = await getShopServer(shopSlug);
    if (!shop) {
      console.warn(`[ProductPage] Shop not found: ${shopSlug}`);
      notFound();
    }

    const products = await getProductsServer(shop.id);
    const product = products.find(p => p.id === productId);
    if (!product) {
      console.warn(`[ProductPage] Product not found: ${productId} in shop ${shop.id}`);
      notFound();
    }

    console.log(`[ProductPage] Data fetched successfully for: ${product.name}`);

    return (
      <ProductDetailClient 
        shop={shop} 
        product={product} 
      />
    );
  } catch (err) {
    console.error(`[ProductPage] FATAL RENDER ERROR for ${productId}:`, err);
    throw err;
  }
}
