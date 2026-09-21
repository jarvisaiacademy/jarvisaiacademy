import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  updateDoc,
  writeBatch,
  DocumentReference,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TEACHERS_COLLECTION, TeacherRecord, TeacherStatus } from "@/data/teachers";
import { COURSES_COLLECTION } from "@/services/courses-service";
import { STUDENTS_COLLECTION } from "@/services/students-service";
import { checkIsAdmin } from "@/providers/auth-provider";

/** A teacher is a user, so the input names the user and not a person-shaped set of fields. */
export interface TeacherInput {
  userId: string;
  mobile: string;
  courseIds?: string[];
  status?: TeacherStatus;
}

/** The person is the document's identity, so nothing here can move a teacher to another user. */
export type TeacherUpdate = Partial<Pick<TeacherInput, "mobile" | "courseIds" | "status">>;

function courseRef(courseId: string): DocumentReference {
  return doc(db!, COURSES_COLLECTION, courseId);
}

/**
 * Subscribe to the teacher roster. Admin-only to read, so a non-admin's listener
 * would only ever receive permission-denied.
 */
export function subscribeTeachersFromFirestore(
  onUpdate: (teachers: TeacherRecord[] | null) => void,
  onError?: (err: Error) => void
): Unsubscribe | null {
  if (!db) return null;

  try {
    return onSnapshot(
      query(collection(db, TEACHERS_COLLECTION)),
      (snapshot) => {
        if (snapshot.empty) {
          onUpdate(null);
          return;
        }
        const teachers: TeacherRecord[] = [];
        snapshot.forEach((docSnap) => {
          teachers.push({ id: docSnap.id, ...(docSnap.data() as Omit<TeacherRecord, "id">) });
        });
        teachers.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        onUpdate(teachers);
      },
      (err) => {
        console.error("[TeachersService] Firestore onSnapshot error:", err);
        onError?.(err);
      }
    );
  } catch (err) {
    console.error("[TeachersService] Failed to set up teacher listener:", err);
    return null;
  }
}

/**
 * Promote a user to the faculty list, and put their uid on every course assigned.
 *
 * Both halves commit together: Firestore has no joins, so the two arrays are the
 * join, and writing them separately would leave a course and a teacher disagreeing
 * about each other if the second write failed.
 */
export async function createTeacherInFirestore(
  input: TeacherInput,
  userEmail?: string | null
): Promise<TeacherRecord> {
  if (!checkIsAdmin(userEmail)) {
    throw new Error("Unauthorized: Only verified admins can create teachers.");
  }
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }

  const { userId } = input;
  const teacherRef = doc(db, TEACHERS_COLLECTION, userId);

  const [existing, userSnap] = await Promise.all([
    getDoc(teacherRef),
    getDoc(doc(db, STUDENTS_COLLECTION, userId)),
  ]);

  // The picker hides accounts that are already on the list, but a stale list is only ever
  // one refresh behind — and silently overwriting here would reset `courseIds` without
  // taking the uid off the courses it no longer names.
  if (existing.exists()) {
    throw new Error("That account is already on the faculty list.");
  }
  if (!userSnap.exists()) {
    throw new Error("That account no longer exists.");
  }

  // Read from the user document rather than trusted from the caller, so the roster cannot
  // be made to name somebody the uid does not belong to.
  const user = userSnap.data();
  const name: string = user.name || user.email || "Unnamed";

  const now = new Date().toISOString();
  const courseIds = input.courseIds ?? [];

  const teacher: TeacherRecord = {
    id: userId,
    name,
    mobile: input.mobile.trim(),
    courseIds,
    status: input.status ?? "active",
    createdAt: now,
    updatedAt: now,
  };

  const batch = writeBatch(db);
  batch.set(teacherRef, teacher);
  // `update`, not `set` with merge: a course the admin's list is stale about should
  // fail the batch loudly rather than have an empty course doc invented for it.
  for (const courseId of courseIds) {
    batch.update(courseRef(courseId), { teacherIds: arrayUnion(userId) });
  }

  await batch.commit();
  return teacher;
}

/**
 * Update a teacher, moving its id to and from courses to match the new assignment
 * list. Also restricted to verified admins.
 */
export async function updateTeacherInFirestore(
  teacherId: string,
  updates: TeacherUpdate,
  userEmail?: string | null
): Promise<void> {
  if (!checkIsAdmin(userEmail)) {
    throw new Error("Unauthorized: Only verified admins can update teachers.");
  }
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }

  const ref = doc(db, TEACHERS_COLLECTION, teacherId);
  const snapshot = await getDoc(ref);
  const previous: string[] = snapshot.exists() ? snapshot.data().courseIds ?? [] : [];
  const next = updates.courseIds ?? previous;

  const batch = writeBatch(db);
  batch.update(ref, {
    ...updates,
    courseIds: next,
    updatedAt: new Date().toISOString(),
  });
  for (const courseId of next.filter((id) => !previous.includes(id))) {
    batch.update(courseRef(courseId), { teacherIds: arrayUnion(teacherId) });
  }
  for (const courseId of previous.filter((id) => !next.includes(id))) {
    batch.update(courseRef(courseId), { teacherIds: arrayRemove(teacherId) });
  }

  await batch.commit();
}

/** Delete a teacher and take its id off every course it was assigned to. */
export async function deleteTeacherInFirestore(
  teacherId: string,
  userEmail?: string | null
): Promise<void> {
  if (!checkIsAdmin(userEmail)) {
    throw new Error("Unauthorized: Only verified admins can delete teachers.");
  }
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }

  const ref = doc(db, TEACHERS_COLLECTION, teacherId);
  const snapshot = await getDoc(ref);
  const courseIds: string[] = snapshot.exists() ? snapshot.data().courseIds ?? [] : [];

  const batch = writeBatch(db);
  batch.delete(ref);
  for (const courseId of courseIds) {
    batch.update(courseRef(courseId), { teacherIds: arrayRemove(teacherId) });
  }

  await batch.commit();
}

export async function setTeacherStatusInFirestore(
  teacherId: string,
  status: TeacherStatus,
  userEmail?: string | null
): Promise<void> {
  if (!checkIsAdmin(userEmail)) {
    throw new Error("Unauthorized: Only verified admins can update teachers.");
  }
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }

  await updateDoc(doc(db, TEACHERS_COLLECTION, teacherId), {
    status,
    updatedAt: new Date().toISOString(),
  });
}
