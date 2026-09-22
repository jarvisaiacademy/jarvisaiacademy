/**
 * Asserts that a referral code is shaped the way everything else assumes.
 *
 *   node scripts/check-referral-codes.mjs
 *
 * A code is derived, not stored, so the same function decides what a learner is shown, what the
 * `referrals` index is keyed by, and what a backfill writes. Get it wrong and the failure is
 * quiet: a code shown on `/settings` that resolves to nobody, or two accounts sharing one code
 * and a ₹3,000 reward credited to the wrong referrer. Neither throws anything anywhere.
 *
 * Imports the real module rather than restating it, so this cannot drift from the app.
 */
import { pathToFileURL } from "node:url";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { REFERRAL_CODE_PREFIX, referralCodeFor, normalizeReferralCode } = await import(
  pathToFileURL(path.join(ROOT, "src/data/referrals.ts")).href
);

let failures = 0;

function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) {
    failures++;
    console.error(`FAIL  ${label}\n        got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`);
  } else {
    console.log(`ok    ${label}`);
  }
}

// --- the shape ---------------------------------------------------------------
// The body length is the collision guarantee, so it is asserted rather than assumed: shortening
// it to 6 raises the chance two accounts share a code from about 1 in 56,000 to 1 in 21.
const uid = "AbCdEfGhIjKlMnOpQrStUvWxYz12";
check("prefix", REFERRAL_CODE_PREFIX, "JAR-");
check("eight characters of the id, uppercased", referralCodeFor(uid), "JAR-ABCDEFGH");
check("length", referralCodeFor(uid).length, 12);
check("deterministic", referralCodeFor(uid), referralCodeFor(uid));
// Nothing past the eighth character may leak into a code that gets read out on a call.
check("does not leak the rest of the id", referralCodeFor(uid).includes("IJKL"), false);

// --- what a learner types ----------------------------------------------------
check("already canonical", normalizeReferralCode("JAR-ABCDEFGH"), "JAR-ABCDEFGH");
check("lower case", normalizeReferralCode("jar-abcdefgh"), "JAR-ABCDEFGH");
check("body without the prefix", normalizeReferralCode("abcdefgh"), "JAR-ABCDEFGH");
check("surrounding whitespace", normalizeReferralCode("  jar-abcdefgh\n"), "JAR-ABCDEFGH");
// A code split across lines when it was copied out of a message is still the code.
check("whitespace inside", normalizeReferralCode("JAR-ABCD EFGH"), "JAR-ABCDEFGH");

// --- what must never reach a document path -----------------------------------
// The result of `normalizeReferralCode` is used as a Firestore document id. A slash there is a
// traversal and a `#` or `?` is a fragment, so these have to come back as "not a code".
for (const bad of ["", "   ", "JAR-", "JAR-AB/CD", "AB#CD", "AB?CD", "JAR-AB.CD", "JAR-AB*CD"]) {
  check(`rejected: ${JSON.stringify(bad)}`, normalizeReferralCode(bad), "");
}

// --- distinctness over a crowd ----------------------------------------------
// A cheap deterministic generator, so this is the same 20,000 ids on every run and can never
// flake. Real ids are 28 alphanumeric characters drawn from a CSPRNG; what matters here is only
// that the derivation is stable and spread out across the whole alphabet.
const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
// xorshift32, not a plain LCG: an LCG's low bits cycle with a period of a few hundred, and since
// only the *first* eight characters of each id decide the code, an LCG produces the same handful
// of codes over and over and reports a collision that is really a bad generator.
let seed = 20260922;
const nextChar = () => {
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  return ALPHABET[(seed >>> 0) % ALPHABET.length];
};
const SAMPLE = 20000;
const codes = new Set();
for (let i = 0; i < SAMPLE; i++) {
  codes.add(referralCodeFor(nextChar() + Array.from({ length: 27 }, nextChar).join("")));
}
check(`${SAMPLE} accounts, no shared code`, codes.size, SAMPLE);

console.log(failures ? `\n${failures} failure(s)` : "\nreferral codes are shaped as everything else assumes");
process.exit(failures ? 1 : 0);
