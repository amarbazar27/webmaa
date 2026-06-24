'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthChange, handleUserSession, handleLoginRedirect } from '@/lib/auth';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  getImpersonationSession,
  isImpersonating,
  startImpersonation,
  endImpersonation,
} from '@/lib/impersonation';
import { logImpersonationStart, logImpersonationEnd } from '@/lib/firestore';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // ── Impersonation State ──────────────────────────────────────────
  const [impersonation, setImpersonation] = useState(null); // { uid, email, shopId, shopName, logId, startedAt }

  // On mount, restore impersonation session from sessionStorage
  useEffect(() => {
    const session = getImpersonationSession();
    if (session) setImpersonation(session);
  }, []);

  const forceUpdateAuth = (newUser, newUserData) => {
    setUser(newUser);
    setUserData(newUserData);
  };

  // ── Impersonation: Superadmin রিটেইলারের dashboard খুলবেন ───────
  const loginAsRetailer = useCallback(async (retailer) => {
    if (!user || !userData || userData.role !== 'superadmin') {
      console.error('Only superadmin can impersonate');
      return;
    }
    try {
      // IP সংগ্রহের চেষ্টা (best effort)
      let ip = 'unknown';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        ip = ipData.ip || 'unknown';
      } catch {}

      // Firestore-এ audit log তৈরি
      const logId = await logImpersonationStart({
        superadminUid: user.uid,
        superadminEmail: user.email,
        retailerUid: retailer.uid,
        retailerEmail: retailer.email || retailer.ownerEmail || 'unknown',
        shopId: retailer.shopId || retailer.id,
        shopName: retailer.shopName || 'Unknown Shop',
        ip,
      });

      const session = {
        uid: retailer.uid || retailer.id,
        email: retailer.email || retailer.ownerEmail || '',
        shopId: retailer.shopId || retailer.id,
        shopName: retailer.shopName || 'Unknown Shop',
        logId,
      };

      startImpersonation(session, logId);
      setImpersonation(session);

      return session;
    } catch (err) {
      console.error('Impersonation failed:', err);
      throw err;
    }
  }, [user, userData]);

  // ── Impersonation Exit ───────────────────────────────────────────
  const exitImpersonation = useCallback(async () => {
    try {
      const logId = endImpersonation();
      if (logId) {
        await logImpersonationEnd(logId);
      }
    } catch (err) {
      console.error('Exit impersonation log failed:', err);
    }
    setImpersonation(null);
  }, []);

  // ── Firebase Auth Listener ───────────────────────────────────────
  useEffect(() => {
    handleLoginRedirect().then(result => {
      if (result?.user && result?.userData) {
        setUser(result.user);
        setUserData(result.userData);
      }
    }).catch(err => {
      console.error('[AuthProvider] Redirect processing failed:', err);
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

          // Listen to shops to see if they are added/removed as staff or admin
          const currentEmail = firebaseUser.email?.toLowerCase();
          if (currentEmail) {
            let unsubStaffOnly = null;
            let unsubAdminOnly = null;

            const checkAndUpdateRole = async (staffDocs, adminDocs) => {
              import('firebase/firestore').then(async ({ updateDoc, getDoc }) => {
                const userRef = doc(db, 'users', firebaseUser.uid);
                const userSnap = await getDoc(userRef);
                const data = userSnap.data();

                if (adminDocs && adminDocs.length > 0) {
                  const shopDoc = adminDocs[0];
                  const shopData = shopDoc.data();
                  if (data?.role !== 'admin' || data?.accessShopId !== shopDoc.id) {
                    await updateDoc(userRef, {
                      role: 'admin',
                      accessShopId: shopDoc.id,
                      shopSlug: shopData.shopSlug
                    });
                  }
                } else if (staffDocs && staffDocs.length > 0) {
                  const shopDoc = staffDocs[0];
                  const shopData = shopDoc.data();
                  if (data?.role !== 'staff' || data?.accessShopId !== shopDoc.id) {
                    await updateDoc(userRef, {
                      role: 'staff',
                      accessShopId: shopDoc.id,
                      shopSlug: shopData.shopSlug
                    });
                  }
                } else {
                  if (data?.role === 'staff' || data?.role === 'admin') {
                    await updateDoc(userRef, {
                      role: 'user',
                      accessShopId: null,
                      shopSlug: null
                    });
                  }
                }
              }).catch(err => console.error('Role update failed:', err));
            };

            let currentStaffDocs = [];
            let currentAdminDocs = [];

            const qStaff = query(collection(db, 'shops'), where('staffEmails', 'array-contains', currentEmail));
            unsubStaffOnly = onSnapshot(qStaff, (snap) => {
              currentStaffDocs = snap.docs;
              checkAndUpdateRole(currentStaffDocs, currentAdminDocs);
            });

            const qAdmin = query(collection(db, 'shops'), where('adminEmails', 'array-contains', currentEmail));
            unsubAdminOnly = onSnapshot(qAdmin, (snap) => {
              currentAdminDocs = snap.docs;
              checkAndUpdateRole(currentStaffDocs, currentAdminDocs);
            });

            unsubStaff = () => {
              if (unsubStaffOnly) unsubStaffOnly();
              if (unsubAdminOnly) unsubAdminOnly();
            };
          }
        } catch (err) {
          console.error('AuthContext fetch error:', err);
          setUserData(null);
          setAuthError(err.message);
        }
      } else {
        setUserData(null);
        // Logout হলে impersonation clear করুন
        endImpersonation();
        setImpersonation(null);
      }
      setLoading(false);
    });

    return () => {
      unsub();
      if (unsubUserDoc) unsubUserDoc();
      if (unsubStaff) unsubStaff();
    };
  }, []);

  // ── Active Shop ID ───────────────────────────────────────────────
  // Priority: impersonation > retailer own shop > staff accessShopId
  const activeShopId = impersonation
    ? impersonation.shopId
    : (userData?.role === 'retailer' || userData?.role === 'superadmin')
      ? user?.uid
      : (userData?.role === 'admin' || userData?.role === 'staff')
        ? userData?.accessShopId
        : null;

  return (
    <AuthContext.Provider value={{
      user,
      userData,
      loading,
      activeShopId,
      forceUpdateAuth,
      // Impersonation
      impersonation,
      loginAsRetailer,
      exitImpersonation,
      isImpersonating: !!impersonation,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
