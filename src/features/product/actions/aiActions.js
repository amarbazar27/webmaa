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
  if (!customInput.trim()) {
    toast.error('কাস্টমাইজ করতে কিছু লিখুন');
    return;
  }
  setAiLoading(true);
  
  const systemPrompt = `Bangladeshi retail AI Assistant. Base: ৳${basePrice}/${product.unit || 'unit'}. 
  PRICE: [number] and QUANTITY_NOTE: [text] required at end.`;

  try {
    const resp = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId: shop.id, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: customInput }] })
    });
    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content || '';
    
    const priceMatch = text.match(/PRICE:\s*(\d+(\.\d+)?)/i);
    const noteMatch = text.match(/QUANTITY_NOTE:\s*(.+)/i);
    
    if (priceMatch) {
      setAiPrice(parseFloat(priceMatch[1]));
      if (noteMatch) setCustomInput(noteMatch[1].trim());
      setAiResult(text.replace(/PRICE:\s*[\d.]+/i, '').replace(/QUANTITY_NOTE:\s*.+/i, '').trim() || 'Done');
    } else {
      setAiResult('মূল্য নির্ধারণ করতে পারিনি।');
    }
  } catch (err) {
    setAiResult('AI সংযোগে সমস্যা হয়েছে।');
  } finally {
    setAiLoading(false);
  }
};
