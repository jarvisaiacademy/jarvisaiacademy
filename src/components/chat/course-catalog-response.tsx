"use client";

import React, { useState } from "react";
import {
  Clock,
  GraduationCap,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Award,
  Users,
  Briefcase,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  COURSE_CATEGORIES,
  CourseCategoryId,
  CourseItem,
} from "@/data/courses";
import { useCourses } from "@/providers/courses-provider";
import { DevIcon } from "@/components/ui/dev-icon";

function CourseBannerGraphic({
  course,
  isHovered,
}: {
  course: CourseItem;
  isHovered?: boolean;
}) {
  const containerClass = `relative flex flex-col gap-1 p-2 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 shadow-lg shadow-black/10 w-[116px] transition-all duration-300 ${
    isHovered ? "rotate-0 scale-105 bg-white/20" : "rotate-[-2deg] scale-100"
  }`;

  switch (course.id) {
    case "fullstack":
      return (
        <div className={containerClass}>
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-white/80" />
              <span className="w-1 h-1 rounded-full bg-white/50" />
              <span className="w-1 h-1 rounded-full bg-white/50" />
            </div>
            <span className="text-[9px] font-mono text-white/90 font-medium ml-1">fullstack.tsx</span>
          </div>
          <div className="flex flex-col gap-0.5 my-0.5">
            <div className="h-1 w-16 bg-white/70 rounded-full" />
            <div className="h-1 w-10 bg-white/40 rounded-full" />
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[8px] font-semibold text-white/90">Next.js + AI</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
          </div>
        </div>
      );

    case "super10":
      return (
        <div className={containerClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-bold text-amber-300">★ Super10</span>
            </div>
            <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-amber-400/30 text-amber-200">
              ELITE
            </span>
          </div>
          <div className="flex items-center gap-1 my-0.5">
            <div className="flex -space-x-1">
              <div className="w-3 h-3 rounded-full bg-white/80 border border-amber-300" />
              <div className="w-3 h-3 rounded-full bg-white/60 border border-amber-300" />
              <div className="w-3 h-3 rounded-full bg-white/40 border border-amber-300" />
            </div>
            <span className="text-[8px] font-semibold text-white/90">10 Seats</span>
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[8px] font-bold text-white">100% Placement</span>
          </div>
        </div>
      );

    case "frontend-react":
      return (
        <div className={containerClass}>
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-white/80" />
              <span className="w-1 h-1 rounded-full bg-white/50" />
              <span className="w-1 h-1 rounded-full bg-white/50" />
            </div>
            <span className="text-[9px] font-mono text-white/90 font-medium ml-1">app.tsx</span>
          </div>
          <div className="flex flex-col gap-0.5 my-0.5">
            <div className="h-1 w-16 bg-white/70 rounded-full" />
            <div className="h-1 w-10 bg-white/40 rounded-full" />
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[8px] font-semibold text-white/90">React 19 + UI</span>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-300 animate-pulse" />
          </div>
        </div>
      );

    case "backend-python":
      return (
        <div className={containerClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-mono text-emerald-300 font-bold">def</span>
              <span className="text-[9px] font-mono text-white/90 font-medium">api():</span>
            </div>
            <span className="text-[8px] font-mono text-emerald-300 bg-emerald-950/60 px-1 rounded">200 OK</span>
          </div>
          <div className="flex flex-col gap-0.5 my-0.5">
            <div className="h-1 w-16 bg-white/70 rounded-full" />
            <div className="h-1 w-11 bg-white/40 rounded-full" />
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[8px] font-semibold text-white/90">FastAPI + Django</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
        </div>
      );

    case "genai":
      return (
        <div className={containerClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
              <span className="text-[9px] font-bold text-white tracking-tight">AI Agent</span>
            </div>
            <span className="text-[8px] font-mono text-purple-300">RAG v2</span>
          </div>
          <div className="flex flex-col gap-0.5 my-0.5">
            <div className="h-1 w-16 bg-white/70 rounded-full" />
            <div className="h-1 w-12 bg-white/40 rounded-full" />
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[8px] font-semibold text-white/90">LLM Vector DB</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
          </div>
        </div>
      );

    case "data-analyst":
      return (
        <div className={containerClass}>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-white tracking-tight">PowerBI + SQL</span>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-300" />
          </div>
          <div className="flex items-end gap-1 h-3.5 my-0.5">
            <div className="w-1.5 bg-white/40 rounded-t h-1.5" />
            <div className="w-1.5 bg-white/60 rounded-t h-2.5" />
            <div className="w-1.5 bg-white/80 rounded-t h-2" />
            <div className="w-1.5 bg-white rounded-t h-3" />
            <span className="text-[7px] text-teal-300 font-mono ml-auto">DAX</span>
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[8px] font-semibold text-white/90">KPI Analytics</span>
            <span className="text-[8px] font-mono text-white/80">+88%</span>
          </div>
        </div>
      );

    case "business-analyst":
      return (
        <div className={containerClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-bold text-amber-300">Jira Sprint</span>
            </div>
            <span className="text-[7px] font-mono bg-amber-400/30 text-amber-200 px-1 rounded">AGILE</span>
          </div>
          <div className="flex flex-col gap-0.5 my-0.5">
            <div className="h-1 w-16 bg-white/70 rounded-full" />
            <div className="h-1 w-10 bg-white/40 rounded-full" />
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[8px] font-semibold text-white/90">BRD & Stories</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          </div>
        </div>
      );

    case "devops-aws":
      return (
        <div className={containerClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-mono text-purple-300">&gt;_</span>
              <span className="text-[9px] font-mono text-white/90">deploy.sh</span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <div className="flex flex-col gap-0.5 my-0.5">
            <div className="h-1 w-16 bg-white/70 rounded-full" />
            <div className="h-1 w-10 bg-white/40 rounded-full" />
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[8px] font-semibold text-white/90">AWS + K8s</span>
            <span className="text-[8px] text-emerald-300 font-bold">CI/CD</span>
          </div>
        </div>
      );

    case "database-admin":
      return (
        <div className={containerClass}>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-white tracking-tight">Oracle PL/SQL</span>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          </div>
          <div className="flex flex-col gap-0.5 my-0.5">
            <div className="h-1 w-16 bg-white/70 rounded-full" />
            <div className="h-1 w-10 bg-white/40 rounded-full" />
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[8px] font-semibold text-white/90">MongoDB + SQL</span>
            <span className="text-[8px] text-slate-300 font-mono">0.2ms</span>
          </div>
        </div>
      );

    case "app-support":
      return (
        <div className={containerClass}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-mono text-orange-300">#</span>
              <span className="text-[9px] font-mono text-white/90">syslog.log</span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
          </div>
          <div className="flex flex-col gap-0.5 my-0.5">
            <div className="h-1 w-16 bg-white/70 rounded-full" />
            <div className="h-1 w-10 bg-white/40 rounded-full" />
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[8px] font-semibold text-white/90">Linux Ops</span>
            <span className="text-[8px] text-orange-300 font-bold">24/7 SLA</span>
          </div>
        </div>
      );

    case "web-laravel":
      return (
        <div className={containerClass}>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono text-pink-300 font-bold">&lt;?php</span>
            <span className="text-[8px] font-mono text-white/80">routes.php</span>
          </div>
          <div className="flex flex-col gap-0.5 my-0.5">
            <div className="h-1 w-16 bg-white/70 rounded-full" />
            <div className="h-1 w-10 bg-white/40 rounded-full" />
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[8px] font-semibold text-white/90">Laravel 11</span>
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
          </div>
        </div>
      );

    case "referral":
      return (
        <div className={containerClass}>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-emerald-300">🎁 Reward</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <div className="text-[12px] font-extrabold text-white leading-none my-0.5">
            ₹3,000 <span className="text-[8px] font-medium text-white/80">Cash</span>
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[8px] font-semibold text-white/90">Direct UPI</span>
            <span className="text-[8px] font-bold text-emerald-300">INSTANT</span>
          </div>
        </div>
      );

    default:
      return (
        <div className={containerClass}>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold text-white">{course.categoryLabel}</span>
            <Sparkles className="w-2.5 h-2.5 text-white/80" />
          </div>
          <div className="flex flex-col gap-0.5 my-0.5">
            <div className="h-1 w-16 bg-white/70 rounded-full" />
            <div className="h-1 w-10 bg-white/40 rounded-full" />
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[8px] font-medium text-white/90">{course.duration}</span>
          </div>
        </div>
      );
  }
}

interface CourseCatalogResponseProps {
  onActionPrompt?: (prompt: string) => void;
  onSelectCourse?: (courseId: string) => void;
}

export function CourseCatalogResponse({
  onActionPrompt,
  onSelectCourse,
}: CourseCatalogResponseProps) {
  const { courses } = useCourses();
  const [selectedCategory, setSelectedCategory] =
    useState<CourseCategoryId>("all");
  const [hoveredCourseId, setHoveredCourseId] = useState<string | null>(null);

  const filteredCourses = courses.filter((course) => {
    if (selectedCategory === "all") return true;
    return course.category === selectedCategory;
  });

  const handleCardClick = (course: CourseItem) => {
    if (onSelectCourse) {
      onSelectCourse(course.id);
    } else if (onActionPrompt) {
      onActionPrompt(course.actionPrompt);
    }
  };

  const handleViewAll = () => {
    if (onActionPrompt) {
      onActionPrompt(
        "Show me the complete 60-day curriculum breakdown, weekly roadmap, and tech stack comparison for all Jarvis AI Academy courses."
      );
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 my-2">
      {/* 1. Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
        {COURSE_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-black shadow-2xs font-semibold"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80 hover:text-neutral-900 dark:bg-white/5 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white border border-neutral-200/50 dark:border-white/5"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* 2. Responsive Course Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredCourses.map((course) => {
            const isHovered = hoveredCourseId === course.id;

            return (
              <motion.div
                key={course.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                onClick={() => handleCardClick(course)}
                onMouseEnter={() => setHoveredCourseId(course.id)}
                onMouseLeave={() => setHoveredCourseId(null)}
                className={`group/card relative flex flex-col rounded-3xl bg-white dark:bg-[#191919] hover:bg-neutral-50/90 dark:hover:bg-[#202020] border transition-all duration-200 overflow-hidden text-left cursor-pointer ${
                  isHovered
                    ? "border-neutral-400/60 dark:border-white/20 shadow-md"
                    : "border-neutral-200 dark:border-white/10 shadow-xs"
                }`}
              >
                {/* Card Banner Header */}
                <div
                  className={`relative h-32 sm:h-36 w-full p-4 bg-gradient-to-br ${course.gradient} flex flex-col justify-between overflow-hidden shrink-0 border-b border-neutral-200/60 dark:border-white/10`}
                >
                  {/* Specular sheen across top */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none" />

                  {/* Background ambient glow effects */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/15 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />

                  {/* Delicate concentric glass rings */}
                  <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full border border-white/15 pointer-events-none" />
                  <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full border border-white/10 pointer-events-none" />

                  {/* Sparkling light stars */}
                  <svg
                    className="absolute top-3.5 right-14 w-3 h-3 text-white/50 animate-pulse pointer-events-none"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                  </svg>
                  <svg
                    className="absolute bottom-3 right-6 w-2 h-2 text-white/40 pointer-events-none"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                  </svg>

                  {/* Floating Frosted Object on the Right */}
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none drop-shadow-md">
                    <CourseBannerGraphic course={course} isHovered={isHovered} />
                  </div>

                {/* Top Row: Badge + Number */}
                <div className="flex items-center justify-between gap-2 z-10">
                  {course.badge ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-black/40 backdrop-blur-md text-amber-300 border border-amber-400/30 shadow-xs">
                      <Sparkles className="w-2.5 h-2.5" />
                      {course.badge}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/30 backdrop-blur-md text-white/80 border border-white/10">
                      {course.categoryLabel}
                    </span>
                  )}

                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white/20 font-mono select-none">
                    {course.number}
                  </span>
                </div>

                {/* Bottom of Banner: Title & Subtitle */}
                <div className="z-10 mt-auto max-w-[66%] sm:max-w-[62%]">
                  <h4 className="text-base sm:text-[17px] font-bold text-white tracking-tight leading-tight drop-shadow-xs">
                    {course.bannerTitle}
                  </h4>
                  <p className="text-[11px] text-white/80 font-medium tracking-wide mt-0.5 drop-shadow-xs line-clamp-1">
                    {course.bannerSubtitle}
                  </p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex flex-col flex-1 justify-between gap-3.5">
                <div>
                  <h3
                    className={`text-sm sm:text-[15px] font-bold leading-snug tracking-tight transition-colors ${
                      isHovered
                        ? "text-primary dark:text-primary"
                        : "text-neutral-900 dark:text-white"
                    }`}
                  >
                    {course.title}
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mt-1 line-clamp-2">
                    {course.description}
                  </p>
                </div>

                {/* Tech Stack Logos (DevIcon integration from Codexa) */}
                {course.techIcons && course.techIcons.length > 0 && (
                  <div className="flex flex-col gap-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                        Tech Stack
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {course.techIcons.map((icon) => (
                        <div
                          key={icon}
                          className={`w-7 h-7 rounded-lg bg-neutral-100 dark:bg-white/5 flex items-center justify-center p-1 border shadow-2xs transition-all ${
                            isHovered
                              ? "border-neutral-300 dark:border-white/20"
                              : "border-neutral-200/70 dark:border-white/10"
                          }`}
                          title={icon}
                        >
                          <DevIcon name={icon} size={18} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Learning Topics Bullet Points */}
                {course.topics && course.topics.length > 0 && (
                  <div className="flex flex-col gap-1 pt-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                      Core Modules
                    </span>
                    <div className="grid grid-cols-1 gap-1">
                      {course.topics.slice(0, 3).map((topic, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-1.5 text-xs text-neutral-700 dark:text-neutral-300"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-500 shrink-0" />
                          <span className="line-clamp-1 leading-snug">
                            {topic}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Card Meta Row (Duration, Level, Fee & Action CTA) */}
                <div className="flex items-center justify-between pt-3 border-t border-neutral-200/70 dark:border-white/5 text-[11px] text-neutral-500 dark:text-neutral-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{course.duration}</span>
                    </span>
                    <span className="hidden xs:flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{course.level}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">
                      {course.fee}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-xs shrink-0 ${
                        isHovered
                          ? "bg-neutral-900 dark:bg-white text-white dark:text-black"
                          : "bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-200"
                      }`}
                    >
                      <ArrowRight
                        className={`w-3.5 h-3.5 transition-transform ${
                          isHovered ? "translate-x-0.5" : ""
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
        </AnimatePresence>
      </div>

      {/* 3. "View Full Curriculum & Roadmap" Action Button */}
      <div className="flex items-center justify-center pt-1">
        <button
          type="button"
          onClick={handleViewAll}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200/90 dark:hover:bg-neutral-700/90 border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-200 text-xs sm:text-[13px] font-semibold transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-98"
        >
          <Layers className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
          <span>
            {selectedCategory === "all"
              ? "Explore All 11+ Programs & Roadmaps"
              : `View All ${COURSE_CATEGORIES.find((c) => c.id === selectedCategory)?.label} Tracks`}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
        </button>
      </div>

      {/* 4. Bottom Features / Academy Highlights Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 mt-1 border-t border-neutral-200/70 dark:border-white/5">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-neutral-50/80 dark:bg-white/[0.02] border border-neutral-200/50 dark:border-white/5">
          <div className="w-8 h-8 rounded-lg bg-neutral-200/70 dark:bg-white/5 flex items-center justify-center shrink-0 text-neutral-700 dark:text-neutral-300">
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
              Fast-Track 60d
            </span>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
              Intensive 2 Months
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-neutral-50/80 dark:bg-white/[0.02] border border-neutral-200/50 dark:border-white/5">
          <div className="w-8 h-8 rounded-lg bg-neutral-200/70 dark:bg-white/5 flex items-center justify-center shrink-0 text-neutral-700 dark:text-neutral-300">
            <Briefcase className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
              Live Capstones
            </span>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
              Commercial Code
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-neutral-50/80 dark:bg-white/[0.02] border border-neutral-200/50 dark:border-white/5">
          <div className="w-8 h-8 rounded-lg bg-neutral-200/70 dark:bg-white/5 flex items-center justify-center shrink-0 text-neutral-700 dark:text-neutral-300">
            <Award className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
              Certificates
            </span>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
              Verified Credentials
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-neutral-50/80 dark:bg-white/[0.02] border border-neutral-200/50 dark:border-white/5">
          <div className="w-8 h-8 rounded-lg bg-neutral-200/70 dark:bg-white/5 flex items-center justify-center shrink-0 text-neutral-700 dark:text-neutral-300">
            <Users className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
              Refer & Earn
            </span>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
              ₹3,000 Cash Reward
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseCatalogResponse;
