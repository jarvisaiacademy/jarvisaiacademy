"use client";

import React from "react";
import { motion } from "motion/react";
import { GraduationCap, BookOpen } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useCourses } from "@/providers/courses-provider";
import { useStudentEnrollments, type EnrollmentRecord } from "@/hooks/use-student-enrollments";
import { SettingsSection } from "@/components/settings/settings-section";

const STATUS_STYLES: Record<
  EnrollmentRecord["action"],
  { label: string; className: string }
> = {
  paid: {
    label: "Paid",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  initiated: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  not_paid: { label: "Not paid", className: "bg-muted text-muted-foreground" },
};

function EnrollmentRow({ record }: { record: EnrollmentRecord }) {
  const status = STATUS_STYLES[record.action] ?? STATUS_STYLES.not_paid;
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-muted text-foreground/80 shrink-0">
          <GraduationCap className="w-4 h-4" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-foreground leading-snug truncate">
            {record.courseName}
          </span>
          <span className="text-xs text-muted-foreground leading-normal mt-0.5 truncate">
            {record.transactionId} · {record.timestamp}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-sm font-medium text-foreground">
          ₹{record.amount.toLocaleString("en-IN")}
        </span>
        <span
          className={`text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full ${status.className}`}
        >
          {status.label}
        </span>
      </div>
    </div>
  );
}

function CourseCard({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex items-start gap-3.5 px-4 py-3.5">
      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-muted text-foreground/80 shrink-0 mt-0.5">
        <BookOpen className="w-4 h-4" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium text-foreground leading-snug">{title}</span>
        {description && (
          <span className="text-xs text-muted-foreground leading-normal mt-0.5 line-clamp-2">
            {description}
          </span>
        )}
      </div>
    </div>
  );
}

export function DashboardCourses() {
  const { user } = useAuth();
  const { courses } = useCourses();
  const enrollments = useStudentEnrollments(user?.email);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6"
    >
      {/* Enrolments from localStorage ledger */}
      <SettingsSection
        title={
          enrollments.length > 0
            ? `My Enrolments (${enrollments.length})`
            : "My Enrolments"
        }
      >
        {enrollments.length > 0 ? (
          enrollments.map((record) => (
            <EnrollmentRow
              key={`${record.transactionId}-${record.timestamp}`}
              record={record}
            />
          ))
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            <GraduationCap className="w-6 h-6 text-muted-foreground opacity-60" />
            <p className="text-sm font-medium text-foreground">No enrolments yet</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Enrolments you make in the chat appear here with their status and transaction ID.
            </p>
          </div>
        )}
      </SettingsSection>

      {/* Full catalogue — all Firestore courses available to browse */}
      {courses.length > 0 && (
        <SettingsSection title={`Available Programmes (${courses.length})`}>
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              title={course.title}
              description={course.description}
            />
          ))}
        </SettingsSection>
      )}
    </motion.div>
  );
}
