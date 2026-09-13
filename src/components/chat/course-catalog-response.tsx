"use client";

import React, { useState } from "react";
import {
  Clock,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Code2,
  Brain,
  Database,
  Zap,
  Award,
  Users,
  Briefcase,
  Gift,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  COURSES_DATA,
  COURSE_CATEGORIES,
  CourseCategoryId,
  CourseItem,
} from "@/data/courses";

interface CourseCatalogResponseProps {
  onActionPrompt?: (prompt: string) => void;
  onSelectCourse?: (courseId: string) => void;
}

export function CourseCatalogResponse({
  onActionPrompt,
  onSelectCourse,
}: CourseCatalogResponseProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<CourseCategoryId>("all");

  const filteredCourses = COURSES_DATA.filter((course) => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "web") return course.category === "web";
    if (selectedCategory === "ai")
      return course.category === "ai" || course.id === "fullstack";
    if (selectedCategory === "datascience")
      return course.category === "datascience";
    if (selectedCategory === "elite")
      return course.category === "elite" || course.id === "super10";
    return true;
  });

  const handleCardClick = (course: CourseItem) => {
    if (onSelectCourse) {
      onSelectCourse(course.id);
    } else if (onActionPrompt) {
      onActionPrompt(course.actionPrompt);
    }
  };

  const handleViewAll = () => {
    if (selectedCategory !== "all") {
      setSelectedCategory("all");
    } else if (onActionPrompt) {
      onActionPrompt("Tell me about the available courses at Jarvis AI Academy");
    }
  };

  // Render course-specific visual emblem in the banner
  const renderBannerGraphic = (courseId: string) => {
    switch (courseId) {
      case "fullstack":
        return (
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg shrink-0">
            <Code2 className="w-7 h-7 text-sky-300" />
            <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500" />
            </span>
          </div>
        );
      case "super10":
        return (
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/20 backdrop-blur-md border border-amber-400/30 shadow-lg shrink-0">
            <Zap className="w-7 h-7 text-amber-300 fill-amber-300/30" />
          </div>
        );
      case "datascience":
        return (
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 shadow-lg shrink-0">
            <Database className="w-7 h-7 text-emerald-300" />
          </div>
        );
      case "genai":
        return (
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-500/20 backdrop-blur-md border border-purple-400/30 shadow-lg shrink-0">
            <Brain className="w-7 h-7 text-purple-300" />
          </div>
        );
      case "referral":
        return (
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-500/20 backdrop-blur-md border border-teal-400/30 shadow-lg shrink-0">
            <Gift className="w-7 h-7 text-teal-300" />
          </div>
        );
      default:
        return (
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg shrink-0">
            <Sparkles className="w-7 h-7 text-amber-300" />
          </div>
        );
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 mt-2 mb-3 select-none">
      {/* 1. Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {COURSE_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer select-none ${
                isActive
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs font-semibold"
                  : "bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/80 dark:hover:bg-neutral-700/80 border border-neutral-200 dark:border-white/5"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* 2. Responsive Course Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        <AnimatePresence mode="popLayout">
          {filteredCourses.map((course) => (
            <motion.div
              key={course.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              onClick={() => handleCardClick(course)}
              className="group relative flex flex-col rounded-2xl bg-white dark:bg-[#1c1c1c] hover:bg-neutral-50/80 dark:hover:bg-[#232323] border border-neutral-200/90 dark:border-white/10 hover:border-neutral-300 dark:hover:border-white/20 transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md text-left cursor-pointer"
            >
              {/* Card Banner Thumbnail */}
              <div
                className={`relative h-32 sm:h-36 w-full p-4 bg-gradient-to-br ${course.gradient} flex flex-col justify-between overflow-hidden shrink-0 border-b border-neutral-200/60 dark:border-white/10`}
              >
                {/* Background ambient glow effect */}
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                {/* Top Row: Badge + Emblem Graphic */}
                <div className="flex items-start justify-between gap-2 z-10">
                  {course.badge ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-black/40 dark:bg-black/60 backdrop-blur-md text-amber-300 border border-amber-400/30 shadow-xs">
                      <Sparkles className="w-2.5 h-2.5" />
                      {course.badge}
                    </span>
                  ) : (
                    <div />
                  )}

                  {renderBannerGraphic(course.id)}
                </div>

                {/* Bottom of Banner: Title & Subtitle */}
                <div className="z-10 mt-auto">
                  <h4 className="text-base sm:text-[17px] font-bold text-white tracking-tight leading-tight drop-shadow-xs">
                    {course.bannerTitle}
                  </h4>
                  <p className="text-[11px] text-neutral-200/90 font-medium tracking-wide mt-0.5 drop-shadow-xs line-clamp-1">
                    {course.bannerSubtitle}
                  </p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-3">
                <div>
                  <h3 className="text-sm sm:text-[15px] font-semibold text-neutral-900 dark:text-white leading-snug tracking-tight group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mt-1 line-clamp-2">
                    {course.description}
                  </p>
                </div>

                {/* Tech Badges */}
                <div className="flex flex-wrap gap-1">
                  {course.techStack.slice(0, 3).map((tech, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-white/5 text-[10px] font-medium text-neutral-600 dark:text-neutral-400 border border-neutral-200/60 dark:border-white/5"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Card Meta Row */}
                <div className="flex items-center justify-between pt-2.5 border-t border-neutral-200/60 dark:border-white/5 text-[11px] text-neutral-500 dark:text-neutral-400">
                  <div className="flex items-center gap-2.5">
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
                    <div className="w-7 h-7 rounded-full bg-neutral-200/80 dark:bg-white/10 group-hover:bg-neutral-900 dark:group-hover:bg-white text-neutral-700 dark:text-neutral-200 group-hover:text-white dark:group-hover:text-black flex items-center justify-center transition-all shadow-xs shrink-0">
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 3. "View All Courses" Action Button */}
      <div className="flex items-center justify-center pt-1">
        <button
          type="button"
          onClick={handleViewAll}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200/90 dark:hover:bg-neutral-700/90 border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-200 text-xs sm:text-[13px] font-semibold transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-98"
        >
          <span>
            {selectedCategory === "all"
              ? "View Full Curriculum & Roadmap"
              : "View All Courses"}
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
              Commercial code
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
              Verified credentials
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
              ₹5,000 Cash Reward
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseCatalogResponse;
