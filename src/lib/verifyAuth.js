/**
 * 🔐 verifyAuth.js — Firebase Token Verification Middleware
 * 
 * API route-এ ব্যবহার করো:
 *   const { uid, email } = await verifyAuth(request);
 * 
 * যদি token invalid হয়, error throw করবে।
 * 
 * কিভাবে কাজ করে:
 * - Client থেকে Authorization: Bearer <idToken> হেডার পাঠাতে হবে
 * - এই middleware Firebase REST API দিয়ে token verify করে
 * - Vercel Edge Runtime-এ Firebase Admin SDK লাগে না
 */

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// Token info endpoint — Firebase publishes this for token verification
const VERIFY_URL = `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`;

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
    // Firebase REST API দিয়ে token verify করা
    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    });

    if (!response.ok) {
      throw new AuthError('Invalid or expired token', 401);
    }

    const data = await response.json();
    const user = data.users?.[0];

    if (!user) {
      throw new AuthError('User not found', 401);
    }

    return {
      uid: user.localId,
      email: user.email || '',
      name: user.displayName || '',
      emailVerified: user.emailVerified || false,
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
