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
    // 🔐 Super Admin Check
    const envAdmin = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || '').toLowerCase().trim();
    if (envAdmin && currentEmail === envAdmin) {
      return { role: 'superadmin' };
    }

    // Parallelize role checks for speed
    const [inviteSnap, staffSnap] = await Promise.all([
      getDocs(query(collection(db, 'retailer_invites'), where('email', '==', currentEmail))),
      getDocs(query(collection(db, 'shops'), where('staffEmails', 'array-contains', currentEmail)))
    ]);

    if (!inviteSnap.empty) return { role: 'retailer' };
    
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
    // New user path
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

    if (finalUserData.role === 'retailer') {
      await initializeShop(user);
    }
  } else {
    // Existing user path - PERFORMANCE OPTIMIZATION
    const existingData = userDocSnap.data();
    
    // Only re-verify role if they are still a basic "user"
    if (existingData.role === 'user' || !existingData.role) {
      const freshRole = await determineRole(user.email);
      if (freshRole.role !== 'user') {
        await updateDoc(userDocRef, { ...freshRole });
        finalUserData = { ...existingData, ...freshRole };
        if (freshRole.role === 'retailer') await initializeShop(user);
      } else {
        finalUserData = existingData;
      }
    } else {
      finalUserData = existingData;
    }

    // Background update lastLogin to avoid blocking UI
    updateDoc(userDocRef, { lastLogin: serverTimestamp() }).catch(e => console.error("Login update failed", e));
  }
  return { user, userData: finalUserData };
};

const initializeShop = async (user) => {
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
};

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
