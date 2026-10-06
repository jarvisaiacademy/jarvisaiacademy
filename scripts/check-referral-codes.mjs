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
const { REFERRAL_CODE_PREFIX, referralCodeFor, normalizeReferralCode, resolvedReferralCode } = await import(
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
const uid = "AbCdEfGhIjKlMnOpQrStUvWxYz12";
const generated = referralCodeFor(uid);
check("length is 6", generated.length, 6);
check("alphanumeric only", /^[A-Z0-9]{6}$/.test(generated), true);
check("deterministic", referralCodeFor(uid), referralCodeFor(uid));

// --- what a learner types ----------------------------------------------------
check("already canonical", normalizeReferralCode("8I4WH0"), "8I4WH0");
check("lower case", normalizeReferralCode("8i4wh0"), "8I4WH0");
check("legacy prefix", normalizeReferralCode("JAR-8I4WH0"), "8I4WH0");
check("surrounding whitespace", normalizeReferralCode("  8i4wh0\n"), "8I4WH0");
check("whitespace inside", normalizeReferralCode("8I4 WH0"), "8I4WH0");

// --- resolved referral code (strictly 6 chars, legacy rejected) --------------
check("resolved: keeps valid 6-char", resolvedReferralCode(uid, "8I4WH0"), "8I4WH0");
check("resolved: strips JAR- to 6-char", resolvedReferralCode(uid, "JAR-8I4WH0"), "8I4WH0");
check("resolved: rejects legacy JAR-8-char", resolvedReferralCode(uid, "JAR-OLDCODE8"), generated);
check("resolved: rejects JARVIS placeholder", resolvedReferralCode(uid, "JARVIS"), generated);
check("resolved: fallback when undefined", resolvedReferralCode(uid, undefined), generated);
check("resolved: fallback when null", resolvedReferralCode(uid, null), generated);
check("resolved: fallback when empty", resolvedReferralCode(uid, ""), generated);

// --- what must never reach a document path -----------------------------------
for (const bad of ["", "   ", "JAR-", "8I/WH0", "8I#WH0", "8I?WH0", "8I.WH0", "8I4W", "8I4WH01"]) {
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
