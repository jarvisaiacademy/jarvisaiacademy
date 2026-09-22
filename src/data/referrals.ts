/**
 * Referral codes — the single definition of what one is.
 *
 * Import-free like `src/data/courses.ts` and `src/data/app-settings.ts`, and for the same
 * reason: `scripts/db-data.mjs` imports this file directly, and the backfill and the browser
 * have to agree on what a code is. One function rather than two copies is the cheapest way to
 * guarantee that.
 *
 * A code is derived from the account id rather than stored as a random value. Three things fall
 * out of that: every write is idempotent, so a backfill needs no uniqueness read and no random
 * draw; the code a learner is shown cannot disagree with the code that resolves, because one
 * function produces both; and there is nothing to re-issue when the same account signs in again.
 *
 * Two ceilings worth knowing. Changing the format below stops every code already shared on
 * WhatsApp from resolving at its old spelling, so the `referrals` index has to be migrated with
 * it. And the derivation assumes an account id drawn from `[A-Za-z0-9]`, which is what Firebase
 * Auth issues — a uid carrying anything else (a hyphen, say) would yield a code
 * `normalizeReferralCode` refuses, so it could never be typed back in. That holds as long as
 * uids stay Firebase's; importing accounts with hand-made ids would break it silently.
 *
 * Checked by `node scripts/check-referral-codes.mjs`.
 */

/** Short, always uppercase, and spelled out when read aloud or typed off a screenshot. */
export const REFERRAL_CODE_PREFIX = "JAR-";

/**
 * How much of the account id a code carries.
 *
 * Eight characters of a 28-character alphanumeric id, uppercased — a 36-symbol alphabet, so
 * about 2.8e12 codes. A collision is the one failure here that costs real money: two accounts
 * with one code means a reward credited to the wrong referrer. At 10k accounts it is roughly 1
 * in 56,000; at six characters it would have been 1 in 21.
 */
const CODE_BODY_LENGTH = 8;

/** The alphabet a code is built from — what `referralCodeFor` can produce. */
const CODE_ALPHABET = /^[A-Z0-9]+$/;

/** The code belonging to an account, in its canonical spelling. */
export function referralCodeFor(uid: string): string {
  return REFERRAL_CODE_PREFIX + uid.slice(0, CODE_BODY_LENGTH).toUpperCase();
}

/**
 * Whatever a learner typed, as the code to look up — or "" when it cannot be one.
 *
 * Lenient about the two things people actually get wrong: case, and copying only the body
 * without the prefix. Strict about the alphabet, because the result goes straight into a
 * Firestore document path and a stray `/` or `#` there is a traversal, not a typo.
 *
 * A body of the wrong length is left alone rather than padded or trimmed: it simply will not
 * resolve, and "that code wasn't recognised" is the right answer for it.
 */
export function normalizeReferralCode(input: string): string {
  const typed = input.trim().toUpperCase().replace(/\s+/g, "");
  if (!typed) return "";

  const body = typed.startsWith(REFERRAL_CODE_PREFIX)
    ? typed.slice(REFERRAL_CODE_PREFIX.length)
    : typed;

  if (!body || body.length > 32 || !CODE_ALPHABET.test(body)) return "";
  return REFERRAL_CODE_PREFIX + body;
}
