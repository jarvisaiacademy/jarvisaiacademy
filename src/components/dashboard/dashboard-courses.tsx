"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  GraduationCap, 
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  PlayCircle,
  Code,
  ListChecks,
  Target,
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useCourses } from "@/providers/courses-provider";
import { useStudentEnrollments, type EnrollmentRecord } from "@/hooks/use-student-enrollments";
import { useStudentProfile } from "@/hooks/use-student-profile";
import { formatDate } from "@/lib/date-format";
import { ContactUsButton } from "@/components/chat/contact-us-button";
import { CourseItem } from "@/data/courses";

function parseDurationDays(durationStr?: string): number {
  if (!durationStr) return 60;
  const matchDays = durationStr.match(/(\d+)\s*days?/i);
  if (matchDays) return parseInt(matchDays[1], 10);
  const matchWeeks = durationStr.match(/(\d+)\s*weeks?/i);
  if (matchWeeks) return parseInt(matchWeeks[1], 10) * 7;
  const matchMonths = durationStr.match(/(\d+)\s*months?/i);
  if (matchMonths) return parseInt(matchMonths[1], 10) * 30;
  return 60;
}

function getCourseDates(
  course: CourseItem,
  enrollment?: EnrollmentRecord | null,
  profileCreatedAt?: string
) {
  const durationDays = parseDurationDays(course.duration);
  const rawStart = enrollment?.timestamp || profileCreatedAt || "2026-09-01T00:00:00Z";
  const startObj = new Date(rawStart);
  const endObj = new Date(startObj.getTime() + durationDays * 24 * 60 * 60 * 1000);

  return {
    startDate: formatDate(startObj),
    endDate: formatDate(endObj),
  };
}

export function DashboardCourses() {
  const { user } = useAuth();
  const { courses } = useCourses();
  const { profile } = useStudentProfile(user?.id);
  const enrollments = useStudentEnrollments(user?.email);

  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentRecord | null>(null);

  // Map only the courses assigned/enrolled for this student
  const enrolledCourses = useMemo(() => {
    const active = courses.filter((c) => c.status !== "inactive");
    const directIds = new Set<string>(profile?.enrolledCourseIds || []);
    const userEmail = (user?.email || "").toLowerCase().trim();

    const list: Array<{
      course: CourseItem;
      enrollment: EnrollmentRecord | null;
    }> = [];

    // Check each active course in the catalogue
    for (const c of active) {
      const match = enrollments.find((e) => {
        const matchesEmail = !userEmail || (e.studentEmail || "").toLowerCase().trim() === userEmail;
        const matchesCourse =
          e.courseId === c.id ||
          (c.enrollmentId && e.courseId === c.enrollmentId) ||
          e.courseName.toLowerCase().trim() === c.title.toLowerCase().trim();
        return matchesEmail && matchesCourse && e.action === "paid";
      });

      const isDirectlyAssigned =
        directIds.has(c.id) || (c.enrollmentId && directIds.has(c.enrollmentId));

      if (match || isDirectlyAssigned) {
        list.push({
          course: c,
          enrollment: match || null,
        });
      }
    }

    // Also include any paid enrollment record whose course wasn't in active catalogue
    for (const e of enrollments) {
      if (e.action === "paid") {
        const alreadyAdded = list.some(
          (item) =>
            item.course.id === e.courseId ||
            item.course.enrollmentId === e.courseId ||
            item.course.title.toLowerCase().trim() === e.courseName.toLowerCase().trim()
        );
        if (!alreadyAdded) {
          const syntheticCourse: CourseItem = {
            id: e.courseId,
            number: "00",
            title: e.courseName,
            bannerTitle: e.courseName,
            bannerSubtitle: "Enrolled Programme",
            description: "Enrolled Jarvis AI Academy programme.",
            category: "all",
            categoryLabel: "Enrolled Programme",
            duration: "12 Weeks",
            level: "All Levels",
            fee: e.amount ? `₹${e.amount.toLocaleString("en-IN")}` : "—",
            amount: e.amount || 0,
            gradient: "from-blue-600 to-indigo-600",
            accentColor: "#3b82f6",
            techStack: ["AI", "Full Stack"],
            techIcons: [],
            topics: ["Core Concepts", "Advanced Concepts"],
            actionPrompt: "Access Course",
          };
          list.push({
            course: syntheticCourse,
            enrollment: e,
          });
        }
      }
    }

    return list;
  }, [courses, enrollments, profile?.enrolledCourseIds, user?.email]);

  // Derive mock data for the selected enrollment
  const getCourseDetails = (record: EnrollmentRecord) => {
    const courseObj = courses.find((c) => c.enrollmentId === record.courseId || c.id === record.courseId);
    
    const startDateObj = new Date(record.timestamp || "2026-09-01T00:00:00Z");
    const durationDays = parseDurationDays(courseObj?.duration);
    const endDateObj = new Date(startDateObj.getTime() + durationDays * 24 * 60 * 60 * 1000);
    
    // Deterministic mock progress between 15% and 85% based on length of course name
    const mockProgress = Math.min(85, Math.max(15, record.courseName.length * 3));
    
    return {
      title: record.courseName,
      status: record.action === "paid" ? "In Progress" : "Awaiting Payment",
      duration: courseObj?.duration || "12 Weeks",
      startDate: formatDate(startDateObj),
      endDate: formatDate(endDateObj),
      progress: record.action === "paid" ? mockProgress : 0,
      description: courseObj?.description || "Master the fundamentals and advanced concepts in this comprehensive Jarvis AI Academy programme.",
      level: courseObj?.level || "All Levels",
      category: courseObj?.categoryLabel || "Professional Programme",
      techStack: courseObj?.techStack || ["React", "Node.js", "Firebase", "AI"],
      topics: courseObj?.topics || [
        "Core Programming Concepts",
        "Advanced Architecture & Design",
        "Real-world Project Implementation"
      ]
    };
  };

  return (
    <div className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-6 overflow-x-hidden">
      <AnimatePresence mode="wait">
        {!selectedEnrollment ? (
          <motion.div
            key="list-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            {/* Header */}
            <div className="flex flex-col gap-1">
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground">My Courses</h2>
              <p className="text-sm text-muted-foreground">
                Manage your enrolments and track your progress across active programmes.
              </p>
            </div>

            {/* If no course is assigned, show only Contact Us button with no list/table */}
            {enrolledCourses.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-5 p-8 sm:p-14 text-center rounded-2xl border border-dashed border-border bg-card/40 max-w-xl mx-auto my-6">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted text-foreground/70 border border-border/60 shadow-xs">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div className="flex flex-col gap-1.5 max-w-md">
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                    No Courses Assigned
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    You currently do not have any assigned courses. Get in touch with our admissions team to enroll in an academy programme.
                  </p>
                </div>
                <div className="pt-2">
                  <ContactUsButton
                    text="CONTACT US"
                    className="py-2.5 pl-5 pr-2 text-sm shadow-md"
                  />
                </div>
              </div>
            ) : (
              /* Enrolled Courses Table */
              <div className="w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <th className="py-3.5 px-4 sm:px-6">Course Name</th>
                        <th className="py-3.5 px-4 sm:px-6 whitespace-nowrap">Start Date</th>
                        <th className="py-3.5 px-4 sm:px-6 whitespace-nowrap">End Date</th>
                        <th className="py-3.5 px-4 sm:px-6 whitespace-nowrap">Fees</th>
                        <th className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 text-sm">
                      {enrolledCourses.map(({ course, enrollment }) => {
                        const dates = getCourseDates(course, enrollment, profile?.createdAt);
                        const displayFee = course.fee || (course.amount ? `₹${course.amount.toLocaleString("en-IN")}` : "—");

                        return (
                          <tr
                            key={course.id}
                            className="hover:bg-muted/30 transition-colors group"
                          >
                            {/* Course Name */}
                            <td className="py-4 px-4 sm:px-6">
                              <div className="flex items-center gap-3.5 min-w-[220px]">
                                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted text-foreground/80 shrink-0 border border-border/50">
                                  <GraduationCap className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-semibold text-foreground leading-snug">
                                    {course.title}
                                  </span>
                                  <div className="flex items-center gap-2 mt-1">
                                    {course.duration && (
                                      <span className="text-[11px] text-muted-foreground">
                                        {course.duration}
                                      </span>
                                    )}
                                    {course.level && (
                                      <>
                                        <span className="text-muted-foreground/40 text-[10px]">·</span>
                                        <span className="text-[11px] text-muted-foreground">
                                          {course.level}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Start Date */}
                            <td className="py-4 px-4 sm:px-6 whitespace-nowrap font-medium text-foreground/90">
                              {dates.startDate}
                            </td>

                            {/* End Date */}
                            <td className="py-4 px-4 sm:px-6 whitespace-nowrap font-medium text-foreground/90">
                              {dates.endDate}
                            </td>

                            {/* Fees */}
                            <td className="py-4 px-4 sm:px-6 whitespace-nowrap font-bold text-foreground">
                              {displayFee}
                            </td>

                            {/* Action */}
                            <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                              <div className="inline-flex items-center justify-end gap-2.5">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Enrolled
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const activeRecord = enrollment || {
                                      action: "paid" as const,
                                      courseId: course.enrollmentId || course.id,
                                      courseName: course.title,
                                      amount: course.amount || 0,
                                      transactionId: `TXN-${course.id.toUpperCase()}`,
                                      studentName: user?.name || "Learner",
                                      studentEmail: user?.email || "",
                                      timestamp: profile?.createdAt || "2026-09-01T00:00:00Z",
                                    };
                                    setSelectedEnrollment(activeRecord);
                                  }}
                                  className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer px-2.5 py-1 rounded-md hover:bg-primary/5"
                                >
                                  View
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="detail-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            {/* Back Button */}
            <button 
              onClick={() => setSelectedEnrollment(null)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-fit group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              Back to My Courses
            </button>
            
            {/* Detail Content */}
            {(() => {
              const details = getCourseDetails(selectedEnrollment);
              const isPaid = selectedEnrollment.action === "paid";
              
              return (
                <div className="flex flex-col gap-8">
                  {/* Hero */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-foreground text-background shrink-0 shadow-sm">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <span
                        className={`text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-full border ${
                          isPaid 
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400" 
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400"
                        }`}
                      >
                        {details.status}
                      </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight leading-tight">
                      {details.title}
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-4xl">
                      {details.description}
                    </p>
                  </div>

                  {/* Progress Section */}
                  <div className="flex flex-col gap-4 p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">Course Progress</h3>
                      <span className="text-sm font-mono font-medium text-foreground">{details.progress}%</span>
                    </div>
                    
                    <div className="relative h-2.5 w-full rounded-full bg-muted overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${details.progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`absolute top-0 left-0 h-full rounded-full ${isPaid ? "bg-foreground" : "bg-muted-foreground/30"}`}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                        <PlayCircle className="w-3.5 h-3.5" />
                        {isPaid ? "Resume Learning" : "Awaiting activation"}
                      </span>
                      {details.progress >= 100 && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1.5 p-4 rounded-xl border border-border bg-card/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Start Date</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{details.startDate}</span>
                    </div>
                    
                    <div className="flex flex-col gap-1.5 p-4 rounded-xl border border-border bg-card/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">End Date</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{details.endDate}</span>
                    </div>

                    <div className="flex flex-col gap-1.5 p-4 rounded-xl border border-border bg-card/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Duration</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{details.duration}</span>
                    </div>
                    
                    <div className="flex flex-col gap-1.5 p-4 rounded-xl border border-border bg-card/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Target className="w-4 h-4" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Level</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{details.level}</span>
                    </div>
                  </div>

                  {/* Tech Stack */}
                  {details.techStack.length > 0 && (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2 text-foreground">
                        <Code className="w-5 h-5 text-emerald-500" />
                        <h3 className="text-lg font-semibold">Technologies Used</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {details.techStack.map((tech) => (
                          <span
                            key={tech}
                            className="px-3 py-1.5 text-sm font-medium rounded-lg border border-border bg-card text-foreground shadow-sm"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Topics / What you'll learn */}
                  {details.topics.length > 0 && (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2 text-foreground">
                        <ListChecks className="w-5 h-5 text-blue-500" />
                        <h3 className="text-lg font-semibold">What You&apos;ll Learn</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {details.topics.map((topic, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card/40 hover:bg-card/80 transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="text-sm text-foreground leading-snug">{topic}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
