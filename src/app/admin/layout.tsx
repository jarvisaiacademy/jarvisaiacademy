import type { Metadata } from "next";

// admin/page.tsx is a Client Component and `metadata` only works in Server
// Components, so this sibling layout is what keeps the dashboard out of search.
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
  // Without this, the root layout's `canonical: "/"` would be inherited and
  // /admin would claim to be the homepage.
  alternates: { canonical: "/admin" },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
