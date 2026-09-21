export interface StudentRecord {
  id: string;
  name: string;
  email: string;
  picture?: string;
  role: "admin" | "student" | "guest";
  plan?: string;
  lastLoginAt: string;
  /** Absent means active. `banned` is a deliberate block, not merely an unset flag. */
  status?: CandidateStatus;
  /** Sugat's name for the flag, underscore and all. Absent means false. */
  is_super10?: boolean;
  // Carried straight off the Firebase Auth user at sign-in. `createdAt` is the account's
  // own birthday, which is not the same thing as `lastLoginAt`.
  emailVerified?: boolean;
  signInProvider?: string;
  createdAt?: string;
}

export type CandidateStatus = "active" | "inactive" | "banned";

export type AssignmentStatus = "active" | "revoked";

export interface AssignmentRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  assignedByEmail: string;
  assignedAt: string;
  status: AssignmentStatus;
  revokedAt?: string;
  revokedByEmail?: string;
}
