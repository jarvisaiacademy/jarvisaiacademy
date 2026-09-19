import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  Auth,
  browserLocalPersistence,
  setPersistence,
  connectAuthEmulator,
} from "firebase/auth";
import { getFirestore, Firestore, connectFirestoreEmulator } from "firebase/firestore";

/**
 * Firebase web config, read from the environment and nothing else.
 *
 * These values are public. The `NEXT_PUBLIC_` prefix makes Next inline them into the
 * client bundle, so every visitor can read this block — which is by design, and why the
 * web API key is not treated as a secret here. What protects the data is
 * `firestore.rules`, plus the key restrictions set in Google Cloud.
 *
 * No hardcoded fallbacks on purpose. They previously named a decommissioned project, so a
 * missing variable connected to a dead backend instead of failing; `isFirebaseConfigured`
 * below is what turns an empty environment into a visible error.
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "",
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

    // Point at the local Emulator Suite. Needs no real project, API key, or login.
    if (process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === "1") {
      connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
      connectFirestoreEmulator(db, "127.0.0.1", 8080);
    }
  } catch (err) {
    console.warn("[Firebase] Initialization error:", err);
  }
}

export { app, auth, db, googleProvider };
