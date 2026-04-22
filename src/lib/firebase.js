// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// 🔐 Firebase config — ONLY from environment variables (never hardcode!)
// .env.local ফাইলে NEXT_PUBLIC_FIREBASE_* ভেরিয়েবলগুলো সেট করতে হবে
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: typeof window !== 'undefined' ? window.location.host : (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "webmaa-app.firebaseapp.com"),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// 🛡️ Validate: env vars ছাড়া অ্যাপ চলবে না
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Firebase environment variables missing! Check .env.local');
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, db, storage, analytics };
