/**
 * Referral codes — the single definition of what one is.
 *
 * Import-free like `src/data/courses.ts` and `src/data/app-settings.ts`, and for the same
 * reason: `scripts/db-data.mjs` imports this file directly, and the backfill and the browser
 * have to agree on what a code is. One function rather than two copies is the cheapest way to
 * guarantee that.
 */

export const REFERRAL_CODE_PREFIX = "JAR-";
const CODE_BODY_LENGTH = 8;
const CODE_ALPHABET = /^[A-Z0-9]+$/;

export function referralCodeFor(uid: string): string {
  return REFERRAL_CODE_PREFIX + uid.slice(0, CODE_BODY_LENGTH).toUpperCase();
}

export function normalizeReferralCode(input: string): string {
  if (typeof input !== "string") return "";

  // Normalize all whitespace, including whitespace inside the value.
  let value = input.replace(/\s+/g, "").toUpperCase();

  // Accept either JAR-XXXXXXXX or XXXXXXXX.
  if (value.startsWith(REFERRAL_CODE_PREFIX)) {
    value = value.slice(REFERRAL_CODE_PREFIX.length);
  }

  // Do not strip invalid characters: stripping causes collisions.
  if (!CODE_ALPHABET.test(value)) {
    return "";
  }

  if (value.length < CODE_BODY_LENGTH) {
    return "";
  }

  return `${REFERRAL_CODE_PREFIX}${value.slice(0, CODE_BODY_LENGTH)}`;
}
