"use client";

import { PanelLeft } from "lucide-react";
import { MobileMenuIcon } from "@/components/ui/mobile-menu-icon";
import { siteConfig } from "@/config/site";

import { ThemeSwitcher } from "./theme-switcher";
import { UserProfile } from "./user-profile";
import { SocialLinks } from "@/components/common/social-links";
import { User } from "@/providers/auth-provider";

interface GuestHeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenLogin: () => void;
  onLogout?: () => void;
  onOpenProfile?: () => void;
  modelName?: string;
  isMobile?: boolean;
  user?: User | null;
}

export function GuestHeader({
  sidebarOpen,
  onToggleSidebar,
  onOpenLogin,
  onLogout,
  onOpenProfile,
  modelName = siteConfig.name,
  user,
}: GuestHeaderProps) {
  return (
    <header className="relative flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 h-14 bg-transparent z-20 shrink-0 w-full select-none">
      {/* Left controls */}
      <div className="flex items-center gap-2 min-w-0">
        {/* No exit animation here on purpose: this button is the only way to
            bring the sidebar back, so it must never be mid-transition when the
            sidebar is hidden. */}
        {!sidebarOpen && (
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Open sidebar"
              className="flex items-center justify-center transition-colors cursor-pointer w-9 h-9 rounded-full bg-neutral-200/80 dark:bg-[#262626] text-neutral-800 dark:text-neutral-100 hover:bg-neutral-300 dark:hover:bg-[#323232] md:w-auto md:h-auto md:p-2 md:rounded-lg md:bg-transparent md:dark:bg-transparent md:text-neutral-500 md:hover:text-neutral-900 md:hover:bg-neutral-200/60 md:dark:text-neutral-400 md:dark:hover:text-white md:dark:hover:bg-white/10 shadow-xs md:shadow-none shrink-0"
            >
              <span className="md:hidden flex items-center justify-center">
                <MobileMenuIcon className="w-4 h-4" />
              </span>
              <span className="hidden md:flex items-center justify-center">
                <PanelLeft className="w-4 h-4" />
              </span>
            </button>

            {/* Model title */}
            <div className="flex items-center gap-2 px-2 py-1.5 font-semibold text-foreground text-sm sm:text-base shrink min-w-0 select-none">
              {/* Decorative — the wordmark beside it already names the brand. */}
              <img
                src={siteConfig.logo}
                alt=""
                width={28}
                height={28}
                className="w-7 h-7 shrink-0 object-contain"
              />
              <div className="flex flex-col min-w-0">
                <span className="truncate whitespace-nowrap max-w-[160px] sm:max-w-none leading-tight">
                  {modelName}
                </span>
                {/* Stacked under the name, not trailing it on a `·`: the inline
                    version lost half its width to truncation on narrow headers.
                    Matches the sidebar header, which has always stacked them. */}
                <span className="truncate text-[11px] font-normal text-neutral-500 dark:text-neutral-400 leading-tight mt-0.5 select-none">
                  {siteConfig.tagline}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Social links, centred in the row. A flex-1 middle rather than an absolute
          overlay: it can only ever use the space left and right have not taken, so
          a long title truncates instead of sliding under the icons. Desktop only —
          below md the row already carries the sidebar toggle, the title, the theme
          switcher and the log-in CTA, and the sidebar footer has the same links. */}
      <div className="hidden md:flex flex-1 items-center justify-center min-w-0">
        <SocialLinks className="shrink-0" />
      </div>

      {/* Right controls: theme, then the signed-in identity chip or one log-in CTA.
          The chip sits deliberately outside .guest-cta-block — globals.css hides that
          block for signed-in users, which is exactly who needs this chip. */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <ThemeSwitcher className="shrink-0" />

        {user ? (
          <UserProfile
            user={user}
            variant="compact"
            onLogout={onLogout}
            onProfileClick={onOpenProfile}
          />
        ) : (
          <div suppressHydrationWarning className="guest-cta-block flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenLogin}
              className="px-3.5 py-1.5 rounded-full bg-foreground hover:opacity-90 text-background text-xs sm:text-sm font-semibold transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer active:scale-95"
            >
              Log in
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default GuestHeader;
