import type { Metadata } from "next";
import { TeacherShell } from "@/components/teacher/teacher-shell";

export const metadata: Metadata = {
  title: "Teacher Dashboard",
  robots: { index: false, follow: false },
  alternates: { canonical: "/teacher" },
};

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return <TeacherShell>{children}</TeacherShell>;
}
