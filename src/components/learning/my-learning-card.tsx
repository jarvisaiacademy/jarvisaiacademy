"use client";

import React from "react";
import {
  Clock,
  BarChart3,
  Sparkles,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { AssignmentRecord } from "@/data/assignments";
import { CourseItem } from "@/data/courses";
import { DevIcon } from "@/components/ui/dev-icon";

interface MyLearningCardProps {
  assignment: AssignmentRecord;
  course: CourseItem | null;
  onOpenCourse?: (topic: string) => void;
}

export function MyLearningCard({
  assignment,
  course,
  onOpenCourse,
}: MyLearningCardProps) {
  // Deleted / unavailable course — fall back to the title snapshot.
  if (!course) {
    return (
      <div className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden opacity-80">
        <div className="h-20 w-full bg-gradient-to-br from-neutral-300 to-neutral-400 dark:from-neutral-800 dark:to-neutral-700" />
        <div className="flex flex-col gap-3 p-5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <h3 className="text-sm font-semibold text-foreground">
              {assignment.courseTitle}
            </h3>
          </div>
          <span className="self-start px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
            Temporarily unavailable
          </span>
          <p className="text-xs text-muted-foreground">
            This course has been removed from the catalog. Your access grant is still on
            record — check back soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:border-foreground/20 transition-colors">
      {/* Gradient Banner */}
      <div
        className={`relative h-24 w-full bg-gradient-to-br ${course.gradient} flex items-end p-4`}
      >
        <div className="flex flex-col">
          <span className="text-[10px] font-bold tracking-wider uppercase text-white/70">
            {course.categoryLabel}
          </span>
          <h3 className="text-sm font-bold text-white leading-tight line-clamp-2">
            {course.title}
          </h3>
        </div>
        <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 backdrop-blur-xs text-white border border-white/25">
          <Sparkles className="w-3 h-3" />
          Granted
        </span>
      </div>

      <div className="flex flex-col gap-4 p-5">
        <p className="text-xs text-muted-foreground line-clamp-2">
          {course.description}
        </p>

        {/* Meta pills */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted">
            <Clock className="w-3 h-3" />
            {course.duration}
          </span>
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted">
            <BarChart3 className="w-3 h-3" />
            {course.level}
          </span>
        </div>

        {/* Tech stack */}
        {course.techIcons.length > 0 && (
          <div className="flex items-center gap-1.5">
            {course.techIcons.slice(0, 6).map((icon) => (
              <span
                key={icon}
                className="flex items-center justify-center w-6 h-6 rounded-lg bg-muted"
              >
                <DevIcon name={icon} size={14} />
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-1 border-t border-border">
          <span className="text-[11px] text-muted-foreground">
            {course.techStack.length} modules
          </span>
          <button
            type="button"
            onClick={() => onOpenCourse?.(course.title)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-foreground text-background hover:opacity-90 transition-opacity cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Open in Chat
          </button>
        </div>
      </div>
    </div>
  );
}

export default MyLearningCard;
