'use client';
import { Component, Suspense } from 'react';
import { Loader2, Info, ArrowLeft } from 'lucide-react';
import { useProductLogic } from '@/features/product/hooks/useProductLogic';
import { sanitizeProductData } from '@/features/product/utils/safeObjects';
import { calculateBasePrice } from '@/features/product/utils/price';
import { handleAiCalculate } from '@/features/product/actions/aiActions';
import { addToCart } from '@/features/product/actions/cartActions';

import ProductImage from '@/features/product/components/ProductImage';
import ProductInfo from '@/features/product/components/ProductInfo';
import ProductVariants from '@/features/product/components/ProductVariants';
import LegacySizes from '@/features/product/components/LegacySizes';
import ProductQuantity from '@/features/product/components/ProductQuantity';
import AiCustomization from '@/features/product/components/AiCustomization';
import ProductActions from '@/features/product/components/ProductActions';
import ReviewSection from '@/components/shop/ReviewSection';
import ServiceBanner from '@/components/shop/ServiceBanner';

class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <ErrorFallback />;
    return this.props.children;
  }
}

const ErrorFallback = ({ onReset }) => (
  <div className="p-8 text-center bg-white min-h-[50vh] flex flex-col items-center justify-center">
    <Info size={40} className="text-red-500 mb-4" />
    <h2 className="text-xl font-black mb-2">পণ্যটি প্রদর্শনে সমস্যা হচ্ছে</h2>
    <p className="text-sm text-slate-500 mb-6">দুঃখিত, এই পণ্যটি সাময়িকভাবে দেখা যাচ্ছে না।</p>
    <div className="flex gap-4">
      <button onClick={() => window.location.reload()} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold">আবার চেষ্টা করুন</button>
      <button onClick={() => window.history.back()} className="px-6 py-2 bg-slate-100 text-slate-900 rounded-xl font-bold border border-slate-200">ফিরে যান</button>
    </div>
  </div>
);

export default function ProductDetailClient({ shop, product }) {
  if (!shop || !product) {
    console.warn('[ProductDetail] Missing props', { shop: !!shop, product: !!product });
    return <ErrorFallback />;
  }
  
  const { product: safeProduct, shop: safeShop } = sanitizeProductData(product, shop);
  
  const logic = useProductLogic(safeShop, safeProduct);
  
  let basePrice = 0;
  try {
    basePrice = calculateBasePrice(safeProduct, logic.isLegacySizes, logic.selectedSize, logic.selectedVariants);
  } catch (err) {
    console.error('[ProductDetail] Price calculation error:', err);
  }
  
  const safeBasePrice = Number(basePrice) || 0;
  const safeQty = Number(logic.qty) || 1;
  const totalPrice = logic.aiPrice !== null ? Number(logic.aiPrice) || 0 : (safeBasePrice * safeQty).toFixed(0);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50">
        <Header router={logic.router} product={safeProduct} shop={safeShop} />
        <ServiceBanner 
          shop={safeShop} 
          status={logic.locationStatus} 
          setStatus={logic.setLocationStatus} 
          manualInput={logic.locationManualInput}
          setManualInput={logic.setLocationManualInput}
          detectedLocation={logic.detectedLocation}
          setDetectedLocation={logic.setDetectedLocation}
        />
        
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          <Suspense fallback={<div className="h-72 bg-slate-200 animate-pulse rounded-3xl w-full"></div>}>
            <ProductImage product={safeProduct} currentPrice={safeBasePrice} />
          </Suspense>
          
          <ProductInfo product={safeProduct} currentPrice={safeBasePrice} />
          
          <ProductVariants variants={logic.variants} selectedVariants={logic.selectedVariants} setSelectedVariants={logic.setSelectedVariants} onResetAi={() => logic.setAiPrice(null)} />
          <LegacySizes sizes={logic.sizes} selectedSize={logic.selectedSize} setSelectedSize={logic.setSelectedSize} onResetAi={() => logic.setAiPrice(null)} />
          
          <ProductQuantity qty={logic.qty} setQty={logic.setQty} onQtyChange={logic.handleQtyChange} basePrice={safeBasePrice} />
          <AiCustomization product={safeProduct} shop={safeShop} customInput={logic.customInput} setCustomInput={logic.setCustomInput} aiResult={logic.aiResult} aiPrice={logic.aiPrice} aiLoading={logic.aiLoading} onCalculate={() => handleAiCalculate({...logic, shop: safeShop, product: safeProduct, basePrice: safeBasePrice})} />
          
          <ProductActions product={safeProduct} customerNote={logic.customerNote} setCustomerNote={logic.setCustomerNote} totalPrice={totalPrice} onAddToCart={() => addToCart({...logic, shop: safeShop, product: safeProduct, basePrice: safeBasePrice, router: logic.router})} />
          <ReviewSection shopId={safeShop?.id} />
        </div>
      </div>
    </ErrorBoundary>
  );
}

function Header({ router, product, shop }) {
  return (
    <div className="bg-white border-b sticky top-0 z-40 px-4 py-4 flex items-center gap-4">
      <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center"><ArrowLeft size={20} /></button>
      <div>
        <h1 className="font-black text-lg truncate">{product.name}</h1>
        <p className="text-xs text-slate-500 font-bold">{shop.shopName}</p>
      </div>
    </div>
  );
}
