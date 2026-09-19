import { PublicShell } from "@/components/layout/public-shell";

/**
 * Chrome for the public programme pages. No `metadata` here — each route sets its own
 * canonical, and a layout-level canonical would apply to the whole segment.
 */
export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell>{children}</PublicShell>;
}
