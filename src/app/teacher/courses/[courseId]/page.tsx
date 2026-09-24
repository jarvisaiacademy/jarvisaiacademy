"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTeacherShell } from "@/components/teacher/teacher-shell";
import { AdminHeader } from "@/components/admin/admin-header";
import { TeacherCourseView } from "@/components/teacher/teacher-course-view";
import { useCourses } from "@/providers/courses-provider";
import { useAuth } from "@/providers/auth-provider";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import type { EnrollmentRecord } from "@/hooks/use-student-enrollments";

export default function TeacherCourseDetailRoute() {
  const { sidebarOpen, onToggleSidebar } = useTeacherShell();
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const { courses } = useCourses();
  const { user } = useAuth();
  
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);

  const course = useMemo(() => {
    return courses.find(c => c.id === params.courseId);
  }, [courses, params.courseId]);

  useEffect(() => {
    if (!db || !course || !user) return;
    
    const cleanEmail = user.email?.trim().toLowerCase();
    const isAssigned =
      course.teacherIds?.includes(user.id) ||
      (cleanEmail ? course.teacherIds?.includes(cleanEmail) : false);

    // Security check: Make sure this teacher actually owns this course
    if (!isAssigned) {
      router.replace("/teacher/courses");
      return;
    }

    const q = query(
      collection(db, "enrollments"), 
      where("courseId", "==", course.id)
    );
    
    const unsub = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as EnrollmentRecord[];
      setEnrollments(fetched);
    });

    return () => unsub();
  }, [course, user, router]);

  if (!course) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <AdminHeader title="Loading Course..." sidebarOpen={sidebarOpen} onToggleSidebar={onToggleSidebar} />
        <div className="flex-1 overflow-y-auto min-h-0 flex items-center justify-center">
          <p className="text-neutral-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AdminHeader
        title={course.title}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={onToggleSidebar}
      />
      <div className="flex-1 overflow-y-auto min-h-0 bg-neutral-50 dark:bg-[#121212] p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <TeacherCourseView 
            course={course}
            enrollments={enrollments}
            onBack={() => router.push("/teacher/courses")}
          />
        </div>
      </div>
    </div>
  );
}
