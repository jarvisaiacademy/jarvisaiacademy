"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  SquarePen,
  BookOpen,
  Zap,
  MessageSquareQuote,
  Award,
  HelpCircle,
  Gift,
  LayoutDashboard,
  UserRound,
  GraduationCap,
  Layers,
  Code2,
  Server,
  Sparkles,
  BarChart3,
  ClipboardList,
  Cloud,
  Database,
  Wrench,
  Globe,
} from "lucide-react";
import { SidebarHoverCard } from "./sidebar-hover-card";
import { SidebarSection } from "./sidebar-section";
import { useAuth } from "@/providers/auth-provider";
import { useStudentEnrollments } from "@/hooks/use-student-enrollments";
import { COURSES_DATA, type CourseItem } from "@/data/courses";

/**
 * The two catalogue entries that already have a nav row of their own — Super10
 * has its own item and the referral entry is a reward, not a programme — so the
 * course list below does not repeat them.
 */
const DEDICATED_ROWS = new Set(["super10", "referral"]);

const COURSE_ROWS = COURSES_DATA.filter((course) => !DEDICATED_ROWS.has(course.id));

/**
 * A coloured glyph per programme, so the list scans the way the catalogue grid
 * does. Presentation only — which is why it lives here and not in COURSES_DATA,
 * whose shape Firestore and the admin form also depend on.
 */
const COURSE_GLYPHS: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  fullstack: { icon: Layers, color: "text-sky-500 dark:text-sky-400" },
  "frontend-react": { icon: Code2, color: "text-indigo-500 dark:text-indigo-400" },
  "backend-python": { icon: Server, color: "text-emerald-500 dark:text-emerald-400" },
  genai: { icon: Sparkles, color: "text-purple-500 dark:text-purple-400" },
  "data-analyst": { icon: BarChart3, color: "text-teal-500 dark:text-teal-400" },
  "business-analyst": { icon: ClipboardList, color: "text-amber-500 dark:text-amber-400" },
  "devops-aws": { icon: Cloud, color: "text-orange-500 dark:text-orange-400" },
  "database-admin": { icon: Database, color: "text-slate-500 dark:text-slate-400" },
  "app-support": { icon: Wrench, color: "text-rose-500 dark:text-rose-400" },
  "web-laravel": { icon: Globe, color: "text-pink-500 dark:text-pink-400" },
};

/** Hover-card copy for a course row, read off the catalogue rather than restated. */
function courseHoverData(id: string) {
  const course = COURSE_ROWS.find((c) => c.id === id);
  if (!course) return undefined;
  return {
    title: course.title,
    // Duration and fee are already on the card's hero object, so the body copy is
    // only the description.
    description: course.description,
    gradientClass: `bg-gradient-to-br ${course.gradient}`,
    course,
  };
}

interface NavHoverItemData {
  title: string;
  description: string;
  gradientClass: string;
  /** Programme rows carry the entry itself, which drives the hero object. */
  course?: CourseItem;
}

const navHoverData: Record<string, NavHoverItemData> = {
  dashboard: {
    title: "Academy Admin Dashboard",
    description: "Access real-time student admissions, revenue metrics, batch programs, and export student ledgers.",
    gradientClass: "bg-gradient-to-br from-[#339af0] via-[#4dabf7] to-[#74c0fc]",
  },
  new_chat: {
    title: "Start a fresh chat",
    description: "Log in to save your conversation history, organize chats, and pick up right where you left off.",
    gradientClass: "bg-gradient-to-br from-[#748ffc] via-[#9775fa] to-[#63e6be]",
  },
  my_profile: {
    title: "My Profile",
    description: "Your Jarvis AI Academy account — your name and email.",
    gradientClass: "bg-gradient-to-br from-[#845ef7] via-[#5c7cfa] to-[#4dabf7]",
  },
  my_courses: {
    title: "My Courses",
    description: "Every course you have enrolled in, with its amount, transaction ID and payment status.",
    gradientClass: "bg-gradient-to-br from-[#38d9a9] via-[#4dabf7] to-[#4c6ef5]",
  },
  learning: {
    title: "My Learning",
    description: "Open the courses your academy admin granted you and jump straight into the syllabus with Jarvis.",
    gradientClass: "bg-gradient-to-br from-[#845ef7] via-[#5c7cfa] to-[#22b8cf]",
  },
  courses: {
    title: "Explore Academy Courses",
    description: "Log in to enroll in Full-Stack AI & Web Engineering (60 Days / ₹30,000 all-inclusive), view roadmaps, and track progress.",
    gradientClass: "bg-gradient-to-br from-[#38d9a9] via-[#20c997] to-[#12b886]",
  },
  super10: {
    title: "Super10 Elite Program",
    description: "Log in to apply for the selective 10-student program (60 Days / ₹0 — fully sponsored) with 100% placement assurance.",
    gradientClass: "bg-gradient-to-br from-[#fcc419] via-[#ff922b] to-[#f76707]",
  },
  referral: {
    title: "Refer & Earn ₹3,000",
    description: "Refer a peer to any 60-day program and receive a ₹3,000 cash reward upon their course completion.",
    gradientClass: "bg-gradient-to-br from-[#12b886] via-[#20c997] to-[#38d9a9]",
  },
  testimonials: {
    title: "Student Success & Reviews",
    description: "Log in to read verified reviews, explore portfolio projects, and view compensation packages of our alumni.",
    gradientClass: "bg-gradient-to-br from-[#f06595] via-[#cc5de8] to-[#845ef7]",
  },
  certificate: {
    title: "Verify Credentials",
    description: "Log in to view tamper-proof cryptographic certificates, verify graduate credentials, and share on LinkedIn.",
    gradientClass: "bg-gradient-to-br from-[#4dabf7] via-[#339af0] to-[#1c7ed6]",
  },
  enquiry: {
    title: "Connect with Admissions",
    description: "Log in to book a 1-on-1 counseling session, get syllabus advice, and reserve batch seating.",
    gradientClass: "bg-gradient-to-br from-[#20c997] via-[#1098ad] to-[#0ca678]",
  },
};

interface SidebarNavProps {
  onNewChat?: () => void;
  onSelectSection?: (section: string) => void;
  onOpenLogin?: () => void;
  onOpenDashboard?: () => void;
  onOpenStudentView?: (view: "profile" | "courses") => void;
  onOpenLearning?: () => void;
  activeItem?: string | null;
  isMobile?: boolean;
}

/** Colour-only variant, so each item keeps its own layout classes. */
const navColorClass = (isActive: boolean) =>
  isActive
    ? "text-neutral-900 dark:text-white bg-neutral-200/80 dark:bg-white/10"
    : "text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5";

const navStateClass = (isActive: boolean) =>
  `${isActive ? "font-medium" : "font-normal"} ${navColorClass(isActive)}`;

/**
 * Lifts and tilts on row hover. Keyed off the row's `group` for both the colour
 * and the transform, so `transition` covers both and one class string serves
 * every nav item. CSS rather than Motion: the hover target is the whole row, not
 * the 16px glyph, and ten rows are not worth ten rAF loops.
 */
function NavIcon({ icon: Icon }: { icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Icon className="w-4 h-4 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200 transition group-hover:scale-110 group-hover:-rotate-6" />
  );
}

export function SidebarNav({
  onNewChat,
  onSelectSection,
  onOpenLogin,
  onOpenDashboard,
  onOpenStudentView,
  onOpenLearning,
  activeItem,
  isMobile,
}: SidebarNavProps) {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
  const enrollmentCount = useStudentEnrollments(user?.email).length;
  const showStudentItems = isLoggedIn && !user?.isAdmin;

  // The auth provider restores the session from localStorage during render, so
  // the server sees no user and the client's first render does. Rendering
  // auth-gated items before mount therefore mismatches the server HTML.
  const [mounted, setMounted] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user?.id) {
      import("firebase/firestore").then(({ doc, getDoc }) => {
        import("@/lib/firebase").then(({ db }) => {
          if (db) {
            getDoc(doc(db, "users", user.id)).then((snapshot) => {
              if (snapshot.exists()) {
                setIsTeacher(snapshot.data().is_teacher === true);
              }
            });
          }
        });
      });
    } else {
      setIsTeacher(false);
    }
  }, [user?.id]);
  const [activeHoverItem, setActiveHoverItem] = useState<string | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [sidebarRight, setSidebarRight] = useState<number | undefined>(undefined);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const handleMouseEnter = (itemId: string, e: React.MouseEvent<HTMLElement>) => {
    clearHideTimer();
    const target = e.currentTarget;
    setAnchorRect(target.getBoundingClientRect());
    const aside = target.closest("aside");
    if (aside) {
      setSidebarRight(aside.getBoundingClientRect().right);
    }
    setActiveHoverItem(itemId);
  };

  const scheduleHide = () => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setActiveHoverItem(null);
    }, 130);
  };

  const handleMouseLeave = () => {
    scheduleHide();
  };

  const handlePopoverMouseEnter = () => {
    clearHideTimer();
  };

  const handlePopoverMouseLeave = () => {
    scheduleHide();
  };

  // Clean up timer and add outside click & escape handlers
  useEffect(() => {
    const handleDismiss = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-sidebar-hover-card]")) {
        return;
      }
      clearHideTimer();
      setActiveHoverItem(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        clearHideTimer();
        setActiveHoverItem(null);
      }
    };

    window.addEventListener("mousedown", handleDismiss);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearHideTimer();
      window.removeEventListener("mousedown", handleDismiss);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Course rows are not in `navHoverData`, so the card falls back to the catalogue.
  const hoverItem = activeHoverItem
    ? navHoverData[activeHoverItem] ?? courseHoverData(activeHoverItem)
    : undefined;

  return (
    <nav
      onMouseLeave={handleMouseLeave}
      className="flex flex-col gap-1 px-2 py-1 relative"
    >
      {/* New chat button */}
      <button
        type="button"
        onClick={onNewChat}
        onMouseEnter={(e) => handleMouseEnter("new_chat", e)}
        onMouseLeave={handleMouseLeave}
        className={`group flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-colors text-left cursor-pointer ${navStateClass(false)}`}
      >
        <NavIcon icon={SquarePen} />
        <span>New chat</span>
      </button>

      {/* Admin Dashboard Navigation (only for authenticated admins) */}
      {mounted && user?.isAdmin && (
        <button
          type="button"
          onClick={onOpenDashboard}
          onMouseEnter={(e) => handleMouseEnter("dashboard", e)}
          onMouseLeave={handleMouseLeave}
          aria-haspopup="dialog"
          aria-expanded={activeHoverItem === "dashboard"}
          aria-current={activeItem === "dashboard" ? "page" : undefined}
          className={`group flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition-colors text-left cursor-pointer ${navStateClass(activeItem === "dashboard")}`}
        >
          <div className="flex items-center gap-2.5">
            <NavIcon icon={LayoutDashboard} />
            <span>Dashboard</span>
          </div>
          <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-neutral-200/80 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
            Admin
          </span>
        </button>
      )}

      {/* Student Dashboard Navigation (only for signed-in students) */}
      {mounted && showStudentItems && (
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          aria-current={activeItem?.startsWith("my_") ? "page" : undefined}
          className={`group flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition-colors text-left cursor-pointer ${navStateClass(!!activeItem?.startsWith("my_"))}`}
        >
          <div className="flex items-center gap-2.5">
            <NavIcon icon={LayoutDashboard} />
            <span>My Dashboard</span>
          </div>
          {enrollmentCount > 0 && (
            <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-neutral-200/80 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
              {enrollmentCount}
            </span>
          )}
        </button>
      )}

      {/* Teacher Dashboard Navigation */}
      {mounted && isTeacher && (
        <button
          type="button"
          onClick={() => router.push("/teacher")}
          aria-current={activeItem?.startsWith("teacher_") ? "page" : undefined}
          className={`group flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition-colors text-left cursor-pointer ${navStateClass(!!activeItem?.startsWith("teacher_"))}`}
        >
          <div className="flex items-center gap-2.5">
            <NavIcon icon={LayoutDashboard} />
            <span>Teacher Dashboard</span>
          </div>
          <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-500/30 transition-colors">
            Faculty
          </span>
        </button>
      )}

      {/* Courses */}
      <button
        type="button"
        onClick={() => onSelectSection?.("courses")}
        onMouseEnter={(e) => handleMouseEnter("courses", e)}
        onMouseLeave={handleMouseLeave}
        aria-haspopup="dialog"
        aria-expanded={activeHoverItem === "courses"}
        aria-current={activeItem === "courses" ? "page" : undefined}
        className={`group flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-colors text-left cursor-pointer ${navStateClass(activeItem === "courses")}`}
      >
        <NavIcon icon={BookOpen} />
        <span>Courses</span>
      </button>

      {/* Super10 */}
      <button
        type="button"
        onClick={() => onSelectSection?.("super10")}
        onMouseEnter={(e) => handleMouseEnter("super10", e)}
        onMouseLeave={handleMouseLeave}
        aria-haspopup="dialog"
        aria-expanded={activeHoverItem === "super10"}
        aria-current={activeItem === "super10" ? "page" : undefined}
        className={`group flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition-colors text-left cursor-pointer ${navStateClass(activeItem === "super10")}`}
      >
        <div className="flex items-center gap-2.5">
          <NavIcon icon={Zap} />
          <span>Super10</span>
        </div>
        <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-neutral-200/80 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
          Elite
        </span>
      </button>

      {/* Refer & Earn */}
      <button
        type="button"
        onClick={() => onSelectSection?.("referral")}
        onMouseEnter={(e) => handleMouseEnter("referral", e)}
        onMouseLeave={handleMouseLeave}
        aria-haspopup="dialog"
        aria-expanded={activeHoverItem === "referral"}
        aria-current={activeItem === "referral" ? "page" : undefined}
        className={`group flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition-colors text-left cursor-pointer ${navStateClass(activeItem === "referral")}`}
      >
        <div className="flex items-center gap-2.5">
          <NavIcon icon={Gift} />
          <span>Refer &amp; Earn</span>
        </div>
        <span className="text-[10px] font-medium tracking-wide px-2 py-0.5 rounded-full bg-neutral-200/80 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
          ₹3,000
        </span>
      </button>

      {/* Testimonials */}
      <button
        type="button"
        onClick={() => onSelectSection?.("testimonials")}
        onMouseEnter={(e) => handleMouseEnter("testimonials", e)}
        onMouseLeave={handleMouseLeave}
        aria-haspopup="dialog"
        aria-expanded={activeHoverItem === "testimonials"}
        aria-current={activeItem === "testimonials" ? "page" : undefined}
        className={`group flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-colors text-left cursor-pointer ${navStateClass(activeItem === "testimonials")}`}
      >
        <NavIcon icon={MessageSquareQuote} />
        <span>Testimonials</span>
      </button>

      {/* Certificate */}
      <button
        type="button"
        onClick={() => onSelectSection?.("certificate")}
        onMouseEnter={(e) => handleMouseEnter("certificate", e)}
        onMouseLeave={handleMouseLeave}
        aria-haspopup="dialog"
        aria-expanded={activeHoverItem === "certificate"}
        aria-current={activeItem === "certificate" ? "page" : undefined}
        className={`group flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-colors text-left cursor-pointer ${navStateClass(activeItem === "certificate")}`}
      >
        <NavIcon icon={Award} />
        <span>Certificate</span>
      </button>

      {/* Enquiry */}
      <button
        type="button"
        onClick={() => onSelectSection?.("enquiry")}
        onMouseEnter={(e) => handleMouseEnter("enquiry", e)}
        onMouseLeave={handleMouseLeave}
        aria-haspopup="dialog"
        aria-expanded={activeHoverItem === "enquiry"}
        aria-current={activeItem === "enquiry" ? "page" : undefined}
        className={`group flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-colors text-left cursor-pointer ${navStateClass(activeItem === "enquiry")}`}
      >
        <NavIcon icon={HelpCircle} />
        <span>Enquiry</span>
      </button>

      {/* Every 60-day programme, so one can be opened without going through the
          catalogue. Clicks go to the chat, which answers with that programme. */}
      <div
        role="separator"
        className="mx-2 my-1.5 h-px bg-neutral-200 dark:bg-white/10"
      />

      <SidebarSection label="Courses">
        {COURSE_ROWS.map((course) => {
          // A course with no glyph still gets the icon column, so its label stays
          // on the same line as every other row's.
          const Icon = COURSE_GLYPHS[course.id]?.icon ?? BookOpen;
          const color =
            COURSE_GLYPHS[course.id]?.color ?? "text-neutral-500 dark:text-neutral-400";

          return (
            <button
              key={course.id}
              type="button"
              onClick={() => onSelectSection?.(course.id)}
              onMouseEnter={(e) => handleMouseEnter(course.id, e)}
              onMouseLeave={handleMouseLeave}
              aria-haspopup="dialog"
              aria-expanded={activeHoverItem === course.id}
              aria-current={activeItem === course.id ? "page" : undefined}
              className={`group flex items-center gap-2.5 w-full px-3 py-1.5 text-[13px] font-medium rounded-lg transition-colors text-left cursor-pointer ${navColorClass(activeItem === course.id)}`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${color} transition-transform group-hover:scale-110`} />
              <span className="truncate">{course.bannerTitle}</span>
            </button>
          );
        })}
      </SidebarSection>

      {/* Reusable Floating Hover Card for Desktop */}
      {!isMobile && anchorRect && (
        <SidebarHoverCard
          isOpen={Boolean(activeHoverItem)}
          anchorRect={anchorRect}
          sidebarRight={sidebarRight}
          title={hoverItem?.title ?? ""}
          description={hoverItem?.description ?? ""}
          gradientClass={hoverItem?.gradientClass ?? ""}
          itemKey={activeHoverItem ?? undefined}
          course={hoverItem?.course}
          showActions={!isLoggedIn}
          onMouseEnter={handlePopoverMouseEnter}
          onMouseLeave={handlePopoverMouseLeave}
          onLoginClick={() => {
            setActiveHoverItem(null);
            onOpenLogin?.();
          }}
        />
      )}
    </nav>
  );
}

export default SidebarNav;
