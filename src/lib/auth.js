import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc, getDocs, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { app, db } from './firebase';

export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const determineRole = async (email) => {
  if (!email) return { role: 'user' };
  
  const currentEmail = email.toLowerCase().trim();
  const envAdmin = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || '').toLowerCase().trim();
  const fallbackAdmin = 'rafiqunnabi07@gmail.com';

  if (currentEmail === envAdmin || currentEmail === fallbackAdmin) {
    return { role: 'superadmin' };
  }

  const q = query(collection(db, 'retailer_invites'), where('email', '==', currentEmail));
  const snap = await getDocs(q);
  if (!snap.empty) return { role: 'retailer' };

  // Check if they are staff
  const staffQuery = query(collection(db, 'shops'), where('staffEmails', 'array-contains', currentEmail));
  const staffSnap = await getDocs(staffQuery);
  if (!staffSnap.empty) {
    const shopDoc = staffSnap.docs[0];
    return { role: 'staff', accessShopId: shopDoc.id, shopSlug: shopDoc.data().shopSlug };
  }

  return { role: 'user' };
};

/**
 * Handles the logic for a user after login (popup or redirect result)
 * Returns { user, userData }
 */
export const handleUserSession = async (user) => {
  if (!user) return null;

  const userDocRef = doc(db, 'users', user.uid);
  const userDocSnap = await getDoc(userDocRef);
  let finalUserData = null;

  if (!userDocSnap.exists()) {
    const roleData = await determineRole(user.email);
    finalUserData = {
      uid: user.uid,
      email: user.email.toLowerCase(),
      name: user.displayName || 'User',
      photoURL: user.photoURL || '',
      role: roleData.role,
      ...(roleData.accessShopId ? { accessShopId: roleData.accessShopId, accessShopSlug: roleData.shopSlug } : {}),
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      subscription: 'free',
    };
    await setDoc(userDocRef, finalUserData);

    if (roleData.role === 'retailer') {
      const slugName = (user.displayName || 'shop').toLowerCase().replace(/\s+/g, '-');
      const shopSlug = `${slugName}-${Date.now()}`;
      await setDoc(doc(db, 'shops', user.uid), {
        ownerId: user.uid,
        shopName: `${user.displayName || 'My'}'s Premium Store`,
        shopSlug,
        description: 'Welcome to our brand new store.',
        coverImg: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200',
        domainType: 'platform',
        subdomainSlug: shopSlug,
        staffEmails: [],
        isActive: true,
        totalOrders: 0,
        createdAt: serverTimestamp(),
      });
    }
  } else {
    const existingData = userDocSnap.data();
    const roleData = await determineRole(user.email);
    const freshRole = roleData.role;
    const updates = {
      lastLogin: serverTimestamp(),
      name: user.displayName || existingData.name,
      photoURL: user.photoURL || existingData.photoURL,
      role: freshRole,
      ...(roleData.accessShopId ? { accessShopId: roleData.accessShopId, accessShopSlug: roleData.shopSlug } : {})
    };
    await setDoc(userDocRef, updates, { merge: true });
    finalUserData = { ...existingData, ...updates };

    if (existingData.role !== freshRole && freshRole === 'retailer') {
      const shopDoc = await getDoc(doc(db, 'shops', user.uid));
      if (!shopDoc.exists()) {
        const slugName = (user.displayName || 'shop').toLowerCase().replace(/\s+/g, '-');
        const shopSlug = `${slugName}-${Date.now()}`;
        await setDoc(doc(db, 'shops', user.uid), {
          ownerId: user.uid,
          shopName: `${user.displayName || 'My'}'s Premium Store`,
          shopSlug,
          description: 'Welcome to our brand new store.',
          coverImg: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200',
          domainType: 'platform',
          subdomainSlug: shopSlug,
          isActive: true,
          totalOrders: 0,
          createdAt: serverTimestamp(),
        });
      }
    }
  }
  return { user, userData: finalUserData };
};

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return await handleUserSession(result.user);
  } catch (error) {
    console.error("Google Auth Error:", error);
    throw error;
  }
};

// Optional backward compatibility just in case it's called elsewhere
export const handleLoginRedirect = async () => null;

export const logoutUser = () => signOut(auth);

export const getUserData = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
};

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);
