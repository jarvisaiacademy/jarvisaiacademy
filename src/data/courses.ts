export interface CourseItem {
  id: string;
  number: string;
  enrollmentId?: "fullstack" | "super10" | string;
  title: string;
  bannerTitle: string;
  bannerSubtitle: string;
  description: string;
  category: "all" | "web" | "ai" | "datascience" | "devops" | "database" | "elite";
  categoryLabel: string;
  badge?: string;
  badgeType?: "bestseller" | "elite" | "popular" | "ai";
  duration: string;
  level: string;
  fee: string;
  amount: number;
  gradient: string;
  accentColor: string;
  techStack: string[];
  techIcons: string[];
  topics: string[];
  actionPrompt: string;
}

export const COURSE_CATEGORIES = [
  { id: "all", label: "All Courses" },
  { id: "web", label: "Web & Full-Stack" },
  { id: "ai", label: "AI & Data Science" },
  { id: "devops", label: "DevOps & Cloud" },
  { id: "database", label: "Database & Systems" },
  { id: "elite", label: "Super10 Elite" },
] as const;

export type CourseCategoryId = (typeof COURSE_CATEGORIES)[number]["id"];

import initialCourses from "./courses-data.json";

export const COURSES_DATA: CourseItem[] = initialCourses as CourseItem[];

