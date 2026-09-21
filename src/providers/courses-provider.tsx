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

  useEffect(() => {
    let isMounted = true;

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
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

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
    };

    // Optimistic update; the Firestore write below is what actually persists it.
    const updated = [...courses.filter((c) => c.id !== newCourse.id), newCourse].sort(
      (a, b) => (a.number || "").localeCompare(b.number || "")
    );
    setCourses(updated);

    // Sync to Firestore
    try {
      await createCourseInFirestore(newCourse, user.email);
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

    const updated = courses.map((c) => (c.id === courseId ? { ...c, ...updates } : c));
    setCourses(updated);

    try {
      await updateCourseInFirestore(courseId, updates, user.email);
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
