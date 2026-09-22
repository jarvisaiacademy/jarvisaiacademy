#!/usr/bin/env node

/**
 * Jarvis AI Academy — Firestore push / pull / drop
 *
 *   pnpm db pull               # every collection -> db-backups/<collection>.json
 *   pnpm db pull courses       # just one collection
 *   pnpm db push --yes         # every backup file -> Firestore
 *   pnpm db drop old one --yes # delete those collections outright
 *
 * Credentials come from `.env.local` (see `.env.example`). This talks to Firestore with the
 * Admin SDK, so `firestore.rules` does not apply and it can write anything — that is the point
 * of a restore tool, and it is why `push` will not run without `--yes`.
 *
 * Set FIRESTORE_EMULATOR_HOST=localhost:8080 to aim it at the emulator instead; no credentials
 * are needed in that case.
 *
 * The backups are a copy of live data, not source, so `db-backups/` is gitignored. Do not
 * commit them.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BACKUP_DIR = path.join(projectRoot, "db-backups");

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

// Every collection in the database, discovered rather than listed, so one added later is backed
// up without editing this file. Root collections only: nothing here uses subcollections, and
// finding them would cost an extra call per document. Extend if one ever appears.
async function allCollections() {
  const refs = await db.listCollections();
  return refs.map((ref) => ref.id).sort();
}

// The inverse of allCollections(), read off the backup directory: whatever pull wrote, push
// restores. This keeps a full backup a full restore without a second list to keep in step.
function backedUpCollections() {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  return fs
    .readdirSync(BACKUP_DIR)
    .filter((file) => file.endsWith(".json"))
    .map((file) => path.basename(file, ".json"))
    .sort();
}

function usage() {
  console.log(`Usage:
  pnpm db pull [collection ...]         Firestore -> db-backups/<collection>.json
  pnpm db push [collection ...] --yes   db-backups/<collection>.json -> Firestore
  pnpm db drop <collection ...> --yes   delete those collections outright

With no collection named, pull backs up every collection in the database and push
restores every backup file it finds. drop always needs the names: there is no
"drop everything", because the mistake is not reversible.`);
}

async function pull(names) {
  const targets = names.length > 0 ? names : await allCollections();
  if (targets.length === 0) {
    console.error("No collections in the database — nothing to back up.");
    process.exit(1);
  }
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  for (const name of targets) {
    const snapshot = await db.collection(name).get();
    const docs = {};
    snapshot.forEach((doc) => {
      docs[doc.id] = doc.data();
    });
    const file = path.join(BACKUP_DIR, `${name}.json`);
    fs.writeFileSync(file, JSON.stringify(docs, null, 2) + "\n");
    console.log(
      `  ✓ ${name.padEnd(12)} ${String(snapshot.size).padStart(5)} docs -> ${path.relative(projectRoot, file)}`
    );
  }
}

async function push(names, confirmed) {
  const targets = names.length > 0 ? names : backedUpCollections();
  const jobs = [];
  for (const name of targets) {
    const file = path.join(BACKUP_DIR, `${name}.json`);
    if (!fs.existsSync(file)) continue;
    jobs.push({ name, file, docs: JSON.parse(fs.readFileSync(file, "utf-8")) });
  }

  if (jobs.length === 0) {
    console.error(`No backup files in ${path.relative(projectRoot, BACKUP_DIR)}. Run \`pnpm db pull\` first.`);
    process.exit(1);
  }

  console.log("Will overwrite these documents:");
  for (const job of jobs) {
    console.log(`  ${job.name.padEnd(12)} ${Object.keys(job.docs).length} docs (from ${path.basename(job.file)})`);
  }

  if (!confirmed) {
    console.error("\nNothing written. Re-run with --yes to confirm the overwrite.");
    process.exit(1);
  }

  for (const job of jobs) {
    // bulkWriter batches and retries for us; no manual 500-write chunking.
    const writer = db.bulkWriter();
    for (const [id, data] of Object.entries(job.docs)) {
      writer.set(db.collection(job.name).doc(id), data);
    }
    await writer.close();
    console.log(`  ✓ ${job.name} written`);
  }
}

async function drop(names, confirmed) {
  if (names.length === 0) {
    console.error("Name the collections to drop. Refusing to guess at a deletion.");
    process.exit(1);
  }

  // Counted before deleting so the operator sees the blast radius, and so a name that matches
  // nothing is visibly a typo rather than a silent no-op.
  const targets = [];
  for (const name of names) {
    const snapshot = await db.collection(name).get();
    targets.push({ name, size: snapshot.size });
  }

  console.log("Will delete these collections:");
  for (const target of targets) {
    console.log(`  ${target.name.padEnd(12)} ${String(target.size).padStart(5)} docs`);
  }

  if (!confirmed) {
    console.error("\nNothing deleted. Re-run with --yes to confirm the deletion.");
    process.exit(1);
  }

  for (const target of targets) {
    // recursiveDelete, not a bulkWriter over the docs: it takes subcollections with it, so a
    // collection cannot be left behind looking empty while its children still bill.
    await db.recursiveDelete(db.collection(target.name));
    console.log(`  ✓ ${target.name} deleted`);
  }
}

const envFile = loadEnv();
const emulator = process.env.FIRESTORE_EMULATOR_HOST;
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
// The key sits on one line in .env, so its newlines arrive escaped.
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

const [command, ...rest] = process.argv.slice(2);
if (command !== "pull" && command !== "push" && command !== "drop") {
  usage();
  process.exit(command ? 1 : 0);
}

const names = rest.filter((arg) => !arg.startsWith("-"));

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

// Against the emulator, deliberately pass no credential: it verifies nothing, and any credential
// object that is neither a certificate nor applicationDefault() is rejected outright. The SDK
// still probes for ambient credentials and logs a MetadataLookupWarning off-GCP; that is noise.
const appOptions = { projectId };
if (clientEmail && privateKey) {
  appOptions.credential = cert({ projectId, clientEmail, privateKey });
} else if (!emulator) {
  appOptions.credential = applicationDefault();
}

initializeApp(appOptions);

const db = getFirestore();
console.log(`Target: ${projectId}${emulator ? ` (emulator ${emulator})` : ""}`);

try {
  if (command === "pull") {
    await pull(names);
  } else if (command === "drop") {
    await drop(names, rest.includes("--yes"));
  } else {
    await push(names, rest.includes("--yes"));
  }
} catch (err) {
  console.error(`\n✗ ${err.message || err}`);
  process.exit(1);
}
