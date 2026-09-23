import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { referralCodeFor } from "@/data/referrals";

export const REFERRALS_COLLECTION = "referrals";

// Spelled out rather than imported from `students-service`, which imports `auth-provider`:
// going the other way would make auth-provider -> this file -> students-service -> auth-provider
// a cycle. `pagination.ts` names the collection the same way.
const USERS_COLLECTION = "users";

/**
 * Publish an account's code: the field on their own row, and the index entry that lets the code
 * be resolved by someone who only knows the code.
 *
 * Both from one function because they are two halves of one fact, and a row claiming a code the
 * index has never heard of is a code that silently fails for whoever is handed it.
 *
 * Best-effort and never throws, like `upsertStudentRecord` beside it: this runs on every sign-in
 * and must not be able to break auth. It is idempotent, so the repeated call each visit is
 * harmless — and free on the row itself, since that write already happens on every visit.
 */
export async function publishReferralCode(uid: string): Promise<void> {
  if (!db) return;

  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
    const storedCode = userDoc.exists() ? userDoc.data()?.referralCode : undefined;

    // Use VIP code if assigned, otherwise auto-generate
    const code = storedCode || referralCodeFor(uid);

    await setDoc(doc(db, USERS_COLLECTION, uid), { referralCode: code }, { merge: true });
    await setDoc(doc(db, REFERRALS_COLLECTION, code), { uid }, { merge: true });
  } catch (err) {
    console.warn("[ReferralService] Could not publish referral code:", err);
  }
}

/**
 * Which account a code belongs to, or null when no account holds it.
 *
 * One document read by id, never a query: the rule gives a signed-in learner `get` and reserves
 * `list` for admins, so this is the only shape a new signup is allowed to ask in, and harvesting
 * every code in play is not one of them.
 *
 * Throws on an unreachable database, unlike its neighbour above — a learner who has typed a code
 * is owed the difference between "we could not check" and "nobody has that code".
 */
export async function resolveReferralCode(code: string): Promise<string | null> {
  if (!db) throw new Error("Firestore is not initialized.");

  const snapshot = await getDoc(doc(db, REFERRALS_COLLECTION, code));
  if (!snapshot.exists()) return null;

  const uid = snapshot.data().uid;
  return typeof uid === "string" && uid ? uid : null;
}

/**
 * Record who brought this account in.
 *
 * Throws, so the learner who typed the code is told when the write is refused rather than
 * discovering months later that the reward went elsewhere.
 *
 * The rules decide whether it is allowed at all, and they are strict about it: the claim must be
 * the account's first, must resolve to exactly the `referredBy` sent here, and must not be the
 * account's own code. Nothing in this function is trusted for any of that.
 */
export async function recordReferral(
  uid: string,
  code: string,
  referrerUid: string
): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized.");

  await setDoc(
    doc(db, USERS_COLLECTION, uid),
    {
      referredByCode: code,
      referredBy: referrerUid,
      referredAt: new Date().toISOString(),
    },
    { merge: true }
  );
}
