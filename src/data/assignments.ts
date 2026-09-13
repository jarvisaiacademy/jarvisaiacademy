export interface StudentRecord {
  id: string;
  name: string;
  email: string;
  picture?: string;
  role: "admin" | "student" | "guest";
  plan?: string;
  lastLoginAt: string;
}

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
