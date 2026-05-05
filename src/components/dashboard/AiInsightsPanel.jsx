'use client';
import { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, DollarSign, Package, Brain, Sparkles, Loader2 } from 'lucide-react';

/**
 * AiInsightsPanel — Smart analytics for retailer dashboard
 * Auto-generates insights from real order & product data
 */
export default function AiInsightsPanel({ orders = [], products = [], shopName = '' }) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orders.length === 0 && products.length === 0) {
      setLoading(false);
      return;
    }

    // Generate insights from real data
    const generated = [];

    // ── Revenue Insight ──
    const totalRevenue = orders.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
    const completedOrders = orders.filter(o => o.status === 'completed');
    const completedRevenue = completedOrders.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
    const pendingOrders = orders.filter(o => o.status === 'pending');

    if (totalRevenue > 0) {
      generated.push({
        type: 'revenue',
        icon: DollarSign,
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        title: 'রেভিনিউ সামারি',
        body: `মোট ৳${totalRevenue.toLocaleString()} আয় হয়েছে। সম্পন্ন অর্ডার থেকে ৳${completedRevenue.toLocaleString()} (${orders.length > 0 ? Math.round(completedOrders.length / orders.length * 100) : 0}% conversion)।`,
      });
    }

    // ── Pending Alert ──
    if (pendingOrders.length > 0) {
      generated.push({
        type: 'alert',
        icon: AlertTriangle,
        color: 'text-amber-600 bg-amber-50 border-amber-200',
        title: 'পেন্ডিং অর্ডার সতর্কতা',
        body: `${pendingOrders.length}টি অর্ডার এখনো পেন্ডিং আছে। দ্রুত কনফার্ম করুন — দেরিতে কনফার্ম করলে গ্রাহক হারানোর সম্ভাবনা ${pendingOrders.length > 5 ? '৮০' : '৪০'}%।`,
      });
    }

    // ── Stock Alert ──
    const lowStockProducts = products.filter(p => p.stock !== undefined && p.stock !== null && p.stock <= 3 && p.stock >= 0);
    const outOfStockProducts = products.filter(p => p.stock !== undefined && p.stock !== null && p.stock === 0);

    if (outOfStockProducts.length > 0) {
      generated.push({
        type: 'stock_critical',
        icon: Package,
        color: 'text-red-600 bg-red-50 border-red-200',
        title: '⚠️ স্টক শেষ!',
        body: `${outOfStockProducts.map(p => p.name).slice(0, 3).join(', ')}${outOfStockProducts.length > 3 ? ` +${outOfStockProducts.length - 3}টি` : ''} — এই পণ্যগুলো কার্টে যোগ করা যাচ্ছে না। দ্রুত রিস্টক করুন।`,
      });
    } else if (lowStockProducts.length > 0) {
      generated.push({
        type: 'stock_low',
        icon: Package,
        color: 'text-orange-600 bg-orange-50 border-orange-200',
        title: 'স্টক কমে যাচ্ছে',
        body: `${lowStockProducts.map(p => `${p.name} (${p.stock}টি)`).slice(0, 3).join(', ')} — শীঘ্রই স্টক আউট হতে পারে।`,
      });
    }

    // ── Top Products ──
    if (orders.length >= 3) {
      const productFreq = {};
      orders.forEach(o => {
        (o.items || []).forEach(item => {
          productFreq[item.name] = (productFreq[item.name] || 0) + item.quantity;
        });
      });
      const sorted = Object.entries(productFreq).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) {
        generated.push({
          type: 'trending',
          icon: TrendingUp,
          color: 'text-purple-600 bg-purple-50 border-purple-200',
          title: 'টপ সেলিং পণ্য',
          body: sorted.slice(0, 3).map(([name, qty], i) => `${i + 1}. ${name} (${qty}টি বিক্রি)`).join(' • '),
        });
      }
    }

    // ── Pricing Suggestion ──
    if (products.length > 0 && orders.length >= 5) {
      const avgOrderValue = totalRevenue / orders.length;
      generated.push({
        type: 'pricing',
        icon: Sparkles,
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        title: 'মূল্য পরামর্শ',
        body: `গড় অর্ডার ভ্যালু ৳${Math.round(avgOrderValue)}। ${avgOrderValue < 200 ? 'কম্বো অফার বা বান্ডেল প্রাইসিং ব্যবহার করলে ভ্যালু বাড়তে পারে।' : 'ভালো পারফর্ম করছে! প্রিমিয়াম পণ্য যোগ করে ভ্যালু আরো বাড়ান।'}`,
      });
    }

    setInsights(generated);
    setLoading(false);
  }, [orders, products]);

  if (loading) {
    return (
      <div className="py-8 text-center">
        <Loader2 size={20} className="animate-spin mx-auto text-slate-300 mb-2" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI বিশ্লেষণ চলছে...</p>
      </div>
    );
  }

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
          <div key={i} className={`border rounded-2xl p-4 shadow-sm ${insight.color}`}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-white/60">
                <insight.icon size={16} />
              </div>
              <div>
                <p className="text-xs font-black mb-1">{insight.title}</p>
                <p className="text-[11px] font-bold leading-relaxed opacity-80">{insight.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
