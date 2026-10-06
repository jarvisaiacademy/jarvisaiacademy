import * as fs from "fs";
import * as path from "path";
import type { AppOptions } from "firebase-admin/app";
import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { COURSES_DATA } from "../src/data/courses";

const projectRoot = path.resolve(__dirname, "..");

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
  }
}
loadEnv();

let appOptions: AppOptions = { credential: applicationDefault(), projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID };
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY, "base64").toString("utf-8")
  );
  appOptions = { credential: cert(serviceAccount) };
} else if (process.env.FIREBASE_PRIVATE_KEY) {
    appOptions = {
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    };
} else if (fs.existsSync(path.join(projectRoot, 'service-account.json'))) {
  const sa = JSON.parse(fs.readFileSync(path.join(projectRoot, 'service-account.json'), 'utf-8'));
  appOptions = { credential: cert(sa) };
}

initializeApp(appOptions);
const db = getFirestore();

async function run() {
  const coursesSnap = await db.collection("courses").get();
  console.log(`Found ${coursesSnap.size} courses in Firestore.`);
  
  const writer = db.bulkWriter();
  let updatedCount = 0;
  
  for (const doc of coursesSnap.docs) {
    const data = doc.data();
    
    // Find the course in the seed data
    const seedCourse = COURSES_DATA.find(c => c.id === doc.id);
    
    let chatResponse = "";
    
    // If it has a specific response from our recent migration, use it.
    if (seedCourse && seedCourse.chatResponse) {
      chatResponse = seedCourse.chatResponse;
    } else {
      // Otherwise use the default fully dynamic template!
      chatResponse = `### 🎓 **{title}**\n*_{bannerSubtitle}_*\n\n* **Track**: {categoryLabel}\n* **Level**: **{level}**\n* **Duration**: **{duration}**\n* **Tuition Fee**: **{fee}**\n* **Curriculum Overview**: {description}\n\n**Key Modules**:\n{topics}\n\n**Tech Stack**: {techStack}\n\nWould you like to enroll in **{title}** or ask about the syllabus?`;
    }
    
    writer.update(doc.ref, { chatResponse });
    updatedCount++;
    console.log(`Queueing update for ${doc.id} (Dynamic: ${chatResponse.includes('{title}')})`);
  }
  
  await writer.close();
  console.log(`Successfully updated ${updatedCount} courses in the database.`);
  console.log(`All courses are now 100% backend-driven with zero frontend fallbacks.`);
}

run().catch(console.error);
