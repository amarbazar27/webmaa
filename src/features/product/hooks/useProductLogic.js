'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useProductLogic(shop, product) {
  const router = useRouter();
  
  // Variant State
  const variants = product.variants || [];
  const isLegacySizes = !product.variants && (product.sizes?.length > 0);
  const sizes = product.sizes || [];
  
  const [selectedSize, setSelectedSize] = useState(sizes.length > 0 ? sizes[0] : null);
  const [selectedVariants, setSelectedVariants] = useState(() => {
    const init = {};
    if (Array.isArray(variants)) {
      variants.forEach(v => {
        if(v.name && v.options?.length) init[v.name] = v.options[0];
      });
    }
    return init;
  });

  // Basic State
  const [qty, setQty] = useState(1);
  const [customerNote, setCustomerNote] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [aiPrice, setAiPrice] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');

  // Location / Service Banner State
  const [locationStatus, setLocationStatus] = useState('idle');
  const [locationManualInput, setLocationManualInput] = useState('');
  const [detectedLocation, setDetectedLocation] = useState('');

  // Persist note safely
  useEffect(() => {
    if (typeof window !== 'undefined' && product?.id) {
      try {
        const saved = localStorage.getItem(`note_${product.id}`);
        if (saved) setCustomerNote(saved);
      } catch (e) {
        console.warn('[LocalStorage] Failed to read note:', e.message);
      }
    }
  }, [product?.id]);

  useEffect(() => {
    if (product?.id) {
      try {
        localStorage.setItem(`note_${product.id}`, customerNote);
      } catch (e) {
        console.warn('[LocalStorage] Failed to write note:', e.message);
      }
    }
  }, [customerNote, product?.id]);

  const handleQtyChange = (delta) => {
    setQty(prev => Math.max(1, Math.min(999, prev + delta)));
    setAiPrice(null);
    setAiResult('');
  };

  return {
    qty, setQty,
    customerNote, setCustomerNote,
    customInput, setCustomInput,
    aiPrice, setAiPrice,
    aiLoading, setAiLoading,
    aiResult, setAiResult,
    locationStatus, setLocationStatus,
    locationManualInput, setLocationManualInput,
    detectedLocation, setDetectedLocation,
    selectedSize, setSelectedSize,
    selectedVariants, setSelectedVariants,
    handleQtyChange,
    router,
    isLegacySizes,
    variants,
    sizes
  };
}
