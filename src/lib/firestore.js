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

// HIGH-10 Fix: Superadmin destructive operations go through authenticated server API
// Previously these were direct client-side deleteDoc calls that bypassed server validation

// Super admin: স্টোর সম্পূর্ণ মুছে ফেলা (via server API)
export const deleteShop = async (shopId) => {
  const { getAuth } = await import('firebase/auth');
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Authentication required');
  
  const res = await fetch('/api/admin/delete-resource', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ type: 'shop', id: shopId })
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Delete failed');
  }
  return res.json();
};

// Super admin: deny করা request চিরতরে মুছে ফেলা (via server API)
export const deleteRetailerRequest = async (requestId) => {
  const { getAuth } = await import('firebase/auth');
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('Authentication required');
  
  const res = await fetch('/api/admin/delete-resource', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ type: 'retailer_request', id: requestId })
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Delete failed');
  }
  return res.json();
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

export const getRecentOrders = async (shopId, limitVal = 100) => {
  const q = query(
    collection(db, 'shops', shopId, 'orders'),
    orderBy('createdAt', 'desc'),
    limit(limitVal)
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
  const amount = parseFloat(orderData.total) || 0;
  try {
    const shopRef = doc(db, 'shops', shopId);
    await updateDoc(shopRef, {
      orderCount: increment(1),
      totalRevenue: increment(amount)
    });
  } catch (err) {
    console.error("Failed to increment shop stats on placeOrder:", err);
  }
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

const standardizePhone = (phone) => {
  if (!phone) return '';
  let cleaned = phone.trim().replace(/\D/g, '');
  if (cleaned.startsWith('880')) cleaned = cleaned.slice(2);
  else if (cleaned.startsWith('80')) cleaned = '0' + cleaned.slice(2);
  else if (cleaned.startsWith('1')) cleaned = '0' + cleaned;
  if (!cleaned.startsWith('0')) cleaned = '0' + cleaned;
  return cleaned.slice(0, 11);
};

const calculateRiskScoreClient = (profile) => {
  let score = 0;
  const reasons = [];

  const successOrders = Number(profile.successOrders || 0);
  const cancelOrders = Number(profile.cancelOrders || 0);
  const returnOrders = Number(profile.returnOrders || 0);
  const totalOrders = Number(profile.totalOrders || 0);

  const extStats = profile.externalStats || {};
  const extSuccessful = Number(extStats.successful || 0);
  const extCancelled = Number(extStats.cancelled || 0);
  const extReturned = Number(extStats.returned || 0);
  const extTotal = Number(extStats.totalOrders || 0);

  const combinedTotal = totalOrders + extTotal;
  const combinedSuccess = successOrders + extSuccessful;
  const combinedReturned = returnOrders + extReturned;
  const combinedCancelled = cancelOrders + extCancelled;

  if (combinedTotal > 0) {
    const successRatio = combinedSuccess / combinedTotal;
    const returnRatio = combinedReturned / combinedTotal;
    const cancelRatio = combinedCancelled / combinedTotal;

    if (combinedTotal >= 2) {
      if (successRatio < 0.5) {
        score += 30;
        reasons.push(`Low overall success rate: ${(successRatio * 100).toFixed(0)}%`);
      } else if (successRatio < 0.75) {
        score += 15;
        reasons.push(`Moderate success rate: ${(successRatio * 100).toFixed(0)}%`);
      }

      if (returnRatio > 0.3) {
        score += 40;
        reasons.push(`Extremely high return rate: ${(returnRatio * 100).toFixed(0)}%`);
      } else if (returnRatio > 0.15) {
        score += 20;
        reasons.push(`Moderate return rate: ${(returnRatio * 100).toFixed(0)}%`);
      }

      if (cancelRatio > 0.4) {
        score += 15;
        reasons.push(`High cancellation rate: ${(cancelRatio * 100).toFixed(0)}%`);
      }
    }
  }

  const uniqueAddresses = profile.addresses || [];
  if (uniqueAddresses.length > 2) {
    const penalty = Math.min(30, (uniqueAddresses.length - 2) * 10);
    score += penalty;
    reasons.push(`Multiple shipping addresses detected (${uniqueAddresses.length})`);
  }

  const reports = profile.reports || [];
  if (reports.length > 0) {
    const uniqueReporters = new Set(reports.map(r => r.shopId));
    const reportCount = uniqueReporters.size;
    if (reportCount > 0) {
      const reportPoints = Math.min(40, reportCount * 15);
      score += reportPoints;
      reasons.push(`Reported by ${reportCount} different shop(s) in community`);
    }
  }

  const finalScore = Math.max(0, Math.min(100, score));
  let riskLevel = 'low';
  if (finalScore >= 60) riskLevel = 'high';
  else if (finalScore >= 25) riskLevel = 'medium';

  return { score: finalScore, riskLevel, reasons };
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

     // ── Update Internal AI Fraud Database Profile (Layer 2) ──
     if (orderData.customerPhone) {
       try {
         const cleanPhone = standardizePhone(orderData.customerPhone);
         const profileRef = doc(db, 'fraud_profiles', cleanPhone);
         await runTransaction(db, async (transaction) => {
           const profileSnap = await transaction.get(profileRef);
           const currentProfile = profileSnap.exists() ? profileSnap.data() : {
             phone: cleanPhone,
             successOrders: 0,
             cancelOrders: 0,
             returnOrders: 0,
             totalOrders: 0,
             addresses: [],
             stores: [],
             reports: [],
             externalStats: {}
           };

           const oldStatus = orderData.status;
           const newStatus = status;

           let successDiff = 0;
           let cancelDiff = 0;
           let returnDiff = 0;

           if (oldStatus !== 'completed' && newStatus === 'completed') {
             successDiff = 1;
           } else if (oldStatus === 'completed' && newStatus !== 'completed') {
             successDiff = -1;
           }

           if (oldStatus !== 'cancelled' && newStatus === 'cancelled') {
             cancelDiff = 1;
           } else if (oldStatus === 'cancelled' && newStatus !== 'cancelled') {
             cancelDiff = -1;
           }

           if (oldStatus !== 'returned' && newStatus === 'returned') {
             returnDiff = 1;
           } else if (oldStatus === 'returned' && newStatus !== 'returned') {
             returnDiff = -1;
           }

           const updatedProfile = {
             ...currentProfile,
             successOrders: Math.max(0, (Number(currentProfile.successOrders) || 0) + successDiff),
             cancelOrders: Math.max(0, (Number(currentProfile.cancelOrders) || 0) + cancelDiff),
             returnOrders: Math.max(0, (Number(currentProfile.returnOrders) || 0) + returnDiff),
             lastUpdated: serverTimestamp()
           };

           const riskResult = calculateRiskScoreClient(updatedProfile);
           updatedProfile.riskScore = riskResult.score;
           updatedProfile.riskLevel = riskResult.riskLevel;

           transaction.set(profileRef, updatedProfile, { merge: true });
         });
       } catch (fErr) {
         console.warn('[Fraud DB] Failed to update profile status:', fErr.message);
       }
     }

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

export const subscribeIncompleteOrders = (shopId, callback, onError) => {
  const q = query(
    collection(db, 'shops', shopId, 'incomplete_orders'),
    limit(100)
  );
  return onSnapshot(
    q, 
    (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => {
        const getMillis = (val) => {
          if (!val) return 0;
          if (val.seconds) return val.seconds * 1000;
          if (val.toDate) return val.toDate().getTime();
          return new Date(val).getTime() || 0;
        };
        return getMillis(b.updatedAt) - getMillis(a.updatedAt);
      });
      callback(data);
    },
    (err) => {
      console.error('[Firestore subscribeIncompleteOrders error]', err);
      if (onError) onError(err);
    }
  );
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

export const initializeShop = async (uid, email, displayName) => {
  const shopDoc = await getDoc(doc(db, 'shops', uid));
  if (!shopDoc.exists()) {
    const shopSlug = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + '-' + Math.floor(Math.random() * 1000);
    await setDoc(doc(db, 'shops', uid), {
      ownerId: uid,
      shopName: `${displayName || 'My'}'s Premium Store`,
      shopSlug,
      subdomainSlug: shopSlug,
      isActive: true,
      showOnMainSite: false,
      createdAt: serverTimestamp(),
      staffEmails: [],
      banners: [
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
        'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200'
      ]
    });
  }
};

// ── RETAILER REQUESTS ─────────────────────────────
export const addRetailerRequest = async (userData, phone = '') => {
  // uid validation
  const uid = userData?.uid;
  if (!uid) throw new Error('ব্যবহারকারীর তথ্য পাওয়া যাচ্ছে না। আবার লগইন করুন।');

  const email = userData?.email?.toLowerCase?.().trim() || userData?.providerData?.[0]?.email?.toLowerCase?.().trim() || '';
  const displayName = userData?.displayName || userData?.name || 'ব্যবহারকারী';

  // Use setDoc with a deterministic ID (uid) to resolve permission issues.
  // This allows us to use standard 'allow read, write: if request.auth.uid == uid' rules.
  const requestRef = doc(db, 'retailer_requests', uid);
  
  try {
    const config = await getGlobalConfig();
    const autoApprove = config?.autoApproveRetailers ?? false;

    // Check if document exists first to maintain the logic of not over-writing approved ones casually
    // However, if we can't read, we just try to set it.
    await setDoc(requestRef, {
      uid,
      email,
      name: displayName,
      photoURL: userData?.photoURL || '',
      phone: phone || '',
      status: autoApprove ? 'approved' : 'pending',
      requestedAt: serverTimestamp(),
    }, { merge: true }); // Merge true to preserve fields if needed

    if (autoApprove) {
      // 1. Add to retailer_invites
      await addRetailerInvite(email);
      // 2. Update users role to retailer
      await updateDoc(doc(db, 'users', uid), { role: 'retailer' });
      // 3. Initialize shop
      await initializeShop(uid, email, displayName);
    }
    
    return { id: uid, autoApproved: autoApprove };
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

export const approveRetailerRequest = async (requestId, email, name = '') => {
  // 1. Add to retailer_invites
  await addRetailerInvite(email);
  // 2. Update request status
  await updateDoc(doc(db, 'retailer_requests', requestId), { status: 'approved' });
  // 3. Update users role to retailer
  await updateDoc(doc(db, 'users', requestId), { role: 'retailer' });
  // 4. Initialize shop
  await initializeShop(requestId, email, name);
};

export const denyRetailerRequest = async (requestId) => {
  await updateDoc(doc(db, 'retailer_requests', requestId), { status: 'denied' });
};

export const deleteOrder = async (shopId, orderId) => {
  const orderRef = doc(db, 'shops', shopId, 'orders', orderId);
  try {
    const orderSnap = await getDoc(orderRef);
    if (orderSnap.exists()) {
      const orderData = orderSnap.data();
      const amount = parseFloat(orderData.total) || 0;
      const shopRef = doc(db, 'shops', shopId);
      await updateDoc(shopRef, {
        orderCount: increment(-1),
        totalRevenue: increment(-amount)
      });
    }
  } catch (err) {
    console.error("Failed to decrement shop stats on deleteOrder:", err);
  }
  return deleteDoc(orderRef);
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
    return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => {
      const isTestStore = s.shopSlug === 'test' || s.subdomainSlug === 'test' || s.shopName?.toLowerCase() === 'test';
      return s.isActive !== false && s.showOnMainSite !== false && (!isTestStore || s.showOnMainSite === true);
    });
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

export const reportCustomerFraud = async (phone, reportData) => {
  const cleanPhone = standardizePhone(phone);
  const profileRef = doc(db, 'fraud_profiles', cleanPhone);
  
  return runTransaction(db, async (transaction) => {
    const profileSnap = await transaction.get(profileRef);
    const currentProfile = profileSnap.exists() ? profileSnap.data() : {
      phone: cleanPhone,
      successOrders: 0,
      cancelOrders: 0,
      returnOrders: 0,
      totalOrders: 0,
      addresses: [],
      stores: [],
      reports: [],
      externalStats: {}
    };

    const reports = currentProfile.reports || [];
    const existingIdx = reports.findIndex(r => r.shopId === reportData.shopId);
    
    const newReport = {
      shopId: reportData.shopId,
      shopName: reportData.shopName || 'Unknown Shop',
      reason: reportData.reason,
      comment: reportData.comment || '',
      createdAt: new Date().toISOString()
    };

    if (existingIdx > -1) {
      reports[existingIdx] = newReport;
    } else {
      reports.push(newReport);
    }

    const updatedProfile = {
      ...currentProfile,
      reports,
      lastUpdated: serverTimestamp()
    };

    const riskResult = calculateRiskScoreClient(updatedProfile);
    updatedProfile.riskScore = riskResult.score;
    updatedProfile.riskLevel = riskResult.riskLevel;

    transaction.set(profileRef, updatedProfile, { merge: true });
  });
};

