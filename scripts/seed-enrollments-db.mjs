import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, applicationDefault, cert } from "firebase-admin/app";
import fs from "fs";
import path from "path";
const projectRoot = path.resolve(process.cwd());

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const full = path.join(projectRoot, file);
    if (!fs.existsSync(full)) continue;
    for (const line of fs.readFileSync(full, "utf-8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed
        .slice(eq + 1)
        .trim()
        .replace(/(^["']|["']$)/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
    return file;
  }
  return null;
}

const envFile = loadEnv();
const emulator = process.env.FIRESTORE_EMULATOR_HOST;
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId) {
  console.error("Missing project id. Set NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env.local.");
  process.exit(1);
}

const appOptions = { projectId };
if (clientEmail && privateKey) {
  appOptions.credential = cert({ projectId, clientEmail, privateKey });
} else if (!emulator) {
  appOptions.credential = applicationDefault();
}

initializeApp(appOptions);
const db = getFirestore();

console.log(`Target: ${projectId}${emulator ? ` (emulator ${emulator})` : ""}`);

async function seedEnrollments() {
  const EMAIL = "sarwadesugatraj@gmail.com";
  const NAME = "Sugatraj Sarwade";

  const enrollments = [
    {
      action: "paid",
      courseId: "super10",
      courseName: "Super10 Elite AI Program",
      amount: 30000,
      transactionId: "TXN-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      studentName: NAME,
      studentEmail: EMAIL,
      timestamp: new Date().toLocaleString("en-IN"),
    },
    {
      action: "initiated",
      courseId: "react-ai",
      courseName: "AI-Powered React Engineering",
      amount: 15000,
      transactionId: "TXN-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      studentName: NAME,
      studentEmail: EMAIL,
      timestamp: new Date(Date.now() - 86400000).toLocaleString("en-IN"),
    },
  ];

  console.log(`\nSeeding Firestore 'enrollments' collection for ${EMAIL}...`);
  
  const batch = db.batch();
  const collRef = db.collection("enrollments");

  for (const record of enrollments) {
    // Make it idempotent by using email + courseId as document ID
    const docId = `${record.studentEmail}_${record.courseId}`.replace(/[@.]/g, "_");
    const docRef = collRef.doc(docId);
    batch.set(docRef, record, { merge: true });
    console.log(`  -> Queued write for ${record.courseName} (${record.action})`);
  }

  await batch.commit();
  console.log("\n✅ Successfully seeded enrollments to Firestore!");
}

seedEnrollments().catch(console.error);
