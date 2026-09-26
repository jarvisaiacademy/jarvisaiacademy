import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  Unsubscribe,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { StudentRecord } from "@/data/students";
import type { CourseItem } from "@/data/courses";
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
  role?: "admin" | "teacher" | "student";
  isTeacher?: boolean;
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

  const isTeacher = user.isTeacher === true || user.role === "teacher";
  const payload: Record<string, unknown> = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: "student",
    lastLoginAt: new Date().toISOString(),
    ...(user.picture ? { picture: user.picture } : {}),
    ...(user.emailVerified === undefined ? {} : { emailVerified: user.emailVerified }),
    ...(user.signInProvider ? { signInProvider: user.signInProvider } : {}),
    ...(user.createdAt ? { createdAt: user.createdAt } : {}),
  };

  if (isTeacher) {
    payload.is_teacher = true;
  }

  try {
    await setDoc(doc(db, STUDENTS_COLLECTION, user.id), payload, { merge: true });
  } catch (err) {
    console.warn("[StudentsService] Could not upsert student record:", err);
  }

  // Only apply default is_teacher: false if user is NOT a teacher
  if (!isTeacher) {
    try {
      await setDoc(doc(db, STUDENTS_COLLECTION, user.id), ROSTER_FIELD_DEFAULTS, { merge: true });
    } catch {
      // An admin-owned value. Leaving it alone is the correct outcome.
    }
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
  updates: Partial<StudentRecord>,
  userEmail?: string | null,
  userName?: string | null
): Promise<void> {
  if (!checkIsAdmin(userEmail)) {
    throw new Error("Unauthorized: Only verified admins can update candidates.");
  }
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }

  const now = new Date().toISOString();
  const author =
    (userName && userName !== "Learner" ? userName.trim() : null) ||
    (userEmail
      ? userEmail
          .split("@")[0]
          .replace(/[._-]+/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : null) ||
    "Admin";

  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }

  cleaned.updatedAt = updates.updatedAt || now;
  cleaned.updatedBy = updates.updatedBy || author;
  if (updates.createdAt) cleaned.createdAt = updates.createdAt;
  if (updates.createdBy) cleaned.createdBy = updates.createdBy;

  await updateDoc(doc(db, STUDENTS_COLLECTION, uid), cleaned);

  if ("referralCode" in cleaned && cleaned.referralCode) {
    await setDoc(doc(db, "referrals", cleaned.referralCode as string), { uid }, { merge: true });
  }
}

export interface UpdateStudentSelfProfileInput {
  name?: string;
  phone?: string;
  title?: string;
  specialization?: string;
  bio?: string;
}

/**
 * Self-service candidate profile update in Firestore.
 * Strictly limited to candidate-editable fields (name, phone, title, specialization, bio).
 * Permitted by Firestore rules for authenticated account owner (isSelf(uid)).
 */
export async function updateStudentSelfProfile(
  uid: string,
  updates: UpdateStudentSelfProfileInput
): Promise<void> {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }

  const currentUser = auth?.currentUser;
  if (!currentUser || currentUser.uid !== uid) {
    throw new Error("Unauthorized: You can only update your own profile.");
  }

  const cleaned: Record<string, unknown> = {};
  if (updates.name !== undefined) cleaned.name = updates.name.trim();
  if (updates.phone !== undefined) cleaned.phone = updates.phone.trim();
  if (updates.title !== undefined) cleaned.title = updates.title.trim();
  if (updates.specialization !== undefined) cleaned.specialization = updates.specialization.trim();
  if (updates.bio !== undefined) cleaned.bio = updates.bio.trim();

  await updateDoc(doc(db, STUDENTS_COLLECTION, uid), cleaned);
}

export interface CreateTeacherInput {
  name: string;
  email: string;
  title?: string;
  specialization?: string;
  bio?: string;
  phone?: string;
  status?: StudentRecord["status"];
  existingUserId?: string;
}

/**
 * Create a new teacher or promote an existing account in Firestore.
 * Strictly restricted to verified admins.
 */
export async function createTeacherInFirestore(
  input: CreateTeacherInput,
  userEmail?: string | null,
  userName?: string | null
): Promise<string> {
  if (!checkIsAdmin(userEmail)) {
    throw new Error("Unauthorized: Only verified admins can create or promote teachers.");
  }
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }

  const currentUser = auth?.currentUser;
  if (!currentUser) {
    throw new Error(
      "No active Firebase Auth session found. Please ensure you are signed in with your admin Google account."
    );
  }

  const cleanEmail = input.email.trim().toLowerCase();
  const now = new Date().toISOString();
  const author =
    (userName && userName !== "Learner" ? userName.trim() : null) ||
    (userEmail
      ? userEmail
          .split("@")[0]
          .replace(/[._-]+/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : null) ||
    "Admin";

  // 1. Resolve teacherId: existingUserId, or find in users by email, or generate new ID
  let teacherId = input.existingUserId?.trim();

  if (!teacherId) {
    try {
      const q = query(collection(db, STUDENTS_COLLECTION), where("email", "==", cleanEmail));
      const snap = await getDocs(q);
      if (!snap.empty) {
        teacherId = snap.docs[0].id;
      }
    } catch (err) {
      console.warn("[StudentsService] Could not query existing user by email:", err);
    }
  }

  if (!teacherId) {
    teacherId = doc(collection(db, STUDENTS_COLLECTION)).id;
  }

  const teacherRecord: Partial<StudentRecord> = {
    id: teacherId,
    name: input.name.trim(),
    email: cleanEmail,
    is_teacher: true,
    role: "student",
    status: input.status || "active",
    lastLoginAt: now,
    updatedAt: now,
    updatedBy: author,
  };

  if (!input.existingUserId) {
    teacherRecord.createdAt = now;
    teacherRecord.createdBy = author;
  }
  if (input.title?.trim()) teacherRecord.title = input.title.trim();
  if (input.specialization?.trim()) teacherRecord.specialization = input.specialization.trim();
  if (input.bio?.trim()) teacherRecord.bio = input.bio.trim();
  if (input.phone?.trim()) teacherRecord.phone = input.phone.trim();

  // Save into users collection
  await setDoc(doc(db, STUDENTS_COLLECTION, teacherId), teacherRecord, { merge: true });

  // Record in teachers collection for fast role verification during login
  try {
    await setDoc(
      doc(db, "teachers", cleanEmail),
      {
        id: teacherId,
        email: cleanEmail,
        name: input.name.trim(),
        is_teacher: true,
        updatedAt: now,
        ...(input.title?.trim() ? { title: input.title.trim() } : {}),
        ...(input.specialization?.trim() ? { specialization: input.specialization.trim() } : {}),
        ...(input.bio?.trim() ? { bio: input.bio.trim() } : {}),
        ...(input.phone?.trim() ? { phone: input.phone.trim() } : {}),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("[StudentsService] Could not write to teachers registry:", err);
  }

  return teacherId;
}

/**
 * Remove or delete a teacher from Firestore.
 * Either unmarks them as teacher (`is_teacher: false`) or deletes their document permanently.
 */
export async function deleteTeacherInFirestore(
  teacherId: string,
  options: { permanent?: boolean; userEmail?: string | null; teacherEmail?: string | null } = {}
): Promise<void> {
  if (!checkIsAdmin(options.userEmail)) {
    throw new Error("Unauthorized: Only verified admins can delete teachers.");
  }
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }

  const firestore = db;
  let emailToRemove = options.teacherEmail?.trim().toLowerCase();

  if (!emailToRemove) {
    try {
      const docSnap = await getDoc(doc(firestore, STUDENTS_COLLECTION, teacherId));
      if (docSnap.exists()) {
        emailToRemove = docSnap.data().email?.trim().toLowerCase();
      }
    } catch {
      // ignore
    }
  }

  if (options.permanent) {
    await deleteDoc(doc(firestore, STUDENTS_COLLECTION, teacherId));
  } else {
    await updateDoc(doc(firestore, STUDENTS_COLLECTION, teacherId), { is_teacher: false });
  }

  if (emailToRemove) {
    try {
      await deleteDoc(doc(firestore, "teachers", emailToRemove));
    } catch {
      // ignore
    }
  }
}

export interface CreateAdminInput {
  name: string;
  email: string;
  title?: string;
  specialization?: string;
  bio?: string;
  phone?: string;
  status?: StudentRecord["status"];
  existingUserId?: string;
}

/**
 * Create a new admin or promote an existing user to admin in Firestore.
 * Strictly restricted to verified admins.
 */
export async function createAdminInFirestore(
  input: CreateAdminInput,
  userEmail?: string | null,
  userName?: string | null
): Promise<string> {
  if (!checkIsAdmin(userEmail)) {
    throw new Error("Unauthorized: Only verified admins can create or promote admins.");
  }
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }

  const currentUser = auth?.currentUser;
  if (!currentUser) {
    throw new Error(
      "No active Firebase Auth session found. Please ensure you are signed in with your admin Google account."
    );
  }

  const firestore = db;
  const adminId =
    input.existingUserId?.trim() || doc(collection(firestore, STUDENTS_COLLECTION)).id;

  const now = new Date().toISOString();
  const author =
    (userName && userName !== "Learner" ? userName.trim() : null) ||
    (userEmail
      ? userEmail
          .split("@")[0]
          .replace(/[._-]+/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : null) ||
    "Admin";

  const adminRecord: Partial<StudentRecord> = {
    id: adminId,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: "admin",
    status: input.status || "active",
    lastLoginAt: now,
    updatedAt: now,
    updatedBy: author,
  };

  if (!input.existingUserId) {
    adminRecord.createdAt = now;
    adminRecord.createdBy = author;
  }
  if (input.title?.trim()) adminRecord.title = input.title.trim();
  if (input.specialization?.trim()) adminRecord.specialization = input.specialization.trim();
  if (input.bio?.trim()) adminRecord.bio = input.bio.trim();
  if (input.phone?.trim()) adminRecord.phone = input.phone.trim();

  await setDoc(doc(firestore, STUDENTS_COLLECTION, adminId), adminRecord, { merge: true });
  return adminId;
}

/**
 * Remove or demote an admin in Firestore.
 * Either demotes them to a student (`role: "student"`) or deletes their document permanently.
 */
export async function deleteAdminInFirestore(
  adminId: string,
  options: { permanent?: boolean; userEmail?: string | null } = {}
): Promise<void> {
  if (!checkIsAdmin(options.userEmail)) {
    throw new Error("Unauthorized: Only verified admins can remove admins.");
  }
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }

  const firestore = db;
  if (options.permanent) {
    await deleteDoc(doc(firestore, STUDENTS_COLLECTION, adminId));
  } else {
    await updateDoc(doc(firestore, STUDENTS_COLLECTION, adminId), {
      role: "student",
      status: "inactive",
    });
  }
}


export interface CreateStudentInput {
  name: string;
  email: string;
  title?: string;
  specialization?: string;
  bio?: string;
  phone?: string;
  status?: StudentRecord["status"];
  is_super10?: boolean;
  referralCode?: string;
  enrolledCourseIds?: string[];
}

/**
 * Create a new student record in Firestore.
 * Strictly restricted to verified admins.
 */
export async function createStudentInFirestore(
  input: CreateStudentInput,
  userEmail?: string | null,
  userName?: string | null
): Promise<string> {
  if (!checkIsAdmin(userEmail)) {
    throw new Error("Unauthorized: Only verified admins can create students.");
  }
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }

  const currentUser = auth?.currentUser;
  if (!currentUser) {
    throw new Error(
      "No active Firebase Auth session found. Please ensure you are signed in with your admin Google account."
    );
  }

  const firestore = db;
  const studentId = doc(collection(firestore, STUDENTS_COLLECTION)).id;
  const now = new Date().toISOString();
  const author =
    (userName && userName !== "Learner" ? userName.trim() : null) ||
    (userEmail
      ? userEmail
          .split("@")[0]
          .replace(/[._-]+/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : null) ||
    "Admin";

  const studentRecord: Partial<StudentRecord> = {
    id: studentId,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    is_teacher: false,
    role: "student",
    status: input.status || "active",
    is_super10: !!input.is_super10,
    lastLoginAt: now,
    createdAt: now,
    createdBy: author,
    updatedAt: now,
    updatedBy: author,
  };

  if (input.title?.trim()) studentRecord.title = input.title.trim();
  if (input.specialization?.trim()) studentRecord.specialization = input.specialization.trim();
  if (input.bio?.trim()) studentRecord.bio = input.bio.trim();
  if (input.phone?.trim()) studentRecord.phone = input.phone.trim();
  if (input.referralCode?.trim()) studentRecord.referralCode = input.referralCode.trim();
  if (input.enrolledCourseIds) studentRecord.enrolledCourseIds = input.enrolledCourseIds;

  await setDoc(doc(firestore, STUDENTS_COLLECTION, studentId), studentRecord, { merge: true });

  if (input.referralCode?.trim()) {
    try {
      await setDoc(doc(firestore, "referrals", input.referralCode.trim()), { uid: studentId }, { merge: true });
    } catch (err) {
      console.warn("[StudentsService] Could not write referral code doc:", err);
    }
  }

  return studentId;
}

/**
 * Remove or deactivate a student in Firestore.
 * Either marks them as inactive or deletes their document permanently.
 */
export async function deleteStudentInFirestore(
  studentId: string,
  options: { permanent?: boolean; userEmail?: string | null; studentEmail?: string } = {}
): Promise<void> {
  if (!checkIsAdmin(options.userEmail)) {
    throw new Error("Unauthorized: Only verified admins can delete students.");
  }
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }

  const firestore = db;

  if (options.permanent) {
    await deleteDoc(doc(firestore, STUDENTS_COLLECTION, studentId));
    if (options.studentEmail) {
      try {
        const q = query(
          collection(firestore, "enrollments"),
          where("studentEmail", "==", options.studentEmail)
        );
        const snap = await getDocs(q);
        const deletes = snap.docs.map((d) => deleteDoc(doc(firestore, "enrollments", d.id)));
        await Promise.all(deletes);
      } catch (err) {
        console.warn("[StudentsService] Could not clean up enrollments for deleted student:", err);
      }
    }
  } else {
    await updateDoc(doc(firestore, STUDENTS_COLLECTION, studentId), { status: "inactive" });
  }
}

/**
 * Synchronize course enrollments for a student in Firestore 'enrollments' collection.
 */
export async function syncStudentEnrollments(
  studentEmail: string,
  studentName: string,
  enrolledCourseIds: string[],
  courses: CourseItem[],
  userEmail?: string | null
): Promise<void> {
  if (!checkIsAdmin(userEmail)) {
    throw new Error("Unauthorized: Only verified admins can sync enrollments.");
  }
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }

  const firestore = db;
  const q = query(
    collection(firestore, "enrollments"),
    where("studentEmail", "==", studentEmail)
  );
  const snap = await getDocs(q);
  const existingByCourseId = new Map<string, string>();

  snap.forEach((d) => {
    const data = d.data();
    if (data.courseId) {
      existingByCourseId.set(data.courseId, d.id);
    }
  });

  const promises: Promise<unknown>[] = [];

  // Add enrollments for newly assigned courses
  for (const courseId of enrolledCourseIds) {
    if (!existingByCourseId.has(courseId)) {
      const course = courses.find((c) => c.id === courseId);
      const docRef = doc(collection(firestore, "enrollments"));
      promises.push(
        setDoc(docRef, {
          action: "paid",
          courseId,
          courseName: course ? course.title : "Course",
          amount: course ? course.amount : 0,
          transactionId: `ADMIN_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          studentName,
          studentEmail,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }

  // Remove enrollments for courses that are no longer assigned
  for (const [courseId, docId] of existingByCourseId.entries()) {
    if (!enrolledCourseIds.includes(courseId)) {
      promises.push(deleteDoc(doc(firestore, "enrollments", docId)));
    }
  }

  await Promise.all(promises);
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
