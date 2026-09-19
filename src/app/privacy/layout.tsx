import { PublicShell } from "@/components/layout/public-shell";

/**
 * The policy is a public page like the programme routes, so it wears the same header
 * and footer. No `metadata` here — page.tsx sets its own title and canonical, and a
 * layout-level canonical would apply to the whole segment.
 */
export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell>{children}</PublicShell>;
}
