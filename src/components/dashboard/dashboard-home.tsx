"use client";

import React from "react";
import { motion } from "motion/react";
import { BookOpen, Award, ArrowRight } from "lucide-react";
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
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border">
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${color}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xl font-bold text-foreground leading-tight">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

export function DashboardHome({ onSelectTab }: DashboardHomeProps) {
  const { user } = useAuth();
  const { courses } = useCourses();
  const enrollments = useStudentEnrollments(user?.email);

  const firstName = user?.name?.split(" ")[0] || "there";
  const referralCode = user?.id ? referralCodeFor(user.id) : "—";
  const joinedYear = user?.createdAt
    ? new Date(user.createdAt).getFullYear()
    : new Date().getFullYear();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6"
    >
      {/* Welcome banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-gradient-to-r from-indigo-600/10 via-blue-600/10 to-emerald-600/10 border border-indigo-500/20">
        <div className="flex items-center gap-3">
          {user?.picture ? (
            <img
              src={user.picture}
              alt={user.name}
              className="w-12 h-12 rounded-full border-2 border-indigo-400/30 object-cover shrink-0"
            />
          ) : (
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-base font-bold shrink-0">
              {user?.name?.slice(0, 2).toUpperCase() ?? "JA"}
            </div>
          )}
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-foreground">
              Welcome back, {firstName} 👋
            </h2>
            <p className="text-xs text-muted-foreground">
              Member since {joinedYear} · Jarvis AI Academy
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={BookOpen}
          label="Enrolled Courses"
          value={enrollments.length}
          color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          icon={Award}
          label="Certificates"
          value={0}
          color="bg-purple-500/10 text-purple-600 dark:text-purple-400"
        />
      </div>

      {/* Referral card */}
      <div className="flex flex-col gap-2 p-5 rounded-2xl bg-card border border-border">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Your Referral Code
        </p>
        <div className="flex items-center justify-between gap-3">
          <span className="text-2xl font-mono font-bold text-foreground tracking-widest">
            {referralCode}
          </span>
          <button
            type="button"
            onClick={() => {
              if (typeof navigator !== "undefined") {
                navigator.clipboard.writeText(referralCode).catch(() => {});
              }
            }}
            className="px-3 py-1.5 rounded-full bg-foreground text-background text-xs font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            Copy
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Share this code — referred learners are linked to your account.
        </p>
      </div>

      {/* Continue learning CTA */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
          Continue Learning
        </p>
        {enrollments.length > 0 ? (
          <div className="flex flex-col divide-y divide-border border border-border rounded-2xl bg-card overflow-hidden">
            {enrollments.slice(0, 3).map((record) => (
              <div
                key={`${record.transactionId}-${record.timestamp}`}
                className="flex items-center justify-between gap-3 px-4 py-3.5"
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-foreground truncate">
                    {record.courseName}
                  </span>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    ₹{record.amount.toLocaleString("en-IN")} ·{" "}
                    <span
                      className={
                        record.action === "paid"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      }
                    >
                      {record.action === "paid" ? "Paid" : "Pending"}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 p-8 rounded-2xl bg-card border border-border text-center">
            <BookOpen className="w-6 h-6 text-muted-foreground opacity-60" />
            <p className="text-sm text-muted-foreground">
              No enrolled courses yet.{" "}
              <span className="text-foreground font-medium">
                {courses.length} programmes
              </span>{" "}
              are available.
            </p>
            <button
              type="button"
              onClick={() => onSelectTab("courses")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-foreground text-background text-xs font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            >
              Browse Courses
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
