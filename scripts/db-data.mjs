#!/usr/bin/env node

/**
 * Jarvis AI Academy — Firestore push / pull / drop / backfill
 *
 *   pnpm db pull               # every collection -> db-backups/<collection>.json
 *   pnpm db pull courses       # just one collection
 *   pnpm db push --yes         # every backup file -> Firestore
 *   pnpm db drop old one --yes # delete those collections outright
 *   pnpm db backfill users --yes  # fill in fields the rules already assume are present
 *   pnpm db referral-codes --yes  # give every account a referral code, and index it
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
import { fileURLToPath, pathToFileURL } from "node:url";
import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BACKUP_DIR = path.join(projectRoot, "db-backups");

// The derivation is imported rather than restated, so the backfill and the browser cannot
// disagree about what a code is — a code written here that `/settings` would not derive is a
// code that resolves to its owner and does not match what they were told to share. Import-free
// for exactly this reason; Node strips the types (`scripts/seed-content.mjs` does the same).
const { referralCodeFor } = await import(
  pathToFileURL(path.join(projectRoot, "src/data/referrals.ts")).href
);

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
  pnpm db backfill users --yes          set fields the rules assume exist
  pnpm db referral-codes --yes          give every existing account a referral code

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

// Fields the app already behaves as though every document has.
//
// `firestore.rules:64-66` compares them with `get(field, default)`, and the roster queries in
// `src/services/pagination.ts` filter on them — but Firestore's `==`, `!=` and `in` all skip a
// document where the field is absent, so `where("is_teacher", "==", false)` matches nobody on a
// roster where the flag was never written. Absent and `false` mean the same thing to the rules
// and different things to a query; this makes them the same thing to both.
const USER_FIELD_DEFAULTS = { is_teacher: false, status: "active" };

async function backfill(names, confirmed) {
  const unknown = names.filter((name) => name !== "users");
  if (unknown.length) {
    console.error(
      `Only \`users\` has fields worth backfilling; got: ${unknown.join(", ")}. Nothing else has a ` +
        `default the app assumes is present.`
    );
    process.exit(1);
  }

  // Collected before writing so the operator sees the blast radius, and so a second run is
  // visibly a no-op — which is the whole safety property here.
  const snapshot = await db.collection("users").get();
  const writes = [];
  const gapsByField = {};

  snapshot.forEach((doc) => {
    const data = doc.data();
    const gaps = {};
    for (const [field, value] of Object.entries(USER_FIELD_DEFAULTS)) {
      // Absent only. A field that is present is left exactly as it is even when it holds
      // `false`, so this can never demote a real teacher or un-ban a suspended candidate.
      if (data[field] === undefined) gaps[field] = value;
    }
    if (Object.keys(gaps).length === 0) return;
    for (const field of Object.keys(gaps)) gapsByField[field] = (gapsByField[field] || 0) + 1;
    writes.push({ ref: doc.ref, gaps });
  });

  const breakdown = Object.entries(gapsByField)
    .map(([field, count]) => `${field} on ${count}`)
    .join(", ");
  console.log("Will set only the fields these documents are missing:");
  console.log(
    `  users        ${String(writes.length).padStart(5)} / ${snapshot.size} docs` +
      (breakdown ? `  (${breakdown})` : "  — nothing missing")
  );

  if (writes.length === 0) {
    console.log("\nNothing to backfill.");
    return;
  }

  if (!confirmed) {
    console.error("\nNothing written. Re-run with --yes to confirm the write.");
    process.exit(1);
  }

  const writer = db.bulkWriter();
  // merge: true, not a plain set — the payload holds only the missing fields, and anything an
  // admin has since set on the document must survive untouched.
  for (const write of writes) {
    writer.set(write.ref, write.gaps, { merge: true });
  }
  await writer.close();
  console.log(`  ✓ users backfilled`);
}

// Every existing account a referral code, in the two places it lives: the field on their own row,
// which is what the dashboard lists, and the `referrals` index document, which is the only way a
// code can be resolved by someone who knows nothing but the code. `publishReferralCode` writes
// the same pair on every sign-in; this is the pass that reaches the accounts that signed in
// before either existed.
//
// A code is derived from the uid, so there is nothing to generate and nothing to make unique —
// which is most of why this is a short script. The one thing it does have to do is refuse to
// write a collision.
async function referralCodes(confirmed, names) {
  if (names.length) {
    console.error(`referral-codes takes no arguments; got: ${names.join(", ")}.`);
    process.exit(1);
  }

  // Both sides read before anything is written. A collision can only be found by looking, and the
  // second write of one code silently moves it to another account and the ₹3,000 with it.
  const [users, index] = await Promise.all([
    db.collection("users").get(),
    db.collection("referrals").get(),
  ]);
  const storedIndex = new Map(index.docs.map((doc) => [doc.id, doc.data().uid]));

  const codeOwners = new Map();
  const collisions = [];
  const userWrites = [];

  users.forEach((doc) => {
    const code = referralCodeFor(doc.id);
    const holder = codeOwners.get(code);
    if (holder) {
      collisions.push(`${code} is derived by both ${holder} and ${doc.id}`);
      return;
    }
    codeOwners.set(code, doc.id);
    if (doc.data().referralCode !== code) userWrites.push({ ref: doc.ref, code });
  });

  const indexWrites = [];
  for (const [code, uid] of codeOwners) {
    const stored = storedIndex.get(code);
    // The same failure from the other direction: an entry already held by a different account,
    // which only an older format or a hand-edited document could have produced.
    if (stored !== undefined && stored !== uid) {
      collisions.push(`${code} is held by ${uid} but indexed to ${stored}`);
      continue;
    }
    if (stored !== uid) indexWrites.push({ code, uid });
  }

  if (collisions.length) {
    console.error("Two accounts would share a code, so nothing was written:");
    for (const line of collisions) console.error(`  ${line}`);
    console.error("\nTwo accounts with one code means a reward credited to the wrong referrer.");
    console.error("Renaming an account is not possible; a code is derived from the uid, and the");
    console.error("uid is Firestore's. Resolve this by hand, and deliberately.");
    process.exit(1);
  }

  // An entry with no account behind it resolves to a uid that no longer exists — the code is
  // dead weight and a claim against it credits nobody. Reported rather than deleted: removing
  // data is a deliberate act, not a side effect of a backfill.
  const orphans = [...storedIndex.keys()].filter((code) => !codeOwners.has(code));

  console.log(`Will set a code on the ${userWrites.length} of ${users.size} accounts that lack one:`);
  console.log(
    `  users        ${String(userWrites.length).padStart(5)} / ${users.size} docs` +
      (userWrites.length ? "" : "  — every account already has its own code")
  );
  console.log(`  referrals    ${String(indexWrites.length).padStart(5)} index docs`);
  if (orphans.length) {
    console.log(`  ${orphans.length} index docs belong to no account: ${orphans.join(", ")}`);
  }

  if (!userWrites.length && !indexWrites.length) {
    console.log("\nNothing to backfill.");
    return;
  }

  if (!confirmed) {
    console.error("\nNothing written. Re-run with --yes to confirm the write.");
    process.exit(1);
  }

  const writer = db.bulkWriter();
  // merge: true on both, so an admin's edits to the rest of the row and anything else already on
  // the index document survive. Only these two fields are this script's business.
  for (const write of userWrites) {
    writer.set(write.ref, { referralCode: write.code }, { merge: true });
  }
  for (const write of indexWrites) {
    writer.set(db.collection("referrals").doc(write.code), { uid: write.uid }, { merge: true });
  }
  await writer.close();
  console.log(`  ✓ referral codes backfilled`);
}

const envFile = loadEnv();
const emulator = process.env.FIRESTORE_EMULATOR_HOST;
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
// The key sits on one line in .env, so its newlines arrive escaped.
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

const [command, ...rest] = process.argv.slice(2);
if (!["pull", "push", "drop", "backfill", "referral-codes"].includes(command)) {
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
  } else if (command === "backfill") {
    await backfill(names, rest.includes("--yes"));
  } else if (command === "referral-codes") {
    await referralCodes(rest.includes("--yes"), names);
  } else {
    await push(names, rest.includes("--yes"));
  }
} catch (err) {
  console.error(`\n✗ ${err.message || err}`);
  process.exit(1);
}
