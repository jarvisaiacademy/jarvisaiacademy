/**
 * Helper script to generate the browser console command needed to seed
 * student enrollments for UI/UX testing.
 * 
 * Enrolments are currently stored in localStorage ('jarvis_enrollment_tracker')
 * by the chat UI, not in Firestore. Therefore, a server-side SDK script cannot
 * directly inject them into the browser.
 * 
 * Run this script to get the exact command to paste into your browser console:
 * node scripts/seed-local-enrollments.mjs
 */

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
    timestamp: new Date().toLocaleString("en-IN")
  },
  {
    action: "initiated",
    courseId: "react-ai",
    courseName: "AI-Powered React Engineering",
    amount: 15000,
    transactionId: "TXN-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
    studentName: NAME,
    studentEmail: EMAIL,
    timestamp: new Date(Date.now() - 86400000).toLocaleString("en-IN")
  }
];

console.log("\n========================================================");
console.log("🛠️  HOW TO SEED ENROLLMENTS FOR UI/UX TESTING");
console.log("========================================================\n");
console.log("Because enrollments currently live in the browser's localStorage");
console.log("and not in Firestore, you need to run this command in your");
console.log("browser's Developer Tools Console (F12 -> Console):\n");

console.log(`localStorage.setItem('jarvis_enrollment_tracker', JSON.stringify(${JSON.stringify(enrollments)}));`);
console.log(`window.location.reload();`);

console.log("\n========================================================\n");
