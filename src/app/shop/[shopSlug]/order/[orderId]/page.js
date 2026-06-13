'use client';
import { useEffect, useState, use } from 'react';
import { Loader2, Download, Package, ArrowLeft, Clock, ShieldAlert, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function LiveCountdown({ deliveryETA }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!deliveryETA) return;
    const update = () => {
      const target = deliveryETA.toDate ? deliveryETA.toDate() : new Date(deliveryETA);
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('00:00:00');
        setIsExpired(true);
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
        const s = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');
        setTimeLeft(`${h}:${m}:${s}`);
      }
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [deliveryETA]);

  if (!deliveryETA) return null;

  return (
    <div className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center ${isExpired ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200 animate-pulse'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Clock size={16} className={isExpired ? 'text-red-500' : 'text-blue-500'} />
        <p className={`text-[10px] font-black uppercase tracking-widest ${isExpired ? 'text-red-600' : 'text-blue-600'}`}>
          {isExpired ? 'ডেলিভারি সময় শেষ' : 'ডেলিভারি পৌঁছানোর সম্ভাব্য সময়'}
        </p>
      </div>
      <p className={`text-3xl font-black tracking-tight font-mono ${isExpired ? 'text-red-700' : 'text-blue-700'}`}>
        {timeLeft}
      </p>
    </div>
  );
}

function DeliveryTracker({ coordinates, status }) {
  const [distance, setDistance] = useState(1200); // initial simulated distance
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!coordinates || typeof window === 'undefined') return;
    let isMounted = true;
    let map = null;
    let interval = null;

    const loadLeaflet = () => {
      return new Promise((resolve) => {
        if (window.L) {
          resolve(window.L);
          return;
        }

        if (!document.getElementById('leaflet-css-tracker')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css-tracker';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
          if (isMounted) resolve(window.L);
        };
        document.head.appendChild(script);
      });
    };

    loadLeaflet().then((L) => {
      if (!isMounted) return;
      const parts = coordinates.split(',');
      if (parts.length !== 2) return;
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (isNaN(lat) || isNaN(lng)) return;

      // Setup Custom Icons
      const customerIcon = L.divIcon({
        className: 'custom-customer-icon',
        html: `<div style="font-size:24px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35));">📍</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      });

      const riderIcon = L.divIcon({
        className: 'custom-rider-icon animate-bounce',
        html: `<div style="font-size:28px;filter:drop-shadow(0 3px 5px rgba(0,0,0,0.4));">🚴</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 34]
      });

      // Initialize map
      map = L.map('tracking-map', { zoomControl: false }).setView([lat + 0.003, lng + 0.003], 15);
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Premium Voyager Tile Layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB'
      }).addTo(map);

      // Customer Marker
      L.marker([lat, lng], { icon: customerIcon }).addTo(map).bindPopup('ডেলিভারি ঠিকানা').openPopup();

      // Ride simulation
      let currentRiderLat = lat + 0.004;
      let currentRiderLng = lng + 0.004;
      const riderMarker = L.marker([currentRiderLat, currentRiderLng], { icon: riderIcon }).addTo(map);

      const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // metres
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // in metres
      };

      setDistance(Math.round(getDistance(currentRiderLat, currentRiderLng, lat, lng)));

      // Simulate rider moving 15% closer every 4s
      interval = setInterval(() => {
        if (status === 'completed') {
          riderMarker.setLatLng([lat, lng]);
          setDistance(0);
          clearInterval(interval);
          return;
        }

        const step = 0.15;
        currentRiderLat = currentRiderLat + (lat - currentRiderLat) * step;
        currentRiderLng = currentRiderLng + (lng - currentRiderLng) * step;

        riderMarker.setLatLng([currentRiderLat, currentRiderLng]);
        const dist = getDistance(currentRiderLat, currentRiderLng, lat, lng);
        setDistance(Math.round(dist));

        if (dist < 10) {
          riderMarker.setLatLng([lat, lng]);
          setDistance(0);
          clearInterval(interval);
        }
      }, 4000);

      setMapLoaded(true);
    }).catch(err => console.error("Leaflet load error:", err));

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
      if (map) map.remove();
    };
  }, [coordinates, status]);

  if (!coordinates) return null;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm space-y-0.5">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-600"></span>
          </span>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">ডেলিভারি ট্র্যাকার (রিয়েল-টাইম)</h3>
        </div>
        {distance > 0 ? (
          <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 animate-pulse">
            রাইডার আপনার থেকে {distance} মিটার দূরে আছে
          </span>
        ) : (
          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            রাইডার আপনার ঠিকানায় পৌঁছে গেছে! 🎉
          </span>
        )}
      </div>
      <div className="h-[250px] w-full bg-slate-100 relative" id="tracking-map">
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-400 bg-slate-50">
            <Loader2 className="animate-spin text-purple-600 mr-2" size={16} />
            লাইভ ট্র্যাকিং ম্যাপ লোড হচ্ছে...
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrderSummaryPage({ params }) {
  const { shopSlug, orderId } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pdfState, setPdfState] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        // Use API route to avoid Firestore client-side permission issues
        const res = await fetch(`/api/order?shopSlug=${encodeURIComponent(shopSlug)}&orderId=${encodeURIComponent(orderId)}`);
        if (res.status === 403) {
          setError('permission');
          return;
        }
        if (!res.ok) {
          // Fallback: try direct Firestore (will work if user is logged in)
          const { getShopBySlug } = await import('@/lib/firestore');
          const { db } = await import('@/lib/firebase');
          const { doc, getDoc } = await import('firebase/firestore');
          const shopData = await getShopBySlug(shopSlug);
          if (!shopData) { setError('not_found'); return; }
          setShop(shopData);
          const orderSnap = await getDoc(doc(db, 'shops', shopData.id, 'orders', orderId));
          if (!orderSnap.exists()) { setError('not_found'); return; }
          setOrder({ id: orderSnap.id, ...orderSnap.data() });
          return;
        }
        const data = await res.json();
        setShop(data.shop);
        setOrder(data.order);
      } catch (err) {
        console.error('[OrderPage]', err);
        // Final fallback: try direct Firestore
        try {
          const { getShopBySlug } = await import('@/lib/firestore');
          const { db } = await import('@/lib/firebase');
          const { doc, getDoc } = await import('firebase/firestore');
          const shopData = await getShopBySlug(shopSlug);
          if (!shopData) { setError('not_found'); return; }
          setShop(shopData);
          const orderSnap = await getDoc(doc(db, 'shops', shopData.id, 'orders', orderId));
          if (!orderSnap.exists()) { setError('not_found'); return; }
          setOrder({ id: orderSnap.id, ...orderSnap.data() });
        } catch (e) {
          if (e?.code === 'permission-denied') {
            setError('permission');
          } else {
            setError('not_found');
          }
        }
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [shopSlug, orderId]);

  const generatePDF = async () => {
    if (isGeneratingPdf) return;
    try {
      setIsGeneratingPdf(true);
      setPdfState('Preparing...');
      setPdfProgress(10);

      const invoiceElement = document.getElementById('pdf-content');
      if (!invoiceElement) throw new Error('Invoice element not found');

      // Make visible for capture
      invoiceElement.style.display = 'block';
      setPdfState('Downloading (40%)');
      setPdfProgress(40);

      const canvas = await html2canvas(invoiceElement, {
        scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff'
      });
      invoiceElement.style.display = 'none';

      setPdfState('Downloading (70%)');
      setPdfProgress(70);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      let heightLeft = pdfHeight;
      let position = 0;

      setPdfState('Downloading (90%)');
      setPdfProgress(90);
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      const orderNum = order.orderIdVisual || order.id.slice(-6);
      pdf.save(`Order_${orderNum}.pdf`);
      setPdfState('Completed ✓');
      setPdfProgress(100);
      toast.success('PDF ডাউনলোড সফল! 📄');
    } catch (err) {
      console.error(err);
      toast.error('PDF ডাউনলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
      setPdfState('');
    } finally {
      setTimeout(() => {
        setIsGeneratingPdf(false);
        setPdfProgress(0);
        setPdfState('');
      }, 2000);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-purple-600" size={32} />
    </div>
  );

  if (error === 'permission') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="bg-white rounded-3xl border border-amber-200 p-8 max-w-sm w-full text-center shadow-sm space-y-4">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert size={28} className="text-amber-600" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900">অর্ডার দেখার অনুমতি নেই</h2>
          <p className="text-sm text-slate-500 font-bold mt-2">এই অর্ডারটি দেখতে আপনাকে সংশ্লিষ্ট ইমেইল দিয়ে লগইন করতে হবে।</p>
        </div>
        <button onClick={() => router.back()} className="w-full py-3 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-purple-600 transition-colors flex items-center justify-center gap-2">
          <ArrowLeft size={16} /> ফিরে যান
        </button>
      </div>
    </div>
  );

  if (!order || !shop || error === 'not_found') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 max-w-sm w-full text-center shadow-sm space-y-4">
        <Package size={40} className="mx-auto text-slate-300" />
        <p className="text-lg font-black text-slate-500">অর্ডার পাওয়া যায়নি</p>
        <button onClick={() => router.back()} className="w-full py-3 bg-slate-100 text-slate-700 rounded-2xl font-black text-sm hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
          <ArrowLeft size={16} /> ফিরে যান
        </button>
      </div>
    </div>
  );

  // Safe number parsing helpers
  const safeNum = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
  const safeInt = (v) => { const n = parseInt(v); return isNaN(n) ? 0 : n; };

  const deliveryFee = safeInt(shop.deliveryConfig?.advanceFee || order.deliveryFee || 0);
  const orderTotal = safeNum(order.total);
  const subtotal = Math.max(0, orderTotal - deliveryFee);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <ArrowLeft size={20} className="text-slate-700" />
          </button>
          <div>
            <h1 className="font-black text-slate-900 text-lg leading-tight">অর্ডার সামারি</h1>
            <p className="text-xs text-slate-500 font-bold">#{order.orderIdVisual || order.id.slice(-6).toUpperCase()}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Status */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900">অর্ডার স্ট্যাটাস</h2>
            <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border ${
              order.status === 'completed' ? 'text-emerald-700 bg-emerald-100 border-emerald-200' 
              : order.status === 'cancelled' ? 'text-red-700 bg-red-100 border-red-200' 
              : 'text-amber-700 bg-amber-100 border-amber-200'}`}>
              {order.status || 'Pending'}
            </span>
          </div>
          {order.returnNote && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">রিটেইলার বার্তা</p>
              <p className="text-sm font-bold text-amber-900">{order.returnNote}</p>
            </div>
          )}
          {order.deliveryETA && <LiveCountdown deliveryETA={order.deliveryETA} />}
        </div>

        {/* Live Tracking Map */}
        {order.coordinates && (
          <DeliveryTracker coordinates={order.coordinates} status={order.status} />
        )}

        {/* PDF Download Button */}
        <button
          onClick={generatePDF}
          disabled={isGeneratingPdf}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-purple-600 transition-colors shadow-xl disabled:opacity-60 relative overflow-hidden"
        >
          {isGeneratingPdf && (
            <div
              className="absolute left-0 top-0 bottom-0 bg-purple-500/50 transition-all duration-500"
              style={{ width: `${pdfProgress}%` }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {isGeneratingPdf
              ? <><Loader2 size={16} className="animate-spin" /> {pdfState}</>
              : <><Download size={16} strokeWidth={2.5} /> ইনভয়েস ডাউনলোড (PDF)</>}
          </span>
        </button>

        {/* Customer Info */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">ডেলিভারি ঠিকানা</h3>
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">নাম</p><p className="text-sm font-bold text-slate-900">{order.customerName}</p></div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ফোন</p><p className="text-sm font-black text-purple-700">{order.customerPhone}</p></div>
          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ঠিকানা</p><p className="text-sm font-bold text-slate-600">{order.customerAddress}</p></div>
          {order.transactionId && (
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction ID</p>
              <p className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded mt-1 inline-block border border-emerald-200">{order.transactionId}</p>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <Package size={16} className="text-slate-500" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">প্রোডাক্ট লিস্ট</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {order.items?.map((item, idx) => (
              <div key={idx} className="p-4 flex gap-4 items-start">
                <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    : <Package size={18} className="text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-black text-slate-900 truncate">{item.name}</p>
                    {item.realBasePrice && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        Base: ৳{item.realBasePrice}
                      </span>
                    )}
                  </div>
                  {item.customizedText && (
                    <div className="mt-1 space-y-0.5">
                      {item.baseUnit && <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">→ Base: {item.baseUnit}</p>}
                      <p className="text-[10px] text-purple-600 font-black uppercase tracking-widest">→ Customized: {item.customizedText}</p>
                    </div>
                  )}
                  {item.note && (
                    <p className="text-xs text-slate-500 font-bold italic mt-1">নোট: {item.note}</p>
                  )}
                  <span className="inline-block text-xs font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md mt-2">
                    {item.quantity} × ৳{safeNum(item.price).toLocaleString()}
                  </span>
                </div>
                <div className="text-right font-black text-slate-900 text-sm flex-shrink-0">
                  ৳{(item.quantity * safeNum(item.price)).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-slate-50 space-y-2 border-t border-slate-200">
            <div className="flex justify-between text-sm font-bold text-slate-600">
              <span>সাবটোটাল</span><span>৳{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-600">
              <span>ডেলিভারি চার্জ</span><span>৳{deliveryFee}</span>
            </div>
            <div className="flex justify-between text-lg font-black text-slate-900 pt-2 border-t border-slate-200">
              <span>সর্বমোট</span><span>৳{safeNum(order.total).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden invoice template for PDF capture */}
      <div
        id="pdf-content"
        style={{ display: 'none', position: 'fixed', top: 0, left: 0, background: 'white', width: '650px', zIndex: -1, padding: '20px', fontFamily: 'sans-serif', color: '#000' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #000', paddingBottom: '10px', marginBottom: '15px' }}>
          <div>
            {shop.logoUrl
              ? <img src={shop.logoUrl} style={{ height: '40px', width: 'auto', marginBottom: '4px' }} alt="Logo" />
              : <div style={{ fontSize: '20px', fontWeight: 900, marginBottom: '2px' }}>{shop.shopName}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Invoice</div>
            <div style={{ fontWeight: 800, fontSize: '11px', marginTop: '4px' }}>
              # {order.orderIdVisual || order.id.slice(-6).toUpperCase()}
            </div>
            <div style={{ fontSize: '10px', fontWeight: 700, marginTop: '4px' }}>
              Date: {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-GB') : 'N/A'}
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px', fontSize: '11px' }}>
          <div>
            <div style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 900, marginBottom: '4px' }}>Billed From</div>
            <div style={{ fontWeight: 900, fontSize: '13px' }}>{shop.shopName}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 900, marginBottom: '4px' }}>Billed To</div>
            <div style={{ fontWeight: 900, fontSize: '13px' }}>{order.customerName}</div>
            <div style={{ fontWeight: 700, maxWidth: '200px', marginLeft: 'auto' }}>{order.customerAddress}</div>
            <div style={{ fontWeight: 900 }}>{order.customerPhone}</div>
          </div>
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #000', borderTop: '1px solid #000', fontSize: '10px', textTransform: 'uppercase', fontWeight: 900 }}>
              <th style={{ padding: '6px 0', textAlign: 'left' }}>Item</th>
              <th style={{ padding: '6px 0', textAlign: 'center' }}>Qty</th>
              <th style={{ padding: '6px 0', textAlign: 'right' }}>Price</th>
              <th style={{ padding: '6px 0', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px dashed #ccc', fontSize: '11px' }}>
                <td style={{ padding: '8px 0', fontWeight: 700 }}>
                  <div style={{ fontWeight: 900 }}>
                    {item.name} {item.realBasePrice && <span style={{ fontSize: '9px', fontWeight: 'bold' }}>(Base: ৳{item.realBasePrice})</span>}
                  </div>
                  {item.customizedText && (
                    <div style={{ marginTop: '2px' }}>
                      {item.baseUnit && <div style={{ fontSize: '9px', fontWeight: 700 }}>Base: {item.baseUnit}</div>}
                      <div style={{ fontSize: '9px', fontWeight: 900, color: '#7c3aed' }}>Customized: {item.customizedText}</div>
                    </div>
                  )}
                  {item.note && (
                    <div style={{ fontSize: '9px', fontStyle: 'italic', marginTop: '2px', color: '#666' }}>Note: {item.note}</div>
                  )}
                </td>
                <td style={{ padding: '8px 0', textAlign: 'center', fontWeight: 700 }}>{item.quantity}</td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700 }}>৳{safeNum(item.price).toLocaleString()}</td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 900 }}>৳{(safeNum(item.price) * item.quantity).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
          <div style={{ width: '200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>
              <span>Subtotal</span><span>৳{subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, marginBottom: '6px' }}>
              <span>Delivery</span><span>৳{deliveryFee}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 900, borderTop: '1px solid #000', paddingTop: '6px' }}>
              <span>Total</span><span>৳{safeNum(order.total).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #000', paddingTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '9px', fontWeight: 700 }}>
          <div>
            {order.transactionId && (
              <p>Txn ID: {order.transactionId}</p>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ marginTop: '4px' }}>Thank you for your business!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
