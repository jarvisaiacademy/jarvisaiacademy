import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Jarvis AI Academy",
  description: "Sign in to access your student, faculty, or administration portal.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/login" },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
