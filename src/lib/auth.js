import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc, getDocs, collection, query, where, serverTimestamp, updateDoc } from 'firebase/firestore';
import { app, db } from './firebase';

export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const determineRole = async (email) => {
  try {
    if (!email) return { role: 'user' };
    
    const currentEmail = email.toLowerCase().trim();
    // 🔐 শুধু environment variable থেকে admin email নেবে
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
    // New user — determine role from invites/staff lists
    const roleData = await determineRole(user.email);
    finalUserData = {
      uid: user.uid,
      email: user.email.toLowerCase(),
      name: user.displayName || 'User',
      photoURL: user.photoURL || '',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      ...roleData
    };
    await setDoc(userDocRef, finalUserData);

    // If they became a retailer, initialize their shop
    if (finalUserData.role === 'retailer') {
      const shopSlug = user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + '-' + Math.floor(Math.random() * 1000);
      await setDoc(doc(db, 'shops', user.uid), {
        ownerId: user.uid,
        shopName: `${user.displayName || 'My'}'s Premium Store`,
        shopSlug,
        subdomainSlug: shopSlug,
        isActive: true,
        createdAt: serverTimestamp(),
        staffEmails: [],
        banners: [
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
          'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200'
        ]
      });
    }
  } else {
    // Existing user
    const existingData = userDocSnap.data();
    
    // 🔥 TASK 3 FIX: If they are currently just a "user", re-verify role
    // This allows staff/retailer invitations to take effect instantly
    if (existingData.role === 'user' || !existingData.role) {
      const freshRole = await determineRole(user.email);
      if (freshRole.role !== 'user') {
        console.log(`[Auth] Promoting user ${user.email} to ${freshRole.role}`);
        await updateDoc(userDocRef, { ...freshRole });
        finalUserData = { ...existingData, ...freshRole };
        
        // If they just became a retailer, initialize their shop
        if (freshRole.role === 'retailer') {
          const shopDoc = await getDoc(doc(db, 'shops', user.uid));
          if (!shopDoc.exists()) {
            const shopSlug = user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + '-' + Math.floor(Math.random() * 1000);
            await setDoc(doc(db, 'shops', user.uid), {
              ownerId: user.uid,
              shopName: `${user.displayName || 'My'}'s Premium Store`,
              shopSlug,
              subdomainSlug: shopSlug,
              isActive: true,
              createdAt: serverTimestamp(),
              staffEmails: [],
              banners: [
                'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
                'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200'
              ]
            });
          }
        }
      } else {
        finalUserData = existingData;
      }
    } else {
      // Periodic check even for non-users (e.g. staff changes)
      // For now, just trust existing role but we could re-verify occasionally
      finalUserData = existingData;
    }

    // Refresh last login
    await updateDoc(userDocRef, { lastLogin: serverTimestamp() });
  }
  return { user, userData: finalUserData };
};

/**
 * Google Login — tries popup first, falls back to full-page redirect.
 */
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return await handleUserSession(result.user);
  } catch (error) {
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
      await signInWithRedirect(auth, googleProvider);
    } else {
      console.error("Google login failed:", error);
      throw error;
    }
  }
};

/**
 * Handle user session after redirect login
 */
export const handleLoginRedirect = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) return await handleUserSession(result.user);
    return null;
  } catch (error) {
    console.error("Redirect result error:", error);
    throw error;
  }
};

export const logoutUser = () => signOut(auth);

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};
