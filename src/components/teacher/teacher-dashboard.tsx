"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Users, GraduationCap, LayoutDashboard, ChevronRight } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useCourses } from "@/providers/courses-provider";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import type { EnrollmentRecord } from "@/hooks/use-student-enrollments";
import type { CourseItem } from "@/data/courses";
import { AdminHeader } from "@/components/admin/admin-header";

interface TeacherDashboardProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function TeacherDashboard({ sidebarOpen, onToggleSidebar }: TeacherDashboardProps) {
  const { user } = useAuth();
  const { courses } = useCourses();
  
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);

  // Find courses assigned to this teacher
  const teacherCourses = useMemo(() => {
    if (!user) return [];
    return courses.filter((c) => c.teacherIds?.includes(user.id));
  }, [courses, user]);

  useEffect(() => {
    if (!db || teacherCourses.length === 0) {
      setEnrollments([]);
      return;
    }

    const courseIds = teacherCourses.map((c) => c.id);
    
    // Firestore "in" queries support max 10 elements. We chunk if needed.
    const chunks = [];
    for (let i = 0; i < courseIds.length; i += 10) {
      chunks.push(courseIds.slice(i, i + 10));
    }

    const unsubscribes: (() => void)[] = [];
    const allFetched = new Map<string, EnrollmentRecord[]>();

    chunks.forEach((chunk, index) => {
      const q = query(
        collection(db!, "enrollments"),
        where("courseId", "in", chunk)
      );
      const unsub = onSnapshot(q, (snapshot) => {
        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as EnrollmentRecord[];
        
        allFetched.set(index.toString(), fetched);
        
        const combined: EnrollmentRecord[] = [];
        allFetched.forEach((records) => combined.push(...records));
        
        combined.sort((a, b) => {
          const tA = new Date(a.timestamp).getTime() || 0;
          const tB = new Date(b.timestamp).getTime() || 0;
          return tB - tA;
        });
        
        setEnrollments(combined);
      }, (err) => {
        console.error("Error fetching enrollments for teacher courses:", err);
      });
      unsubscribes.push(unsub);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [teacherCourses]);

  const totalStudents = enrollments.length;

  return (
    <div className="flex flex-col min-h-screen w-full bg-neutral-50 dark:bg-[#121212] text-neutral-900 dark:text-neutral-100 overflow-y-auto">
      <AdminHeader 
        sidebarOpen={sidebarOpen} 
        onToggleSidebar={onToggleSidebar} 
        title="Teacher Dashboard" 
      />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">
        
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(" ")[0] || "Teacher"}
          </h1>
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400">
            Here&apos;s an overview of your assigned courses and students.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-3 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                My Courses
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <LayoutDashboard className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-neutral-900 dark:text-white">
                {teacherCourses.length}
              </span>
              <span className="text-sm text-neutral-500">Active</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col gap-3 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Total Enrolled Students
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-neutral-900 dark:text-white">
                {totalStudents}
              </span>
              <span className="text-sm text-neutral-500">Across {teacherCourses.length} courses</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
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
                  <div key={course.id} className="p-5 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
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
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
