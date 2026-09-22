"use client";

import React from "react";
import { motion } from "motion/react";
import { BookOpen } from "lucide-react";
import { SettingsHeader } from "@/components/settings/settings-header";
import { useAuth } from "@/providers/auth-provider";

interface MyLearningPageProps {
  onBack?: () => void;
  className?: string;
}

/**
 * The learner's own page.
 *
 * It listed the courses an admin had granted, one card each, read from the `assignments`
 * collection. That collection is gone, so there is nothing to list and the page shows its
 * empty state permanently. Give it a source — the whole catalogue, or a new grant — before
 * anyone relies on it again.
 */
export function MyLearningPage({ onBack, className = "" }: MyLearningPageProps) {
  const { user } = useAuth();

  const firstName = user?.name?.split(" ")[0] || "there";

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
              The courses you have access to.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <BookOpen className="w-6 h-6 text-muted-foreground opacity-60" />
          <p className="text-sm font-medium text-foreground">No courses here yet</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            Nothing is listed on this page right now. Ask an academy admin about access to a
            course.
          </p>
        </div>
      </main>
    </motion.div>
  );
}

export default MyLearningPage;
