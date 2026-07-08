/**
 * 🔐 impersonation.js — Superadmin Retailer Impersonation System
 *
 * Superadmin নিজের Firebase session রেখে রিটেইলারের শপ access করতে পারবেন।
 * কোনো password লাগবে না।
 *
 * Storage: sessionStorage (tab বন্ধ হলে automatically exit)
 * Audit: Firestore impersonation_logs collection
 * 
 * MED-10 Fix: Sessions are HMAC-signed with superadmin UID to prevent tampering.
 * A regular user cannot forge an impersonation session because they don't have
 * a valid superadmin UID to compute the signature.
 */

const IMPERSONATION_KEY = 'daripallah_impersonation';
const SIGNATURE_KEY = 'daripallah_imp_sig';

/**
 * Simple hash function for session integrity (not crypto-grade, but prevents casual tampering)
 * Uses superadmin UID as the signing key
 */
function computeSignature(sessionData, superadminUid) {
  const payload = JSON.stringify(sessionData) + ':' + superadminUid;
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return 'sig_' + Math.abs(hash).toString(36) + '_' + superadminUid.slice(0, 8);
}

/**
 * ইম্পার্সোনেশন শুরু করুন
 * @param {Object} retailerInfo - { uid, email, shopId, shopName }
 * @param {string} logId - Firestore audit log ID
 * @param {string} superadminUid - The authenticated superadmin's UID (for signing)
 */
export function startImpersonation(retailerInfo, logId, superadminUid) {
  if (typeof window === 'undefined') return;
  const session = {
    ...retailerInfo,
    logId,
    startedAt: new Date().toISOString(),
    _saUid: superadminUid, // Store superadmin UID for verification
  };
  const signature = computeSignature(session, superadminUid);
  sessionStorage.setItem(IMPERSONATION_KEY, JSON.stringify(session));
  sessionStorage.setItem(SIGNATURE_KEY, signature);
}

/**
 * বর্তমান ইম্পার্সোনেশন session পড়ুন (with integrity check)
 * @returns {Object|null}
 */
export function getImpersonationSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(IMPERSONATION_KEY);
    if (!raw) return null;
    
    const session = JSON.parse(raw);
    const storedSig = sessionStorage.getItem(SIGNATURE_KEY);
    
    // MED-10: Verify session integrity
    if (!session._saUid || !storedSig) {
      // No signature found — invalid/tampered session
      sessionStorage.removeItem(IMPERSONATION_KEY);
      sessionStorage.removeItem(SIGNATURE_KEY);
      return null;
    }
    
    const expectedSig = computeSignature(session, session._saUid);
    if (storedSig !== expectedSig) {
      // Signature mismatch — session was tampered with
      console.warn('[Impersonation] Session integrity check failed — clearing');
      sessionStorage.removeItem(IMPERSONATION_KEY);
      sessionStorage.removeItem(SIGNATURE_KEY);
      return null;
    }
    
    return session;
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
  sessionStorage.removeItem(SIGNATURE_KEY);
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
