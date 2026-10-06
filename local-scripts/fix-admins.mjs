import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Load the downloaded service account key
const serviceAccount = JSON.parse(readFileSync('./service-account.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const admins = [
  { email: "sugatraj.2106@gmail.com", uid: "JwiyrJNNkXXEpV75yA6xucYstuY2" },
  { email: "lalitspatil03@gmail.com", uid: "rDGHU0VVx3RhIAOiolNAS2aA5QA3" },
  { email: "hivirajkadam@gmail.com", uid: "zTsajJlOLDetg0XQ3XBsjGCNxSm1" }
];

async function run() {
  console.log("Setting up Admin roles securely...");
  for (const admin of admins) {
    try {
      await db.collection('users').doc(admin.uid).set({ 
        role: 'admin',
        email: admin.email
      }, { merge: true });
      console.log(`✅ Successfully granted Admin to ${admin.email}`);
    } catch (e) {
      console.log(`❌ Failed for ${admin.email}:`, e.message);
    }
  }
}
run();
