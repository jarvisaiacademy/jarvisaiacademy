"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  SquarePen,
  Search,
  BookOpen,
  Zap,
  MessageSquareQuote,
  Award,
  HelpCircle,
} from "lucide-react";
import { SidebarHoverCard } from "./sidebar-hover-card";

interface NavHoverItemData {
  title: string;
  description: string;
  gradientClass: string;
}

const navHoverData: Record<string, NavHoverItemData> = {
  new_chat: {
    title: "Start a fresh chat",
    description: "Log in to save your conversation history, organize chats, and pick up right where you left off.",
    gradientClass: "bg-gradient-to-br from-[#748ffc] via-[#9775fa] to-[#63e6be]",
  },
  search: {
    title: "Search your chat history",
    description: "Log in to save conversations, search past answers, and pick up where you left off.",
    gradientClass: "bg-gradient-to-br from-[#8ba7f9] via-[#aca5fb] to-[#8db7fd]",
  },
  courses: {
    title: "Explore Academy Courses",
    description: "Log in to enroll in Full-Stack AI & Web Engineering, view curriculum roadmaps, and track learning progress.",
    gradientClass: "bg-gradient-to-br from-[#38d9a9] via-[#20c997] to-[#12b886]",
  },
  super10: {
    title: "Super10 Elite Cohort",
    description: "Log in to apply for the selective 10-student cohort, view live projects, and access placement details.",
    gradientClass: "bg-gradient-to-br from-[#fcc419] via-[#ff922b] to-[#f76707]",
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
  isMobile?: boolean;
}

export function SidebarNav({
  onNewChat,
  onSelectSection,
  onOpenLogin,
  isMobile,
}: SidebarNavProps) {
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
      const target = e.target as HTMLElement | null;
      if (target?.closest('[role="dialog"]') || target?.closest("nav")) {
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
        className="group flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-neutral-900 dark:text-white bg-neutral-200/80 dark:bg-[#212121] hover:bg-neutral-300/80 dark:hover:bg-[#2c2c2c] rounded-lg transition-all text-left shadow-xs cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <SquarePen className="w-4 h-4 text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white" />
          <span>New chat</span>
        </div>
      </button>

      {/* Search chats */}
      <button
        type="button"
        onClick={onOpenLogin}
        onMouseEnter={(e) => handleMouseEnter("search", e)}
        onMouseLeave={handleMouseLeave}
        aria-haspopup="dialog"
        aria-expanded={activeHoverItem === "search"}
        className="group flex items-center gap-2.5 w-full px-3 py-2 text-sm font-normal text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/5 rounded-lg transition-colors text-left cursor-pointer"
      >
        <Search className="w-4 h-4 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200 transition-colors" />
        <span>Search chats</span>
      </button>

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
        <BookOpen className="w-4 h-4 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200 transition-colors" />
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
          <Zap className="w-4 h-4 text-amber-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
          <span>Super10</span>
        </div>
        <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
          Elite
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
        <MessageSquareQuote className="w-4 h-4 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200 transition-colors" />
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
        <Award className="w-4 h-4 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200 transition-colors" />
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
        <HelpCircle className="w-4 h-4 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200 transition-colors" />
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
          onMouseEnter={handlePopoverMouseEnter}
          onMouseLeave={handlePopoverMouseLeave}
          onLoginClick={() => {
            setActiveHoverItem(null);
            onOpenLogin?.();
          }}
          onSignupClick={() => {
            setActiveHoverItem(null);
            onOpenLogin?.();
          }}
        />
      )}
    </nav>
  );
}

export default SidebarNav;
