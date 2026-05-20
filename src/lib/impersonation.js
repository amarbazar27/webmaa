/**
 * 🔐 impersonation.js — Superadmin Retailer Impersonation System
 *
 * Superadmin নিজের Firebase session রেখে রিটেইলারের শপ access করতে পারবেন।
 * কোনো password লাগবে না।
 *
 * Storage: sessionStorage (tab বন্ধ হলে automatically exit)
 * Audit: Firestore impersonation_logs collection
 */

const IMPERSONATION_KEY = 'webmaa_impersonation';

/**
 * ইম্পার্সোনেশন শুরু করুন
 * @param {Object} retailerInfo - { uid, email, shopId, shopName }
 * @param {string} logId - Firestore audit log ID
 */
export function startImpersonation(retailerInfo, logId) {
  if (typeof window === 'undefined') return;
  const session = {
    ...retailerInfo,
    logId,
    startedAt: new Date().toISOString(),
  };
  sessionStorage.setItem(IMPERSONATION_KEY, JSON.stringify(session));
}

/**
 * বর্তমান ইম্পার্সোনেশন session পড়ুন
 * @returns {Object|null}
 */
export function getImpersonationSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(IMPERSONATION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * ইম্পার্সোনেশন চলছে কিনা চেক করুন
 */
export function isImpersonating() {
  return !!getImpersonationSession();
}

/**
 * ইম্পার্সোনেশন শেষ করুন
 * @returns {string|null} logId (Firestore-এ exitAt update করতে)
 */
export function endImpersonation() {
  if (typeof window === 'undefined') return null;
  const session = getImpersonationSession();
  const logId = session?.logId || null;
  sessionStorage.removeItem(IMPERSONATION_KEY);
  return logId;
}

/**
 * ইম্পার্সোনেশন session-এ active shopId পান
 * Dashboard layout এটি ব্যবহার করে
 */
export function getImpersonatedShopId() {
  const session = getImpersonationSession();
  return session?.shopId || null;
}
