"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { useCourses } from "@/providers/courses-provider";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Users, GraduationCap } from "lucide-react";
import type { EnrollmentRecord } from "@/hooks/use-student-enrollments";

interface TeacherCoursesViewProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function TeacherCoursesView({ sidebarOpen, onToggleSidebar }: TeacherCoursesViewProps) {
  const { user } = useAuth();
  const { courses } = useCourses();
  
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);

  const teacherCourses = useMemo(() => {
    if (!user) return [];
    const cleanEmail = user.email?.trim().toLowerCase();
    return courses.filter(
      (c) =>
        c.teacherIds?.includes(user.id) ||
        (cleanEmail ? c.teacherIds?.includes(cleanEmail) : false)
    );
  }, [courses, user]);

  useEffect(() => {
    if (!db || teacherCourses.length === 0) {
      setEnrollments([]);
      return;
    }

    const courseIds = teacherCourses.map((c) => c.id);
    const chunks = [];
    for (let i = 0; i < courseIds.length; i += 10) {
      chunks.push(courseIds.slice(i, i + 10));
    }

    const unsubscribes: (() => void)[] = [];
    const allFetched = new Map<string, EnrollmentRecord[]>();

    chunks.forEach((chunk, index) => {
      const q = query(collection(db!, "enrollments"), where("courseId", "in", chunk));
      const unsub = onSnapshot(q, (snapshot) => {
        const fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as EnrollmentRecord[];
        allFetched.set(index.toString(), fetched);
        const combined: EnrollmentRecord[] = [];
        allFetched.forEach((records) => combined.push(...records));
        setEnrollments(combined);
      });
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [teacherCourses]);

  return (
    <div className="flex flex-col min-h-full w-full bg-neutral-50 dark:bg-[#121212] text-neutral-900 dark:text-neutral-100 p-4 sm:p-8">
      <div className="flex flex-col gap-4 max-w-7xl mx-auto w-full">
        <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-neutral-400" />
          Course Roster
        </h2>
        
        {teacherCourses.length === 0 ? (
          <div className="p-12 text-center border border-neutral-200 dark:border-white/10 rounded-2xl bg-white dark:bg-[#1c1c1c]">
            <p className="text-neutral-500">You are not assigned to any courses yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teacherCourses.map((course) => {
              const courseEnrollments = enrollments.filter(e => e.courseId === course.id);
              return (
                <Link
                  href={`/teacher/courses/${course.id}`}
                  key={course.id} 
                  className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-sm flex flex-col justify-between cursor-pointer hover:border-neutral-300 dark:hover:border-white/20 transition-all hover:-translate-y-0.5"
                >
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300">
                        {course.categoryLabel}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-white line-clamp-2 leading-snug mb-1">
                      {course.title}
                    </h3>
                  </div>
                  <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                      <Users className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {courseEnrollments.length} {courseEnrollments.length === 1 ? 'Student' : 'Students'}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
