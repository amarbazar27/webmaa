'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { subscribeOrders, updateOrderStatus, getShop, deleteOrder } from '@/lib/firestore'; 
import { ShoppingBag, Clock, CheckCircle, Truck, XCircle, FileText, Phone, MapPin, Package, ArrowRight, Save, Lock, Trash2, Download, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const STATUS_CONFIG = {
  pending: { label: 'Pending', icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  confirmed: { label: 'Confirmed', icon: CheckCircle, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  shipped: { label: 'Shipped', icon: Truck, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  completed: { label: 'Delivered', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  cancelled: { label: 'Rejected', icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200' },
};

export default function OrdersPage() {
  const { user, userData, activeShopId } = useAuth();
  const [shop, setShop] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // States for advanced edits
  const [customNote, setCustomNote] = useState({});
  const [countdown, setCountdown] = useState({});
  const [hours, setHours] = useState({});
  const [minutes, setMinutes] = useState({});

  // Security Auth Modal State
  const [authModal, setAuthModal] = useState({ open: false, orderId: null, newStatus: '', pin: '', actionType: 'status' });
  const [checkedItems, setCheckedItems] = useState({});
  const [expandedSummary, setExpandedSummary] = useState({});
  const [downloadingPdf, setDownloadingPdf] = useState(null);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pdfState, setPdfState] = useState('');

  // Courier booking modal states
  const [courierModalOpen, setCourierModalOpen] = useState(false);
  const [selectedOrderForCourier, setSelectedOrderForCourier] = useState(null);
  const [courierFormData, setCourierFormData] = useState({
    recipientName: '',
    recipientPhone: '',
    recipientAddress: '',
    codAmount: 0,
    note: ''
  });
  const [bookingCourier, setBookingCourier] = useState(false);

  // Map overlay coordinates viewer
  const [mapOverlayCoords, setMapOverlayCoords] = useState(null);

  useEffect(() => {
    if (!activeShopId) return;
    
    // Fetch shop settings to get actionPin
    getShop(activeShopId).then(setShop);

    const unsub = subscribeOrders(activeShopId, (data) => {
      setOrders(data);
      setLoading(false);
    });
    return () => unsub();
  }, [activeShopId]);

  const handleStatusAttempt = (orderId, newStatus) => {
    const orderObj = orders.find(o => o.id === orderId);
    const isUnpaidAutomatedOrder = orderObj && 
      (orderObj.paymentMethod === 'piprapay' || orderObj.paymentMethod === 'automated') && 
      orderObj.paymentStatus !== 'paid';

    if (isUnpaidAutomatedOrder && (newStatus === 'confirmed' || newStatus === 'completed')) {
      toast.error('অটো পেমেন্ট পেন্ডিং থাকা অবস্থায় কনফার্ম বা ডেলিভার করা সম্ভব নয়!');
      return;
    }

    const isVerified = sessionStorage.getItem('pinVerified') === 'true';
    if (isVerified) {
       proceedStatusUpdate(orderId, newStatus);
    } else if (shop?.authSettings?.actionPin) {
       setAuthModal({ open: true, orderId, newStatus, pin: '', actionType: 'status' });
    } else {
       toast.error('অনুগ্রহ করে সেটিংস থেকে 4-Digit Security PIN সেট করুন!');
    }
  };

  const handleDeleteAttempt = (orderId) => {
    const isVerified = sessionStorage.getItem('pinVerified') === 'true';
    if (isVerified) {
       proceedOrderDeletion(orderId);
    } else if (shop?.authSettings?.actionPin) {
       setAuthModal({ open: true, orderId, newStatus: 'DELETE', pin: '', actionType: 'delete' });
    } else {
       toast.error('অর্ডার ডিলিট করতে সেটিংস থেকে PIN সেট করা থাকতে হবে!');
    }
  };

  const proceedStatusUpdate = async (orderId, newStatus) => {
    try {
      const deliveryConfig = newStatus === 'confirmed' ? shop?.deliveryConfig : null;
      const actorInfo = {
        uid: user.uid,
        name: userData?.name || user.displayName || 'Unknown',
        role: userData?.role || 'staff'
      };
      // Pass named actor fields so each action is independently tracked
      await updateOrderStatus(activeShopId, orderId, newStatus, deliveryConfig, actorInfo);
      toast.success(`Order marked as ${newStatus}`);
      setAuthModal({ open: false, orderId: null, newStatus: '', pin: '', actionType: 'status' });
    } catch (err) {
      console.error('Status update error:', err);
      toast.error('Failed to update status');
    }
  };

  const proceedOrderDeletion = async (orderId) => {
    try {
      await deleteOrder(activeShopId, orderId);
      toast.success('অর্ডার চিরতরে মুছে ফেলা হয়েছে!');
      setAuthModal({ open: false, orderId: null, newStatus: '', pin: '', actionType: 'status' });
    } catch (err) {
      toast.error('অর্ডার ডিলিট করতে সমস্যা হয়েছে');
    }
  };

  const openCourierModal = (order) => {
    setSelectedOrderForCourier(order);
    setCourierFormData({
      recipientName: order.customerName || '',
      recipientPhone: order.customerPhone || '',
      recipientAddress: order.customerAddress || '',
      codAmount: parseFloat(order.total) || 0,
      note: order.customerNote || ''
    });
    setCourierModalOpen(true);
  };

  const handleCourierBooking = async (e) => {
    e.preventDefault();
    if (!user || !activeShopId || !selectedOrderForCourier) return;
    setBookingCourier(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/courier/steadfast/create-parcel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          shopId: activeShopId,
          orderId: selectedOrderForCourier.id,
          recipientName: courierFormData.recipientName,
          recipientPhone: courierFormData.recipientPhone,
          recipientAddress: courierFormData.recipientAddress,
          codAmount: Number(courierFormData.codAmount) || 0,
          note: courierFormData.note
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to book parcel');
      }

      toast.success('পার্সেল সফলভাবে বুক করা হয়েছে! 🎉');
      setCourierModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(`বুকিং ব্যর্থ: ${err.message}`);
    } finally {
      setBookingCourier(false);
    }
  };

  const handlePinSubmit = (e) => {
     e.preventDefault();
     if (authModal.pin === shop?.authSettings?.actionPin) {
        sessionStorage.setItem('pinVerified', 'true');
        if (authModal.actionType === 'delete') {
           proceedOrderDeletion(authModal.orderId);
        } else {
           proceedStatusUpdate(authModal.orderId, authModal.newStatus);
        }
     } else {
        toast.error('পিন নম্বর ভুল হয়েছে!');
     }
  };

  const saveAdvancedFields = async (orderId) => {
     try {
        const orderRef = doc(db, 'shops', activeShopId, 'orders', orderId);
        
        let formattedCountdown = '';
        const d = countdown[orderId];
        const h = hours[orderId];
        const m = minutes[orderId];
        if (d) formattedCountdown += `${d} দিন `;
        if (h) formattedCountdown += `${h} ঘণ্টা `;
        if (m) formattedCountdown += `${m} মিনিট`;

        // Calculate actual ETA timestamp
        let etaMillis = 0;
        if (d) etaMillis += parseInt(d) * 24 * 60 * 60 * 1000;
        if (h) etaMillis += parseInt(h) * 60 * 60 * 1000;
        if (m) etaMillis += parseInt(m) * 60 * 1000;

        await updateDoc(orderRef, {
           returnNote: customNote[orderId] || '',
           deliveryCountdownFormatted: formattedCountdown.trim(),
           deliveryETA: etaMillis > 0 ? new Date(Date.now() + etaMillis) : null
        });
        toast.success('অতিরিক্ত তথ্য সেভ হয়েছে!');
     } catch (err) {
        toast.error('সংরক্ষণ ব্যর্থ হয়েছে');
     }
  };

  // ── Admin PDF Generator ──────────────────────────
  const generateAdminPDF = async (order) => {
    if (downloadingPdf === order.id) return;
    setDownloadingPdf(order.id);
    setPdfProgress(10);
    const toastId = toast.loading('আপনার PDF তৈরি হচ্ছে... (10%)');
    
    try {
      const { default: html2canvas } = await import('html2canvas');
      setPdfProgress(30);
      const { default: jsPDF } = await import('jspdf');
      
      const el = document.createElement('div');
      el.style.cssText = 'position:fixed;left:-9999px;top:0;width:595px;padding:40px;background:white;font-family:Arial,sans-serif;color:black;';
      const taka = String.fromCharCode(2547);
      
      // BLACK & WHITE THEME
      el.innerHTML = `
        <div style="text-align:center;border-bottom:2px solid black;padding-bottom:20px;margin-bottom:20px">
          <h1 style="font-size:24px;font-weight:900;color:black;margin:0">${shop?.shopName || 'Store'}</h1>
          <p style="font-size:12px;color:black;margin:4px 0 0">Order Invoice</p>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:16px">
          <div>
            <p style="font-size:10px;color:#333;text-transform:uppercase;font-weight:700;margin:0">Order ID</p>
            <p style="font-size:18px;font-weight:900;color:black;margin:4px 0 0">#${order.orderNumber || order.orderIdVisual || order.id.slice(-6).toUpperCase()}</p>
          </div>
          <div style="text-align:right">
            <p style="font-size:10px;color:#333;text-transform:uppercase;font-weight:700;margin:0">Status</p>
            <p style="font-size:14px;font-weight:900;color:black;margin:4px 0 0">${order.status || 'Pending'}</p>
          </div>
        </div>
        <div style="border:1px solid black;padding:16px;margin-bottom:16px">
          <p style="font-size:10px;color:#333;text-transform:uppercase;font-weight:700;margin:0 0 8px">Customer</p>
          <p style="margin:4px 0;font-size:13px;font-weight:700;color:black">${order.customerEmail || order.customerPhone || 'N/A'}</p>
          <p style="margin:4px 0;font-size:12px;color:black">${order.customerAddress || ''}</p>
          ${order.transactionId ? `<p style="margin:8px 0 0;font-size:11px;color:black;font-weight:700">TxnID: ${order.transactionId}</p>` : ''}
          ${order.customerNote ? `<p style="margin:4px 0 0;font-size:11px;color:black;font-style:italic">Note: ${order.customerNote}</p>` : ''}
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
          <thead><tr style="border-bottom:2px solid black;color:black">
            <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:700">Item</th>
            <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:700">Qty</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:700">Price</th>
          </tr></thead>
          <tbody>
            ${(order.items || []).map((item, i) => `
              <tr style="border-bottom:1px solid #ccc;">
                <td style="padding:10px 12px;font-size:12px;font-weight:700;color:black">${item.name}
                  ${item.customizedText ? `<br><span style="font-size:10px;color:#555;font-weight:700;">→ Base: ${item.baseUnit || 'N/A'}</span><br><span style="font-size:10px;color:#9333ea;font-weight:900;">→ Customized: ${item.customizedText}</span>` : (item.note ? `<br><span style="font-size:10px;color:#555">${item.note}</span>` : '')}
                </td>
                <td style="padding:10px 12px;text-align:center;font-size:12px;font-weight:700;color:black">${item.quantity}</td>
                <td style="padding:10px 12px;text-align:right;font-size:12px;font-weight:900;color:black">${taka}${(parseFloat(item.price)*item.quantity).toFixed(0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="display:flex;justify-content:space-between;border:2px solid black;color:black;padding:14px 16px;">
          <span style="font-size:16px;font-weight:900">Total</span>
          <span style="font-size:20px;font-weight:900">${taka}${order.total}</span>
        </div>
        <p style="text-align:center;margin-top:20px;font-size:10px;color:#333;font-weight:bold;">Powered by bdretailers.com Admin Panel</p>
      `;
      document.body.appendChild(el);
      
      setPdfProgress(50);
      toast.loading('PDF রেন্ডার হচ্ছে... (50%)', { id: toastId });
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      document.body.removeChild(el);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      let heightLeft = pdfHeight;
      let position = 0;
      
      setPdfProgress(90);
      toast.loading('PDF সেভ হচ্ছে... (90%)', { id: toastId });
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Invoice_${order.orderNumber || order.orderIdVisual || order.id.slice(-6)}.pdf`);
      setPdfProgress(100);
      toast.success('PDF সফলভাবে ডাউনলোড হয়েছে! 📄', { id: toastId });
    } catch (err) {
      toast.error('PDF ডাউনলোড ব্যর্থ হয়েছে!', { id: toastId });
      console.error(err);
    } finally {
      setTimeout(() => {
        setDownloadingPdf(null);
        setPdfProgress(0);
      }, 500);
    }
  };

  // ── Helpers for item checklist ──────────────────────────────────
  const allItemsChecked = (orderId, items) => {
    if (!items || items.length === 0) return true;
    const order = orders.find(o => o.id === orderId);
    const packed = order?.packedItems || [];
    return items.every((_, idx) => packed.includes(idx));
  };

  const toggleItemCheck = async (orderId, idx) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const packed = [...(order.packedItems || [])];
      const foundIdx = packed.indexOf(idx);
      if (foundIdx > -1) {
        packed.splice(foundIdx, 1);
      } else {
        packed.push(idx);
      }
      const orderRef = doc(db, 'shops', activeShopId, 'orders', orderId);
      await updateDoc(orderRef, { packedItems: packed });
    } catch (err) {
      console.error("Checklist toggle error:", err);
      toast.error('চেকলিস্ট সেভ করতে সমস্যা হয়েছে');
    }
  };

  const checkAllItems = async (orderId, items) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const allChecked = allItemsChecked(orderId, items);
      let packed = [];
      if (!allChecked) {
        packed = (items || []).map((_, idx) => idx);
      }
      const orderRef = doc(db, 'shops', activeShopId, 'orders', orderId);
      await updateDoc(orderRef, { packedItems: packed });
    } catch (err) {
      console.error("Checklist check all error:", err);
      toast.error('চেকলিস্ট সেভ করতে সমস্যা হয়েছে');
    }
  };

  // Grouping by Phone/Email algorithm
  const groupedOrders = orders.reduce((acc, order) => {
     const identifier = order.customerEmail || order.customerPhone || 'Unknown Customer';
     if (!acc[identifier]) acc[identifier] = [];
     acc[identifier].push(order);
     return acc;
  }, {});

  const identifierKeys = Object.keys(groupedOrders);

  if (loading) {
     return (
        <div className="py-20 text-center">
           <div className="w-10 h-10 border-4 border-slate-100 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
           <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Loading Network Data...</p>
        </div>
     );
  }

  if (orders.length === 0) {
      return (
        <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-slate-200">
          <ShoppingBag size={64} className="mx-auto mb-6 text-slate-200" />
          <h3 className="text-xl font-black text-slate-400">কোনো অর্ডার পাওয়া যায়নি</h3>
          <p className="text-slate-400 text-sm mt-2 font-medium">আপনার স্টোরে যখনই কেউ কিছু অর্ডার করবে, তা এখানে দেখা যাবে।</p>
        </div>
      );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-slide-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Order Management</h1>
          <p className="text-sm text-slate-500 font-medium">Verify Transactions, Set Countdowns, and Group by Customer.</p>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 bg-white border border-slate-200 p-2 rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="pl-3 text-slate-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </div>
          <input
            type="text"
            placeholder="Search by customer name, phone, or order ID..."
            className="bg-transparent border-none outline-none w-full py-2 text-sm font-bold text-slate-700 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'confirmed', 'shipped', 'completed', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors border ${
                filter === s
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-10">
        {identifierKeys
          .filter(identifier => {
            if (!searchTerm.trim()) return true;
            const term = searchTerm.toLowerCase();
            // Check if identifier (phone/email) matches
            if (identifier.toLowerCase().includes(term)) return true;
            // Check orders for name or order ID match
            return groupedOrders[identifier].some(o =>
              (o.customerName || '').toLowerCase().includes(term) ||
              (o.orderIdVisual || '').toLowerCase().includes(term) ||
              (o.id || '').toLowerCase().includes(term)
            );
          })
          .map(identifier => {
           const userOrders = groupedOrders[identifier];
           const filteredUserOrders = filter === 'all' ? userOrders : userOrders.filter(o => o.status === filter);
           
           if (filteredUserOrders.length === 0) return null;

           return (
             <div key={identifier} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-900 text-white font-black flex items-center justify-center rounded-2xl shadow-sm">{identifier[0]}</div>
                      <div>
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight">Customer Network Group</p>
                         <p className="text-xl font-black text-slate-900">{identifier}</p>
                      </div>
                   </div>
                   <div className="px-4 py-1.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-xl text-xs font-black shadow-sm">
                      {userOrders.length} Orders
                   </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {filteredUserOrders.map(order => {
                        const isUnpaidAutomatedOrder = (order.paymentMethod === 'piprapay' || order.paymentMethod === 'automated') && order.paymentStatus !== 'paid';
                        return (
                          <div key={order.id} className="border-b border-slate-100 last:border-0">
                       <div className="p-6 grid grid-cols-1 xl:grid-cols-12 gap-8 hover:bg-slate-50/50 transition-colors">
                         {/* Order Info & Status */}
                         <div className="xl:col-span-4 space-y-5">
                            <div className="flex justify-between items-start">
                               <div>
                                  <div className="flex items-center gap-2 mb-1">
                                     <h3 className="font-black text-slate-900 text-lg">Order #{order.orderIdVisual || order.id.slice(-6).toUpperCase()}</h3>
                                     <div className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${STATUS_CONFIG[order.status || 'pending'].color}`}>
                                        {STATUS_CONFIG[order.status || 'pending'].label}
                                     </div>
                                  </div>
                                  {order.fraudRiskLevel && (
                                     <div className="flex flex-wrap items-center gap-1.5 mt-1.5 mb-2">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                          order.fraudRiskLevel === 'very_high' ? 'bg-red-50 text-red-700 border-red-200' :
                                          order.fraudRiskLevel === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                          order.fraudRiskLevel === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                          'bg-green-50 text-green-700 border-green-200'
                                        }`}>
                                           🛡️ Risk: {order.fraudRiskLevel.replace('_', ' ')} ({order.fraudScore}%)
                                        </span>
                                        {order.fraudReasons && order.fraudReasons.length > 0 && (
                                           <span className="text-[9px] text-slate-400 font-bold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                                              {order.fraudReasons.join(', ')}
                                           </span>
                                        )}
                                     </div>
                                  )}
                                  {isUnpaidAutomatedOrder && (
                                     <div className="mt-1 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-black flex items-center gap-1.5 animate-pulse">
                                        <AlertCircle size={14} />
                                        <span>Awaiting Payment (অটো পেমেন্ট পেন্ডিং)</span>
                                     </div>
                                  )}
                                  <p className="text-xs font-bold text-slate-400 mt-1">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('en-GB') : 'Just now'}</p>
                                  {/* Who confirmed / delivered this order */}
                                  {(order.confirmedBy || order.deliveredBy || order.updatedBy) && (
                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                      {order.confirmedBy && (
                                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                                          ✓ Confirmed: {order.confirmedBy.name}
                                        </span>
                                      )}
                                      {order.deliveredBy && (
                                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                                          🚚 Delivered: {order.deliveredBy.name}
                                        </span>
                                      )}
                                      {!order.confirmedBy && !order.deliveredBy && order.updatedBy && (
                                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full">
                                          ↻ Updated: {order.updatedBy.name}
                                        </span>
                                      )}
                                    </div>
                                  )}
                               </div>
                            </div>
                            
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
                               <div className="flex items-start gap-3">
                                  <MapPin size={16} className="text-slate-400 shrink-0" />
                                  <div>
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Address</p>
                                     <p className="text-xs font-bold text-slate-900 leading-relaxed">{order.customerAddress}</p>
                                     {order.coordinates && (
                                       <button
                                         onClick={() => setMapOverlayCoords(order.coordinates)}
                                         className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-pink-600 bg-pink-50 hover:bg-pink-600 hover:text-white px-2.5 py-1 rounded-full border border-pink-100 transition-colors shadow-sm cursor-pointer"
                                       >
                                         📍 View on Map
                                       </button>
                                     )}
                                  </div>
                               </div>
                               {order.customerNote && (
                                 <div className="flex items-start gap-3 pt-2 border-t border-slate-100">
                                    <FileText size={16} className="text-amber-500 shrink-0" />
                                    <div><p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Customer Note</p><p className="text-xs font-bold text-amber-900">{order.customerNote}</p></div>
                                 </div>
                               )}
                               {order.transactionId && (
                                 <div className="flex items-start gap-3 pt-2 border-t border-slate-100">
                                    <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                                    <div><p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Advance Txn ID</p><p className="text-xs font-black text-emerald-900 tracking-wider bg-emerald-100 px-2 rounded mt-1 inline-block border border-emerald-200">{order.transactionId}</p></div>
                                 </div>
                               )}
                               {order.paymentScreenshot && (
                                 <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
                                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest flex items-center gap-1">📸 Payment Screenshot</p>
                                    <div className="relative group max-w-[120px] rounded-lg overflow-hidden border border-slate-200 shadow-sm cursor-zoom-in">
                                      <img 
                                        src={order.paymentScreenshot} 
                                        alt="Payment Proof" 
                                        onClick={() => {
                                          const w = window.open();
                                          w.document.write(`<img src="${order.paymentScreenshot}" style="max-width:100%;height:auto;display:block;margin:auto;" />`);
                                        }}
                                        className="w-full h-16 object-cover hover:scale-105 transition-transform duration-300" 
                                      />
                                    </div>
                                 </div>
                               )}
                            </div>
                         </div>

                         {/* Action Config (Return note & Countdown) */}
                         <div className="xl:col-span-5 space-y-4">
                            <div className="space-y-1.5">
                               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">রিটার্ন মেসেজ (কাস্টমারকে)</label>
                               <textarea
                                 rows={2}
                                 className="w-full text-xs font-bold text-slate-900 p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-purple-500 transition-colors placeholder:text-slate-400"
                                 placeholder="আপনার পেমেন্ট পাইনি, অনুগ্রহ করে যোগাযোগ করুন..."
                                 value={customNote[order.id] ?? (order.returnNote || '')}
                                 onChange={e => setCustomNote({...customNote, [order.id]: e.target.value})}
                               />
                            </div>
                            <div className="flex gap-2 items-end">
                               <div className="flex-1 space-y-1.5">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ডেলিভারি সময় সেট করুন</label>
                                  <div className="grid grid-cols-3 gap-2">
                                     <input type="number" placeholder="দিন" className="w-full text-xs font-black text-slate-900 p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-purple-500" value={countdown[order.id] ?? (order.deliveryCountdownFormatted?.match(/(\d+)\s*দিন/)?.[1] || '')} onChange={e => setCountdown({...countdown, [order.id]: e.target.value})} />
                                     <input type="number" placeholder="ঘণ্টা" className="w-full text-xs font-black text-slate-900 p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-purple-500" value={hours[order.id] ?? (order.deliveryCountdownFormatted?.match(/(\d+)\s*ঘণ্টা/)?.[1] || '')} onChange={e => setHours({...hours, [order.id]: e.target.value})} />
                                     <input type="number" placeholder="মিনিট" className="w-full text-xs font-black text-slate-900 p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-purple-500" value={minutes[order.id] ?? (order.deliveryCountdownFormatted?.match(/(\d+)\s*মিনিট/)?.[1] || '')} onChange={e => setMinutes({...minutes, [order.id]: e.target.value})} />
                                  </div>
                               </div>
                               <button onClick={() => saveAdvancedFields(order.id)} className="w-[46px] h-[46px] bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-purple-600 transition-colors shadow-md tooltip" title="Save Info">
                                  <Save size={18} strokeWidth={2.5}/>
                               </button>
                            </div>
                            {order.deliveryCountdownFormatted && (
                               <p className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-1.5 rounded border border-purple-100 inline-block mt-2">
                                  সেভ করা সময়: {order.deliveryCountdownFormatted}
                               </p>
                            )}
                         </div>

                         {/* Final Status Control & Summary */}
                         <div className="xl:col-span-3 flex flex-col justify-between items-end border-l border-slate-100 pl-6 space-y-4">
                            <div className="w-full">
                               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-right mb-2">Change Status <Lock size={10} className="inline mb-0.5"/></p>
                               <div className="flex flex-col gap-2">
                                  <button 
                                     onClick={() => handleStatusAttempt(order.id, 'confirmed')} 
                                     disabled={isUnpaidAutomatedOrder}
                                     title={isUnpaidAutomatedOrder ? 'পেমেন্ট সম্পন্ন না হওয়া পর্যন্ত কনফার্ম করা যাবে না' : ''}
                                     className={`w-full px-3 py-2 rounded-lg text-xs font-black transition-colors border shadow-sm text-center ${
                                       isUnpaidAutomatedOrder
                                         ? 'text-slate-400 bg-slate-100 border-slate-200 cursor-not-allowed'
                                         : 'text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white border-blue-200'
                                     }`}
                                  >
                                     Confirm Order
                                  </button>
                                  <div className="grid grid-cols-2 gap-2">
                                     <button onClick={() => handleStatusAttempt(order.id, 'cancelled')} className="px-2 py-2 rounded-lg text-[11px] font-black text-red-700 bg-red-50 hover:bg-red-600 hover:text-white transition-colors border border-red-200 shadow-sm">Reject</button>
                                     <button 
                                        onClick={() => handleStatusAttempt(order.id, 'completed')} 
                                        disabled={!allItemsChecked(order.id, order.items) || isUnpaidAutomatedOrder}
                                        title={isUnpaidAutomatedOrder ? 'পেমেন্ট সম্পন্ন না হওয়া পর্যন্ত Delivered করা যাবে না' : (!allItemsChecked(order.id, order.items) ? 'সব আইটেম চেক করুন তারপর Delivered দিন' : '')}
                                        className={`px-2 py-2 rounded-lg text-[11px] font-black transition-colors border shadow-sm ${
                                          allItemsChecked(order.id, order.items) && !isUnpaidAutomatedOrder
                                            ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white border-emerald-200'
                                            : 'text-slate-400 bg-slate-100 border-slate-200 cursor-not-allowed'
                                        }`}
                                      >
                                        {allItemsChecked(order.id, order.items) && !isUnpaidAutomatedOrder ? '✓ Delivered' : '🔒 Delivered'}
                                      </button>
                                  </div>
                                  {(order.status === 'completed' || order.status === 'cancelled') && (
                                    <button onClick={() => handleDeleteAttempt(order.id)} className="w-full mt-2 px-3 py-2 rounded-lg text-xs font-black text-red-600 bg-white hover:bg-red-50 transition-colors border border-red-100 flex items-center justify-center gap-2 shadow-sm">
                                       <Trash2 size={14} /> Delete Order
                                    </button>
                                  )}

                                  {/* Steadfast Courier Parcel Controls */}
                                  {shop?.courierConfig?.steadfastEnabled && (
                                     <div className="mt-4 pt-4 border-t border-slate-100 w-full text-left">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">🚚 Courier Shipping</p>
                                        {order.consignmentId ? (
                                           <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                                              <div className="flex justify-between items-center">
                                                 <span className="text-[9px] font-black text-slate-400 uppercase">Steadfast Status</span>
                                                 <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-purple-50 text-purple-700 border border-purple-100">
                                                    {order.courierStatus || 'Pending'}
                                                 </span>
                                              </div>
                                              <p className="text-[10px] font-extrabold text-slate-700">Consignment: {order.consignmentId}</p>
                                              <p className="text-[10px] font-extrabold text-slate-700">Tracking: {order.trackingCode}</p>
                                              <a
                                                 href={`https://steadfast.com.bd/t/${order.trackingCode}`}
                                                 target="_blank"
                                                 rel="noreferrer"
                                                 className="w-full py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest text-center block hover:bg-purple-600 transition-colors mt-2"
                                              >
                                                 Track Parcel
                                              </a>
                                           </div>
                                        ) : (
                                           <button
                                              onClick={() => openCourierModal(order)}
                                              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest text-center block transition-colors shadow-md shadow-purple-500/10 cursor-pointer"
                                           >
                                              Send to Steadfast
                                           </button>
                                        )}
                                     </div>
                                  )}
                               </div>
                            </div>

                            <div className="w-full text-right bg-slate-50 p-4 rounded-xl border border-slate-200">
                                {order.customImage && (
                                  <div className="mb-4 text-left w-full">
                                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><FileText size={12}/> Customer Provided Image</p>
                                    <div className="relative group cursor-pointer overflow-hidden rounded-[1.5rem] border-2 border-purple-100 bg-white shadow-md aspect-[9/16] w-full max-w-[240px] mx-auto" onClick={() => window.open(order.customImage, '_blank')}>
                                      <img src={order.customImage} alt="Order Attachment" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="text-white text-[10px] font-black uppercase tracking-widest">বড় করে দেখুন</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                               <p className="text-xs font-black text-slate-500">{order.items?.length || 0} Products Total</p>
                               <p className="text-2xl font-black text-slate-900 mt-1">৳{order.total}</p>

                                {/* Packing Checklist Toggle */}
                                <button
                                  onClick={() => setExpandedSummary(prev => ({ ...prev, [order.id]: !prev[order.id] }))}
                                  className={`mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-black transition-colors border shadow-sm ${
                                    expandedSummary[order.id]
                                      ? 'bg-amber-500 text-white border-amber-500'
                                      : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                  }`}
                                >
                                  <Package size={14} />
                                  {expandedSummary[order.id] ? 'চেকলিস্ট বন্ধ করুন ▲' : 'প্যাকিং চেকলিস্ট ▼'}
                                </button>

                                <button 
                                 onClick={() => generateAdminPDF(order)} 
                                 disabled={downloadingPdf === order.id}
                                 className="mt-2 flex items-center justify-center gap-2 w-full py-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-xs font-bold hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-colors shadow-sm disabled:opacity-50 relative overflow-hidden"
                               >
                                 {downloadingPdf === order.id && <div className="absolute left-0 top-0 bottom-0 bg-purple-500/20 transition-all duration-300" style={{ width: `${pdfProgress}%` }} />}
                                 <span className="relative z-10 flex items-center gap-2">
                                   {downloadingPdf === order.id ? <><div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin"></div> {pdfProgress}%</> : <><Download size={14} strokeWidth={2.5}/> PDF ডাউনলোড</>}
                                 </span>
                               </button>
                            </div>
                         </div>
                      </div>

                      {/* ── Packing Checklist Expanded Panel ── */}
                      {expandedSummary[order.id] && (
                        <div className="mx-6 mb-6 bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden shadow-sm">
                          <div className="px-5 py-3 bg-amber-100 border-b border-amber-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Package size={16} className="text-amber-700" />
                              <p className="text-xs font-black text-amber-800 uppercase tracking-widest">অর্ডার প্যাকিং চেকলিস্ট</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-amber-700">
                                {(order.items || []).filter((_, idx) => (order.packedItems || []).includes(idx)).length} / {order.items?.length || 0} চেক করা হয়েছে
                              </span>
                              <button
                                onClick={() => checkAllItems(order.id, order.items)}
                                className="text-[10px] font-black text-amber-700 bg-white border border-amber-300 px-2.5 py-1 rounded-lg hover:bg-amber-700 hover:text-white transition-colors"
                              >
                                {allItemsChecked(order.id, order.items) ? 'সব আনচেক' : 'সব চেক করুন'}
                              </button>
                            </div>
                          </div>
                          <div className="divide-y divide-amber-100">
                            {(order.items || []).map((item, idx) => {
                              const isChecked = (order.packedItems || []).includes(idx);
                              return (
                                <div
                                  key={idx}
                                  onClick={() => toggleItemCheck(order.id, idx)}
                                  className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-all ${
                                    isChecked ? 'bg-emerald-50' : 'hover:bg-amber-100/50'
                                  }`}
                                >
                                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                    isChecked
                                      ? 'bg-emerald-500 border-emerald-500 shadow-sm'
                                      : 'border-amber-400 bg-white'
                                  }`}>
                                    {isChecked && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-black leading-tight ${
                                      isChecked ? 'text-emerald-700 line-through opacity-60' : 'text-slate-900'
                                    }`}>{item.name}</p>
                                    {item.customizedText && (
                                      <p className="text-[10px] font-bold text-purple-600 mt-0.5">→ {item.customizedText}</p>
                                    )}
                                    {item.note && (
                                      <p className="text-[10px] font-bold text-slate-400 italic mt-0.5">নোট: {item.note}</p>
                                    )}
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <p className="text-xs font-black text-slate-700">{item.quantity} পিস</p>
                                    <p className="text-[10px] font-bold text-slate-500">৳{parseFloat(item.price || 0) * (item.quantity || 1)}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {!allItemsChecked(order.id, order.items) && (
                            <div className="px-5 py-3 bg-red-50 border-t border-amber-200 flex items-center gap-2">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                              <p className="text-xs font-black text-red-600">সব পণ্য চেক না হওয়া পর্যন্ত Delivered দেওয়া যাবে না</p>
                            </div>
                          )}
                          {allItemsChecked(order.id, order.items) && order.items?.length > 0 && (
                            <div className="px-5 py-3 bg-emerald-50 border-t border-amber-200 flex items-center gap-2">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                              <p className="text-xs font-black text-emerald-600">সব পণ্য প্যাক করা হয়েছে! এখন Delivered মার্ক করতে পারবেন।</p>
                            </div>
                          )}
                        </div>
                      )}
                       </div>
                        );
                    })}
                 </div>
               </div>
            );
          })}
      </div>

      {/* Security PIN Modal */}
      {authModal.open && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setAuthModal({...authModal, open: false})} />
            <div className="relative w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl border border-slate-200 animate-slide-in">
               <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-5 mx-auto shadow-inner border border-red-100">
                  <Lock size={24} strokeWidth={2.5}/>
               </div>
               <h2 className="text-xl font-black text-slate-900 text-center mb-2">Security Verification</h2>
               <p className="text-sm font-bold text-slate-500 text-center mb-6">স্ট্যাটাস (<span className="text-purple-600 uppercase tracking-widest">{authModal.newStatus}</span>) পরিবর্তন করতে আপনার 4-Digit PIN প্রদান করুন।</p>
               
               <form onSubmit={handlePinSubmit} className="space-y-4">
                  <input 
                     required
                     autoFocus
                     type="password" 
                     maxLength={4}
                     placeholder="• • • •" 
                     className="w-full text-center text-3xl tracking-[1em] font-black p-4 rounded-xl bg-slate-50 border-2 border-slate-200 outline-none focus:border-purple-600 focus:bg-white transition-all shadow-sm"
                     value={authModal.pin}
                     onChange={e => setAuthModal({...authModal, pin: e.target.value.replace(/\D/g, '')})}
                  />
                  <div className="flex gap-3 pt-2">
                     <button type="button" onClick={() => setAuthModal({...authModal, open: false})} className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl transition-colors">Cancel</button>
                     <button type="submit" className="flex-1 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl transition-colors shadow-md">Confirm</button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* Steadfast Courier Booking Modal */}
      {courierModalOpen && selectedOrderForCourier && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setCourierModalOpen(false)} />
            <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 animate-slide-in" onClick={e => e.stopPropagation()}>
               <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-5 shadow-inner border border-purple-100">
                  <Truck size={24} strokeWidth={2.5}/>
               </div>
               <h2 className="text-xl font-black text-slate-900 mb-1">Send to Steadfast Courier</h2>
               <p className="text-xs font-bold text-slate-500 mb-6">নিচের তথ্যগুলো যাচাই করে বুকিং নিশ্চিত করুন।</p>
               
               <form onSubmit={handleCourierBooking} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Recipient Name</label>
                        <input 
                           required 
                           type="text"
                           className="w-full text-xs font-bold text-slate-950 p-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 outline-none"
                           value={courierFormData.recipientName}
                           onChange={e => setCourierFormData({...courierFormData, recipientName: e.target.value})}
                        />
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Recipient Phone</label>
                        <input 
                           required 
                           type="text"
                           className="w-full text-xs font-bold text-slate-950 p-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 outline-none"
                           value={courierFormData.recipientPhone}
                           onChange={e => setCourierFormData({...courierFormData, recipientPhone: e.target.value})}
                        />
                     </div>
                  </div>

                  <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Delivery Address</label>
                     <textarea 
                        required 
                        rows={2}
                        className="w-full text-xs font-bold text-slate-950 p-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 outline-none resize-none"
                        value={courierFormData.recipientAddress}
                        onChange={e => setCourierFormData({...courierFormData, recipientAddress: e.target.value})}
                     />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">COD Amount (৳)</label>
                        <input 
                           required 
                           type="number"
                           className="w-full text-xs font-black text-slate-950 p-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 outline-none"
                           value={courierFormData.codAmount}
                           onChange={e => setCourierFormData({...courierFormData, codAmount: e.target.value})}
                        />
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Note (Optional)</label>
                        <input 
                           type="text"
                           className="w-full text-xs font-bold text-slate-950 p-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-600 outline-none"
                           value={courierFormData.note}
                           onChange={e => setCourierFormData({...courierFormData, note: e.target.value})}
                        />
                     </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                     <button type="button" onClick={() => setCourierModalOpen(false)} className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl transition-colors">Cancel</button>
                     <button type="submit" disabled={bookingCourier} className="flex-1 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl transition-colors shadow-md flex items-center justify-center gap-2">
                        {bookingCourier ? 'Booking...' : 'Confirm Booking'}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* Map Location Overlay Viewer */}
      {mapOverlayCoords && (
         <GoogleMapViewer 
            coords={mapOverlayCoords} 
            apiKey={shop?.googleMapsApiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY} 
            onClose={() => setMapOverlayCoords(null)} 
         />
      )}
    </div>
  );
}

// Subcomponent to view Google Map for Customer Address
function GoogleMapViewer({ coords, onClose, apiKey }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!apiKey || !coords || !mapRef.current) return;
    
    const loadMap = () => {
      if (window.google && window.google.maps) {
        const map = new window.google.maps.Map(mapRef.current, {
          center: coords,
          zoom: 17,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        });
        new window.google.maps.Marker({
          position: coords,
          map,
          icon: {
            path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            fillColor: '#db2777',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 6
          }
        });
        return;
      }
      
      const scriptId = 'google-maps-viewer-script';
      let script = document.getElementById(scriptId);
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&language=bn`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      
      script.onload = () => {
        if (!mapRef.current) return;
        const map = new window.google.maps.Map(mapRef.current, {
          center: coords,
          zoom: 17,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        });
        new window.google.maps.Marker({
          position: coords,
          map,
          icon: {
            path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            fillColor: '#db2777',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 6
          }
        });
      };
    };
    
    loadMap();
  }, [coords, apiKey]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-lg h-[60vh] bg-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-slide-in" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-black text-slate-800 text-sm">গ্রাহকের ম্যাপ লোকেশন (Customer Location Pin)</h3>
            <p className="text-[10px] text-slate-400 font-bold">অর্ডারের সঠিক পিনপয়েন্ট ম্যাপ ভিউ</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 w-full bg-slate-50" ref={mapRef} />
      </div>
    </div>
  );
}
