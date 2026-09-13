import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  Auth,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const getCleanAuthDomain = () => {
  if (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) {
    return process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  }
  if (typeof window !== "undefined") {
    const host = window.location.host;
    if (host.includes("jarvisaiacademy") || host.includes("netlify.app")) {
      return host;
    }
  }
  return "jarvisaiacademy-580a7.firebaseapp.com";
};

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyABWBeFX9nHxWzCpxhu4iCmS1TeaTHijMg",
  authDomain: getCleanAuthDomain(),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "jarvisaiacademy-580a7",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "jarvisaiacademy-580a7.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "864804438661",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:864804438661:web:5842fc7c5b6acbaa55dfec",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-J5RQ9DQQF7",
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.apiKey.length > 5
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (typeof window !== "undefined" && isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    // Use browserLocalPersistence for instant synchronous token restoration
    setPersistence(auth, browserLocalPersistence).catch(() => {});
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });
  } catch (err) {
    console.warn("[Firebase] Initialization error:", err);
  }
}

export { app, auth, db, googleProvider };
