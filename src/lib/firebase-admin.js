import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getMessaging } from 'firebase-admin/messaging';

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!getApps().length && projectId) {
  try {
    initializeApp({
      credential: cert({
        projectId: projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Handle escaped newlines in the exact format Vercel injects
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    // PROD-1: Removed success log — avoid leaking project details in production
  } catch (error) {
    console.error('[FIREBASE ADMIN] Initialization error', error.stack);
  }
}

// Export singletons — init must run before these lines
export const adminDb = getApps().length ? getFirestore() : null;
export const adminAuth = getApps().length ? getAuth() : null;
export const adminMessaging = getApps().length ? getMessaging() : null;

// Re-export FieldValue for routes that need serverTimestamp, increment, etc.
export { FieldValue };
