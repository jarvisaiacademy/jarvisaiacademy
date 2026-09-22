#!/usr/bin/env node

/**
 * Jarvis AI Academy — seed the public content collections from source
 *
 *   pnpm seed:content              # create any doc that is missing; never overwrite
 *   pnpm seed:content --dry-run    # print the plan and write nothing (no credentials needed)
 *   pnpm seed:content --force      # overwrite docs that already exist
 *
 * `src/data/courses.ts` is the seed, keyed so the admin dashboard and the public pages
 * address the identical documents.
 *
 * Testimonials are deliberately not here: they are hard-coded in `src/data/testimonials.ts`
 * and never read from Firestore, so the twelve invented graduates never reach a collection.
 * The academy's own figures (`src/data/app-settings.ts`) are not here either, and no longer
 * have a Firestore document at all.
 *
 * Create-only is the default on purpose: `--force` against the real project discards
 * whatever an admin has since edited in the dashboard. Run `--dry-run` first.
 *
 * Credentials come from `.env.local` (see `.env.example`) — the same service account the
 * `pnpm db` script uses. The Admin SDK bypasses `firestore.rules` by design, which is what
 * lets this seed a project where no admin has signed in yet.
 *
 * Set FIRESTORE_EMULATOR_HOST=localhost:8080 to aim it at the emulator instead; no
 * credentials are needed in that case.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Same convention as scripts/db-data.mjs — read that file if this needs to change.
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

function usage() {
  console.log(`Seed the courses collection and the settings document from src/data.

  pnpm seed:content              create missing docs only
  pnpm seed:content --dry-run    list what would be written, write nothing
  pnpm seed:content --force      overwrite existing docs as well
`);
}

const argv = process.argv.slice(2);
const unknown = argv.filter((a) => a !== "--dry-run" && a !== "--force");
if (unknown.length) {
  console.error(`Unknown option: ${unknown.join(", ")}\n`);
  usage();
  process.exit(1);
}
const dryRun = argv.includes("--dry-run");
const force = argv.includes("--force");

// Node strips the types natively, so the courses come from the real source file rather than
// a copy that can drift from it. The module is import-free, which is what makes that work.
const fromData = (rel) => pathToFileURL(path.join(projectRoot, rel)).href;
const { COURSES_DATA } = await import(fromData("src/data/courses.ts"));

const targets = [
  ...COURSES_DATA.map((course) => ({
    collection: "courses",
    id: course.id,
    data: course,
  })),
];

// A repeated id means two sources collapsed onto one document and one of them would be
// lost silently — a renamed person, most likely. Refuse rather than write half the data.
const seen = new Set();
const duplicates = [];
for (const target of targets) {
  const key = `${target.collection}/${target.id}`;
  if (seen.has(key)) duplicates.push(key);
  seen.add(key);
}
if (duplicates.length) {
  console.error(`Duplicate document ids — fix the source data first:\n  ${duplicates.join("\n  ")}`);
  process.exit(1);
}

const courseCount = COURSES_DATA.length;
console.log(
  `${courseCount} courses + 1 settings → ` +
    `${targets.length} documents${force ? " (overwriting)" : " (create-only)"}`
);

if (dryRun) {
  for (const target of targets) {
    console.log(`  ${target.collection}/${target.id}`);
  }
  console.log("\nDry run — nothing written.");
  process.exit(0);
}

const envFile = loadEnv();
const emulator = process.env.FIRESTORE_EMULATOR_HOST;
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
// The key sits on one line in .env, so its newlines arrive escaped.
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId) {
  console.error("Missing project id. Set NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env.local.");
  process.exit(1);
}

if (!emulator && !(clientEmail && privateKey) && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error(`No Firestore credentials. Add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY to
${envFile || ".env.local"} — a service account key from the Firebase console, Project settings ->
Service accounts -> Generate new private key. Or point GOOGLE_APPLICATION_CREDENTIALS at the
downloaded .json. To work against the emulator instead, set FIRESTORE_EMULATOR_HOST=localhost:8080.`);
  process.exit(1);
}

// Against the emulator, deliberately pass no credential — it verifies nothing. Same as db-data.mjs.
const appOptions = { projectId };
if (clientEmail && privateKey) {
  appOptions.credential = cert({ projectId, clientEmail, privateKey });
} else if (!emulator) {
  appOptions.credential = applicationDefault();
}

initializeApp(appOptions);
const db = getFirestore();

const writer = db.bulkWriter();
// Handlers are attached as each op is queued, so a rejection is never unhandled. `create`
// fails with ALREADY_EXISTS on a doc that is there; that is a skip, not an error.
const results = targets.map((target) => {
  const ref = db.collection(target.collection).doc(target.id);
  const op = force ? writer.set(ref, target.data) : writer.create(ref, target.data);
  return op.then(
    () => ({ target, ok: true }),
    (err) => ({ target, ok: false, code: err.code, message: err.message })
  );
});

await writer.close();
const settled = await Promise.all(results);

const written = [];
const skipped = [];
const failed = [];
for (const result of settled) {
  const label = `${result.target.collection}/${result.target.id}`;
  if (result.ok) written.push(label);
  else if (result.code === 6) skipped.push(label); // ALREADY_EXISTS
  else failed.push(`${label} — ${result.message}`);
}

console.log(`\n  ${force ? "overwritten" : "created"}: ${written.length}`);
console.log(`  already present: ${skipped.length}`);
if (failed.length) {
  console.log(`  failed: ${failed.length}`);
  for (const failure of failed) console.log(`    - ${failure}`);
}

if (failed.length) process.exit(1);
if (skipped.length) console.log("\nRe-run with --force to overwrite the ones already present.");
console.log("Done.");
