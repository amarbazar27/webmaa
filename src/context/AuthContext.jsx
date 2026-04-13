'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange, handleUserSession } from '@/lib/auth';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          // Use handleUserSession to ensure doc is created if missing
          const result = await handleUserSession(firebaseUser);
          setUserData(result?.userData || null);
        } catch (err) {
          console.error("AuthContext fetch error:", err);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Compute activeShopId: Either they own the shop (uid) or they are staff (accessShopId)
  const activeShopId = userData?.role === 'retailer' ? user?.uid : userData?.accessShopId;

  return (
    <AuthContext.Provider value={{ user, userData, loading, activeShopId }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
