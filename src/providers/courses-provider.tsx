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

const LOCAL_STORAGE_KEY = "jarvis_courses_data";

interface CoursesContextType {
  courses: CourseItem[];
  loading: boolean;
  isLiveFromFirebase: boolean;
  error: string | null;
  addCourse: (course: Partial<CourseItem> & { title: string; category: CourseItem["category"] }) => Promise<CourseItem>;
  editCourse: (courseId: string, updates: Partial<CourseItem>) => Promise<void>;
  removeCourse: (courseId: string) => Promise<void>;
  seedCourses: () => Promise<{ count: number; courses: CourseItem[] }>;
  resetToDefaults: () => Promise<void>;
  refreshCourses: () => Promise<void>;
}

const CoursesContext = createContext<CoursesContextType | undefined>(undefined);

export function CoursesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // ignore parse error
      }
    }
    return COURSES_DATA;
  });
  const [loading, setLoading] = useState(true);
  const [isLiveFromFirebase, setIsLiveFromFirebase] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state changes to localStorage for offline persistence
  const saveToLocal = (newCourses: CourseItem[]) => {
    setCourses(newCourses);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newCourses));
      } catch {
        // ignore storage error
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = subscribeCoursesFromFirestore(
      (firestoreCourses) => {
        if (!isMounted) return;
        if (firestoreCourses && firestoreCourses.length > 0) {
          saveToLocal(firestoreCourses);
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
      if (data && data.length > 0) {
        saveToLocal(data);
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
      fee: course.fee || "₹30,000",
      amount: course.amount || 30000,
      gradient: course.gradient || "from-[#0f172a] via-[#1e1b4b] to-[#0284c7]",
      accentColor: course.accentColor || "text-blue-400",
      techStack: course.techStack || [],
      techIcons: course.techIcons || [],
      topics: course.topics || [],
      actionPrompt: course.actionPrompt || `Tell me about the ${course.title} course`,
    };

    // Save locally first
    const updated = [...courses.filter((c) => c.id !== newCourse.id), newCourse].sort(
      (a, b) => (a.number || "").localeCompare(b.number || "")
    );
    saveToLocal(updated);

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
    saveToLocal(updated);

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
    saveToLocal(updated);

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

    saveToLocal(COURSES_DATA);

    try {
      const result = await seedDefaultCoursesToFirestore(user.email);
      setIsLiveFromFirebase(true);
      return result;
    } catch (err) {
      console.warn("[CoursesProvider] Cloud Firestore seeding warning, seeded locally:", err);
      return { count: COURSES_DATA.length, courses: COURSES_DATA };
    }
  };

  const resetToDefaults = async () => {
    if (!user?.isAdmin) {
      throw new Error("Unauthorized: Only verified admins can reset courses.");
    }
    saveToLocal(COURSES_DATA);
  };

  return (
    <CoursesContext.Provider
      value={{
        courses,
        loading,
        isLiveFromFirebase,
        error,
        addCourse,
        editCourse,
        removeCourse,
        seedCourses,
        resetToDefaults,
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
      resetToDefaults: async () => {},
      refreshCourses: async () => {},
    };
  }
  return context;
}
