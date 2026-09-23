"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  GraduationCap, 
  BookOpen, 
  ChevronRight, 
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  PlayCircle,
  Code,
  ListChecks,
  Target,
  Award
} from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useCourses } from "@/providers/courses-provider";
import { useStudentEnrollments, type EnrollmentRecord } from "@/hooks/use-student-enrollments";
import { SettingsSection } from "@/components/settings/settings-section";

const STATUS_STYLES: Record<
  EnrollmentRecord["action"],
  { label: string; className: string }
> = {
  paid: {
    label: "Enrolled",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  initiated: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  not_paid: { label: "Not paid", className: "bg-muted text-muted-foreground" },
};

export function DashboardCourses() {
  const { user } = useAuth();
  const { courses } = useCourses();
  const enrollments = useStudentEnrollments(user?.email);

  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentRecord | null>(null);

  // Derive mock data for the selected enrollment
  const getCourseDetails = (record: EnrollmentRecord) => {
    const courseObj = courses.find((c) => c.enrollmentId === record.courseId || c.id === record.courseId);
    
    const startDateObj = new Date(record.timestamp || "2026-09-01T00:00:00Z");
    const endDateObj = new Date(startDateObj.getTime() + 12 * 7 * 24 * 60 * 60 * 1000); // +12 weeks
    
    // Deterministic mock progress between 15% and 85% based on length of course name
    const mockProgress = Math.min(85, Math.max(15, record.courseName.length * 3));
    
    return {
      title: record.courseName,
      status: record.action === "paid" ? "In Progress" : "Awaiting Payment",
      duration: courseObj?.duration || "12 Weeks",
      startDate: startDateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      endDate: endDateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
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
    <div className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 overflow-x-hidden">
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
              <h2 className="text-xl font-semibold text-foreground">My Learning</h2>
              <p className="text-sm text-muted-foreground">
                Manage your enrolments and track your progress across active programmes.
              </p>
            </div>

            {/* Enrolments List */}
            <SettingsSection
              title={
                enrollments.length > 0
                  ? `Active Enrolments (${enrollments.length})`
                  : "Active Enrolments"
              }
            >
              {enrollments.length > 0 ? (
                enrollments.map((record) => {
                  const status = STATUS_STYLES[record.action] ?? STATUS_STYLES.not_paid;
                  const courseObj = courses.find((c) => c.enrollmentId === record.courseId || c.id === record.courseId);
                  const description = courseObj?.description || "A comprehensive Jarvis AI Academy programme.";

                  return (
                    <button
                      key={`${record.transactionId}-${record.timestamp}`}
                      onClick={() => setSelectedEnrollment(record)}
                      className="w-full flex items-start justify-between gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors text-left group"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-muted text-foreground/80 shrink-0 group-hover:bg-background group-hover:shadow-sm transition-all border border-transparent group-hover:border-border mt-0.5">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium text-foreground leading-snug truncate">
                            {record.courseName}
                          </span>
                          <span className="text-xs text-muted-foreground leading-relaxed mt-1 line-clamp-2 pr-4">
                            {description}
                          </span>
                          <div className="flex items-center gap-2 mt-2">
                            {courseObj?.duration && (
                              <span className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                                {courseObj.duration}
                              </span>
                            )}
                            {courseObj?.level && (
                              <span className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                                {courseObj.level}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0 pt-1">
                        <span
                          className={`text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full ${status.className}`}
                        >
                          {status.label}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-colors mt-auto" />
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="flex flex-col items-center gap-3 px-6 py-12 text-center border border-dashed border-border rounded-xl bg-muted/10 m-4">
                  <GraduationCap className="w-8 h-8 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-foreground">No active enrolments</p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Programmes you enrol in via the Jarvis AI chat will appear here.
                  </p>
                </div>
              )}
            </SettingsSection>

            {/* Catalogue Preview */}
            {courses.length > 0 && (
              <SettingsSection title={enrollments.length === 0 ? "All Programmes" : "Explore Programmes"}>
                {(enrollments.length === 0 ? courses : courses.slice(0, 3)).map((course) => (
                  <div key={course.id} className="flex items-start gap-3.5 px-4 py-3.5 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-muted/50 text-foreground/60 shrink-0 mt-0.5">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-foreground leading-snug">{course.title}</span>
                      {course.description && (
                        <span className="text-xs text-muted-foreground leading-normal mt-0.5 line-clamp-2">
                          {course.description}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </SettingsSection>
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
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-fit group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              Back to Learning
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
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                      {details.description}
                    </p>
                  </div>

                  {/* Progress Section */}
                  <div className="flex flex-col gap-4 p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-sm">
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
