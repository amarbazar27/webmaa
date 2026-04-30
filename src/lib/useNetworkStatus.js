'use client';
import { useState, useEffect } from 'react';

/**
 * TASK 7: Auto Network Detection + Lite Mode
 * Returns { isOnline, isLiteMode, setLiteMode }
 * - isOnline: navigator.onLine
 * - isLiteMode: true when connection is slow (2g/slow-2g) OR user manually enabled it
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isLiteMode, setIsLiteModeState] = useState(false);

  useEffect(() => {
    // Restore user preference from localStorage
    const saved = localStorage.getItem('webmaa_lite_mode');
    if (saved === 'true') {
      setIsLiteModeState(true);
    }

    const updateOnline = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    setIsOnline(navigator.onLine);

    // Auto-detect slow connection via Network Information API
    const detectSlowNetwork = () => {
      if (typeof navigator === 'undefined') return;
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (!conn) return;

      const slowTypes = ['slow-2g', '2g'];
      const isSlowByType = slowTypes.includes(conn.effectiveType);
      const isSlowByRtt = conn.rtt && conn.rtt > 500;
      const isSlowByDown = conn.downlink && conn.downlink < 0.5;

      if (isSlowByType || isSlowByRtt || isSlowByDown) {
        setIsLiteModeState(true);
        localStorage.setItem('webmaa_lite_mode', 'true');
      }
    };

    detectSlowNetwork();

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      conn.addEventListener('change', detectSlowNetwork);
    }

    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
      if (conn) conn.removeEventListener('change', detectSlowNetwork);
    };
  }, []);

  const setLiteMode = (val) => {
    setIsLiteModeState(val);
    localStorage.setItem('webmaa_lite_mode', val ? 'true' : 'false');
  };

  return { isOnline, isLiteMode, setLiteMode };
}
