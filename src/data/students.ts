/**
 * A row of the `users` collection — the roster the admin dashboard lists by role.
 *
 * One document per Google sign-in: `upsertStudentRecord` writes it on auth state change, so
 * an account can appear here having never enrolled. Signing in is not enrolling; access to a
 * course is a separate thing.
 */
export interface StudentRecord {
  id: string;
  name: string;
  email: string;
  picture?: string;
  role: "admin" | "student";
  lastLoginAt: string;
  /** Absent means active. `banned` is a deliberate block, not merely an unset flag. */
  status?: CandidateStatus;
  /** Sugat's name for the flag, underscore and all. Absent means false. */
  is_super10?: boolean;
  /**
   * Faculty, as an admin-set flag. Absent means false.
   *
   * A flag rather than a value in `role`, because `role` is recomputed from the admin
   * allowlist on every sign-in — a "teacher" stored there reverts on that person's next
   * visit. This field sits with `status` and `is_super10` instead: admin-owned, and the
   * `users` rule refuses a self-write that changes it.
   */
  is_teacher?: boolean;
  // Carried straight off the Firebase Auth user at sign-in. `createdAt` is the account's
  // own birthday, which is not the same thing as `lastLoginAt`.
  emailVerified?: boolean;
  signInProvider?: string;
  createdAt?: string;
  /**
   * The account's own code to share, derived from the uid. Stored rather than only derived so the
   * row records the code the learner was actually told, which is what a hand-paid reward has to be
   * checked against. Absent on an account no sign-in or backfill has reached yet.
   */
  referralCode?: string;
  /** The code this account signed up with. Written once, then fixed — only an admin can move it. */
  referredByCode?: string;
  /** The account `referredByCode` belongs to: who the referral reward is owed to. */
  referredBy?: string;
  /** ISO timestamp of when the claim was made. Cosmetic; nothing is decided from it. */
  referredAt?: string;
}

/**
 * The rows that carry a referral claim — one per person who signed up with someone's code.
 *
 * Shared by the dashboard tab that lists them and the count beside its name in the sidebar, so
 * the badge cannot disagree with the table it labels.
 */
export function referredUsers(users: StudentRecord[]): StudentRecord[] {
  return users.filter((user) => !!user.referredBy);
}

export type CandidateStatus = "active" | "inactive" | "banned";

/** The three roles a person can hold on this site. */
export type AccountRole = "student" | "teacher" | "admin";

/**
 * A person's role, decided in one place so that everything which groups people agrees —
 * the badge on a row, the page that row is listed on, and the count beside the page's name
 * in the sidebar.
 *
 * Admin outranks faculty, so an account is listed once, under the strongest role it holds.
 */
export function accountRoleOf(user: {
  role: "admin" | "student";
  is_teacher?: boolean;
}): AccountRole {
  if (user.role === "admin") return "admin";
  return user.is_teacher ? "teacher" : "student";
}
