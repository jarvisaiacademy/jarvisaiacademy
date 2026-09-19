import Link from "next/link";
import { siteConfig } from "@/config/site";
import { SocialLinks } from "@/components/common/social-links";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";

/**
 * Chrome for the public programme pages.
 *
 * The chat's shell (sidebar, header, canvas) lives inside app/page.tsx and is not
 * shared with anything, so these routes bring their own. They also bring their own
 * scroll container: the root <body> is `overflow-hidden`, which suits a fixed chat
 * viewport and would trap a long page.
 *
 * No `metadata` here — each route sets its own canonical, and a layout-level
 * canonical would apply to the whole segment.
 */
export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-dvh overflow-y-auto bg-background text-foreground">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-neutral-200 dark:border-white/10 bg-white/90 dark:bg-[#171717]/90 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          {/* Decorative: the name beside it is the link's text. */}
          <img
            src={siteConfig.logo}
            alt=""
            width={28}
            height={28}
            className="w-7 h-7 shrink-0 object-contain"
          />
          <span className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate leading-tight">
              {siteConfig.name}
            </span>
            <span className="text-[11px] font-normal text-neutral-400 dark:text-neutral-500 truncate leading-tight">
              {siteConfig.tagline}
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          <ThemeSwitcher />
          <Link
            href="/"
            className="px-3.5 py-1.5 rounded-full bg-foreground text-background text-xs sm:text-sm font-semibold transition-colors hover:opacity-90 whitespace-nowrap"
          >
            Start chatting
          </Link>
        </div>
      </header>

      {children}

      <footer className="mt-16 px-4 sm:px-6 py-10 border-t border-neutral-200 dark:border-white/10 flex flex-col items-center gap-4 text-center">
        <SocialLinks />
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
          <a href={`mailto:${siteConfig.contact.email}`} className="hover:underline">
            {siteConfig.contact.email}
          </a>
          <a href={`tel:${siteConfig.contact.phone}`} className="hover:underline">
            {siteConfig.contact.phone}
          </a>
          <span>Pune, Maharashtra, India</span>
        </div>
        <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
          © {new Date().getFullYear()} {siteConfig.name}
        </p>
      </footer>
    </div>
  );
}
