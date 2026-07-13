'use client';

/**
 * ThemeContext — Role-aware dark/light mode system
 *
 * Priority Chain (highest to lowest):
 *   1. User's personal toggle (localStorage `wm_theme_<shopId>`)
 *   2. Retailer's shop setting (Firestore shop.themeMode)
 *   3. SuperAdmin system default (Firestore system/config.defaultTheme)
 *   4. Fallback → 'light'
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
  systemDefault: 'light',
  setSystemDefault: () => {},
});

export function ThemeProvider({ children, shopId = null, shopTheme = null }) {
  const STORAGE_KEY = shopId ? `wm_theme_${shopId}` : 'wm_theme_global';

  // Resolve initial theme: user pref → shop setting → system setting → light
  const getInitialTheme = () => {
    if (typeof window === 'undefined') return 'light';

    // Force light theme on storefronts / general public pages to prevent broken dark mode styling
    const isDashboardOrAdmin = window.location.pathname.startsWith('/dashboard') || 
                               window.location.pathname.startsWith('/superadmin');
    if (!isDashboardOrAdmin) {
      return 'light';
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    if (shopTheme === 'dark' || shopTheme === 'light') return shopTheme;
    const systemSaved = localStorage.getItem('wm_system_theme');
    if (systemSaved === 'dark' || systemSaved === 'light') return systemSaved;
    // Respect OS preference as final fallback
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const [theme, setThemeState] = useState('light');
  const [systemDefault, setSystemDefaultState] = useState('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setThemeState(getInitialTheme());
    const sys = localStorage.getItem('wm_system_theme') || 'light';
    setSystemDefaultState(sys);
    setMounted(true);
  }, [shopId, shopTheme]);

  // Apply class to <html>
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
  }, [theme, mounted]);

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newTheme);
    }
  }, [STORAGE_KEY]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  /** SuperAdmin calls this to change the system-wide default */
  const setSystemDefault = useCallback((newTheme) => {
    setSystemDefaultState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wm_system_theme', newTheme);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, systemDefault, setSystemDefault }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
