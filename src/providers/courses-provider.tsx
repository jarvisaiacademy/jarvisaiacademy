"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CourseItem, COURSES_DATA } from "@/data/courses";
import {
  subscribeCoursesFromFirestore,
  getCoursesFromFirestore,
  createCourseInFirestore,
  updateCourseInFirestore,
  deleteCourseInFirestore,
  seedDefaultCoursesToFirestore,
} from "@/services/courses-service";
import { useAuth } from "@/providers/auth-provider";
import { fetchPublicContent } from "@/lib/public-content";

interface CoursesContextType {
  courses: CourseItem[];
  loading: boolean;
  isLiveFromFirebase: boolean;
  error: string | null;
  /**
   * Only the documents that exist, with no fallback. The admin dashboard reads this and
   * nothing else: a course the fallback invents is one the database cannot be edited
   * through, which is what made every save fail with "No document to update: courses/<id>"
   * while the twelve built-in ones were on screen.
   */
  firestoreCourses: CourseItem[];
  addCourse: (course: Partial<CourseItem> & { title: string; category: CourseItem["category"] }) => Promise<CourseItem>;
  editCourse: (courseId: string, updates: Partial<CourseItem>) => Promise<void>;
  removeCourse: (courseId: string) => Promise<void>;
  seedCourses: () => Promise<{ count: number; courses: CourseItem[] }>;
  refreshCourses: () => Promise<void>;
}

const CoursesContext = createContext<CoursesContextType | undefined>(undefined);

export function CoursesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  // Firestore is the store of record. Until it answers — and if it never does — the built-in
  // COURSES_DATA seed is shown, but it is never written back to localStorage. An earlier version
  // kept a localStorage copy and treated it as a database, so an edit that failed to reach
  // Firestore still survived the reload and looked saved.
  const [courses, setCourses] = useState<CourseItem[]>(COURSES_DATA);
  // The same read without that fallback. Empty until the first snapshot, and empty for good on
  // a project where the catalogue has never been seeded — which is the truth the dashboard
  // should be showing.
  const [firestoreCourses, setFirestoreCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiveFromFirebase, setIsLiveFromFirebase] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = !!user?.isAdmin;

  useEffect(() => {
    let isMounted = true;

    // An admin keeps the live subscription: the Courses tab has to show the course it just
    // saved, and a value the cache has not caught up with reads as a failed save. Everyone
    // else takes the cached payload below, which is one Firestore read per window instead of
    // one per visitor.
    if (isAdmin) {
      const unsubscribe = subscribeCoursesFromFirestore(
        (stored) => {
          if (!isMounted) return;
          setFirestoreCourses(stored ?? []);
          if (stored && stored.length > 0) {
            setCourses(stored);
            setIsLiveFromFirebase(true);
          } else {
            // Keep current courses or fall back to default COURSES_DATA
            setCourses((prev) => (prev.length > 0 ? prev : COURSES_DATA));
            setIsLiveFromFirebase(false);
          }
          setLoading(false);
          setError(null);
        },
        (err) => {
          if (!isMounted) return;
          console.warn("[CoursesProvider] Real-time subscription error, using local state:", err);
          setError(err.message);
          setIsLiveFromFirebase(false);
          setLoading(false);
        }
      );

      if (!unsubscribe) {
        setIsLiveFromFirebase(false);
        setLoading(false);
      }

      return () => {
        isMounted = false;
        unsubscribe?.();
      };
    }

    fetchPublicContent()
      .then((payload) => {
        if (!isMounted) return;
        // `firestoreCourses` is left alone on purpose. This payload cannot say whether a
        // course is stored or is the server's built-in fallback, and that list means "what is
        // in the database" — only the subscription above, which reads the collection itself,
        // may fill it.
        if (payload.courses?.length) setCourses(payload.courses);
        setIsLiveFromFirebase(false);
        setLoading(false);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        // COURSES_DATA stays on screen: it is the same catalogue the server would have sent.
        console.warn("[CoursesProvider] Cached read failed, using the built-in catalogue:", err);
        setError(err instanceof Error ? err.message : "Failed to load the catalogue");
        setIsLiveFromFirebase(false);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  const refreshCourses = async () => {
    setLoading(true);
    try {
      const data = await getCoursesFromFirestore();
      setFirestoreCourses(data ?? []);
      if (data && data.length > 0) {
        setCourses(data);
        setIsLiveFromFirebase(true);
      } else {
        setIsLiveFromFirebase(false);
      }
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to refresh courses";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const addCourse = async (
    course: Partial<CourseItem> & { title: string; category: CourseItem["category"] }
  ) => {
    if (!user?.isAdmin) {
      throw new Error("Unauthorized: Only verified admins can create courses.");
    }

    // Generate full course object
    const courseId =
      course.id?.trim() ||
      course.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const now = new Date().toISOString();
    const author =
      (user.name && user.name !== "Learner" ? user.name.trim() : null) ||
      (user.email
        ? user.email
            .split("@")[0]
            .replace(/[._-]+/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
        : null) ||
      "Admin";

    const newCourse: CourseItem = {
      id: courseId,
      number: course.number || String(courses.length + 1).padStart(2, "0"),
      enrollmentId: course.enrollmentId || courseId,
      title: course.title,
      bannerTitle: course.bannerTitle || course.title,
      bannerSubtitle: course.bannerSubtitle || "",
      description: course.description || "",
      category: course.category,
      categoryLabel: course.categoryLabel || "Specialized Program",
      badge: course.badge || undefined,
      badgeType: course.badgeType || undefined,
      duration: course.duration || "60 Days (2 Months)",
      level: course.level || "Beginner to Adv",
      // A doc that omits the fee must not read as free — ₹30,000 is the standard tuition,
      // and Super10's ₹0 arrives as the string "₹0", which is truthy and passes through.
      fee: course.fee || "₹30,000",
      amount: course.amount ?? 30000,
      gradient: course.gradient || "from-[#0f172a] via-[#1e1b4b] to-[#0284c7]",
      accentColor: course.accentColor || "text-blue-400",
      techStack: course.techStack || [],
      techIcons: course.techIcons || [],
      topics: course.topics || [],
      actionPrompt: course.actionPrompt || `Tell me about the ${course.title} course`,
      status: course.status ?? "active",
      teacherIds: course.teacherIds ?? [],
      createdBy: course.createdBy || author,
      createdAt: course.createdAt || now,
      updatedBy: course.updatedBy || author,
      updatedAt: course.updatedAt || now,
    };

    // Optimistic update; the Firestore write below is what actually persists it.
    const updated = [...courses.filter((c) => c.id !== newCourse.id), newCourse].sort(
      (a, b) => (a.number || "").localeCompare(b.number || "")
    );
    setCourses(updated);

    // Sync to Firestore
    try {
      await createCourseInFirestore(newCourse, user.email, user.name);
      setIsLiveFromFirebase(true);
    } catch (err) {
      console.warn("[CoursesProvider] Could not sync new course to Firestore immediately:", err);
    }

    return newCourse;
  };

  const editCourse = async (courseId: string, updates: Partial<CourseItem>) => {
    if (!user?.isAdmin) {
      throw new Error("Unauthorized: Only verified admins can update courses.");
    }

    const now = new Date().toISOString();
    const author =
      (user.name && user.name !== "Learner" ? user.name.trim() : null) ||
      (user.email
        ? user.email
            .split("@")[0]
            .replace(/[._-]+/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
        : null) ||
      "Admin";
    const existing = courses.find((c) => c.id === courseId);

    const courseUpdates: Partial<CourseItem> = {
      ...updates,
      ...(existing && !existing.createdAt ? { createdAt: now } : {}),
      ...(existing && !existing.createdBy ? { createdBy: author } : {}),
      updatedBy: updates.updatedBy || author,
      updatedAt: updates.updatedAt || now,
    };

    const updated = courses.map((c) => (c.id === courseId ? { ...c, ...courseUpdates } : c));
    setCourses(updated);

    try {
      await updateCourseInFirestore(courseId, courseUpdates, user.email, user.name);
      setIsLiveFromFirebase(true);
    } catch (err) {
      console.warn("[CoursesProvider] Could not sync update to Firestore immediately:", err);
    }
  };

  const removeCourse = async (courseId: string) => {
    if (!user?.isAdmin) {
      throw new Error("Unauthorized: Only verified admins can delete courses.");
    }

    const updated = courses.filter((c) => c.id !== courseId);
    setCourses(updated);

    try {
      await deleteCourseInFirestore(courseId, user.email);
    } catch (err) {
      console.warn("[CoursesProvider] Could not sync deletion to Firestore immediately:", err);
    }
  };

  const seedCourses = async () => {
    if (!user?.isAdmin) {
      throw new Error("Unauthorized: Only verified admins can seed courses.");
    }

    setCourses(COURSES_DATA);

    // Only claim success if Firestore accepted the write. The old catch returned the default
    // catalogue as if it had seeded, which was half a lie propped up by the localStorage copy.
    const result = await seedDefaultCoursesToFirestore(user.email);
    setIsLiveFromFirebase(true);
    return result;
  };

  return (
    <CoursesContext.Provider
      value={{
        courses,
        firestoreCourses,
        loading,
        isLiveFromFirebase,
        error,
        addCourse,
        editCourse,
        removeCourse,
        seedCourses,
        refreshCourses,
      }}
    >
      {children}
    </CoursesContext.Provider>
  );
}

export function useCourses() {
  const context = useContext(CoursesContext);
  if (!context) {
    return {
      courses: COURSES_DATA,
      // Nothing was read, so nothing is known to exist.
      firestoreCourses: [],
      loading: false,
      isLiveFromFirebase: false,
      error: null,
      addCourse: async () => {
        throw new Error("useCourses must be used within a CoursesProvider");
      },
      editCourse: async () => {
        throw new Error("useCourses must be used within a CoursesProvider");
      },
      removeCourse: async () => {
        throw new Error("useCourses must be used within a CoursesProvider");
      },
      seedCourses: async () => {
        throw new Error("useCourses must be used within a CoursesProvider");
      },
      refreshCourses: async () => {},
    };
  }
  return context;
}
