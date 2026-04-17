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
  const q = query(collection(db, 'shops'), where('subdomainSlug', '==', slug));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
};

export const getShopByDomain = async (domain) => {
  if (!domain) return null;
  const q = query(collection(db, 'shops'), where('customDomain', '==', domain.toLowerCase().trim()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
};

export const updateShop = async (shopId, data) => {
  const shopDocRef = doc(db, 'shops', shopId);
  return updateDoc(shopDocRef, { ...data, updatedAt: serverTimestamp() });
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

export const getUserOrders = async (shopId, customerEmail) => {
  if (!customerEmail) return [];
  const q = query(
    collection(db, 'shops', shopId, 'orders'),
    where('customerEmail', '==', customerEmail.toLowerCase().trim()),
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

export const updateOrderStatus = async (shopId, orderId, status) => {
  const orderRef = doc(db, 'shops', shopId, 'orders', orderId);
  const orderSnap = await getDoc(orderRef);

  if (orderSnap.exists()) {
     const orderData = orderSnap.data();
     await updateDoc(orderRef, { status });

     // Loyalty Point Logic Isolation
     if (status === 'completed' && orderData.status !== 'completed' && orderData.customerId) {
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
