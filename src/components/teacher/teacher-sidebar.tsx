"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeft, Home, UserRound, BookOpen, Users } from "lucide-react";
import { SidebarHeader } from "@/components/layout/sidebar-header";
import { UserProfile } from "@/components/layout/user-profile";
import { SocialLinks } from "@/components/common/social-links";
import { useAuth } from "@/providers/auth-provider";
import { motion } from "motion/react";

interface TeacherSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobile?: boolean;
  onBackToChat: () => void;
}

interface NavButtonProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconActive: string;
}

function NavButton({ href, label, icon: Icon, iconActive }: NavButtonProps) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/teacher" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer text-left ${
        active
          ? "bg-foreground text-background shadow-sm"
          : "text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-white/10"
      }`}
    >
      <Icon className={`w-4 h-4 shrink-0 ${active ? "text-background" : iconActive}`} />
      <span>{label}</span>
    </Link>
  );
}

export function TeacherSidebar({
  isOpen,
  onToggle,
  isMobile,
  onBackToChat,
}: TeacherSidebarProps) {
  const { user, isLoggedIn, logout } = useAuth();

  const nav = (
    <div className="flex flex-col gap-5 px-3 py-2 text-neutral-800 dark:text-neutral-200">
      {/* Return to Chat */}
      <button
        type="button"
        onClick={onBackToChat}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-200/60 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors cursor-pointer border border-neutral-300/50 dark:border-white/5 shadow-xs"
      >
        <ArrowLeft className="w-4 h-4 text-neutral-500" />
        <span>Return to Chat</span>
      </button>

      {/* Navigation */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center px-2 pb-1.5">
          <span className="text-[10px] font-bold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">
            Teacher Dashboard
          </span>
        </div>

        <NavButton
          href="/teacher"
          label="Home"
          icon={Home}
          iconActive="text-amber-500 dark:text-amber-400"
        />
        <NavButton
          href="/teacher/profile"
          label="My Profile"
          icon={UserRound}
          iconActive="text-sky-500 dark:text-sky-400"
        />
        <NavButton
          href="/teacher/courses"
          label="My Courses"
          icon={BookOpen}
          iconActive="text-emerald-500 dark:text-emerald-400"
        />
        <NavButton
          href="/teacher/referrals"
          label="My Referral"
          icon={Users}
          iconActive="text-pink-500 dark:text-pink-400"
        />
      </div>
    </div>
  );

  const footer = isLoggedIn ? (
    <UserProfile user={user} onLogout={logout} />
  ) : null;

  if (isMobile) {
    return (
      <>
        {isOpen && (
          <div
            onClick={onToggle}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"
            aria-hidden="true"
          />
        )}
        <motion.aside
          key="teacher-sidebar-drawer"
          initial={false}
          animate={{ x: isOpen ? 0 : -280 }}
          transition={{ type: "spring", stiffness: 350, damping: 32 }}
          className="md:hidden fixed top-0 left-0 bottom-0 w-[260px] bg-[#f9f9f9] dark:bg-[#171717] border-r border-neutral-200 dark:border-white/5 z-50 flex flex-col justify-between overflow-hidden select-none transition-colors"
        >
          <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar">
            <SidebarHeader onToggle={onToggle} isMobile={true} />
            {nav}
          </div>
          <div suppressHydrationWarning className="flex flex-col border-t border-neutral-200 dark:border-white/5">
            {footer}
            <div className="flex items-center justify-center pt-2 pb-3">
              <SocialLinks />
            </div>
          </div>
        </motion.aside>
      </>
    );
  }

  return (
    <motion.aside
      key="teacher-sidebar-docked"
      initial={false}
      animate={{ width: isOpen ? 260 : 0, x: 0 }}
      transition={{ type: "spring", stiffness: 350, damping: 32 }}
      className={`relative hidden md:flex flex-col justify-between h-screen bg-[#f9f9f9] dark:bg-[#171717] overflow-hidden shrink-0 select-none z-30 transition-colors ${
        isOpen ? "border-r border-neutral-200 dark:border-white/5" : "border-none"
      }`}
    >
      <div className="w-[260px] flex flex-col flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        <SidebarHeader onToggle={onToggle} isMobile={false} />
        {nav}
      </div>
      <div suppressHydrationWarning className="w-[260px] flex flex-col border-t border-neutral-200 dark:border-white/5">
        {footer}
        <div className="flex items-center justify-center pt-2 pb-3.5">
          <SocialLinks />
        </div>
      </div>
    </motion.aside>
  );
}
