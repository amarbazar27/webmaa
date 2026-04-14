import { 
  collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, addDoc,
  query, where, orderBy, serverTimestamp, onSnapshot, limit 
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
export const addRetailerRequest = async (userData, phone) => {
  // Check for duplicate
  const q = query(collection(db, 'retailer_requests'), where('email', '==', userData.email.toLowerCase().trim()));
  const existing = await getDocs(q);
  if (!existing.empty) {
    throw new Error('You have already submitted a retailer request.');
  }

  return addDoc(collection(db, 'retailer_requests'), {
    uid: userData.uid,
    email: userData.email.toLowerCase().trim(),
    name: userData.displayName || userData.name || 'Unknown',
    photoURL: userData.photoURL || '',
    phone: phone,
    status: 'pending',
    requestedAt: serverTimestamp(),
  });
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

