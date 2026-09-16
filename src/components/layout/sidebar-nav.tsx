"use client";

import React, { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import { SidebarHoverCard } from "./sidebar-hover-card";
import { useAuth } from "@/providers/auth-provider";
import { useStudentEnrollments } from "@/hooks/use-student-enrollments";

interface NavHoverItemData {
  title: string;
  description: string;
  gradientClass: string;
}

const navHoverData: Record<string, NavHoverItemData> = {
  dashboard: {
    title: "Academy Admin Dashboard",
    description: "Access real-time student admissions, revenue metrics, batch cohorts, and export student ledgers.",
    gradientClass: "bg-gradient-to-br from-[#339af0] via-[#4dabf7] to-[#74c0fc]",
  },
  new_chat: {
    title: "Start a fresh chat",
    description: "Log in to save your conversation history, organize chats, and pick up right where you left off.",
    gradientClass: "bg-gradient-to-br from-[#748ffc] via-[#9775fa] to-[#63e6be]",
  },
  my_profile: {
    title: "My Profile",
    description: "Your Jarvis AI Academy account — name, email and the plan you are enrolled on.",
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
    description: "Log in to enroll in Full-Stack AI & Web Engineering (60 Days / ₹30K), view roadmaps, and track progress.",
    gradientClass: "bg-gradient-to-br from-[#38d9a9] via-[#20c997] to-[#12b886]",
  },
  super10: {
    title: "Super10 Elite Cohort",
    description: "Log in to apply for the selective 10-student cohort (60 Days / ₹30K) with 100% placement assurance.",
    gradientClass: "bg-gradient-to-br from-[#fcc419] via-[#ff922b] to-[#f76707]",
  },
  referral: {
    title: "Refer & Earn ₹3,000",
    description: "Refer a peer to any 60-day cohort and receive a ₹3,000 cash reward upon their course completion.",
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
const navStateClass = (isActive: boolean) =>
  isActive
    ? "font-medium text-neutral-900 dark:text-white bg-neutral-200/80 dark:bg-white/10"
    : "font-normal text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5";

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
  const enrollmentCount = useStudentEnrollments(user?.email).length;
  const showStudentItems = isLoggedIn && !user?.isAdmin;

  // The auth provider restores the session from localStorage during render, so
  // the server sees no user and the client's first render does. Rendering
  // auth-gated items before mount therefore mismatches the server HTML.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
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

      {/* Student Navigation (only for signed-in students) */}
      {mounted && showStudentItems && (
        <>
          <button
            type="button"
            onClick={() => onOpenStudentView?.("profile")}
            onMouseEnter={(e) => handleMouseEnter("my_profile", e)}
            onMouseLeave={handleMouseLeave}
            aria-haspopup="dialog"
            aria-expanded={activeHoverItem === "my_profile"}
            aria-current={activeItem === "my_profile" ? "page" : undefined}
            className={`group flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-colors text-left cursor-pointer ${navStateClass(activeItem === "my_profile")}`}
          >
            <NavIcon icon={UserRound} />
            <span>My Profile</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenStudentView?.("courses")}
            onMouseEnter={(e) => handleMouseEnter("my_courses", e)}
            onMouseLeave={handleMouseLeave}
            aria-haspopup="dialog"
            aria-expanded={activeHoverItem === "my_courses"}
            aria-current={activeItem === "my_courses" ? "page" : undefined}
            className={`group flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition-colors text-left cursor-pointer ${navStateClass(activeItem === "my_courses")}`}
          >
            <div className="flex items-center gap-2.5">
              <NavIcon icon={GraduationCap} />
              <span>My Courses</span>
            </div>
            {enrollmentCount > 0 && (
              <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-neutral-200/80 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                {enrollmentCount}
              </span>
            )}
          </button>

          {/* Courses an admin granted this account — distinct from the paid
              enrolments above, so it keeps its own row. */}
          <button
            type="button"
            onClick={onOpenLearning}
            onMouseEnter={(e) => handleMouseEnter("learning", e)}
            onMouseLeave={handleMouseLeave}
            aria-haspopup="dialog"
            aria-expanded={activeHoverItem === "learning"}
            aria-current={activeItem === "learning" ? "page" : undefined}
            className={`group flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg transition-colors text-left cursor-pointer ${navStateClass(activeItem === "learning")}`}
          >
            <NavIcon icon={BookOpen} />
            <span>My Learning</span>
          </button>
        </>
      )}

      {/* Courses */}
      <button
        type="button"
        onClick={() => onSelectSection?.("courses")}
        onMouseEnter={(e) => handleMouseEnter("courses", e)}
        onMouseLeave={handleMouseLeave}
        aria-haspopup="dialog"
        aria-expanded={activeHoverItem === "courses"}
        className="group flex items-center gap-2.5 w-full px-3 py-2 text-sm font-normal text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5 rounded-lg transition-colors text-left cursor-pointer"
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
        className="group flex items-center justify-between w-full px-3 py-2 text-sm font-normal text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5 rounded-lg transition-colors text-left cursor-pointer"
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
        className="group flex items-center justify-between w-full px-3 py-2 text-sm font-normal text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5 rounded-lg transition-colors text-left cursor-pointer"
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
        className="group flex items-center gap-2.5 w-full px-3 py-2 text-sm font-normal text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5 rounded-lg transition-colors text-left cursor-pointer"
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
        className="group flex items-center gap-2.5 w-full px-3 py-2 text-sm font-normal text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5 rounded-lg transition-colors text-left cursor-pointer"
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
        className="group flex items-center gap-2.5 w-full px-3 py-2 text-sm font-normal text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5 rounded-lg transition-colors text-left cursor-pointer"
      >
        <NavIcon icon={HelpCircle} />
        <span>Enquiry</span>
      </button>

      {/* Reusable Floating Hover Card for Desktop */}
      {!isMobile && anchorRect && (
        <SidebarHoverCard
          isOpen={Boolean(activeHoverItem)}
          anchorRect={anchorRect}
          sidebarRight={sidebarRight}
          title={activeHoverItem ? navHoverData[activeHoverItem]?.title ?? "" : ""}
          description={activeHoverItem ? navHoverData[activeHoverItem]?.description ?? "" : ""}
          gradientClass={activeHoverItem ? navHoverData[activeHoverItem]?.gradientClass ?? "" : ""}
          itemKey={activeHoverItem ?? undefined}
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
