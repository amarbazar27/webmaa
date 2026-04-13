'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { subscribeOrders, updateOrderStatus, getShop, deleteOrder } from '@/lib/firestore'; 
import { ShoppingBag, Clock, CheckCircle, Truck, XCircle, FileText, Phone, MapPin, Package, ArrowRight, Save, Lock, Trash2 } from 'lucide-react';
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
  const { user, activeShopId } = useAuth();
  const [shop, setShop] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  
  // States for advanced edits
  const [customNote, setCustomNote] = useState({});
  const [countdown, setCountdown] = useState({});
  const [hours, setHours] = useState({});
  const [minutes, setMinutes] = useState({});

  // Security Auth Modal State
  const [authModal, setAuthModal] = useState({ open: false, orderId: null, newStatus: '', pin: '', actionType: 'status' });

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
    if (shop?.authSettings?.actionPin) {
       setAuthModal({ open: true, orderId, newStatus, pin: '', actionType: 'status' });
    } else {
       toast.error('অনুগ্রহ করে সেটিংস থেকে 4-Digit Security PIN সেট করুন!');
    }
  };

  const handleDeleteAttempt = (orderId) => {
    if (shop?.authSettings?.actionPin) {
       setAuthModal({ open: true, orderId, newStatus: 'DELETE', pin: '', actionType: 'delete' });
    } else {
       toast.error('অর্ডার ডিলিট করতে সেটিংস থেকে PIN সেট করা থাকতে হবে!');
    }
  };

  const proceedStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(activeShopId, orderId, newStatus);
      toast.success(`Order marked as ${newStatus}`);
      setAuthModal({ open: false, orderId: null, newStatus: '', pin: '', actionType: 'status' });
    } catch (err) {
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

  const handlePinSubmit = (e) => {
     e.preventDefault();
     if (authModal.pin === shop?.authSettings?.actionPin) {
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

        await updateDoc(orderRef, {
           returnNote: customNote[orderId] || '',
           deliveryCountdownFormatted: formattedCountdown.trim()
        });
        toast.success('অতিরিক্ত তথ্য সেভ হয়েছে!');
     } catch (err) {
        toast.error('সংরক্ষণ ব্যর্থ হয়েছে');
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

      <div className="space-y-10">
        {identifierKeys.map(identifier => {
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
                   {filteredUserOrders.map(order => (
                      <div key={order.id} className="p-6 grid grid-cols-1 xl:grid-cols-12 gap-8 hover:bg-slate-50/50 transition-colors">
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
                                  <p className="text-xs font-bold text-slate-400">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('en-GB') : 'Just now'}</p>
                               </div>
                            </div>
                            
                            <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
                               <div className="flex items-start gap-3">
                                  <MapPin size={16} className="text-slate-400 shrink-0" />
                                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Address</p><p className="text-xs font-bold text-slate-900 leading-relaxed">{order.customerAddress}</p></div>
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
                                     <input type="number" placeholder="দিন" className="w-full text-xs font-black text-slate-900 p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-purple-500" value={countdown[order.id] ?? ''} onChange={e => setCountdown({...countdown, [order.id]: e.target.value})} />
                                     <input type="number" placeholder="ঘণ্টা" className="w-full text-xs font-black text-slate-900 p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-purple-500" value={hours[order.id] ?? ''} onChange={e => setHours({...hours, [order.id]: e.target.value})} />
                                     <input type="number" placeholder="মিনিট" className="w-full text-xs font-black text-slate-900 p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:border-purple-500" value={minutes[order.id] ?? ''} onChange={e => setMinutes({...minutes, [order.id]: e.target.value})} />
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
                                  <button onClick={() => handleStatusAttempt(order.id, 'confirmed')} className="w-full px-3 py-2 rounded-lg text-xs font-black text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white transition-colors border border-blue-200 shadow-sm text-center">Confirm Order</button>
                                  <div className="grid grid-cols-2 gap-2">
                                     <button onClick={() => handleStatusAttempt(order.id, 'cancelled')} className="px-2 py-2 rounded-lg text-[11px] font-black text-red-700 bg-red-50 hover:bg-red-600 hover:text-white transition-colors border border-red-200 shadow-sm">Reject</button>
                                     <button onClick={() => handleStatusAttempt(order.id, 'completed')} className="px-2 py-2 rounded-lg text-[11px] font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white transition-colors border border-emerald-200 shadow-sm">Delivered</button>
                                  </div>
                                  {order.status === 'completed' && (
                                    <button onClick={() => handleDeleteAttempt(order.id)} className="w-full mt-2 px-3 py-2 rounded-lg text-xs font-black text-red-600 bg-white hover:bg-red-50 transition-colors border border-red-100 flex items-center justify-center gap-2 shadow-sm">
                                       <Trash2 size={14} /> Delete Order
                                    </button>
                                  )}
                               </div>
                            </div>

                            <div className="w-full text-right bg-slate-50 p-4 rounded-xl border border-slate-200">
                               <p className="text-xs font-black text-slate-500">{order.items?.length || 0} Products Total</p>
                               <p className="text-2xl font-black text-slate-900 mt-1">৳{order.total}</p>
                               <button className="mt-3 flex items-center justify-center gap-2 w-full py-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-xs font-bold hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 transition-colors shadow-sm">
                                 <FileText size={14} strokeWidth={2.5}/> View Details
                               </button>
                            </div>
                         </div>
                      </div>
                   ))}
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
    </div>
  );
}
