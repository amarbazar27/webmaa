import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc, getDocs, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { app, db } from './firebase';

export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const determineRole = async (email) => {
  try {
    if (!email) return { role: 'user' };
    
    const currentEmail = email.toLowerCase().trim();
    // 🔐 শুধু environment variable থেকে admin email নেবে
    // ⚠️ আগে hardcoded fallback ছিল — এটা বিপজ্জনক!
    const envAdmin = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || '').toLowerCase().trim();

    if (envAdmin && currentEmail === envAdmin) {
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
  } catch (error) {
    console.error("Role Check Error:", error);
    return { role: 'user' };
  }
};

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

/**
 * Google Login — tries popup first, falls back to full-page redirect.
 * Redirect goes through Firebase's own authDomain (webmaa-app.firebaseapp.com).
 * Returns { user, userData } on popup success, or null if redirect was started.
 */
export const loginWithGoogle = async () => {
  try {
    console.log("[Auth] Starting Google Popup login...");
    const result = await signInWithPopup(auth, googleProvider);
    console.log("[Auth] Popup success:", result.user?.email);
    return await handleUserSession(result.user);
  } catch (error) {
    const errorCode = error?.code || 'unknown';
    const errorMsg = error?.message || '';
    console.error(`[Auth] Popup error (${errorCode}):`, errorMsg);

    // Specific triggers for redirect fallback
    const shouldFallback = 
      errorCode === 'auth/unauthorized-domain' || 
      errorCode === 'auth/popup-blocked' || 
      errorCode === 'auth/popup-closed-by-user' ||
      errorCode === 'auth/cancelled-popup-request' ||
      // If we are on a custom domain, popup might fail with generic errors in some browsers
      (typeof window !== 'undefined' && !window.location.hostname.includes('vercel.app') && !window.location.hostname.includes('localhost'));

    if (shouldFallback) {
      console.log("[Auth] Falling back to Redirect login...");
      try {
        await signInWithRedirect(auth, googleProvider);
        return null; // Navigation occurs
      } catch (redirectError) {
        console.error("[Auth] Redirect initiation failed:", redirectError.code);
        throw redirectError;
      }
    }

    // Special handling for the "invalid action" error to provide better hint
    if (errorMsg.toLowerCase().includes('invalid action') || errorCode === 'auth/invalid-action-code') {
      throw new Error("লগইন সেশনটি অবৈধ হয়ে গেছে। দয়া করে পেজটি রিফ্রেশ করে আবার চেষ্টা করুন। (Auth state mismatch)");
    }

    throw error;
  }
};

// Called on page load to process any pending redirect login result
export const handleLoginRedirect = async () => {
  try {
    // Only attempt if we potentially came from a redirect
    if (typeof window === 'undefined') return null;
    
    const result = await getRedirectResult(auth);
    if (result?.user) {
      console.log("[Auth] Redirect success:", result.user.email);
      return await handleUserSession(result.user);
    }
    return null;
  } catch (error) {
    const code = error?.code;
    // Suppress common non-errors
    if (code === 'auth/no-auth-event' || code === 'auth/user-not-found') return null;
    
    console.error("[Auth] Redirect processing error:", code, error.message);
    
    // If we get an "invalid action" here, it means state was corrupted
    if (error.message.toLowerCase().includes('invalid action')) {
      // Consuming the error so it doesn't crash the AuthProvider mount
      return null;
    }
    return null;
  }
};

export const logoutUser = () => signOut(auth);

export const getUserData = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
};

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);
