#!/usr/bin/env node

/**
 * Jarvis AI Academy — Firebase Firestore Course Seeder
 *
 * Usage:
 *   node scripts/seed-courses.mjs
 *   pnpm seed:courses
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// 1. Load environment variables from .env.local or .env
function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const fullPath = path.join(projectRoot, file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim();
          if (!process.env[key]) {
            process.env[key] = val.replace(/(^["']|["']$)/g, "");
          }
        }
      }
      console.log(`[Seeder] Loaded environment from ${file}`);
      break;
    }
  }
}

loadEnv();

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error(
    "❌ Error: Missing Firebase configuration. Please check .env.local for NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID."
  );
  process.exit(1);
}

console.log(`\n🚀 Initializing Firebase connection for project: ${firebaseConfig.projectId}...`);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. Load courses data
const coursesDataPath = path.join(projectRoot, "src", "data", "courses-data.json");
if (!fs.existsSync(coursesDataPath)) {
  console.error(`❌ Error: courses data file not found at ${coursesDataPath}`);
  process.exit(1);
}

const courses = JSON.parse(fs.readFileSync(coursesDataPath, "utf-8"));
console.log(`📚 Found ${courses.length} courses to feed into Firestore (collection: "courses")...\n`);

async function seed() {
  let count = 0;

  // Add timeout promise to avoid hanging if Firestore API is disabled
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(
        new Error(
          "Timeout connecting to Cloud Firestore. Please ensure the Cloud Firestore database is created/enabled in your Firebase Console: https://console.firebase.google.com/project/" +
            firebaseConfig.projectId +
            "/firestore"
        )
      );
    }, 15000);
  });

  const seedPromise = (async () => {
    for (const course of courses) {
      const docRef = doc(db, "courses", course.id);
      await setDoc(docRef, course, { merge: true });
      count++;
      console.log(`  ✓ [${course.number}] ${course.id.padEnd(16)} -> "${course.title}" (${course.fee})`);
    }
  })();

  await Promise.race([seedPromise, timeoutPromise]);

  console.log(`\n🎉 Successfully seeded ${count} courses to Firestore in collection "courses"!`);
  console.log("👉 The courses will now load dynamically and sync in real time across the Jarvis AI Academy app.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("\n❌ Seeding failed:", err.message || err);
  if (String(err).includes("PERMISSION_DENIED") || String(err).includes("disabled") || String(err).includes("Timeout")) {
    console.log("\n💡 Solution:");
    console.log("1. Open: https://console.firebase.google.com/project/" + firebaseConfig.projectId + "/firestore");
    console.log("2. Click 'Create database' and select production/test rules.");
    console.log("3. Once created, run `pnpm seed:courses` again.\n");
  }
  process.exit(1);
});
