'use client';
import { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, DollarSign, Package, Brain, Sparkles, Loader2, ChevronDown, ChevronUp, ExternalLink, Plus, Minus } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AiInsightsPanel({ orders = [], products = [], shopName = '', activeShopId }) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [stockValues, setStockValues] = useState({});
  const [stockSaving, setStockSaving] = useState({});

  const toggle = (type) => setExpanded(prev => ({ ...prev, [type]: !prev[type] }));

  const handleStockUpdate = async (productId, newStock) => {
    if (!activeShopId || newStock < 0) return;
    setStockSaving(prev => ({ ...prev, [productId]: true }));
    try {
      await updateDoc(doc(db, 'shops', activeShopId, 'products', productId), { stock: newStock });
      setStockValues(prev => ({ ...prev, [productId]: newStock }));
    } catch (e) {
      console.error('Stock update failed', e);
    } finally {
      setStockSaving(prev => ({ ...prev, [productId]: false }));
    }
  };

  useEffect(() => {
    if (orders.length === 0 && products.length === 0) { setLoading(false); return; }

    const generated = [];
    const totalRevenue = orders.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
    const completedOrders = orders.filter(o => o.status === 'completed');
    const completedRevenue = completedOrders.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
    const pendingOrders = orders.filter(o => o.status === 'pending');
    const conversion = orders.length > 0 ? Math.round(completedOrders.length / orders.length * 100) : 0;

    if (totalRevenue > 0) {
      generated.push({
        type: 'revenue',
        icon: DollarSign,
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        accentBg: 'bg-emerald-100',
        title: 'রেভিনিউ সামারি',
        body: `মোট ৳${totalRevenue.toLocaleString()} আয়। ${conversion}% conversion।`,
        detail: { totalRevenue, completedRevenue, completedOrders, pendingOrders, conversion },
      });
    }

    if (pendingOrders.length > 0) {
      generated.push({
        type: 'alert',
        icon: AlertTriangle,
        color: 'text-amber-600 bg-amber-50 border-amber-200',
        accentBg: 'bg-amber-100',
        title: 'পেন্ডিং অর্ডার সতর্কতা',
        body: `${pendingOrders.length}টি অর্ডার পেন্ডিং।`,
        detail: { pendingOrders },
      });
    }

    const lowStockProducts = products.filter(p => p.stock !== undefined && p.stock !== null && p.stock <= 3 && p.stock > 0);
    const outOfStockProducts = products.filter(p => p.stock !== undefined && p.stock !== null && p.stock === 0);
    const stockAlertList = [...outOfStockProducts, ...lowStockProducts];

    if (stockAlertList.length > 0) {
      generated.push({
        type: outOfStockProducts.length > 0 ? 'stock_critical' : 'stock_low',
        icon: Package,
        color: outOfStockProducts.length > 0 ? 'text-red-600 bg-red-50 border-red-200' : 'text-orange-600 bg-orange-50 border-orange-200',
        accentBg: outOfStockProducts.length > 0 ? 'bg-red-100' : 'bg-orange-100',
        title: outOfStockProducts.length > 0 ? '⚠️ স্টক শেষ!' : 'স্টক কমে যাচ্ছে',
        body: `${stockAlertList.slice(0, 2).map(p => `${p.name} (${p.stock}টি)`).join(', ')}${stockAlertList.length > 2 ? ` +${stockAlertList.length - 2}টি` : ''}`,
        detail: { stockAlertList },
      });
      // Initialize stock values
      const sv = {};
      stockAlertList.forEach(p => { sv[p.id] = p.stock; });
      setStockValues(sv);
    }

    if (orders.length >= 3) {
      const productFreq = {};
      orders.forEach(o => {
        (o.items || []).forEach(item => {
          productFreq[item.name] = (productFreq[item.name] || 0) + (item.quantity || 1);
        });
      });
      const sorted = Object.entries(productFreq).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) {
        generated.push({
          type: 'trending',
          icon: TrendingUp,
          color: 'text-purple-600 bg-purple-50 border-purple-200',
          accentBg: 'bg-purple-100',
          title: 'টপ সেলিং পণ্য',
          body: sorted.slice(0, 3).map(([name, qty], i) => `${i+1}. ${name} (${qty}টি)`).join(' • '),
          detail: { sorted },
        });
      }
    }

    if (products.length > 0 && orders.length >= 5) {
      const avg = Math.round(totalRevenue / orders.length);
      generated.push({
        type: 'pricing',
        icon: Sparkles,
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        accentBg: 'bg-blue-100',
        title: 'মূল্য পরামর্শ',
        body: `গড় অর্ডার ভ্যালু ৳${avg}। ${avg < 200 ? 'কম্বো অফার ট্রাই করুন।' : 'ভালো পারফর্ম করছে!'}`,
        detail: { avg, totalRevenue, orderCount: orders.length },
      });
    }

    setInsights(generated);
    setLoading(false);
  }, [orders, products]);

  if (loading) return (
    <div className="py-8 text-center">
      <Loader2 size={20} className="animate-spin mx-auto text-slate-300 mb-2" />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI বিশ্লেষণ চলছে...</p>
    </div>
  );

  if (insights.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
          <Brain size={18} />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900">AI Insights</h3>
          <p className="text-[10px] font-bold text-slate-400">রিয়েল-টাইম ডেটা থেকে স্বয়ংক্রিয় বিশ্লেষণ</p>
        </div>
      </div>

      <div className="space-y-3">
        {insights.map((insight, i) => (
          <div key={i} className={`border rounded-2xl overflow-hidden shadow-sm ${insight.color}`}>
            {/* Header — always clickable */}
            <button
              className="w-full flex items-center gap-3 p-4 text-left hover:opacity-90 transition-opacity"
              onClick={() => toggle(insight.type)}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${insight.accentBg}`}>
                <insight.icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black">{insight.title}</p>
                <p className="text-[11px] font-bold leading-relaxed opacity-75 truncate">{insight.body}</p>
              </div>
              <div className="shrink-0 opacity-60">
                {expanded[insight.type] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </button>

            {/* Expanded Detail */}
            {expanded[insight.type] && (
              <div className="border-t border-current/10 p-4 bg-white/60 space-y-3">

                {/* Revenue detail */}
                {insight.type === 'revenue' && (
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white/80 rounded-xl p-2.5">
                        <p className="text-[9px] font-black uppercase tracking-wider opacity-60">মোট আয়</p>
                        <p className="text-sm font-black">৳{insight.detail.totalRevenue.toLocaleString()}</p>
                      </div>
                      <div className="bg-white/80 rounded-xl p-2.5">
                        <p className="text-[9px] font-black uppercase tracking-wider opacity-60">সম্পন্ন অর্ডার</p>
                        <p className="text-sm font-black">৳{insight.detail.completedRevenue.toLocaleString()}</p>
                      </div>
                      <div className="bg-white/80 rounded-xl p-2.5">
                        <p className="text-[9px] font-black uppercase tracking-wider opacity-60">Conversion</p>
                        <p className="text-sm font-black">{insight.detail.conversion}%</p>
                      </div>
                      <div className="bg-white/80 rounded-xl p-2.5">
                        <p className="text-[9px] font-black uppercase tracking-wider opacity-60">পেন্ডিং</p>
                        <p className="text-sm font-black">{insight.detail.pendingOrders.length}টি</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pending alert detail */}
                {insight.type === 'alert' && (
                  <div className="space-y-1.5">
                    {insight.detail.pendingOrders.slice(0, 5).map((order, j) => (
                      <div key={j} className="flex items-center justify-between bg-white/80 rounded-xl px-3 py-2 text-xs">
                        <span className="font-bold">{order.customerName || order.phone || `অর্ডার #${j+1}`}</span>
                        <span className="font-black">৳{parseFloat(order.total || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Stock detail — inline editable */}
                {(insight.type === 'stock_critical' || insight.type === 'stock_low') && (
                  <div className="space-y-2">
                    {insight.detail.stockAlertList.map((product) => {
                      const currentStock = stockValues[product.id] ?? product.stock;
                      const isSaving = stockSaving[product.id];
                      return (
                        <div key={product.id} className="flex items-center justify-between bg-white/80 rounded-xl px-3 py-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black truncate">{product.name}</p>
                            <p className="text-[10px] font-bold opacity-60">{currentStock === 0 ? '❌ স্টক শেষ' : `${currentStock}টি বাকি`}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              disabled={currentStock <= 0 || isSaving}
                              onClick={() => handleStockUpdate(product.id, currentStock - 1)}
                              className="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center hover:bg-slate-300 disabled:opacity-40 transition-colors"
                            >
                              <Minus size={10} />
                            </button>
                            <span className="text-sm font-black w-7 text-center tabular-nums">
                              {isSaving ? '...' : currentStock}
                            </span>
                            <button
                              disabled={isSaving}
                              onClick={() => handleStockUpdate(product.id, currentStock + 1)}
                              className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 disabled:opacity-40 transition-colors"
                            >
                              <Plus size={10} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <p className="text-[9px] opacity-60 font-medium text-center">+/− বাটনে ক্লিক করে সরাসরি স্টক আপডেট করুন</p>
                  </div>
                )}

                {/* Top selling detail */}
                {insight.type === 'trending' && (
                  <div className="space-y-1.5">
                    {insight.detail.sorted.slice(0, 5).map(([name, qty], j) => (
                      <div key={j} className="flex items-center gap-2 bg-white/80 rounded-xl px-3 py-2">
                        <span className="text-[10px] font-black w-4 opacity-50">#{j+1}</span>
                        <span className="flex-1 text-xs font-bold truncate">{name}</span>
                        <span className="text-xs font-black">{qty}টি বিক্রি</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pricing detail */}
                {insight.type === 'pricing' && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white/80 rounded-xl p-2.5">
                      <p className="text-[9px] font-black uppercase tracking-wider opacity-60">গড় অর্ডার ভ্যালু</p>
                      <p className="text-sm font-black">৳{insight.detail.avg}</p>
                    </div>
                    <div className="bg-white/80 rounded-xl p-2.5">
                      <p className="text-[9px] font-black uppercase tracking-wider opacity-60">মোট অর্ডার</p>
                      <p className="text-sm font-black">{insight.detail.orderCount}টি</p>
                    </div>
                    <div className="col-span-2 bg-white/80 rounded-xl p-2.5">
                      <p className="text-[9px] font-black uppercase tracking-wider opacity-60 mb-1">পরামর্শ</p>
                      <p className="font-bold leading-relaxed">
                        {insight.detail.avg < 200
                          ? '💡 কম্বো অফার বা বান্ডেল প্রাইসিং ব্যবহার করুন। ২টি পণ্য একসাথে কিনলে ১০% ছাড় দিলে গড় ভ্যালু বাড়বে।'
                          : '🎉 দারুণ পারফরম্যান্স! প্রিমিয়াম পণ্য যোগ করে আরও বাড়ান।'}
                      </p>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
