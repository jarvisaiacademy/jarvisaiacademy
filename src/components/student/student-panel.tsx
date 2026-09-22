"use client";

import React from "react";
import { motion } from "motion/react";
import { GraduationCap, Mail } from "lucide-react";

import { SettingsHeader } from "@/components/settings/settings-header";
import { SettingsSection } from "@/components/settings/settings-section";
import { useAuth } from "@/providers/auth-provider";
import {
  useStudentEnrollments,
  type EnrollmentRecord,
} from "@/hooks/use-student-enrollments";

export type StudentView = "profile" | "courses";

interface StudentPanelProps {
  view: StudentView;
  onBack?: () => void;
  onBrowseCourses?: () => void;
}

const TITLES: Record<StudentView, string> = {
  profile: "My Profile",
  courses: "My Courses",
};

/** Same shell as SettingsPage, so every full view in the app opens identically. */
export function StudentPanel({
  view,
  onBack,
  onBrowseCourses,
}: StudentPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col min-h-screen w-full bg-background text-foreground"
    >
      <SettingsHeader onBack={onBack} title={TITLES[view]} />

      <main className="flex-1 w-full max-w-2xl mx-auto px-0 sm:px-6 py-4 sm:py-8 flex flex-col gap-6 sm:gap-8">
        {view === "profile" ? (
          <ProfileSection />
        ) : (
          <CoursesSection onBrowseCourses={onBrowseCourses} />
        )}
      </main>
    </motion.div>
  );
}

function IconChip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-muted text-foreground/80 shrink-0">
      {children}
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-center gap-3.5 px-4 py-3.5">
      <IconChip>{icon}</IconChip>
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium text-foreground leading-snug">
          {label}
        </span>
        <span className="text-xs text-muted-foreground leading-normal mt-0.5 truncate">
          {value || "—"}
        </span>
      </div>
    </div>
  );
}

function ProfileSection() {
  const { user } = useAuth();
  const name = user?.name || "Jarvis Member";
  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : "JA";

  return (
    <SettingsSection title="Account">
      <div className="flex items-center gap-3.5 px-4 py-3.5">
        {user?.picture ? (
          <img
            src={user.picture}
            alt={name}
            className="w-9 h-9 rounded-full border border-border object-cover shrink-0"
          />
        ) : (
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-muted text-foreground/80 text-xs font-semibold shrink-0">
            {initials}
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-foreground leading-snug truncate">
            {name}
          </span>
          <span className="text-xs text-muted-foreground leading-normal mt-0.5">
            Signed in with Google
          </span>
        </div>
      </div>

      <DetailRow
        icon={<Mail className="w-4 h-4" />}
        label="Email"
        value={user?.email}
      />
    </SettingsSection>
  );
}

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
  // Records come out of localStorage, so fall back rather than trusting the shape.
  const status = STATUS_STYLES[record.action] ?? STATUS_STYLES.not_paid;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <div className="flex items-center gap-3.5 min-w-0">
        <IconChip>
          <GraduationCap className="w-4 h-4" />
        </IconChip>
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

function CoursesSection({ onBrowseCourses }: { onBrowseCourses?: () => void }) {
  const { user } = useAuth();
  const records = useStudentEnrollments(user?.email);

  if (records.length === 0) {
    return (
      <SettingsSection title="Enrolled Courses">
        <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-muted text-muted-foreground">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-foreground">
              No courses yet
            </span>
            <span className="text-xs text-muted-foreground max-w-xs">
              Enrolments you make in the chat appear here with their status and
              transaction ID.
            </span>
          </div>
          <button
            type="button"
            onClick={onBrowseCourses}
            className="mt-1 px-4 py-2 rounded-full bg-foreground text-background text-xs font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            Browse Courses
          </button>
        </div>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection title={`Enrolled Courses (${records.length})`}>
      {records.map((record) => (
        <EnrollmentRow
          key={`${record.transactionId}-${record.timestamp}`}
          record={record}
        />
      ))}
    </SettingsSection>
  );
}

export default StudentPanel;
