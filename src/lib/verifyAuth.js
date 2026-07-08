/**
 * 🔐 verifyAuth.js — Firebase Token Verification Middleware
 * 
 * API route-এ ব্যবহার করো:
 *   const { uid, email } = await verifyAuth(request);
 * 
 * যদি token invalid হয়, error throw করবে।
 * 
 * CRIT-3 Fix: Uses Firebase Admin SDK verifyIdToken() for full
 * cryptographic verification instead of the insecure REST API.
 */

import admin from 'firebase-admin';
import '@/lib/firebase-admin'; // ensure initialized

/**
 * Verify Firebase ID token from request headers
 * @param {Request} request - Next.js API request object  
 * @returns {{ uid: string, email: string, name: string }} Decoded user info
 * @throws {Error} If token is missing or invalid
 */
export async function verifyAuth(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');

  if (!token) {
    throw new AuthError('Missing authorization token', 401);
  }

  try {
    // 🔒 Firebase Admin SDK — full cryptographic token verification
    const decoded = await admin.auth().verifyIdToken(token);

    return {
      uid: decoded.uid,
      email: decoded.email || '',
      name: decoded.name || '',
      emailVerified: decoded.email_verified || false,
    };
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new AuthError('Token verification failed', 401);
  }
}

/**
 * Optional auth — returns null instead of throwing if no token
 * Guest checkout-এর জন্য ব্যবহার হবে
 */
export async function optionalAuth(request) {
  try {
    return await verifyAuth(request);
  } catch {
    return null;
  }
}

/**
 * Custom error class for auth failures
 */
export class AuthError extends Error {
  constructor(message, statusCode = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}
