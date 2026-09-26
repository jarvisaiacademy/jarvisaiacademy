"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { BookOpen, Award, ArrowRight, Copy, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useCourses } from "@/providers/courses-provider";
import { useStudentEnrollments } from "@/hooks/use-student-enrollments";
import { referralCodeFor } from "@/data/referrals";
import { type StudentTab } from "@/components/dashboard/student-shell";

interface DashboardHomeProps {
  onSelectTab: (tab: StudentTab) => void;
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-xs hover:bg-muted/40 transition-colors w-full">
      <div className="flex flex-col gap-1">
        <span className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <span className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">
          {value}
        </span>
      </div>
      <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}

function formatEnrolledDate(timestamp?: string | number): string {
  if (!timestamp) return "Recently";
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? "Recently"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

export function DashboardHome({ onSelectTab }: DashboardHomeProps) {
  const { user } = useAuth();
  const { courses } = useCourses();
  const enrollments = useStudentEnrollments(user?.email);
  const [copied, setCopied] = useState(false);

  const firstName = user?.name?.split(" ")[0] || "there";
  const referralCode = user?.referralCode || (user?.id ? referralCodeFor(user.id) : "JAR-04BPH3SW");
  const joinedYear = user?.createdAt
    ? new Date(user.createdAt).getFullYear()
    : new Date().getFullYear();

  const certificatesCount = enrollments.filter((e) => e.action === "paid").length;

  const handleCopy = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(referralCode).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const greetingTime = (() => {
    const h = new Date().getHours();
    return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-6 flex flex-col gap-6"
    >
      {/* Welcome Hero Card — Full Width End to End */}
      <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 p-6 sm:p-8 rounded-2xl bg-card border border-border w-full shadow-xs">
        {/* Avatar */}
        <div className="relative shrink-0">
          {user?.picture ? (
            <img
              src={user.picture}
              alt={user.name || "Student"}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-2 ring-border ring-offset-2 ring-offset-background"
            />
          ) : (
            <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted text-foreground text-xl sm:text-2xl font-bold ring-2 ring-border ring-offset-2 ring-offset-background">
              {user?.name?.slice(0, 2).toUpperCase() ?? "JA"}
            </div>
          )}
          {/* Online dot */}
          <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-background" />
        </div>

        {/* Greeting & Meta */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-1 flex-1 min-w-0">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight truncate w-full">
            Good {greetingTime}, {firstName}
          </h2>
          <p className="text-sm text-muted-foreground">
            Member since {joinedYear} · Jarvis AI Academy
          </p>
        </div>
      </div>

      {/* Stats Cards — Full Width End to End */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        <StatCard
          icon={BookOpen}
          label="Enrolled Courses"
          value={enrollments.length}
          color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          icon={Award}
          label="Certificates"
          value={certificatesCount}
          color="bg-purple-500/10 text-purple-600 dark:text-purple-400"
        />
      </div>

      {/* Referral Code Card — Full Width End to End */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-card border border-border w-full shadow-xs">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Your Referral Code
          </span>
          <span className="text-lg sm:text-xl font-mono font-bold text-foreground tracking-widest">
            {referralCode}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs shrink-0"
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

      {/* Continue Learning — Full Width End to End */}
      <div className="flex flex-col gap-3 w-full">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Continue Learning
          </p>
          {enrollments.length > 0 && (
            <button
              type="button"
              onClick={() => onSelectTab("courses")}
              className="text-xs font-semibold text-foreground hover:underline cursor-pointer inline-flex items-center gap-1"
            >
              <span>View all programmes</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {enrollments.length > 0 ? (
          <div className="flex flex-col rounded-2xl overflow-hidden border border-border divide-y divide-border bg-card w-full shadow-xs">
            {enrollments.slice(0, 5).map((record) => (
              <div
                key={`${record.transactionId}-${record.timestamp}`}
                onClick={() => onSelectTab("courses")}
                className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {record.courseName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Enrolled on {formatEnrolledDate(record.timestamp)}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 border ${
                    record.action === "paid"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                  }`}
                >
                  {record.action === "paid" ? "Enrolled" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center rounded-2xl border border-border bg-card w-full shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1 max-w-sm">
              <h4 className="text-base font-semibold text-foreground">No active courses yet</h4>
              <p className="text-xs text-muted-foreground">
                You haven&apos;t enrolled in any courses yet. Browse our programmes to kickstart your AI learning journey.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab("courses")}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <span>Browse All Courses</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
