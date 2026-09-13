import type { Metadata } from "next";

// settings/page.tsx is a Client Component, and `metadata` only works in Server
// Components — so this sibling layout is what keeps the account UI out of search.
export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: true },
  alternates: { canonical: "/settings" },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
