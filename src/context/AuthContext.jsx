'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange, handleUserSession, handleLoginRedirect } from '@/lib/auth';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const forceUpdateAuth = (newUser, newUserData) => {
    setUser(newUser);
    setUserData(newUserData);
  };

  useEffect(() => {
    // 1. Process any pending redirect login result
    handleLoginRedirect().then(result => {
      if (result?.user && result?.userData) {
        setUser(result.user);
        setUserData(result.userData);
      }
    }).catch(err => {
      console.error("[AuthProvider] Redirect processing failed:", err);
    });

    let unsubUserDoc = null;
    let unsubStaff = null;

    const unsub = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);

      if (unsubUserDoc) { unsubUserDoc(); unsubUserDoc = null; }
      if (unsubStaff) { unsubStaff(); unsubStaff = null; }

      if (firebaseUser) {
        try {
          const result = await handleUserSession(firebaseUser);
          setUserData(result?.userData || null);

          // Listen to own user document
          unsubUserDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), (snap) => {
            if (snap.exists()) {
              setUserData(snap.data());
            }
          });

          // Listen to shops to see if they are added/removed as staff
          const currentEmail = firebaseUser.email?.toLowerCase();
          if (currentEmail) {
            const q = query(collection(db, 'shops'), where('staffEmails', 'array-contains', currentEmail));
            unsubStaff = onSnapshot(q, async (snap) => {
              if (!snap.empty) {
                const shopDoc = snap.docs[0];
                const shopData = shopDoc.data();
                
                import('firebase/firestore').then(async ({ updateDoc, getDoc }) => {
                  const userRef = doc(db, 'users', firebaseUser.uid);
                  const userSnap = await getDoc(userRef);
                  const data = userSnap.data();
                  if (data?.role !== 'staff' || data?.accessShopId !== shopDoc.id) {
                    await updateDoc(userRef, {
                      role: 'staff',
                      accessShopId: shopDoc.id,
                      shopSlug: shopData.shopSlug
                    });
                  }
                }).catch(err => console.error("Auto staff update failed:", err));
              } else {
                import('firebase/firestore').then(async ({ updateDoc, getDoc }) => {
                  const userRef = doc(db, 'users', firebaseUser.uid);
                  const userSnap = await getDoc(userRef);
                  const data = userSnap.data();
                  if (data?.role === 'staff') {
                    await updateDoc(userRef, {
                      role: 'user',
                      accessShopId: null,
                      shopSlug: null
                    });
                  }
                }).catch(err => console.error("Auto staff downgrade failed:", err));
              }
            });
          }
        } catch (err) {
          console.error("AuthContext fetch error:", err);
          setUserData(null);
          setAuthError(err.message);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => {
      unsub();
      if (unsubUserDoc) unsubUserDoc();
      if (unsubStaff) unsubStaff();
    };
  }, []);

  // Compute activeShopId: Either they own the shop (uid) or they are staff (accessShopId)
  const activeShopId = (userData?.role === 'retailer' || userData?.role === 'superadmin') ? user?.uid : userData?.accessShopId;

  return (
    <AuthContext.Provider value={{ user, userData, loading, activeShopId, forceUpdateAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
