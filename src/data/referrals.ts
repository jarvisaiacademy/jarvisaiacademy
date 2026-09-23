/**
 * Referral codes — the single definition of what one is.
 *
 * Updated format: 4 uppercase alphabetic characters (e.g. "ABCD"). No numbers, no dashes.
 */

const CODE_BODY_LENGTH = 4;
const CODE_ALPHABET = /^[A-Z]+$/;

/** The code belonging to an account, in its canonical spelling. */
export function referralCodeFor(uid: string): string {
  // Filter out any non-alphabetic characters from the uid and take the first 4
  const lettersOnly = uid.replace(/[^A-Za-z]/g, "").toUpperCase();
  // Pad with some default letters if uid somehow doesn't have 4 letters
  const padded = (lettersOnly + "JARV").slice(0, CODE_BODY_LENGTH);
  return padded;
}

/**
 * Whatever a learner typed, as the code to look up — or "" when it cannot be one.
 */
export function normalizeReferralCode(input: string): string {
  const typed = input.trim().toUpperCase().replace(/[^A-Z]/g, "");
  if (!typed || typed.length !== CODE_BODY_LENGTH) return "";
  return typed;
}
