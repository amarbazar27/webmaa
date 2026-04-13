// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMMzATvPWghOT8islcllFz9hXlCJ6HdFk",
  authDomain: "webmaa-app.firebaseapp.com",
  projectId: "webmaa-app",
  storageBucket: "webmaa-app.firebasestorage.app",
  messagingSenderId: "156216219253",
  appId: "1:156216219253:web:8fec080019c45244d0ca3c",
  measurementId: "G-ZNTHE383S2"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, db, storage, analytics };
