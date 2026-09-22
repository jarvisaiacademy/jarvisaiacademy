import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// Load from .env.local manually
import fs from "fs";
import path from "path";

const projectRoot = path.resolve(process.cwd());
for (const file of [".env.local", ".env"]) {
  const full = path.join(projectRoot, file);
  if (!fs.existsSync(full)) continue;
  for (const line of fs.readFileSync(full, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/(^["']|["']$)/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
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

  const certificates = [
    {
      id: "JAA-2026-" + Math.random().toString(36).substr(2, 4).toUpperCase(),
      courseId: "super10",
      courseName: "Super10 Elite AI Program",
      studentName: NAME,
      studentEmail: EMAIL,
      issuedAt: new Date().toLocaleString("en-IN"),
    }
  ];

  console.log(`Seeding to LIVE project: ${firebaseConfig.projectId}`);

  for (const record of enrollments) {
    const docId = `${record.studentEmail}_${record.courseId}`.replace(/[@.]/g, "_");
    await setDoc(doc(db, "enrollments", docId), record, { merge: true });
    console.log(`  -> Wrote Enrollment: ${record.courseName} (${record.action})`);
  }
  
  for (const cert of certificates) {
    await setDoc(doc(db, "certificates", cert.id), cert, { merge: true });
    console.log(`  -> Wrote Certificate: ${cert.courseName} (${cert.id})`);
  }

  console.log("\n✅ Successfully seeded enrollments & certificates to Firestore!");
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Failed:", e);
    process.exit(1);
  });
