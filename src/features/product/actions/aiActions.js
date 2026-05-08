import toast from 'react-hot-toast';
import { trackStoreEvent } from '@/components/shop/StoreAnalytics';

export const handleAiCalculate = async ({
  shop,
  product,
  customInput,
  basePrice,
  setAiLoading,
  setAiResult,
  setAiPrice,
  setCustomInput
}) => {
  try {
    const aiKey = shop?.aiConfig?.geminiKey || shop?.aiConfig?.groqKey || '';
    if (!aiKey) {
      toast.error('AI পরিষেবা কনফিগার করা নেই।');
      return;
    }

    if (!customInput || !customInput.trim()) {
      toast.error('কাস্টমাইজ করতে কিছু লিখুন');
      return;
    }

    setAiLoading(true);
    
    const safeBasePrice = Number(basePrice) || 0;
    const unit = product?.unit || 'unit';
    const systemPrompt = `Bangladeshi retail AI Assistant. Base: ৳${safeBasePrice}/${unit}. 
    PRICE: [number] and QUANTITY_NOTE: [text] required at end.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 sec timeout

    const resp = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        shopId: shop?.id || '', 
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: customInput.trim() }] 
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!resp.ok) {
      throw new Error(`API error: ${resp.status}`);
    }

    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content || '';
    
    if (!text) {
      setAiResult('AI থেকে কোনো উত্তর পাওয়া যায়নি।');
      return;
    }

    const priceMatch = text.match(/PRICE:\s*(\d+(\.\d+)?)/i);
    const noteMatch = text.match(/QUANTITY_NOTE:\s*(.+)/i);
    
    if (priceMatch && !isNaN(parseFloat(priceMatch[1]))) {
      setAiPrice(parseFloat(priceMatch[1]));
      if (noteMatch && noteMatch[1]) setCustomInput(noteMatch[1].trim());
      const resText = text.replace(/PRICE:\s*[\d.]+/i, '').replace(/QUANTITY_NOTE:\s*.+/i, '').trim();
      setAiResult(resText || 'সম্পন্ন হয়েছে');
    } else {
      setAiResult('মূল্য নির্ধারণ করতে পারিনি।');
      console.warn('[AI Calculate] Invalid AI output format', text);
    }
  } catch (err) {
    console.error('[AI Calculate] Error:', err);
    if (err.name === 'AbortError') {
      toast.error('AI সংযোগে সময় শেষ হয়েছে।');
      setAiResult('AI সংযোগে সময় শেষ হয়েছে।');
    } else {
      toast.error('AI সংযোগে সমস্যা হয়েছে।');
      setAiResult('AI সংযোগে সমস্যা হয়েছে।');
    }
  } finally {
    setAiLoading(false);
  }
};
