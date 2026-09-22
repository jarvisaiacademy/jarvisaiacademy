import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StudentRecord } from "@/data/students";
import { checkIsAdmin } from "@/providers/auth-provider";

export const STUDENTS_COLLECTION = "users";

/**
 * The two fields the roster pages filter on, and the value the app already assumes for both.
 *
 * They have to be *written* for those filters to work at all: Firestore's `==` skips a document
 * where the field is absent, so a sign-up that never wrote `is_teacher` is missing from
 * `where('is_teacher','==',false)` — the Students tab renders empty while the sidebar, which
 * reads the whole collection, still counts the account.
 *
 * Mirrors `USER_FIELD_DEFAULTS` in `scripts/db-data.mjs`, which is what heals accounts created
 * before this write existed.
 */
const ROSTER_FIELD_DEFAULTS = { is_teacher: false, status: "active" };

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
  role?: "admin" | "student";
  /** Straight off the Firebase Auth user; whatever the Google account actually gave us. */
  emailVerified?: boolean;
  signInProvider?: string;
  createdAt?: string;
}

/**
 * Upsert the authenticated user into the `users` roster collection.
 * Never throws — roster sync is best-effort and must not block auth.
 *
 * `status` and `is_super10` belong to the admin, and the `users` rule forbids a learner
 * changing either — so they stay out of the payload, where a refusal would take the whole
 * upsert down with it. The one exception is the default `status`, written afterwards on its
 * own so that a refused write costs nothing; see `ROSTER_FIELD_DEFAULTS`.
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
    ...(user.emailVerified === undefined ? {} : { emailVerified: user.emailVerified }),
    ...(user.signInProvider ? { signInProvider: user.signInProvider } : {}),
    ...(user.createdAt ? { createdAt: user.createdAt } : {}),
  };

  try {
    await setDoc(doc(db, STUDENTS_COLLECTION, user.id), payload, { merge: true });
  } catch (err) {
    console.warn("[StudentsService] Could not upsert student record:", err);
  }

  // Separate from the payload above, and after it, because the rules fence both of these
  // against a learner's update: on an account an admin has deliberately moved off its default
  // — a teacher, a banned candidate — this is refused and the upsert above still stands.
  try {
    await setDoc(doc(db, STUDENTS_COLLECTION, user.id), ROSTER_FIELD_DEFAULTS, { merge: true });
  } catch {
    // An admin-owned value. Leaving it alone is the correct outcome.
  }
}

/**
 * Write admin-owned fields on a candidate — `status`, `is_super10`, or an edit to the
 * name. One function rather than one per field: the rule is what constrains this, and it
 * treats them alike.
 *
 * Unlike the roster upsert above this *does* throw, because an admin acting deliberately
 * needs to be told when the write was refused rather than watch the row silently not move.
 */
export async function updateCandidateInFirestore(
  uid: string,
  updates: Partial<
    Pick<StudentRecord, "name" | "status" | "is_super10" | "is_teacher" | "role">
  >,
  userEmail?: string | null
): Promise<void> {
  if (!checkIsAdmin(userEmail)) {
    throw new Error("Unauthorized: Only verified admins can update candidates.");
  }
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }

  await updateDoc(doc(db, STUDENTS_COLLECTION, uid), updates);
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
