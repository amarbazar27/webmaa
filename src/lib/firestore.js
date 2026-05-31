import { 
  collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, addDoc,
  query, where, orderBy, serverTimestamp, onSnapshot, limit, increment, runTransaction
} from 'firebase/firestore';
import { db } from './firebase';

// ── SHOP ──────────────────────────────────────────
export const getShop = async (shopId) => {
  const snap = await getDoc(doc(db, 'shops', shopId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getAllShops = async () => {
  const snap = await getDocs(collection(db, 'shops'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getShopBySlug = async (slug) => {
  if (!slug) return null;
  // Indexing fix: Check both fields as some legacy stores might use shopSlug
  const q1 = query(collection(db, 'shops'), where('subdomainSlug', '==', slug));
  const snap1 = await getDocs(q1);
  if (!snap1.empty) return { id: snap1.docs[0].id, ...snap1.docs[0].data() };

  const q2 = query(collection(db, 'shops'), where('shopSlug', '==', slug));
  const snap2 = await getDocs(q2);
  if (!snap2.empty) return { id: snap2.docs[0].id, ...snap2.docs[0].data() };
  
  return null;
};



export const updateShop = async (shopId, data) => {
  const shopDocRef = doc(db, 'shops', shopId);
  return updateDoc(shopDocRef, { ...data, updatedAt: serverTimestamp() });
};

// Super admin: স্টোর পজ করা (isActive = false)
export const pauseShop = async (shopId) => {
  return updateDoc(doc(db, 'shops', shopId), { isActive: false, pausedAt: serverTimestamp() });
};

// Super admin: স্টোর চালু করা (isActive = true)
export const resumeShop = async (shopId) => {
  return updateDoc(doc(db, 'shops', shopId), { isActive: true, pausedAt: null });
};

// Super admin: স্টোর সম্পূর্ণ মুছে ফেলা
export const deleteShop = async (shopId) => {
  return deleteDoc(doc(db, 'shops', shopId));
};

// Super admin: deny করা request চিরতরে মুছে ফেলা (user আবার apply করতে পারবে)
export const deleteRetailerRequest = async (requestId) => {
  return deleteDoc(doc(db, 'retailer_requests', requestId));
};

// ── PRODUCTS ──────────────────────────────────────
export const getProducts = async (shopId) => {
  const q = query(
    collection(db, 'shops', shopId, 'products'),
    orderBy('createdAt', 'desc')
  );
  try {
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) { return []; } 
};

export const getProduct = async (shopId, productId) => {
  const snap = await getDoc(doc(db, 'shops', shopId, 'products', productId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const addProduct = async (shopId, productData) => {
  return addDoc(collection(db, 'shops', shopId, 'products'), {
    ...productData,
    createdAt: serverTimestamp(),
  });
};

export const updateProduct = async (shopId, productId, data) => {
  return updateDoc(doc(db, 'shops', shopId, 'products', productId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteProduct = async (shopId, productId) => {
  return deleteDoc(doc(db, 'shops', shopId, 'products', productId));
};

// ── CATEGORIES ────────────────────────────────────
export const getCategories = async (shopId) => {
  const snap = await getDocs(collection(db, 'shops', shopId, 'categories'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const addCategory = async (shopId, data) => {
  return addDoc(collection(db, 'shops', shopId, 'categories'), {
    ...data,
    createdAt: serverTimestamp(),
  });
};

export const deleteCategory = async (shopId, categoryId) => {
  return deleteDoc(doc(db, 'shops', shopId, 'categories', categoryId));
};

// ── ORDERS ────────────────────────────────────────
export const getOrders = async (shopId) => {
  const q = query(
    collection(db, 'shops', shopId, 'orders'),
    orderBy('createdAt', 'desc')
  );
  try {
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) { return []; }
};

export const getUserOrders = async (shopId, identifier) => {
  if (!identifier) return [];
  
  const queryVal = identifier.toLowerCase().trim();
  const isPhone = /^[0-9\+\-\s]+$/.test(queryVal);
  const searchField = isPhone ? 'customerPhone' : 'customerEmail';

  const q = query(
    collection(db, 'shops', shopId, 'orders'),
    where(searchField, '==', isPhone ? queryVal.replace(/\D/g, '') : queryVal),
    orderBy('createdAt', 'desc')
  );
  try {
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) { 
    console.error("getUserOrders error:", err);
    return []; 
  }
};

export const placeOrder = async (shopId, orderData) => {
  return addDoc(collection(db, 'shops', shopId, 'orders'), {
    ...orderData,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
};

export const saveUserCart = async (uid, shopId, cartData) => {
  return setDoc(doc(db, 'users', uid, 'carts', shopId), { items: cartData, updatedAt: serverTimestamp() }, { merge: true });
};

export const getUserCart = async (uid, shopId) => {
  const snap = await getDoc(doc(db, 'users', uid, 'carts', shopId));
  return snap.exists() ? (snap.data().items || []) : [];
};

export const saveUserData = async (uid, data) => {
  return setDoc(doc(db, 'users', uid), data, { merge: true });
};

export const updateOrderStatus = async (shopId, orderId, status, deliveryConfig = null, updaterInfo = null) => {
  const orderRef = doc(db, 'shops', shopId, 'orders', orderId);
  const orderSnap = await getDoc(orderRef);

  if (orderSnap.exists()) {
     const orderData = orderSnap.data();
     const updates = { status };
     
     if (status === 'confirmed' && deliveryConfig) {
       // Support old string format or new object format
       if (typeof deliveryConfig === 'string') {
         updates.deliveryTime = deliveryConfig;
       } else {
         const d = parseInt(deliveryConfig.deliveryDays) || 0;
         const h = parseInt(deliveryConfig.deliveryHours) || 0;
         const m = parseInt(deliveryConfig.deliveryMinutes) || 0;
         
         if (d > 0 || h > 0 || m > 0) {
           const now = new Date();
           const etaMillis = now.getTime() + (d * 86400000) + (h * 3600000) + (m * 60000);
           updates.deliveryETA = serverTimestamp(); // We use local logic in frontend, but need real TS.
           // Actually, firestore doesn't let us add millis to serverTimestamp easily, so we use JS date
           updates.deliveryETA = new Date(etaMillis); 
           
           let fmt = '';
           if (d) fmt += `${d} দিন `;
           if (h) fmt += `${h} ঘণ্টা `;
           if (m) fmt += `${m} মিনিট`;
           updates.deliveryCountdownFormatted = fmt.trim();
         }
       }
       updates.confirmedAt = serverTimestamp();
     }

     // Track who performed each specific action
     if (updaterInfo) {
       updates.updatedBy = updaterInfo;
       if (status === 'confirmed') {
         updates.confirmedBy = updaterInfo;
       } else if (status === 'completed') {
         updates.deliveredBy = updaterInfo;
         updates.deliveredAt = serverTimestamp();
       } else if (status === 'cancelled') {
         updates.rejectedBy = updaterInfo;
         updates.rejectedAt = serverTimestamp();
       }
     }

     await updateDoc(orderRef, updates);

     // Loyalty Point Logic Isolation
     if (status === 'completed' && orderData.status !== 'completed' && orderData.customerId) {
        try {
           const userRef = doc(db, 'users', orderData.customerId);
           const userSnap = await getDoc(userRef);
           if (userSnap.exists()) {
              const userData = userSnap.data();
              const todayStr = new Date().toISOString().split('T')[0];
              
              if (userData.lastLoyaltyDate !== todayStr) {
                 await updateDoc(userRef, {
                    loyaltyPoints: (userData.loyaltyPoints || 0) + 1,
                    lastLoyaltyDate: todayStr
                 });
              }
           }
        } catch (e) {
           console.warn("Could not update loyalty points (possibly guest or permission denied):", e);
        }
     }
  }
};

export const subscribeOrders = (shopId, callback) => {
  const q = query(
    collection(db, 'shops', shopId, 'orders'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

// ── CUSTOMERS ─────────────────────────────────────
export const getCustomers = async (shopId) => {
  const snap = await getDocs(collection(db, 'shops', shopId, 'customers'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ── RETAILER INVITE MANAGEMENT ────────────────────
// Super admin uses these to grant/revoke retailer access

export const getRetailerInvites = async () => {
  const snap = await getDocs(collection(db, 'retailer_invites'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const addRetailerInvite = async (email) => {
  // Check if already invited
  const q = query(collection(db, 'retailer_invites'), where('email', '==', email.toLowerCase().trim()));
  const existing = await getDocs(q);
  if (!existing.empty) {
    throw new Error('This email is already invited as a retailer.');
  }

  return addDoc(collection(db, 'retailer_invites'), {
    email: email.toLowerCase().trim(),
    invitedAt: serverTimestamp(),
    status: 'active',
  });
};

export const removeRetailerInvite = async (inviteId) => {
  return deleteDoc(doc(db, 'retailer_invites', inviteId));
};

// ── ALL USERS ─────────────────────────────────────
export const getAllUsers = async () => {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// ── RETAILER REQUESTS ─────────────────────────────
export const addRetailerRequest = async (userData, phone = '') => {
  // uid validation
  const uid = userData?.uid;
  if (!uid) throw new Error('ব্যবহারকারীর তথ্য পাওয়া যাচ্ছে না। আবার লগইন করুন।');

  const email = userData?.email?.toLowerCase?.().trim() || userData?.providerData?.[0]?.email?.toLowerCase?.().trim() || '';

  // Use setDoc with a deterministic ID (uid) to resolve permission issues.
  // This allows us to use standard 'allow read, write: if request.auth.uid == uid' rules.
  const requestRef = doc(db, 'retailer_requests', uid);
  
  try {
    // Check if document exists first to maintain the logic of not over-writing approved ones casually
    // However, if we can't read, we just try to set it.
    await setDoc(requestRef, {
      uid,
      email,
      name: userData?.displayName || userData?.name || 'ব্যবহারকারী',
      photoURL: userData?.photoURL || '',
      phone: phone || '',
      status: 'pending',
      requestedAt: serverTimestamp(),
    }, { merge: true }); // Merge true to preserve fields if needed
    
    return { id: uid };
  } catch (err) {
    console.error("Retailer Request Error:", err);
    if (err.code === 'permission-denied') {
      throw new Error('অনুমতি নেই। সম্ভবত আপনার আবেদনটি প্রক্রিয়াধীন আছে।');
    }
    throw err;
  }
};

export const getRetailerRequests = async () => {
  const q = query(
    collection(db, 'retailer_requests'),
    orderBy('requestedAt', 'desc')
  );
  try {
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) { return []; }
};

export const approveRetailerRequest = async (requestId, email) => {
  // 1. Add to retailer_invites
  await addRetailerInvite(email);
  // 2. Update request status
  await updateDoc(doc(db, 'retailer_requests', requestId), { status: 'approved' });
};

export const denyRetailerRequest = async (requestId) => {
  await updateDoc(doc(db, 'retailer_requests', requestId), { status: 'denied' });
};

export const deleteOrder = async (shopId, orderId) => {
  return deleteDoc(doc(db, 'shops', shopId, 'orders', orderId));
};

// ── ORDER SERIAL (Sequential, per-shop, per-day) ────────────────
// Returns a zero-padded serial like "01", "02", ... for the current date
export const getOrderSerial = async (shopId) => {
  const today = new Date().toLocaleDateString('en-GB').replace(/\//g, ''); // DDMMYY
  const counterRef = doc(db, 'shops', shopId, 'counters', `orders_${today}`);
  try {
    const newCount = await runTransaction(db, async (tx) => {
      const snap = await tx.get(counterRef);
      const current = snap.exists() ? (snap.data().count || 0) : 0;
      const next = current + 1;
      tx.set(counterRef, { count: next, date: today }, { merge: true });
      return next;
    });
    return newCount.toString().padStart(2, '0');
  } catch (err) {
    console.error('Serial error:', err);
    return Math.floor(Math.random() * 99).toString().padStart(2, '0');
  }
};

// ── USER ORDER STREAK ──────────────────────────────────────────
// Returns { streak: N, hasFreeDelivery: bool } based on unique order days
// Order ID format: 01#15042026 — last 8 chars = DDMMYYYY
export const getUserStreak = (orders) => {
  if (!orders || orders.length === 0) return { streak: 0, hasFreeDelivery: false, days: [] };

  // Extract unique dates from orderIdVisual (format: XX#DDMMYYYY)
  const dateSet = new Set();
  orders.forEach(order => {
    const vis = order.orderIdVisual || '';
    const parts = vis.split('#');
    if (parts.length === 2 && parts[1].length === 8) {
      dateSet.add(parts[1]); // DDMMYYYY
    } else if (order.createdAt?.toDate) {
      // Fallback: use createdAt timestamp
      const d = order.createdAt.toDate();
      const dd = String(d.getDate()).padStart(2,'0');
      const mm = String(d.getMonth()+1).padStart(2,'0');
      const yyyy = d.getFullYear();
      dateSet.add(`${dd}${mm}${yyyy}`);
    }
  });

  // Convert to sortable format and sort descending
  const parseDateStr = (s) => {
    const dd = s.slice(0,2), mm = s.slice(2,4), yyyy = s.slice(4,8);
    return new Date(`${yyyy}-${mm}-${dd}`);
  };

  const sortedDates = Array.from(dateSet)
    .map(s => ({ str: s, date: parseDateStr(s) }))
    .filter(x => !isNaN(x.date))
    .sort((a, b) => b.date - a.date);

  if (sortedDates.length === 0) return { streak: 0, hasFreeDelivery: false, days: [] };

  // Count consecutive days
  let streak = 1;
  const ONE_DAY = 86400000;
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const diff = sortedDates[i].date - sortedDates[i+1].date;
    if (Math.round(diff / ONE_DAY) === 1) {
      streak++;
    } else {
      break; // streak broken
    }
  }

  return {
    streak,
    hasFreeDelivery: streak >= 6,
    days: sortedDates.slice(0, 7).map(x => x.str)
  };
};

// ── GLOBAL CONFIG ──────────────────────────────────
export const getGlobalConfig = async () => {
  try {
    const snap = await getDoc(doc(db, 'config', 'global'));
    return snap.exists() ? snap.data() : { geminiApiKey: '' };
  } catch (err) {
    console.error("Global Config Error:", err);
    return { geminiApiKey: '' };
  }
};

export const updateGlobalConfig = async (data) => {
  return setDoc(doc(db, 'config', 'global'), data, { merge: true });
};

export const subscribeGlobalConfig = (callback) => {
  return onSnapshot(doc(db, 'config', 'global'), (snap) => {
    if (snap.exists()) {
      callback(snap.data());
    } else {
      callback({ geminiApiKey: '' });
    }
  });
};

// ── REVIEWS ───────────────────────────────────────
export const getReviews = async (shopId) => {
  const q = query(
    collection(db, 'shops', shopId, 'reviews'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  try {
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) { return []; }
};

export const subscribeReviews = (shopId, callback) => {
  const q = query(
    collection(db, 'shops', shopId, 'reviews'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

// ── SHOP DESIGN (Realtime theme updates) ──────────
export const subscribeShopDesign = (shopId, callback) => {
  return onSnapshot(doc(db, 'shops', shopId), (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      callback({
        designPreset: data.designPreset || 'classic',
        designOverrides: data.designOverrides || {},
        messengerLink: data.messengerLink || '',
      });
    }
  });
};
// ── BROADCAST NOTIFICATIONS ──────────────────────
export const sendBroadcast = async (data) => {
  return addDoc(collection(db, 'broadcasts'), {
    ...data,
    createdAt: serverTimestamp(),
  });
};

export const deleteBroadcast = async (broadcastId) => {
  return deleteDoc(doc(db, 'broadcasts', broadcastId));
};


export const subscribeBroadcasts = (callback, errorCallback, shopId = null) => {
  // Fetch last 50 to have enough for client-side filtering
  const q = query(
    collection(db, 'broadcasts'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  return onSnapshot(q, (snap) => {
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // Client-side broad filter: if specific_shop or shop_users, it MUST match shopId.
    // Global/all targets are preserved for client-side contextual role filtering.
    const filtered = all.filter(b => {
      if (b.target === 'specific_shop' || b.target === 'shop_users') {
        return b.shopId === shopId;
      }
      return true;
    });
    callback(filtered);
  }, errorCallback);
};

// ── IMPERSONATION AUDIT LOGS ──────────────────────
/**
 * Superadmin কোনো retailer-এর dashboard access করলে log করুন
 */
export const logImpersonationStart = async ({ superadminUid, superadminEmail, retailerUid, retailerEmail, shopId, shopName, ip = 'unknown' }) => {
  const logRef = await addDoc(collection(db, 'impersonation_logs'), {
    superadminUid,
    superadminEmail,
    retailerUid,
    retailerEmail,
    shopId,
    shopName,
    action: 'start',
    ip,
    loginAt: serverTimestamp(),
    exitAt: null,
    isActive: true,
  });
  return logRef.id;
};

export const logImpersonationEnd = async (logId) => {
  if (!logId) return;
  return updateDoc(doc(db, 'impersonation_logs', logId), {
    exitAt: serverTimestamp(),
    isActive: false,
  });
};

export const getImpersonationLogs = async (limit_count = 50) => {
  const q = query(
    collection(db, 'impersonation_logs'),
    orderBy('loginAt', 'desc'),
    limit(limit_count)
  );
  try {
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) { return []; }
};

// ── MARKETPLACE ────────────────────────────────────

export const getAllVisibleShops = async () => {
  try {
    const q = query(collection(db, 'shops'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => s.isActive !== false);
  } catch (err) { return []; }
};

export const getShopProducts = async (shopId) => {
  try {
    const snap = await getDocs(collection(db, 'shops', shopId, 'products'));
    return snap.docs.map(d => ({ id: d.id, shopId, ...d.data() }));
  } catch (err) { return []; }
};

export const getAllMarketplaceProducts = async () => {
  try {
    const shops = await getAllVisibleShops();
    const productArrays = await Promise.all(
      shops.map(async (shop) => {
        const prods = await getShopProducts(shop.id);
        return prods.map(p => ({
          ...p,
          shopId: shop.id,
          shopName: shop.shopName || '',
          shopSlug: shop.subdomainSlug || shop.shopSlug || '',
          shopLogoUrl: shop.logoUrl || '',
          deliveryConfig: shop.deliveryConfig || {},
          customDomain: shop.customDomain || '',
          domainStatus: shop.domainStatus || '',
        }));
      })
    );
    return productArrays.flat();
  } catch (err) { return []; }
};

export const toggleShopMainSiteVisibility = async (shopId, visible) => {
  return updateDoc(doc(db, 'shops', shopId), {
    showOnMainSite: visible,
    updatedAt: serverTimestamp(),
  });
};

export const createSuperadminShop = async (uid, email, name) => {
  const ref = doc(db, 'shops', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      shopName: name || 'Daripallah Store',
      ownerEmail: email,
      ownerUid: uid,
      subdomainSlug: 'daripallah-store',
      shopSlug: 'daripallah-store',
      showOnMainSite: true,
      isActive: true,
      createdAt: serverTimestamp(),
    });
  }
  const newSnap = await getDoc(ref);
  return { id: uid, ...newSnap.data() };
};

