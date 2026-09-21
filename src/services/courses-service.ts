import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  query,
  orderBy,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CourseItem, COURSES_DATA } from "@/data/courses";
import { TEACHERS_COLLECTION } from "@/data/teachers";
import { checkIsAdmin } from "@/providers/auth-provider";

export const COURSES_COLLECTION = "courses";

/**
 * Fetch all courses from Firestore.
 * Returns null if Firestore is empty or unavailable (caller can use local fallback).
 */
export async function getCoursesFromFirestore(): Promise<CourseItem[] | null> {
  if (!db) {
    console.warn("[CoursesService] Firestore is not initialized");
    return null;
  }

  try {
    const q = query(collection(db, COURSES_COLLECTION));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const courses: CourseItem[] = [];
    snapshot.forEach((docSnap) => {
      courses.push({ id: docSnap.id, ...(docSnap.data() as Omit<CourseItem, "id">) });
    });

    // Sort by course number string ("01", "02", etc.)
    return courses.sort((a, b) => (a.number || "").localeCompare(b.number || ""));
  } catch (err) {
    console.error("[CoursesService] Error fetching courses from Firestore:", err);
    return null;
  }
}

/**
 * Subscribe to real-time course updates from Firestore.
 */
export function subscribeCoursesFromFirestore(
  onUpdate: (courses: CourseItem[] | null) => void,
  onError?: (err: Error) => void
): Unsubscribe | null {
  if (!db) return null;

  try {
    const q = query(collection(db, COURSES_COLLECTION));
    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          onUpdate(null);
          return;
        }

        const courses: CourseItem[] = [];
        snapshot.forEach((docSnap) => {
          courses.push({ id: docSnap.id, ...(docSnap.data() as Omit<CourseItem, "id">) });
        });

        courses.sort((a, b) => (a.number || "").localeCompare(b.number || ""));
        onUpdate(courses);
      },
      (err) => {
        console.error("[CoursesService] Firestore onSnapshot error:", err);
        onError?.(err);
      }
    );
  } catch (err) {
    console.error("[CoursesService] Failed to set up real-time listener:", err);
    return null;
  }
}

/**
 * Create a new course in Firestore.
 * Strictly restricted to verified admins.
 */
export async function createCourseInFirestore(
  course: Partial<CourseItem> & { title: string; category: CourseItem["category"] },
  userEmail?: string | null
): Promise<CourseItem> {
  if (!checkIsAdmin(userEmail)) {
    throw new Error("Unauthorized: Only verified admins can create courses.");
  }

  if (!db) {
    throw new Error("Firestore is not initialized.");
  }

  // Generate ID if missing
  const courseId =
    course.id?.trim() ||
    course.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const fullCourse: CourseItem = {
    id: courseId,
    number: course.number || "99",
    enrollmentId: course.enrollmentId || courseId,
    title: course.title,
    bannerTitle: course.bannerTitle || course.title,
    bannerSubtitle: course.bannerSubtitle || "",
    description: course.description || "",
    category: course.category,
    categoryLabel: course.categoryLabel || "Specialized Program",
    badge: course.badge || undefined,
    badgeType: course.badgeType || undefined,
    duration: course.duration || "60 Days",
    level: course.level || "All Levels",
    // A doc that omits the fee must not read as free — ₹30,000 is the standard tuition,
    // and Super10's ₹0 arrives as the string "₹0", which is truthy and passes through.
    fee: course.fee || "₹30,000",
    amount: course.amount ?? 30000,
    gradient: course.gradient || "from-slate-900 via-indigo-950 to-blue-900",
    accentColor: course.accentColor || "text-blue-400",
    techStack: course.techStack || [],
    techIcons: course.techIcons || [],
    topics: course.topics || [],
    actionPrompt: course.actionPrompt || `Tell me about the ${course.title} course`,
    status: course.status ?? "active",
    teacherIds: course.teacherIds ?? [],
  };

  const docRef = doc(db, COURSES_COLLECTION, courseId);
  const teacherIds = fullCourse.teacherIds ?? [];

  // The course and the teachers' own `courseIds` are the join, so they commit together —
  // see the note on `updateCourseInFirestore`.
  const batch = writeBatch(db);
  batch.set(docRef, fullCourse);
  for (const teacherId of teacherIds) {
    batch.update(doc(db, TEACHERS_COLLECTION, teacherId), { courseIds: arrayUnion(courseId) });
  }

  await batch.commit();
  return fullCourse;
}

/**
 * Update an existing course in Firestore.
 * Strictly restricted to verified admins.
 *
 * When the update carries `teacherIds`, the other half of the link is moved in the
 * same batch: each newly assigned teacher gains this course id, each dropped teacher
 * loses it. Skipping this is how the two arrays drift apart — the course would name
 * a teacher who does not name it back.
 */
export async function updateCourseInFirestore(
  courseId: string,
  updates: Partial<CourseItem>,
  userEmail?: string | null
): Promise<void> {
  if (!checkIsAdmin(userEmail)) {
    throw new Error("Unauthorized: Only verified admins can update courses.");
  }

  if (!db) {
    throw new Error("Firestore is not initialized.");
  }

  const docRef = doc(db, COURSES_COLLECTION, courseId);

  if (!updates.teacherIds) {
    await updateDoc(docRef, updates);
    return;
  }

  const next = updates.teacherIds;
  const snapshot = await getDoc(docRef);
  const previous: string[] = snapshot.exists() ? snapshot.data().teacherIds ?? [] : [];

  const batch = writeBatch(db);
  batch.update(docRef, updates);
  for (const teacherId of next.filter((id) => !previous.includes(id))) {
    batch.update(doc(db, TEACHERS_COLLECTION, teacherId), { courseIds: arrayUnion(courseId) });
  }
  for (const teacherId of previous.filter((id) => !next.includes(id))) {
    batch.update(doc(db, TEACHERS_COLLECTION, teacherId), { courseIds: arrayRemove(courseId) });
  }

  await batch.commit();
}

/**
 * Delete a course from Firestore.
 * Strictly restricted to verified admins.
 */
export async function deleteCourseInFirestore(
  courseId: string,
  userEmail?: string | null
): Promise<void> {
  if (!checkIsAdmin(userEmail)) {
    throw new Error("Unauthorized: Only verified admins can delete courses.");
  }

  if (!db) {
    throw new Error("Firestore is not initialized.");
  }

  const docRef = doc(db, COURSES_COLLECTION, courseId);
  await deleteDoc(docRef);
}

/**
 * Seed all default courses from COURSES_DATA into Firestore.
 * Strictly restricted to verified admins.
 */
export async function seedDefaultCoursesToFirestore(
  userEmail?: string | null
): Promise<{ count: number; courses: CourseItem[] }> {
  if (!checkIsAdmin(userEmail)) {
    throw new Error("Unauthorized: Only verified admins can seed courses to Firestore.");
  }

  if (!db) {
    throw new Error("Firestore is not initialized.");
  }

  const batch = writeBatch(db);
  for (const course of COURSES_DATA) {
    const docRef = doc(db, COURSES_COLLECTION, course.id);
    // Merge, not overwrite: COURSES_DATA knows nothing of `status` or `teacherIds`, so a
    // plain set would retire nothing but would silently unassign every teacher.
    batch.set(docRef, course, { merge: true });
  }

  await batch.commit();
  return { count: COURSES_DATA.length, courses: COURSES_DATA };
}
