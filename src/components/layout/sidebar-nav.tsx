"use client";

import {
  SquarePen,
  BookOpen,
  Zap,
  MessageSquareQuote,
  Award,
  HelpCircle,
} from "lucide-react";

interface SidebarNavProps {
  onNewChat?: () => void;
  onSelectSection?: (section: string) => void;
}

export function SidebarNav({ onNewChat, onSelectSection }: SidebarNavProps) {
  return (
    <nav className="flex flex-col gap-1 px-2 py-1">
      {/* New chat button */}
      <button
        type="button"
        onClick={onNewChat}
        className="group flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-white bg-[#212121] hover:bg-[#2c2c2c] rounded-lg transition-all text-left shadow-sm"
      >
        <div className="flex items-center gap-2.5">
          <SquarePen className="w-4 h-4 text-neutral-300 group-hover:text-white" />
          <span>New chat</span>
        </div>
      </button>

      {/* Courses */}
      <button
        type="button"
        onClick={() => onSelectSection?.("courses")}
        className="group flex items-center gap-2.5 w-full px-3 py-2 text-sm font-normal text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
      >
        <BookOpen className="w-4 h-4 text-neutral-400 group-hover:text-neutral-200 transition-colors" />
        <span>Courses</span>
      </button>

      {/* Super10 */}
      <button
        type="button"
        onClick={() => onSelectSection?.("super10")}
        className="group flex items-center justify-between w-full px-3 py-2 text-sm font-normal text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <Zap className="w-4 h-4 text-amber-400/90 group-hover:text-amber-400 transition-colors" />
          <span>Super10</span>
        </div>
        <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 group-hover:text-white transition-colors">
          Elite
        </span>
      </button>

      {/* Testimonials */}
      <button
        type="button"
        onClick={() => onSelectSection?.("testimonials")}
        className="group flex items-center gap-2.5 w-full px-3 py-2 text-sm font-normal text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
      >
        <MessageSquareQuote className="w-4 h-4 text-neutral-400 group-hover:text-neutral-200 transition-colors" />
        <span>Testimonials</span>
      </button>

      {/* Certificate */}
      <button
        type="button"
        onClick={() => onSelectSection?.("certificate")}
        className="group flex items-center gap-2.5 w-full px-3 py-2 text-sm font-normal text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
      >
        <Award className="w-4 h-4 text-neutral-400 group-hover:text-neutral-200 transition-colors" />
        <span>Certificate</span>
      </button>

      {/* Enquiry */}
      <button
        type="button"
        onClick={() => onSelectSection?.("enquiry")}
        className="group flex items-center gap-2.5 w-full px-3 py-2 text-sm font-normal text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left"
      >
        <HelpCircle className="w-4 h-4 text-neutral-400 group-hover:text-neutral-200 transition-colors" />
        <span>Enquiry</span>
      </button>
    </nav>
  );
}
