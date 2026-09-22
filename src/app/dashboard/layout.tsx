import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Dashboard",
  alternates: { canonical: "/dashboard" },
};

export default function StudentDashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
