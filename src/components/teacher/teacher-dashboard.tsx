"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Users, GraduationCap, LayoutDashboard, ChevronRight, Copy, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useCourses } from "@/providers/courses-provider";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import type { EnrollmentRecord } from "@/hooks/use-student-enrollments";
import type { CourseItem } from "@/data/courses";
import { referralCodeFor } from "@/data/referrals";
import { formatDate } from "@/lib/date-format";
import { AdminHeader } from "@/components/admin/admin-header";
import { TeacherCourseView } from "./teacher-course-view";

interface TeacherDashboardProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function TeacherDashboard({ sidebarOpen, onToggleSidebar }: TeacherDashboardProps) {
  const { user } = useAuth();
  const { courses } = useCourses();
  
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const referralCode =
    user?.referralCode && /^[A-Z0-9]{6}$/.test(user.referralCode)
      ? user.referralCode
      : user?.id
      ? referralCodeFor(user.id)
      : "JARVIS";
  const joinedDate = formatDate(user?.createdAt, formatDate(new Date()));

  const handleCopyReferral = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(referralCode).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Restore selected course from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem("jarvis_teacher_course");
    if (stored) setSelectedCourseId(stored);
  }, []);

  const handleSelectCourse = (id: string | null) => {
    setSelectedCourseId(id);
    if (id) {
      sessionStorage.setItem("jarvis_teacher_course", id);
    } else {
      sessionStorage.removeItem("jarvis_teacher_course");
    }
  };

  // Find courses assigned to this teacher
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
      
      <main className="flex-1 w-full max-w-none px-3 sm:px-6 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">
            <div className="flex flex-col items-center gap-4 pt-4 pb-2 text-center max-w-2xl mx-auto w-full">
              {/* Avatar */}
              <div className="relative">
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name || "Teacher"}
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-neutral-200 dark:ring-white/10 ring-offset-2 ring-offset-background"
                  />
                ) : (
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 dark:bg-white/5 text-neutral-900 dark:text-white text-lg font-semibold ring-2 ring-neutral-200 dark:ring-white/10 ring-offset-2 ring-offset-background">
                    {user?.name?.slice(0, 2).toUpperCase() ?? "JA"}
                  </div>
                )}
                {/* online dot */}
                <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-background" />
              </div>

              {/* Greeting */}
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white tracking-tight">
                  Good{" "}
                  {(() => {
                    const h = new Date().getHours();
                    return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
                  })()}
                  , {user?.name?.split(" ")[0] || "Teacher"}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Faculty Member since {joinedDate} · Jarvis AI Academy
                </p>
              </div>
            </div>

            {/* Thin divider */}
            <div className="max-w-2xl mx-auto w-full mt-2 mb-2">
              <hr className="border-neutral-200 dark:border-white/10" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-4">
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

            {/* Referral Code Card — Unique to each teacher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#1c1c1c] border border-neutral-200 dark:border-white/10 shadow-xs">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Your Teacher Referral Code
                </span>
                <span className="text-xl sm:text-2xl font-mono font-bold text-neutral-900 dark:text-white tracking-widest">
                  {referralCode}
                </span>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Share your unique 6-digit code with learners and track their enrollment.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyReferral}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs shrink-0"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
      </main>
    </div>
  );
}
