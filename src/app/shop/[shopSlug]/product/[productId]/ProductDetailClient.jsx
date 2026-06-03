'use client';
// Build trigger: v1.0.4 - Shop-themed header with share button on product detail page
import { Component, Suspense, useState, useEffect } from 'react';
import { Loader2, Info, ArrowLeft, Share2, Copy, Store } from 'lucide-react';
import { useProductLogic } from '@/features/product/hooks/useProductLogic';
import { sanitizeProductData } from '@/features/product/utils/safeObjects';
import { calculateBasePrice } from '@/features/product/utils/price';
import { handleAiCalculate } from '@/features/product/actions/aiActions';
import { addToCart } from '@/features/product/actions/cartActions';
import toast from 'react-hot-toast';
import Image from 'next/image';

import ProductImage from '@/features/product/components/ProductImage';
import ProductInfo from '@/features/product/components/ProductInfo';
import ProductVariants from '@/features/product/components/ProductVariants';
import LegacySizes from '@/features/product/components/LegacySizes';
import ProductQuantity from '@/features/product/components/ProductQuantity';
import AiCustomization from '@/features/product/components/AiCustomization';
import SmartCalculator from '@/features/product/components/SmartCalculator';
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

const ErrorFallback = () => (
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-600" size={40} />
      </div>
    );
  }

  if (!shop || !product) {
    return <ErrorFallback />;
  }

  return (
    <ErrorBoundary>
      <ProductDetailInner shop={shop} product={product} />
    </ErrorBoundary>
  );
}

function ProductDetailInner({ shop, product }) {
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

  // Build shop theme CSS variables (same presets as ShopClient)
  const SHOP_THEME_PRESETS = {
    classic:  { primary: '#4f46e5', accent: '#7c3aed', bg: '#ffffff',  text: '#0f172a', card: '#ffffff', border: '#e2e8f0', headerBg: 'linear-gradient(135deg, #4f46e5, #7c3aed)', headerText: '#ffffff', btnText: '#ffffff' },
    forest:   { primary: '#059669', accent: '#34d399', bg: '#f0fdf4',  text: '#064e3b', card: '#ffffff', border: '#bbf7d0', headerBg: 'linear-gradient(135deg, #065f46, #047857)', headerText: '#ecfdf5', btnText: '#ffffff' },
    sunset:   { primary: '#ea580c', accent: '#f97316', bg: '#fff7ed',  text: '#431407', card: '#ffffff', border: '#fed7aa', headerBg: 'linear-gradient(135deg, #c2410c, #ea580c)', headerText: '#ffffff', btnText: '#ffffff' },
    ocean:    { primary: '#0284c7', accent: '#38bdf8', bg: '#f0f9ff',  text: '#0c4a6e', card: '#ffffff', border: '#bae6fd', headerBg: 'linear-gradient(135deg, #0369a1, #0284c7)', headerText: '#ffffff', btnText: '#ffffff' },
    rose:     { primary: '#be185d', accent: '#f43f5e', bg: '#fff1f2',  text: '#4c0519', card: '#ffffff', border: '#fecdd3', headerBg: 'linear-gradient(135deg, #9f1239, #be185d)', headerText: '#ffffff', btnText: '#ffffff' },
    minimal:  { primary: '#18181b', accent: '#71717a', bg: '#fafafa',  text: '#18181b', card: '#ffffff', border: '#e4e4e7', headerBg: '#18181b', headerText: '#fafafa', btnText: '#ffffff' },
    royal:    { primary: '#7c3aed', accent: '#a78bfa', bg: '#faf5ff',  text: '#2e1065', card: '#ffffff', border: '#ddd6fe', headerBg: 'linear-gradient(135deg, #5b21b6, #7c3aed)', headerText: '#ffffff', btnText: '#ffffff' },
    earth:    { primary: '#92400e', accent: '#d97706', bg: '#fffbeb',  text: '#451a03', card: '#ffffff', border: '#fde68a', headerBg: 'linear-gradient(135deg, #78350f, #92400e)', headerText: '#ffffff', btnText: '#ffffff' },
    midnight: { primary: '#a5b4fc', accent: '#c084fc', bg: '#0f172a',  text: '#f8fafc', card: '#1e293b', border: '#334155', headerBg: 'linear-gradient(135deg, #1e1b4b, #312e81)', headerText: '#e0e7ff', btnText: '#ffffff' },
    neon:     { primary: '#22d3ee', accent: '#a855f7', bg: '#020617',  text: '#f0fdfa', card: '#0f172a', border: '#1e293b', headerBg: 'linear-gradient(135deg, #0e7490, #7c3aed)', headerText: '#f0fdfa', btnText: '#ffffff' },
  };

  const presetKey = safeShop?.designPreset || 'classic';
  const base = SHOP_THEME_PRESETS[presetKey] || SHOP_THEME_PRESETS.classic;
  const overrides = safeShop?.designOverrides || {};
  const theme = { ...base, ...overrides };

  const themeVars = {
    '--sp-primary': theme.primary,
    '--sp-accent': theme.accent,
    '--sp-bg': theme.bg,
    '--sp-text': theme.text,
    '--sp-card': theme.card,
    '--sp-border': theme.border,
    '--sp-header-bg': theme.headerBg,
    '--sp-header-text': theme.headerText,
    '--sp-btn-text': theme.btnText || '#ffffff',
  };

  return (
    <div className="min-h-screen" style={{ ...themeVars, background: theme.bg }}>
      <Header router={logic.router} product={safeProduct} shop={safeShop} />
      
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="px-4 pb-12 space-y-6">
          <Suspense fallback={<div className="h-72 bg-slate-200 animate-pulse rounded-3xl w-full"></div>}>
            <ProductImage product={safeProduct} currentPrice={safeBasePrice} />
          </Suspense>
          
          <ProductInfo product={safeProduct} currentPrice={safeBasePrice} />
          
          <ProductVariants variants={logic.variants} selectedVariants={logic.selectedVariants} setSelectedVariants={logic.setSelectedVariants} onResetAi={() => logic.setAiPrice(null)} />
          <LegacySizes sizes={logic.sizes} selectedSize={logic.selectedSize} setSelectedSize={logic.setSelectedSize} onResetAi={() => logic.setAiPrice(null)} />
          
          <ProductQuantity qty={logic.qty} setQty={logic.setQty} onQtyChange={logic.handleQtyChange} basePrice={safeBasePrice} />
          
          {safeShop?.aiConfig?.smartCalcEnabled ? (
            <SmartCalculator product={safeProduct} setCustomInput={logic.setCustomInput} setAiPrice={logic.setAiPrice} />
          ) : safeProduct?.allowCustomize ? (
            <AiCustomization product={safeProduct} shop={safeShop} customInput={logic.customInput} setCustomInput={logic.setCustomInput} aiResult={logic.aiResult} aiPrice={logic.aiPrice} aiLoading={logic.aiLoading} onCalculate={() => handleAiCalculate({...logic, shop: safeShop, product: safeProduct, basePrice: safeBasePrice})} />
          ) : null}
          
          <ProductActions product={safeProduct} customerNote={logic.customerNote} setCustomerNote={logic.setCustomerNote} totalPrice={totalPrice} onAddToCart={() => addToCart({...logic, shop: safeShop, product: safeProduct, basePrice: safeBasePrice, router: logic.router})} />
          <ReviewSection shopId={safeShop?.id} />
        </div>
      </div>
    </div>
  );
}


function Header({ router, product, shop }) {
  const [sharing, setSharing] = useState(false);

  // Build the share URL
  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    if (shop?.shopSlug && product?.id) {
      return `${window.location.origin}/shop/${shop.shopSlug}/product/${product.id}`;
    }
    return typeof window !== 'undefined' ? window.location.href : '';
  };

  const handleShare = async () => {
    const url = getShareUrl();
    if (navigator.share) {
      try {
        setSharing(true);
        await navigator.share({
          title: product?.name || 'পণ্য',
          text: `${shop?.shopName || 'Shop'}-এ '${product?.name}' দেখুন! 🛒`,
          url,
        });
      } catch (err) {
        if (err.name !== 'AbortError') handleCopy(url);
      } finally {
        setSharing(false);
      }
    } else {
      handleCopy(url);
    }
  };

  const handleCopy = (url) => {
    navigator.clipboard.writeText(url || getShareUrl()).then(() => {
      toast.success('লিংক কপি হয়েছে! 🔗');
    }).catch(() => toast.error('লিংক কপি করা যায়নি'));
  };

  return (
    <div
      className="sticky top-0 z-40 border-b"
      style={{
        background: 'var(--sp-header-bg, #4f46e5)',
        borderColor: 'var(--sp-border, #e2e8f0)',
      }}
    >
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95"
          style={{
            background: 'var(--sp-primary, #4f46e5)',
            color: 'var(--sp-btn-text, #ffffff)',
          }}
        >
          <ArrowLeft size={18} />
        </button>

        {/* Shop Logo + Name + Product Name */}
        <div className="flex-1 min-w-0 flex items-center gap-2.5">
          {shop?.logoUrl ? (
            <div className="w-7 h-7 rounded-lg overflow-hidden border shrink-0" style={{ borderColor: 'var(--sp-border, #e2e8f0)' }}>
              <Image src={shop.logoUrl} alt={shop.shopName || ''} width={28} height={28} className="object-cover w-full h-full" />
            </div>
          ) : (
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--sp-primary, #4f46e5)' }}
            >
              <Store size={14} style={{ color: 'var(--sp-btn-text, #ffffff)' }} />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider truncate" style={{ color: 'var(--sp-header-text, #64748b)' }}>
              {shop?.shopName || 'Store'}
            </p>
            <h1 className="font-black text-sm truncate leading-tight" style={{ color: 'var(--sp-header-text, #0f172a)' }}>
              {product?.name || 'পণ্য বিবরণ'}
            </h1>
          </div>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          disabled={sharing}
          title="শেয়ার করুন"
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95 border"
          style={{
            background: 'var(--sp-card, #ffffff)',
            borderColor: 'var(--sp-border, #e2e8f0)',
            color: 'var(--sp-primary, #4f46e5)',
          }}
        >
          {sharing ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
        </button>

        {/* Copy Link Button */}
        <button
          onClick={() => handleCopy()}
          title="লিংক কপি করুন"
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95 border"
          style={{
            background: 'var(--sp-card, #ffffff)',
            borderColor: 'var(--sp-border, #e2e8f0)',
            color: 'var(--sp-text, #64748b)',
          }}
        >
          <Copy size={15} />
        </button>
      </div>
    </div>
  );
}
