/**
 * Referral codes — the single definition of what one is.
 *
 * Import-free like `src/data/courses.ts` and `src/data/app-settings.ts`, and for the same
 * reason: `scripts/db-data.mjs` imports this file directly, and the backfill and the browser
 * have to agree on what a code is. One function rather than two copies is the cheapest way to
 * guarantee that.
 */

export const REFERRAL_CODE_PREFIX = "";
export const REFERRAL_CODE_LENGTH = 6;
const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CODE_ALPHABET = /^[A-Z0-9]{6}$/;

/**
 * Derives a deterministic, high-entropy 6-character alphanumeric referral code from a user id.
 * Produces exactly 6 characters in [A-Z0-9], unique to each user.
 */
export function referralCodeFor(uid: string): string {
  if (!uid || typeof uid !== "string") return "JARVIS";

  let h1 = 0x811c9dc5;
  let h2 = 0x27d4eb2f;
  for (let i = 0; i < uid.length; i++) {
    const ch = uid.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x01000193);
    h2 = Math.imul(h2 ^ ch, 0x5bd1e995);
  }

  const n1 = Math.abs(h1) >>> 0;
  const n2 = Math.abs(h2) >>> 0;
  let n = (n1 * 31 + n2) >>> 0;

  let res = "";
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    res += ALPHABET[n % 36];
    n = Math.floor(n / 36);
  }
  return res;
}

export function normalizeReferralCode(input: string): string {
  if (typeof input !== "string") return "";

  // Normalize all whitespace, including internal whitespace.
  let value = input.replace(/\s+/g, "").toUpperCase();

  // Strip legacy JAR- prefix if entered.
  if (value.startsWith("JAR-")) {
    value = value.slice(4);
  }

  // Must be strictly 6 alphanumeric characters.
  if (!CODE_ALPHABET.test(value)) {
    return "";
  }

  return value;
}

