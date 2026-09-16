import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteField,
  onSnapshot,
  query,
  where,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AssignmentRecord, StudentRecord } from "@/data/assignments";
import { checkIsAdmin } from "@/providers/auth-provider";

export const ASSIGNMENTS_COLLECTION = "assignments";

/**
 * Deterministic document id keeps assignments idempotent per student+course.
 * uids are [A-Za-z0-9] and course slugs are [a-z0-9-], so "__" cannot collide.
 */
export function assignmentId(studentId: string, courseId: string): string {
  return `${studentId}__${courseId}`;
}

function sortByAssignedAtDesc(records: AssignmentRecord[]): AssignmentRecord[] {
  return records.sort((a, b) => (b.assignedAt || "").localeCompare(a.assignedAt || ""));
}

export interface CreateAssignmentInput {
  student: Pick<StudentRecord, "id" | "name" | "email">;
  courseId: string;
  courseTitle: string;
}

/**
 * Grant a student free access to a course.
 * Strictly restricted to verified admins.
 */
export async function createAssignmentInFirestore(
  input: CreateAssignmentInput,
  adminEmail?: string | null
): Promise<AssignmentRecord> {
  if (!checkIsAdmin(adminEmail)) {
    throw new Error("Unauthorized: Only verified admins can assign courses.");
  }
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }

  const id = assignmentId(input.student.id, input.courseId);
  const record: AssignmentRecord = {
    id,
    studentId: input.student.id,
    studentName: input.student.name,
    studentEmail: input.student.email,
    courseId: input.courseId,
    courseTitle: input.courseTitle,
    assignedByEmail: adminEmail || "",
    assignedAt: new Date().toISOString(),
    status: "active",
  };

  await setDoc(doc(db, ASSIGNMENTS_COLLECTION, id), record, { merge: true });
  return record;
}

/**
 * Soft-revoke an assignment (audit trail preserved). Admin-only.
 */
export async function revokeAssignmentInFirestore(
  id: string,
  adminEmail?: string | null
): Promise<void> {
  if (!checkIsAdmin(adminEmail)) {
    throw new Error("Unauthorized: Only verified admins can revoke assignments.");
  }
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }

  await updateDoc(doc(db, ASSIGNMENTS_COLLECTION, id), {
    status: "revoked",
    revokedAt: new Date().toISOString(),
    revokedByEmail: adminEmail || "",
  });
}

/**
 * Restore a previously revoked assignment. Admin-only.
 */
export async function restoreAssignmentInFirestore(
  id: string,
  adminEmail?: string | null
): Promise<void> {
  if (!checkIsAdmin(adminEmail)) {
    throw new Error("Unauthorized: Only verified admins can restore assignments.");
  }
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }

  await updateDoc(doc(db, ASSIGNMENTS_COLLECTION, id), {
    status: "active",
    revokedAt: deleteField(),
    revokedByEmail: deleteField(),
  });
}

/**
 * Fetch assignments, optionally scoped to one student.
 * Returns null if Firestore is unavailable.
 */
export async function getAssignmentsFromFirestore(
  studentId?: string | null
): Promise<AssignmentRecord[] | null> {
  if (!db) {
    console.warn("[AssignmentsService] Firestore is not initialized");
    return null;
  }

  try {
    const base = collection(db, ASSIGNMENTS_COLLECTION);
    const q = studentId ? query(base, where("studentId", "==", studentId)) : query(base);
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const records: AssignmentRecord[] = [];
    snapshot.forEach((docSnap) => {
      records.push(docSnap.data() as AssignmentRecord);
    });

    return sortByAssignedAtDesc(records);
  } catch (err) {
    console.error("[AssignmentsService] Error fetching assignments:", err);
    return null;
  }
}

/**
 * Subscribe to real-time assignment updates.
 * Pass `{ studentId }` to scope to a single student (avoids composite indexes).
 */
export function subscribeAssignmentsFromFirestore(
  onUpdate: (records: AssignmentRecord[] | null) => void,
  opts?: { studentId?: string | null },
  onError?: (err: Error) => void
): Unsubscribe | null {
  if (!db) return null;

  try {
    const base = collection(db, ASSIGNMENTS_COLLECTION);
    const q = opts?.studentId
      ? query(base, where("studentId", "==", opts.studentId))
      : query(base);

    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          onUpdate(null);
          return;
        }

        const records: AssignmentRecord[] = [];
        snapshot.forEach((docSnap) => {
          records.push(docSnap.data() as AssignmentRecord);
        });

        onUpdate(sortByAssignedAtDesc(records));
      },
      (err) => {
        console.error("[AssignmentsService] Firestore onSnapshot error:", err);
        onError?.(err);
      }
    );
  } catch (err) {
    console.error("[AssignmentsService] Failed to set up assignments listener:", err);
    return null;
  }
}
