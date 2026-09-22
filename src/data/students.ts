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
  plan?: string;
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
