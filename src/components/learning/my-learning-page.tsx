"use client";

import React, { useMemo } from "react";
import { motion } from "motion/react";
import { BookOpen, GraduationCap, Loader2, RefreshCw } from "lucide-react";
import { SettingsHeader } from "@/components/settings/settings-header";
import { MyLearningCard } from "./my-learning-card";
import { useAuth } from "@/providers/auth-provider";
import { useAssignments } from "@/providers/assignments-provider";
import { useCourses } from "@/providers/courses-provider";

interface MyLearningPageProps {
  onBack?: () => void;
  onOpenCourse?: (topic: string) => void;
  className?: string;
}

export function MyLearningPage({
  onBack,
  onOpenCourse,
  className = "",
}: MyLearningPageProps) {
  const { user } = useAuth();
  const { myAssignments, loading, error, refreshAssignments } = useAssignments();
  const { courses } = useCourses();

  const courseById = useMemo(
    () => new Map(courses.map((c) => [c.id, c])),
    [courses]
  );

  const firstName = user?.name?.split(" ")[0] || "there";
  const showLoading = loading && myAssignments.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.18 }}
      className={`flex flex-col min-h-screen w-full bg-background text-foreground ${className}`}
    >
      <SettingsHeader onBack={onBack} title="My Learning" />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8 flex flex-col gap-6">
        {/* Welcome banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-gradient-to-r from-indigo-600/10 via-blue-600/10 to-emerald-600/10 border border-indigo-500/20">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              Welcome back, {firstName}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Courses granted to your account by an academy admin.
            </p>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-medium self-start sm:self-auto">
            <GraduationCap className="w-3.5 h-3.5" />
            {myAssignments.length} Enrolled
          </span>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
            <span>Could not sync your courses right now.</span>
            <button
              type="button"
              onClick={() => void refreshAssignments()}
              className="flex items-center gap-1 font-semibold underline cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        )}

        {showLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-xs">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading your courses...
          </div>
        ) : myAssignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <BookOpen className="w-6 h-6 text-muted-foreground opacity-60" />
            <p className="text-sm font-medium text-foreground">
              No courses assigned yet
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Once an admin grants you access to a course, it will appear here
              automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {myAssignments.map((assignment) => (
              <MyLearningCard
                key={assignment.id}
                assignment={assignment}
                course={courseById.get(assignment.courseId) ?? null}
                onOpenCourse={onOpenCourse}
              />
            ))}
          </div>
        )}
      </main>
    </motion.div>
  );
}

export default MyLearningPage;
