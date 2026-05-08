import { getShopServer, getProductsServer } from '@/lib/server-fetch';
import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://webmaa.vercel.app';

export async function generateMetadata({ params }) {
  try {
    console.log('[PRODUCT PAGE] generateMetadata start');
    const resolvedParams = await params;
    if (!resolvedParams || !resolvedParams.shopSlug || !resolvedParams.productId) {
      return { title: 'Product', description: 'Product page' };
    }
    const { shopSlug, productId } = resolvedParams;
    const shop = await getShopServer(shopSlug);
    if (!shop) return { title: 'পণ্য পাওয়া যায়নি' };
    
    const products = await getProductsServer(shop.id) || [];
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
  console.log('[PRODUCT PAGE] Server Render Request start');
  
  try {
    const resolvedParams = await params;
    console.log('[PRODUCT PAGE] params', resolvedParams);
    
    if (!resolvedParams || !resolvedParams.shopSlug || !resolvedParams.productId) {
      console.warn('[PRODUCT PAGE] Missing params');
      return <ProductDetailClient shop={null} product={null} />;
    }
    
    const { shopSlug, productId } = resolvedParams;
    console.log('[PRODUCT PAGE] shopSlug', shopSlug);
    console.log('[PRODUCT PAGE] productId', productId);
    
    console.log('[PRODUCT PAGE] product fetch start');
    const shop = await getShopServer(shopSlug);
    console.log('[PRODUCT PAGE] shop fetch result', shop ? 'found' : 'missing');
    
    if (!shop) {
      console.warn(`[ProductPage] Shop not found: ${shopSlug}`);
      return <ProductDetailClient shop={null} product={null} />;
    }

    const products = await getProductsServer(shop.id) || [];
    const product = products.find(p => p?.id === productId);
    console.log('[PRODUCT PAGE] product fetch result', product ? 'found' : 'missing');
    
    if (!product) {
      console.warn(`[ProductPage] Product not found: ${productId} in shop ${shop.id}`);
      return <ProductDetailClient shop={null} product={null} />;
    }

    // 🚨 FAIL-SAFE SERIALIZATION: Guarantee plain objects for Next.js SSR
    const safeShop = JSON.parse(JSON.stringify(shop));
    const safeProduct = JSON.parse(JSON.stringify(product));

    return (
      <ProductDetailClient 
        shop={safeShop} 
        product={safeProduct} 
      />
    );
  } catch (err) {
    console.error(`[PRODUCT PAGE] FATAL RENDER ERROR:`, err);
    // Never throw server exceptions. Render a safe fallback UI.
    return <ProductDetailClient shop={null} product={null} />;
  }
}
