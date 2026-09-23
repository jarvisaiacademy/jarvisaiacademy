import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teacher Dashboard",
  robots: { index: false, follow: false },
  alternates: { canonical: "/teacher" },
};

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return children;
}
