'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange, handleUserSession, handleLoginRedirect } from '@/lib/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

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

    const unsub = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);

      // Clean up previous user document listener
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }

      if (firebaseUser) {
        try {
          // Initial session setup (creates doc if missing, refreshes role)
          const result = await handleUserSession(firebaseUser);
          setUserData(result?.userData || null);

          // TASK 3 FIX: Real-time listener on user document
          // This ensures role changes (e.g. staff added by retailer) propagate instantly
          // without requiring logout/login cycle
          unsubUserDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), (snap) => {
            if (snap.exists()) {
              setUserData(snap.data());
            }
          }, (err) => {
            console.error("[AuthProvider] User doc listener error:", err);
          });
        } catch (err) {
          console.error("AuthContext fetch error:", err);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => {
      unsub();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, []);

  // Compute activeShopId: Either they own the shop (uid) or they are staff (accessShopId)
  const activeShopId = (userData?.role === 'retailer' || userData?.role === 'superadmin') ? user?.uid : userData?.accessShopId;

  return (
    <AuthContext.Provider value={{ user, userData, loading, activeShopId }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
