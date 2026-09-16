import {
  collection,
  doc,
  getDocs,
  setDoc,
  onSnapshot,
  query,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StudentRecord } from "@/data/assignments";

export const STUDENTS_COLLECTION = "users";

/**
 * Structural shape accepted by `upsertStudentRecord`.
 * Intentionally avoids importing from `@/providers/auth-provider` so that
 * auth-provider can import this service without creating a cycle.
 */
export interface RosterUserInput {
  id: string;
  name: string;
  email: string;
  picture?: string;
  role?: "admin" | "student" | "guest";
  plan?: string;
}

/**
 * Upsert the authenticated user into the `users` roster collection.
 * Never throws — roster sync is best-effort and must not block auth.
 */
export async function upsertStudentRecord(user: RosterUserInput): Promise<void> {
  if (!db) return;

  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || "student",
    lastLoginAt: new Date().toISOString(),
    ...(user.picture ? { picture: user.picture } : {}),
    ...(user.plan ? { plan: user.plan } : {}),
  };

  try {
    await setDoc(doc(db, STUDENTS_COLLECTION, user.id), payload, { merge: true });
  } catch (err) {
    console.warn("[StudentsService] Could not upsert student record:", err);
  }
}

/**
 * Fetch the full student roster. Returns null if Firestore is unavailable.
 */
export async function getStudentsFromFirestore(): Promise<StudentRecord[] | null> {
  if (!db) {
    console.warn("[StudentsService] Firestore is not initialized");
    return null;
  }

  try {
    const snapshot = await getDocs(query(collection(db, STUDENTS_COLLECTION)));
    if (snapshot.empty) return null;

    const students: StudentRecord[] = [];
    snapshot.forEach((docSnap) => {
      students.push({
        id: docSnap.id,
        ...(docSnap.data() as Omit<StudentRecord, "id">),
      });
    });

    return students.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  } catch (err) {
    console.error("[StudentsService] Error fetching students:", err);
    return null;
  }
}

/**
 * Subscribe to real-time roster updates.
 */
export function subscribeStudentsFromFirestore(
  onUpdate: (students: StudentRecord[] | null) => void,
  onError?: (err: Error) => void
): Unsubscribe | null {
  if (!db) return null;

  try {
    return onSnapshot(
      query(collection(db, STUDENTS_COLLECTION)),
      (snapshot) => {
        if (snapshot.empty) {
          onUpdate(null);
          return;
        }

        const students: StudentRecord[] = [];
        snapshot.forEach((docSnap) => {
          students.push({
            id: docSnap.id,
            ...(docSnap.data() as Omit<StudentRecord, "id">),
          });
        });

        students.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        onUpdate(students);
      },
      (err) => {
        console.error("[StudentsService] Firestore onSnapshot error:", err);
        onError?.(err);
      }
    );
  } catch (err) {
    console.error("[StudentsService] Failed to set up roster listener:", err);
    return null;
  }
}
